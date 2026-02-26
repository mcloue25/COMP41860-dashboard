import asyncio
from abc import ABC, abstractmethod
from types import TracebackType
from typing import Any, Literal

from google.genai import types
from google.genai.client import AsyncClient as GeminiClient
from tenacity import AsyncRetrying, retry, stop_after_attempt, wait_random_exponential
from tqdm.asyncio import tqdm
from voyageai import AsyncClient as VoyageAIClient

from app.core import get_embedding_client, get_logger, get_voyage_embed_model, setup_logging
from app.services.clients import initialize_gemini_client, initialize_voyageai_client

setup_logging()
logger = get_logger(__name__)


class Embedder(ABC):
    """Abstract Base Class for Async Embedders with built-in batching and __call__ API."""

    def __init__(self, batch_size: int = 32, max_concurrency: int = 4) -> None:
        self.batch_size: int = batch_size
        self.semaphore: asyncio.Semaphore = asyncio.Semaphore(max_concurrency)
        logger.info(f"{self.__class__.__name__} initialized with batch_size={batch_size}.")

    @abstractmethod
    def set_task_type(self, mode: Literal["query", "document"]) -> None:
        """Sets the task type for the specific provider."""
        pass

    @abstractmethod
    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Implementation-specific async logic for a single batch."""
        pass

    async def __call__(self, documents: list[str]) -> list[list[float]]:
        if not documents:
            return []

        batches: list[list[str]] = [
            documents[i: i + self.batch_size] for i in range(0, len(documents), self.batch_size)
        ]

        tasks: list[asyncio.Task[list[list[float]]]] = [
            asyncio.create_task(self._wrapped_embed_batch(batch)) for batch in batches
        ]

        all_embeddings: list[list[float]] = []

        for f in tqdm.as_completed(tasks, desc="Embedding texts", total=len(tasks), leave=False):
            batch_embeddings: list[list[float]] = await f
            all_embeddings.extend(batch_embeddings)

        return all_embeddings

    async def _wrapped_embed_batch(self, texts: list[str]) -> list[list[float]]:
        async with self.semaphore:
            return await self._embed_batch(texts)

    def __enter__(self) -> "Embedder":
        return self

    def __exit__(
            self,
            exc_type: type[BaseException] | None,
            exc_val: BaseException | None,
            exc_tb: TracebackType | None,
    ) -> None:
        self.close()

    def close(self) -> None:
        logger.info(f"{self.__class__.__name__} connection closed.")


class VoyageAIEmbedder(Embedder):
    """Async VoyageAI Embedder implementation."""

    def __init__(
            self,
            api_key: str | None = None,
            model: str | None = None,
            input_type: Literal["query", "document"] = "document",
            batch_size: int = 32,
            max_concurrency: int = 4,
    ) -> None:
        super().__init__(batch_size=batch_size, max_concurrency=max_concurrency)
        self.client: VoyageAIClient = initialize_voyageai_client(api_key=api_key)
        self.model: str = model or get_voyage_embed_model()
        self.input_type: Literal["query", "document"] = input_type
        logger.info(f"VoyageAI initialized with model={self.model}")

    def set_task_type(self, mode: Literal["query", "document"]) -> None:
        self.input_type = mode

    @retry(wait=wait_random_exponential(multiplier=1, max=60), stop=stop_after_attempt(6))
    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        async for attempt in AsyncRetrying(
                wait=wait_random_exponential(min=1, max=60),
                stop=stop_after_attempt(6),
                reraise=True,
        ):
            with attempt:
                response: Any = await self.client.embed(
                    texts, model=self.model, input_type=self.input_type
                )
                return response.embeddings
        return []


class GeminiAsyncEmbedder(Embedder):
    """Gemini Asynchronous Implementation using google-genai client."""

    def __init__(
            self,
            api_key: str | None = None,
            model: str = "gemini-embedding-001",
            batch_size: int = 32,
            max_concurrency: int = 4
    ) -> None:
        super().__init__(batch_size=batch_size, max_concurrency=max_concurrency)
        self.client: GeminiClient = initialize_gemini_client(api_key=api_key)
        self.model: str = model
        self.task_type: str = "RETRIEVAL_DOCUMENT"

    def set_task_type(self, mode: Literal["query", "document"]) -> None:
        self.task_type = "RETRIEVAL_QUERY" if mode == "query" else "RETRIEVAL_DOCUMENT"

    @retry(wait=wait_random_exponential(multiplier=1, max=60), stop=stop_after_attempt(6))
    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        response: Any = await self.client.models.embed_content(
            model=self.model,
            contents=texts,
            config=types.EmbedContentConfig(task_type=self.task_type)
        )
        return [e.values for e in response.embeddings]

    async def close(self) -> None:
        await self.client.aclose()
        super().close()

async def main() -> None:
    # Example usage in an async context
    embedding_client: str = get_embedding_client()
    if embedding_client == "voyageai":
        embedder: VoyageAIEmbedder = VoyageAIEmbedder()
    elif embedding_client == "gemini":
        embedder: GeminiAsyncEmbedder = GeminiAsyncEmbedder()
    else:
        raise ValueError(f"Unsupported embedding client: {embedding_client}")

    texts: list[str] = ["Hello world", "ChromaDB and VoyageAI are powerful."]

    # We can now call the object directly like a function (Async)
    embeddings: list[list[float]] = await embedder(texts)

    for text, emb in zip(texts, embeddings, strict=True):
        print(f"Text: {text} | Vector Dim: {len(emb)}")


if __name__ == "__main__":
    asyncio.run(main())
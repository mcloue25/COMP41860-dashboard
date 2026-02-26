from collections.abc import Callable
from typing import Any, TypedDict

from langchain_text_splitters import RecursiveCharacterTextSplitter, TextSplitter

from app.core.get_env_var import get_chunk_overlap, get_chunk_size


class ChunkedResult(TypedDict):
    documents: list[str]
    metadata: list[dict[str, Any]]

def chunk_document(
        documents: list[str],
        meta_data: list[dict[str, Any]],
        document_chunker: Callable[[str], list[str]]
) -> ChunkedResult:
    """
    Splits documents and replicates metadata for each resulting chunk.
    """
    chunked_documents: list[str] = []
    chunked_metadata: list[dict[str, Any]] = []

    for doc, meta in zip(documents, meta_data, strict=False):
        chunks: list[str] = document_chunker(doc)
        chunked_documents.extend(chunks)

        # Add chunk index to metadata for better traceability during evaluation
        for i in range(len(chunks)):
            m = meta.copy()
            m["chunk_index"] = i
            chunked_metadata.append(m)

    return {"documents": chunked_documents, "metadata": chunked_metadata}


def get_recursive_splitter(
        chunk_size: int | None = get_chunk_size(),
        chunk_overlap: int | None = get_chunk_overlap(),
        model_name: str = "gpt-4"
) -> TextSplitter:
    """
    Returns a RecursiveCharacterTextSplitter using tiktoken encoding.
    """

    return RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        model_name=model_name,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

if __name__ == "__main__":
    # Example usage
    example_documents = ["This is a long document that needs to be ",
                         "chunked into smaller pieces for better processing. " * 100]
    example_metadata = [{"source": "example_document.txt"}, {"source": "example_document_2.txt"}]

    chunker = get_recursive_splitter(chunk_size=100, chunk_overlap=20)
    result = chunk_document(example_documents, example_metadata, chunker.split_text)

    print("Chunked Documents:", result["documents"])
    print("Chunked Metadata:", result["metadata"])
// src/api/chatApi.ts
import type { Chat, Message } from "../types/chat";

/**
 * Base URL for FastAPI
 * Set in Vite: VITE_API_URL=http://127.0.0.1:8000
 */
const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

/**
 * Toggle this to see full request/response logs in the browser console.
 * You can also set VITE_API_DEBUG=true in .env and use that.
 */
const API_DEBUG =
  String((import.meta as any).env?.VITE_API_DEBUG ?? "false").toLowerCase() ===
  "true";

/** ===== Types that mirror the backend schemas ===== */

type ApiChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ApiCreateChatSessionResponse = {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ApiChatSessionPreview = {
  session_id: string;
  title: string;
  last_message_preview: string;
  updated_at: string;
};

type ApiRecentChatSessionsResponse = {
  sessions: ApiChatSessionPreview[];
};

type ApiChatSessionDetailResponse = {
  session_id: string;
  title: string;
  history: ApiChatMessage[];
  created_at: string;
  updated_at: string;
};

type ApiChatResponse = {
  session_id: string;
  answer: string;
  history: ApiChatMessage[];
  latency_ms: number;
};

/** ===== Debug logging helper ===== */

function logDebug(label: string, ...args: any[]) {
  if (!API_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[chatApi] ${label}`, ...args);
}

/** ===== Guard helpers ===== */

function requireUserId(userId: string | null | undefined, where: string): string {
  const v = (userId ?? "").trim();
  if (!v) {
    throw new Error(
      `Missing userId for ${where}. For MVP, set a user id (e.g. localStorage "user_id") and pass it into chatApi.`
    );
  }
  return v;
}

/**
 * Low-level request helper:
 * - logs status/ok/response (when API_DEBUG=true)
 * - parses JSON (falls back to text)
 * - throws on non-2xx with useful detail
 */
async function request<T>(
  path: string,
  init?: RequestInit & { debugLabel?: string }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const debugLabel = init?.debugLabel ?? `${init?.method ?? "GET"} ${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      // Later: Authorization: `Bearer ${token}`
    },
  });

  logDebug(`${debugLabel} status`, res.status);
  logDebug(`${debugLabel} ok`, res.ok);

  const contentType = res.headers.get("content-type") ?? "";
  let data: any = null;

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch {
    data = null;
  }

  logDebug(`${debugLabel} response`, data);

  if (!res.ok) {
    // FastAPI often returns {"detail": "..."} or {"detail":[...]} for validation
    let detail = `HTTP ${res.status}`;

    if (data && typeof data === "object" && "detail" in data) {
      const d: any = (data as any).detail;
      detail =
        typeof d === "string"
          ? d
          : Array.isArray(d)
          ? d.map((x) => x?.msg ?? JSON.stringify(x)).join(" | ")
          : JSON.stringify(d);
    } else if (typeof data === "string" && data.trim()) {
      detail = data;
    }

    throw new Error(detail);
  }

  return data as T;
}

/** ===== Mapping backend -> your frontend types ===== */

// Backend messages don’t include ids/timestamps; for MVP we generate them deterministically.
function mapHistoryToMessages(history: ApiChatMessage[]): Message[] {
  const baseTs = Date.now();

  return history
    .filter((m) => m.role !== "system")
    .map((m, idx) => ({
      id: `${idx}-${m.role}-${Math.random().toString(16).slice(2)}`,
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
      ts: baseTs + idx,
    }));
}

function mapSessionDetailToChat(detail: ApiChatSessionDetailResponse): Chat {
  return {
    id: detail.session_id,
    title: detail.title,
    messages: mapHistoryToMessages(detail.history),
  };
}

/** ===== Public API used by your frontend ===== */

/**
 * POST /chat/sessions
 * Creates a new session. Backend requires user_id.
 */
export async function createChat(params: {
  userId: string;
  title?: string | null;
}): Promise<{ chatId: string; title: string; createdAt: string; updatedAt: string }> {
  const userId = requireUserId(params.userId, "POST /chat/sessions");

  const body = {
    user_id: userId,
    title: params.title ?? null,
  };

  const data = await request<ApiCreateChatSessionResponse>("/chat/sessions", {
    method: "POST",
    body: JSON.stringify(body),
    debugLabel: "POST /chat/sessions",
  });

  return {
    chatId: data.session_id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * GET /chat/sessions/recent?user_id=...&limit=...&preview_chars=...
 * Sidebar endpoint. Backend requires user_id.
 */
export async function listChats(params: {
  userId: string;
  limit?: number;
  previewChars?: number;
}): Promise<Array<{ id: string; title: string; lastMessagePreview: string; updatedAt: string }>> {
  const userId = requireUserId(params.userId, "GET /chat/sessions/recent");
  const limit = params.limit ?? 10;
  const previewChars = params.previewChars ?? 80;

  const qs =
    `?user_id=${encodeURIComponent(userId)}` +
    `&limit=${encodeURIComponent(limit)}` +
    `&preview_chars=${encodeURIComponent(previewChars)}`;

  const data = await request<ApiRecentChatSessionsResponse>(`/chat/sessions/recent${qs}`, {
    method: "GET",
    debugLabel: "GET /chat/sessions/recent",
  });

  return data.sessions.map((s) => ({
    id: s.session_id,
    title: s.title,
    lastMessagePreview: s.last_message_preview,
    updatedAt: s.updated_at,
  }));
}

/**
 * GET /chat/sessions/{session_id}?user_id=...
 * Fetch full history. Backend requires user_id.
 */
export async function getChat(params: {
  chatId: string;
  userId: string;
}): Promise<Chat> {
  const userId = requireUserId(params.userId, "GET /chat/sessions/{id}");

  const data = await request<ApiChatSessionDetailResponse>(
    `/chat/sessions/${encodeURIComponent(params.chatId)}?user_id=${encodeURIComponent(userId)}`,
    { method: "GET", debugLabel: "GET /chat/sessions/{id}" }
  );

  return mapSessionDetailToChat(data);
}

/**
 * POST /chat
 * Send a message. Backend requires user_id, session_id, message.
 */
export async function sendMessage(params: {
  chatId: string;
  text: string;
  userId: string;
  signal?: AbortSignal;
}): Promise<{
  sessionId: string;
  answer: string;
  latencyMs: number;
  assistantMessage: Message;
  history: Message[];
}> {
  const userId = requireUserId(params.userId, "POST /chat");
  const chatId = (params.chatId ?? "").trim();
  const text = (params.text ?? "").trim();

  if (!chatId) throw new Error("Missing chatId for POST /chat");
  if (!text) throw new Error("Missing text for POST /chat");

  const body = {
    user_id: userId,
    session_id: chatId,
    message: text,
  };

  const data = await request<ApiChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(body),
    signal: params.signal,
    debugLabel: "POST /chat",
  });

  const assistantMessage: Message = {
    id: `assistant-${Math.random().toString(16).slice(2)}`,
    role: "assistant",
    content: data.answer,
    ts: Date.now(),
  };

  return {
    sessionId: data.session_id,
    answer: data.answer,
    latencyMs: data.latency_ms,
    assistantMessage,
    history: mapHistoryToMessages(data.history),
  };
}

/**
 * DELETE not implemented in backend yet.
 */
export async function deleteChat(): Promise<never> {
  throw new Error("DELETE /chat/sessions/{session_id} is not implemented yet.");
}

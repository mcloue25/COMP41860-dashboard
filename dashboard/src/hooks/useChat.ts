// src/hooks/useChat.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Chat, Message, Status } from "../types/chat";
import { uid } from "../lib/ids";
import * as chatApi from "../api/chatApi";

/**
 * MVP user id source.
 * Later replace this with your real auth/session user id.
 */
const USER_ID = (localStorage.getItem("user_id") ?? "DEFAULT_USER_ID").trim();

/**
 * Local fallback chat used only if backend is unreachable.
 */
function makeLocalChat(overrides?: Partial<Chat>): Chat {
  return {
    id: uid(),
    title: "Student Support",
    messages: [],
    ...overrides,
  };
}

export function useChat() {
  // Backend session id (created lazily on first send)
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [chats, setChats] = useState<Chat[]>(() => [makeLocalChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0]?.id ?? "");

  const [status, setStatus] = useState<Status>("Idle");
  const [openMenuForChatId, setOpenMenuForChatId] = useState<string | null>(null);

  // Abort in-flight send when user sends again quickly
  const sendAbortRef = useRef<AbortController | null>(null);

  // ✅ Single-flight session creation: prevents 2 POST /chat/sessions if user double-clicks send
  const createSessionPromiseRef = useRef<Promise<string> | null>(null);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) ?? chats[0];
  }, [chats, activeChatId]);

  /**
   * Initial load: fetch recent sessions for sidebar (no auto-create).
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const recent = await chatApi.listChats({
          userId: USER_ID,
          limit: 20,
          previewChars: 80,
        });
        if (cancelled) return;

        if (recent.length === 0) {
          const initial: Chat = { id: uid(), title: "New chat", messages: [] };
          setChats([initial]);
          setActiveChatId(initial.id);
          return;
        }

        const sidebarChats: Chat[] = recent.map((s) => ({
          id: s.id,
          title: s.title,
          messages: [],
        }));

        setChats(sidebarChats);
        setActiveChatId(sidebarChats[0].id);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load recent chats (using local fallback):", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Optional quick API test only when VITE_API_DEBUG=true
  useEffect(() => {
    const debugEnabled =
      String((import.meta as any).env?.VITE_API_DEBUG ?? "false").toLowerCase() === "true";
    if (!debugEnabled) return;

    if (sessionStorage.getItem("quickTestRan") === "1") return;
    sessionStorage.setItem("quickTestRan", "1");

    (async () => {
      try {
        const session = await chatApi.createChat({ userId: USER_ID, title: "QuickTest" });
        // eslint-disable-next-line no-console
        console.log("Created:", session);

        const reply = await chatApi.sendMessage({
          chatId: session.chatId,
          text: "Hello",
          userId: USER_ID,
        });
        // eslint-disable-next-line no-console
        console.log("Reply:", reply);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("quickTest failed:", e);
      }
    })();
  }, []);

  function updateChat(chatId: string, updater: (c: Chat) => Chat) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
  }

  async function newChat() {
    setOpenMenuForChatId(null);
    setStatus("Idle");

    // reset backend session so next send triggers POST /chat/sessions
    setSessionId(null);
    createSessionPromiseRef.current = null;

    // UI: insert a fresh local chat tab
    const chat: Chat = {
      id: uid(),
      title: "New chat",
      messages: [],
    };

    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }

  async function selectChat(chatId: string) {
    setActiveChatId(chatId);
    setOpenMenuForChatId(null);

    const existing = chats.find((c) => c.id === chatId);
    if (existing && existing.messages.length > 0) return;

    try {
      const full = await chatApi.getChat({ userId: USER_ID, chatId });
      setChats((prev) => prev.map((c) => (c.id === chatId ? full : c)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load chat history:", e);
    }
  }

  function toggleMenu(chatId: string) {
    setOpenMenuForChatId((prev) => (prev === chatId ? null : chatId));
  }

  function closeMenus() {
    setOpenMenuForChatId(null);
  }

  function deleteChat(chatId: string) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== chatId);

      if (activeChatId === chatId) {
        if (next.length > 0) setActiveChatId(next[0].id);
        else {
          const fresh = makeLocalChat();
          setActiveChatId(fresh.id);
          return [fresh];
        }
      }
      return next;
    });

    setOpenMenuForChatId(null);

    void (async () => {
      try {
        await chatApi.deleteChat();
      } catch {
        // ignore
      }
    })();
  }

  // ✅ ensures correct order: POST /chat/sessions then POST /chat/
  async function ensureBackendSession(): Promise<string> {
    if (sessionId) return sessionId;

    if (!createSessionPromiseRef.current) {
      createSessionPromiseRef.current = (async () => {
        const created = await chatApi.createChat({ userId: USER_ID, title: null });
        const sid = created.chatId;
        setSessionId(sid);
        return sid;
      })().finally(() => {
        // allow future retries if creation fails
        // (if successful, sessionId is now set so ensureBackendSession returns early anyway)
        createSessionPromiseRef.current = null;
      });
    }

    return createSessionPromiseRef.current;
  }

  /**
   * Flow on first send:
   * 1) POST /chat/sessions -> get session_id
   * 2) POST /chat/ with message + session_id
   */
  async function sendMessage(textRaw: string) {
    const text = textRaw.trim();
    if (!text) return;

    setStatus("Thinking");

    // cancel previous in-flight send
    sendAbortRef.current?.abort();
    const ac = new AbortController();
    sendAbortRef.current = ac;

    const uiChatId = activeChatId || chats[0]?.id;
    if (!uiChatId) return;

    try {
      // ✅ 1) create/get backend session BEFORE we append and send
      const sid = await ensureBackendSession();

      // optimistic user message (only after we have a real sid)
      const localUserMsg: Message = {
        id: uid(),
        role: "user",
        content: text,
        ts: Date.now(),
        state: "pending",
      };

      updateChat(uiChatId, (c) => {
        const shouldTitle =
          (c.title === "Student Support" || c.title === "New chat") && c.messages.length === 0;
        const nextTitle = shouldTitle ? text.slice(0, 32) : c.title;
        return { ...c, title: nextTitle, messages: [...c.messages, localUserMsg] };
      });

      // ✅ 2) immediately POST /chat/ with the new session_id
      const res = await chatApi.sendMessage({
        userId: USER_ID,
        chatId: sid,
        text,
        signal: ac.signal,
      });

      updateChat(uiChatId, (c) => {
        const msgs = c.messages.map((m) =>
          m.id === localUserMsg.id ? { ...m, state: "sent" } : m
        );
        return {
          ...c,
          messages: [...msgs, { ...res.assistantMessage, state: "sent" }],
        };
      });

      setStatus("Idle");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("sendMessage failed:", e);
      setStatus("Error");
    }
  }

  function resetChats() {
    const fresh = makeLocalChat();
    setChats([fresh]);
    setActiveChatId(fresh.id);
    setOpenMenuForChatId(null);
    setStatus("Idle");
    setSessionId(null);
    createSessionPromiseRef.current = null;
  }

  return {
    chats,
    activeChatId,
    activeChat,
    status,
    openMenuForChatId,

    newChat,
    selectChat,
    toggleMenu,
    closeMenus,
    deleteChat,
    sendMessage,
    resetChats,

    initialized: true,
  };
}

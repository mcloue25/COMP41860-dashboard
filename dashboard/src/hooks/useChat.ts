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
  const [chats, setChats] = useState<Chat[]>(() => [makeLocalChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0]?.id ?? "");

  const [status, setStatus] = useState<Status>("Idle");
  const [openMenuForChatId, setOpenMenuForChatId] = useState<string | null>(null);

  // Abort in-flight send when user sends again quickly
  const sendAbortRef = useRef<AbortController | null>(null);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) ?? chats[0];
  }, [chats, activeChatId]);

  /**
   * Initial load: fetch recent sessions for sidebar.
   * If none exist, create one session so the UI has a real chat id.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const recent = await chatApi.listChats({ userId: USER_ID, limit: 20, previewChars: 80 });
        if (cancelled) return;

        if (recent.length === 0) {
          // No sessions yet → create one
          const created = await chatApi.createChat({ userId: USER_ID, title: null });
          if (cancelled) return;

          const initial: Chat = { id: created.chatId, title: created.title ?? "New chat", messages: [] };
          setChats([initial]);
          setActiveChatId(initial.id);
          return;
        }

        // Populate sidebar from recent sessions (messages lazy-loaded on select)
        const sidebarChats: Chat[] = recent.map((s) => ({
          id: s.id,
          title: s.title,
          messages: [],
        }));

        setChats(sidebarChats);
        setActiveChatId(sidebarChats[0].id);
      } catch (e) {
        // Backend unreachable → keep local fallback
        // eslint-disable-next-line no-console
        console.warn("Failed to load recent chats (using local fallback):", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Optional quick API test only when VITE_API_DEBUG=true (keeps your earlier behavior)
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

    try {
      const created = await chatApi.createChat({ userId: USER_ID, title: null });

      const chat: Chat = {
        id: created.chatId,
        title: created.title ?? "New chat",
        messages: [],
      };

      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
    } catch (e) {
      // backend failed → local chat fallback
      const chat = makeLocalChat({ title: "New chat (offline)" });
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
    }
  }

  async function selectChat(chatId: string) {
    setActiveChatId(chatId);
    setOpenMenuForChatId(null);

    // If already loaded messages, don't refetch
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
    // Local delete always works (backend delete not implemented yet)
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== chatId);

      if (activeChatId === chatId) {
        if (next.length > 0) {
          setActiveChatId(next[0].id);
        } else {
          const fresh = makeLocalChat();
          setActiveChatId(fresh.id);
          return [fresh];
        }
      }

      return next;
    });

    setOpenMenuForChatId(null);

    // Backend delete not implemented; keep behavior explicit
    void (async () => {
      try {
        await chatApi.deleteChat();
      } catch {
        // ignore
      }
    })();
  }

  async function sendMessage(textRaw: string) {
    const text = textRaw.trim();
    if (!text) return;

    const chatId = activeChatId || chats[0]?.id;
    if (!chatId) return;

    setStatus("Thinking");

    // cancel previous in-flight send
    sendAbortRef.current?.abort();
    const ac = new AbortController();
    sendAbortRef.current = ac;

    const localUserMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      ts: Date.now(),
      state: "pending",
    };

    // optimistic append
    updateChat(chatId, (c) => {
      const shouldTitle =
        (c.title === "Student Support" || c.title === "New chat") && c.messages.length === 0;
      const nextTitle = shouldTitle ? text.slice(0, 32) : c.title;

      return { ...c, title: nextTitle, messages: [...c.messages, localUserMsg] };
    });

    try {
      const res = await chatApi.sendMessage({
        userId: USER_ID,
        chatId,
        text,
        signal: ac.signal,
      });

      // mark user sent + append assistant
      updateChat(chatId, (c) => {
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

      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === localUserMsg.id ? { ...m, state: "failed" } : m
        ),
      }));

      setStatus("Error");
    }
  }

  function resetChats() {
    const fresh = makeLocalChat();
    setChats([fresh]);
    setActiveChatId(fresh.id);
    setOpenMenuForChatId(null);
    setStatus("Idle");
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

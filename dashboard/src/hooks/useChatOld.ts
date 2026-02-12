import { useMemo, useState } from "react";
import type { Chat, Message, Status } from "../types/chat";
import { uid } from "../lib/ids";
import { fakeRagAnswer } from "../lib/fakeRag";

function makeFreshChat(): Chat {
  return {
    id: uid(),
    title: "Student Support",
    messages: [],
  };
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>(() => [makeFreshChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const first = makeFreshChat();
    // initialize in a single place
    return first.id;
  });

  // Ensure chats + activeChatId are in sync on first render
  // (This avoids subtle mismatches if you later change init logic)
  const [initialized] = useState(() => {
    const first = makeFreshChat();
    setChats([first]);
    setActiveChatId(first.id);
    return true;
  });

  const [status, setStatus] = useState<Status>("Idle");
  const [openMenuForChatId, setOpenMenuForChatId] = useState<string | null>(null);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) ?? chats[0];
  }, [chats, activeChatId]);

  function newChat() {
    const chat = makeFreshChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setOpenMenuForChatId(null);
  }

  function selectChat(chatId: string) {
    setActiveChatId(chatId);
    setOpenMenuForChatId(null);
  }

  function toggleMenu(chatId: string) {
    setOpenMenuForChatId((prev) => (prev === chatId ? null : chatId));
  }

  function closeMenus() {
    setOpenMenuForChatId(null);
  }

  function updateChat(chatId: string, updater: (c: Chat) => Chat) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
  }

  function deleteChat(chatId: string) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== chatId);

      if (activeChatId === chatId) {
        if (next.length > 0) {
          setActiveChatId(next[0].id);
        } else {
          const fresh = makeFreshChat();
          setActiveChatId(fresh.id);
          return [fresh];
        }
      }

      return next;
    });

    setOpenMenuForChatId(null);
  }

  function sendMessage(textRaw: string) {
    const text = textRaw.trim();
    if (!text) return;

    setStatus("Thinking");

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      ts: Date.now(),
    };

    updateChat(activeChatId, (c) => {
      // Professional: only auto-title if it's still the default and first user msg
      const shouldTitle =
        (c.title === "Student Support" || c.title === "New chat") && c.messages.length === 0;

      const nextTitle = shouldTitle ? text.slice(0, 32) : c.title;

      return { ...c, title: nextTitle, messages: [...c.messages, userMsg] };
    });

    window.setTimeout(() => {
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: fakeRagAnswer(text),
        ts: Date.now(),
      };

      updateChat(activeChatId, (c) => ({
        ...c,
        messages: [...c.messages, assistantMsg],
      }));

      setStatus("Idle");
    }, 400);
  }

  // Optional helper
  function resetChats() {
    const fresh = makeFreshChat();
    setChats([fresh]);
    setActiveChatId(fresh.id);
    setOpenMenuForChatId(null);
    setStatus("Idle");
  }

  return {
    // state
    chats,
    activeChatId,
    activeChat,
    status,
    openMenuForChatId,

    // actions
    newChat,
    selectChat,
    toggleMenu,
    closeMenus,
    deleteChat,
    sendMessage,
    resetChats,

    // internal
    initialized,
  };
}

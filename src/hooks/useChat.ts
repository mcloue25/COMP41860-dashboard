import { useMemo, useState } from "react";
import type { Chat, Message, Status } from "../types/chat";
import { uid } from "../lib/ids";
import { fakeRagAnswer } from "../lib/fakeRag";

function makeFreshChat(): Chat {
  return {
    id: uid(),
    title: "New chat",
    messages: [
      {
        id: uid(),
        role: "assistant",
        content:
          "Hi! I’m the University Helpdesk (demo). Ask something about fees, timetables, modules, IT support, etc.",
        ts: Date.now(),
      },
    ],
  };
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>(() => [makeFreshChat()]);
  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0].id);
  const [status, setStatus] = useState<Status>("Idle");
  const [openMenuForChatId, setOpenMenuForChatId] = useState<string | null>(
    null
  );

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

      // If deleting active chat, choose another or create a new one
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
      const nextTitle = c.title === "New chat" ? text.slice(0, 24) : c.title;
      return { ...c, title: nextTitle, messages: [...c.messages, userMsg] };
    });

    // Fake assistant response delay
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
  };
}

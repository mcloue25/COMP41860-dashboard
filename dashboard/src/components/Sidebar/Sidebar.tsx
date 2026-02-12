import React from "react";
import type { Chat } from "../../types/chat";
import { ChatListItem } from "./ChatListItem";

export function Sidebar(props: {
  chats: Chat[];
  activeChatId: string;
  openMenuForChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onToggleMenu: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}) {
  const {
    chats,
    activeChatId,
    openMenuForChatId,
    onNewChat,
    onSelectChat,
    onToggleMenu,
    onDeleteChat,
  } = props;

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      className="flex self-stretch min-h-0 w-[280px] flex-col gap-3 border-r border-white/10 bg-[#002542] p-3 text-white"
    >
      {/* Brand */}
      <div className="grid gap-1">
        <div className="font-extrabold tracking-[0.2px] text-center">University Helpdesk</div>
        {/* <div className="text-xs text-white/75">Iteration 1 (barebones)</div> */}
      </div>

      {/* New chat button — styled to match chat list items */}
      <button
        onClick={onNewChat}
        className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm font-semibold text-white hover:bg-[rgba(255,255,255,0.08)]"
      >
        + New chat
      </button>

      <div className="text-xs text-white/75">Chats</div>

      {/* Chat list */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            menuOpen={openMenuForChatId === chat.id}
            onSelect={() => onSelectChat(chat.id)}
            onToggleMenu={() => onToggleMenu(chat.id)}
            onDelete={() => onDeleteChat(chat.id)}
          />
        ))}
      </div>

      {/* Footer */}
      {/* <div className="mt-auto text-xs text-white/70">Fake RAG: lorem ipsum</div> */}
    </aside>
  );
}

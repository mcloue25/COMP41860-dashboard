import React from "react";
import type { Chat } from "../../types/chat";

export function ChatListItem(props: {
  chat: Chat;
  isActive: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onDelete: () => void;
}) {
  const { chat, isActive, menuOpen, onSelect, onToggleMenu, onDelete } = props;

  return (
    <div
      className={[
        "relative grid grid-cols-[1fr_auto] items-center gap-1.5 rounded-lg border p-1.5",
        isActive
          ? "border-[rgba(0,138,204,0.4)] bg-[rgba(0,138,204,0.16)]"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)]",
      ].join(" ")}
    >
      {/* Main clickable chat area */}
      <button
        onClick={onSelect}
        title={chat.title}
        className="flex w-full items-center gap-2 rounded-md bg-transparent px-2 py-1.5 text-left text-white hover:bg-[rgba(255,255,255,0.06)]"
      >
        <span
          aria-hidden="true"
          className="h-4 w-4 flex-none rounded-[3px] border border-[rgba(255,255,255,0.5)] bg-white"
        />
        <span className="max-w-[160px] truncate text-sm">{chat.title}</span>
      </button>

      {/* 3-dots menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        aria-label="Chat options"
        className="grid h-8 w-8 place-items-center rounded-lg border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.08)]"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>

      {/* Popover menu */}
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-11 z-10 min-w-[140px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
        >
          <button
            onClick={onDelete}
            className="w-full rounded-md border border-gray-100 bg-white px-2.5 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
          >
            Delete chat
          </button>
        </div>
      )}
    </div>
  );
}

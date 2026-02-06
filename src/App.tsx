import React, { useState } from "react";
import { useChat } from "../src/hooks/useChat";
import { Sidebar } from "../src/components/Sidebar/Sidebar";
import { UcdFooter } from "../src/components/UcdFooter/UcdFooter";
import { ChatWindow } from "../src/components/ChatWindow/ChatWindow";
import { UcdHeader } from "./components/UcdHeader/UcdHeader";

import "../src/styles/ucd-theme.css";

export default function App() {
  const {
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
  } = useChat();

  const [prompt, setPrompt] = useState("");

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(prompt);
    setPrompt("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <UcdHeader />

      {/* Main app area */}
      <div className="flex-1 ucd-shell" onClick={closeMenus}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          openMenuForChatId={openMenuForChatId}
          onNewChat={newChat}
          onSelectChat={selectChat}
          onToggleMenu={toggleMenu}
          onDeleteChat={deleteChat}
        />

        <ChatWindow
          chat={activeChat}
          status={status}
          prompt={prompt}
          onPromptChange={setPrompt}
          onSend={onSend}
        />
      </div>

      {/* Footer */}
      <UcdFooter />
    </div>
  );
}
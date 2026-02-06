import React from "react";
import type { Chat, Status } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

export function ChatWindow(props: {
  chat: Chat;
  status: Status;
  prompt: string;
  onPromptChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
}) {
  const { chat, status, prompt, onPromptChange, onSend } = props;

  return (
    <section
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100%",
        minHeight: 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <header
        style={{
          borderBottom: "1px solid #ddd",
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>{chat.title}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Ask about modules, fees, timetables, IT, campus services…
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>{status}</div>
      </header>

      <main
        style={{
          padding: 12,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 0,
        }}
      >
        {chat.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </main>

      <Composer value={prompt} onChange={onPromptChange} onSubmit={onSend} />
    </section>
  );
}

import React from "react";
import type { Message } from "../../types/chat";

export function MessageBubble(props: { message: Message }) {
  const { message } = props;

  return (
    <div style={{ border: "1px solid #eee", padding: 10, maxWidth: 900 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
        {message.role === "user" ? "Student" : "Helpdesk"} •{" "}
        {new Date(message.ts).toLocaleTimeString()}
      </div>
      <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
    </div>
  );
}

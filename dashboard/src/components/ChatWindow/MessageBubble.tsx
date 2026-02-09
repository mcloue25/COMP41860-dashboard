import React from "react";
import type { Message } from "../../types/chat";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-900 border border-slate-300",
        ].join(" ")}
      >
        {/* Meta row */}
        <div
          className={[
            "mb-1 text-[11px]",
            isUser ? "text-blue-100" : "text-slate-500",
          ].join(" ")}
        >
          {isUser ? "Student" : "Helpdesk"} •{" "}
          {new Date(message.ts).toLocaleTimeString()}
        </div>

        {/* Message content */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Whether we should auto-follow new messages
  const [stickToBottom, setStickToBottom] = useState(true);

  function isNearBottom(el: HTMLElement, thresholdPx = 140) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < thresholdPx;
  }

  // Update stickiness when the user scrolls
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setStickToBottom(isNearBottom(el));
  }

  // Scroll to bottom helper (use rAF so layout is settled)
  function scrollToBottom(smooth = true) {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    });
  }

  // On first mount, jump to bottom (no animation)
  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When messages change, follow if user is (or was) at the bottom
  useLayoutEffect(() => {
    if (stickToBottom) scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages.length, stickToBottom]);

  return (
    <section className="h-full min-h-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="truncate text-sm font-medium text-slate-900">
            {chat.title || "Student Support Assistant"}
          </h2>

          <span
            className={[
              "inline-block h-2 w-2 rounded-full",
              status.toLowerCase().includes("error")
                ? "bg-red-500"
                : status.toLowerCase().includes("thinking") ||
                  status.toLowerCase().includes("loading")
                ? "bg-amber-400"
                : "bg-emerald-500",
            ].join(" ")}
            title={String(status)}
          />
        </div>
      </header>

      {/* Messages (scroll container) */}
      <main
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white"
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex flex-col gap-3">
            {chat.messages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Ask anything about UCD student supports.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Try: “How do I register for my modules?” or “Where can I find exam timetables?”
                </p>
              </div>
            ) : (
              chat.messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* Composer */}
      <footer className="shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-3">
          <Composer value={prompt} onChange={onPromptChange} onSubmit={onSend} />
        </div>
      </footer>
    </section>
  );
}

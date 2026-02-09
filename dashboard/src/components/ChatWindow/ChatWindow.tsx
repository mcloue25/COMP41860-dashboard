import React, { useEffect, useRef } from "react";
import type { Chat, Status } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

function StatusPill({ status }: { status: Status }) {
  const label = String(status);

  const className =
    label.toLowerCase().includes("error")
      ? "bg-red-50 text-red-700 ring-red-200"
      : label.toLowerCase().includes("thinking") ||
        label.toLowerCase().includes("loading")
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      ].join(" ")}
      title={label}
    >
      {label}
    </span>
  );
}

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

  const prevLenRef = useRef<number>(0);
  const didMountRef = useRef(false);

  function isNearBottom(el: HTMLElement, thresholdPx = 120) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < thresholdPx;
  }

  useEffect(() => {
    const el = scrollRef.current;
    const len = chat.messages.length;

    // First mount: record but don't scroll (prevents page jump)
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevLenRef.current = len;
      return;
    }

    const prevLen = prevLenRef.current;
    const addedMessage = len > prevLen;

    // Only autoscroll if a new message was added AND user is near bottom
    if (addedMessage && el && isNearBottom(el)) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    prevLenRef.current = len;
  }, [chat.messages.length]);

  return (
    <section
      className="h-full min-h-0 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
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


      {/* Messages: THIS is the scroll container */}
      <main
        ref={scrollRef}
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

      {/* Composer always visible */}
      <footer className="shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-3">
          <Composer value={prompt} onChange={onPromptChange} onSubmit={onSend} />
          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            Responses are generated from the student helpdesk knowledge base and may be imperfect.
          </p>
        </div>
      </footer>
    </section>
  );

}

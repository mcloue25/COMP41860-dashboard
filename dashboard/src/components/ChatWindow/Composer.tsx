import React from "react";

export function Composer(props: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) {
  const { value, onChange, onSubmit, disabled } = props;

  const isEmpty = value.trim().length === 0;

  return (
    <form onSubmit={onSubmit} className="flex items-start gap-2">
      <div className="flex-1">
        <label className="sr-only" htmlFor="composer">
          Message
        </label>

        <textarea
          id="composer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask a question…"
          rows={1}
          onKeyDown={(e) => {
            // Enter submits, Shift+Enter makes a newline
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // Submit the form programmatically
              (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
                     placeholder:text-slate-400 shadow-sm outline-none
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                     disabled:bg-slate-50 disabled:text-slate-500"
          disabled={disabled}
        />
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          Press Enter to send • Shift+Enter for a new line
        </p>
      </div>

      <button
        type="submit"
        disabled={disabled || isEmpty}
        className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold
                   bg-[#004377] text-white shadow-sm
                   hover:bg-[#00365f] disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-600/30"
        aria-label="Send message"
        title={isEmpty ? "Type a message to send" : "Send"}
      >
        Send
      </button>
    </form>
  );
}

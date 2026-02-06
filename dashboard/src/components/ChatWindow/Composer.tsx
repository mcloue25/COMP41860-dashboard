import React from "react";

export function Composer(props: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { value, onChange, onSubmit } = props;

  return (
    <form
      onSubmit={onSubmit}
      style={{
        borderTop: "1px solid #ddd",
        padding: 12,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 8,
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a question (e.g., 'How do I reset my student password?')"
        style={{ padding: 10, border: "1px solid #ccc", width: "100%" }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 14px",
          border: "1px solid #ccc",
          background: "#f7f7f7",
          cursor: "pointer",
          borderRadius: 8,
        }}
      >
        Send
      </button>
    </form>
  );
}

export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  state?: "pending" | "sent" | "failed";
};


export type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export type Status = "Idle" | "Thinking";

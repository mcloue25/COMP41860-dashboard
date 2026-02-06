export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export type Status = "Idle" | "Thinking";

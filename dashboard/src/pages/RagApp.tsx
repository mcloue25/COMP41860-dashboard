import React, { useState } from "react";
import { useChat } from "../hooks/useChat";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { UcdFooter } from "../components/UcdFooter/UcdFooter";
import { ChatWindow } from "../components/ChatWindow/ChatWindow";
import { UcdHeader } from "../components/UcdHeader/UcdHeader";

import "../styles/ucd-theme.css";

type QuickLink = {
  title: string;
  description: string;
  prompt: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    title: "New Students",
    description: "Deadlines, payment methods, tuition info.",
    prompt: "Can you help me find information about fees and how to pay?",
  },
  {
    title: "Registration",
    description: "Where to find your timetable and key dates.",
    prompt: "Where can I find my timetable and important academic dates?",
  },
  {
    title: "Fees & Grants",
    description: "Wellbeing, counselling, disability supports.",
    prompt: "What student supports are available and how do I access them?",
  },
  {
    title: "Frequently asked Questions",
    description: "Password resets, Wi-Fi, email, account access.",
    prompt: "I need IT help. How do I reset my password and access services?",
  },
  {
    title: "Freshers Guide",
    description: "Opening hours, borrowing, online resources.",
    prompt: "How do I access library resources and what are the opening hours?",
  },
  {
    title: "Exams & Assessments",
    description: "Exam timetables, venues, regulations.",
    prompt: "Where do I find exam timetables and exam regulations?",
  },
  {
    title: "Official Documents",
    description: "Opening hours, borrowing, online resources.",
    prompt: "How do I access library resources and what are the opening hours?",
  },
  {
    title: "Admissions",
    description: "Exam timetables, venues, regulations.",
    prompt: "Where do I find exam timetables and exam regulations?",
  },
];

export default function RagApp() {
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

  // UI mode:
  // - false => landing mode (Welcome + Quick prompts)
  // - true  => chat mode (ChatGPT-style)
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Only switch UI mode when user sends or selects an existing chat
  const isChatMode = hasStartedChat;

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text) return;

    setHasStartedChat(true);
    sendMessage(text);
    setPrompt("");
  }

  // Selecting an existing chat should immediately enter chat mode
  function onSelectChatAndEnter(chatId: string) {
    setHasStartedChat(true);
    selectChat(chatId);
  }

  // Creating a new chat should return to landing mode
  function onNewChatAndReset() {
    newChat();
    setHasStartedChat(false);
    setPrompt("");
  }

  function onQuickLinkClick(p: string) {
    // Clicking a quick prompt should enter chat mode and send immediately
    setHasStartedChat(true);
    sendMessage(p);

    // If you prefer "prefill only", replace the two lines above with:
    // setPrompt(p);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <UcdHeader />

      {/* Page body */}
      <div className="flex-1 ucd-shell" onClick={closeMenus}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          openMenuForChatId={openMenuForChatId}
          onNewChat={onNewChatAndReset}
          onSelectChat={onSelectChatAndEnter}
          onToggleMenu={toggleMenu}
          onDeleteChat={deleteChat}
        />

        {/* Right side content */}
        <div className="flex-1 flex flex-col">
          {/* Welcome (keep mounted so it can animate out) */}
          <section
            className={[
              "bg-white ui-transition duration-700 overflow-hidden",
              isChatMode
                ? "opacity-0 -translate-y-4 max-h-0"
                : "opacity-100 translate-y-0 max-h-[400px]",
            ].join(" ")}
          >
            <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center">
              <h1 className="text-4xl font-semibold text-slate-900">
                Welcome to the Student Support Assistant
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Ask questions about fees, timetables, supports, exams, campus services,
                and more. This assistant will use your college knowledge base to help you
                find the right information quickly.
              </p>
            </div>
          </section>

          {/* Chat + Quick prompts */}
          <section className="flex-1 bg-white">
            <div
              className={[
                "mx-auto w-full px-4 py-6 transition-all duration-700",
                isChatMode ? "max-w-6xl" : "max-w-5xl",
                isChatMode ? "flex flex-col h-full" : "space-y-6",
              ].join(" ")}
            >
              {/* ChatWindow */}
              <div
                className={[
                  "rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-700",
                  isChatMode ? "flex-1 min-h-[60vh]" : "",
                  // NEW: subtle lift-in animation when chat mode begins
                  isChatMode ? "animate-[fadeInUp_0.4s_ease-out]" : "",
                ].join(" ")}
              >
                <ChatWindow
                  chat={activeChat}
                  status={status}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onSend={onSend}
                />
              </div>

              {/* Quick prompts (keep mounted so it can animate out) */}
              <div
                className={[
                  "ui-transition duration-500 overflow-hidden",
                  isChatMode
                    ? "opacity-0 translate-y-2 max-h-0 pointer-events-none"
                    : "opacity-100 translate-y-0 max-h-[600px]",
                ].join(" ")}
              >
                <h2 className="text-sm font-semibold text-slate-900">Quick prompts</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Click a topic to prefill your message.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {QUICK_LINKS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => onQuickLinkClick(item.prompt)}
                      className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition-shadow"
                    >
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <UcdFooter />
    </div>
  );
}

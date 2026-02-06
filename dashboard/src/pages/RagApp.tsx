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

// const QUICK_LINKS: QuickLink[] = [
//   {
//     title: "Fees & Payments",
//     description: "Deadlines, payment methods, tuition info.",
//     prompt: "Can you help me find information about fees and how to pay?",
//   },
//   {
//     title: "Timetables",
//     description: "Where to find your timetable and key dates.",
//     prompt: "Where can I find my timetable and important academic dates?",
//   },
//   {
//     title: "Student Supports",
//     description: "Wellbeing, counselling, disability supports.",
//     prompt: "What student supports are available and how do I access them?",
//   },
//   {
//     title: "IT Help",
//     description: "Password resets, Wi-Fi, email, account access.",
//     prompt: "I need IT help. How do I reset my password and access services?",
//   },
//   {
//     title: "Library",
//     description: "Opening hours, borrowing, online resources.",
//     prompt: "How do I access library resources and what are the opening hours?",
//   },
//   {
//     title: "Exam Info",
//     description: "Exam timetables, venues, regulations.",
//     prompt: "Where do I find exam timetables and exam regulations?",
//   },
// ];


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

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    sendMessage(prompt);
    setPrompt("");
  }

  function onQuickLinkClick(p: string) {
    // Put text into the prompt box (so user can edit), or send immediately:
    setPrompt(p);
    // If you prefer "one click sends it", use:
    // sendMessage(p);
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
          onNewChat={newChat}
          onSelectChat={selectChat}
          onToggleMenu={toggleMenu}
          onDeleteChat={deleteChat}
        />

        {/* Right side content (sections) */}
        <div className="flex-1 flex flex-col">
          {/* SECTION 1: Welcome */}
          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-5xl px-4 py-6">
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome to the Student Support Assistant
              </h1>
              <p className="mt-2 text-slate-600">
                Ask questions about fees, timetables, supports, exams, campus services,
                and more. This assistant will use your college knowledge base to help you
                find the right information quickly.
              </p>
            </div>
          </section>

          {/* SECTION 2: Chat on top, quick boxes underneath */}
          <section className="flex-1 bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
              {/* ChatWindow on top */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <ChatWindow
                  chat={activeChat}
                  status={status}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onSend={onSend}
                />
              </div>

              {/* Clickable boxes underneath */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Quick prompts
                </h2>
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
                      <div className="font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </div>
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

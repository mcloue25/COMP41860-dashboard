import React, { useState } from "react";
import { useChat } from "../hooks/useChat";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { ChatWindow } from "../components/ChatWindow/ChatWindow";
import { UcdHeader } from "../components/UcdHeader/UcdHeader";

import "../styles/ucd-theme.css";
import { UcdFooter } from "../components/UcdFooter/UcdFooter";

type QuickLink = {
  title: string;
  description: string;
  prompt: string;
  bgColor: string;
  accentColor: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    title: "New Students",
    description: "Deadlines, payment methods, tuition info.",
    prompt: "Can you help me find information about fees and how to pay?",
    bgColor: "#004377",
    accentColor: "#FFFFFF",
  },
  {
    title: "Registration",
    description: "Where to find your timetable and key dates.",
    prompt: "Where can I find my timetable and important academic dates?",
    bgColor: "#6bbe51",
    accentColor: "#004377",
  },
  {
    title: "Fees & Grants",
    description: "Wellbeing, counselling, disability supports.",
    prompt: "What student supports are available and how do I access them?",
    bgColor: "#007db8",
    accentColor: "#FFFFFF",
  },
  {
    title: "Frequently Asked Questions",
    description: "Password resets, Wi-Fi, email, account access.",
    prompt: "I need IT help. How do I reset my password and access services?",
    bgColor: "#fad239",
    accentColor: "#004377",
  },
  {
    title: "Freshers Guide",
    description: "Opening hours, borrowing, online resources.",
    prompt: "How do I access library resources and what are the opening hours?",
    bgColor: "#007db8",
    accentColor: "#FFFFFF",
  },
  {
    title: "Exams & Assessments",
    description: "Exam timetables, venues, regulations.",
    prompt: "Where do I find exam timetables and exam regulations?",
    bgColor: "#fad239",
    accentColor: "#1c5370",
  },
  {
    title: "Official Documents",
    description: "Transcripts, letters, certificates.",
    prompt: "How do I request official university documents?",
    bgColor: "#6bbe51",
    accentColor: "#004377",
  },
  {
    title: "Admissions",
    description: "Offers, requirements, timelines.",
    prompt: "Can you help me with admissions-related questions?",
    bgColor: "#004377",
    accentColor: "#FFFFFF",
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
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const isChatMode = hasStartedChat;

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text) return;

    setHasStartedChat(true);
    sendMessage(text);
    setPrompt("");
  }

  function onSelectChatAndEnter(chatId: string) {
    setHasStartedChat(true);
    selectChat(chatId);
  }

  function onNewChatAndReset() {
    newChat();
    setHasStartedChat(false);
    setPrompt("");
  }

  function onQuickLinkClick(p: string) {
    setHasStartedChat(true);
    sendMessage(p);
  }

  return (
    <div
      className={[
        isChatMode ? "h-screen" : "min-h-screen",
        "flex flex-col bg-white",
      ].join(" ")}
    >
      <UcdHeader />

      <div
        className={[
          "ucd-shell w-full flex flex-1 min-h-0", // ✅ key change
          isChatMode ? "overflow-hidden" : "overflow-visible",
        ].join(" ")}
        onClick={closeMenus}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          openMenuForChatId={openMenuForChatId}
          onNewChat={onNewChatAndReset}
          onSelectChat={onSelectChatAndEnter}
          onToggleMenu={toggleMenu}
          onDeleteChat={deleteChat}
        />

        {/* Right side */}
        <div
          className={[
            "flex-1",
            // ✅ force a definite height chain in chat mode
            isChatMode ? "min-h-0 h-full flex flex-col" : "",
          ].join(" ")}
        >
          {!isChatMode && (
            <section className="bg-white">
              <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center">
                <h1 className="text-4xl font-semibold text-slate-900">
                  Welcome to the Student Support Assistant
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                  Help & support for current students, alumni, applicants & third parties
                </p>
              </div>
            </section>
          )}

          <section
            className={[
              "bg-white",
              // ✅ force section to fill remaining height in chat mode
              isChatMode ? "flex-1 min-h-0 h-full" : "",
            ].join(" ")}
          >
            <div
              className={[
                "mx-auto w-full px-4",
                isChatMode
                  ? "pt-2 pb-2 max-w-[92vw] flex flex-col flex-1 min-h-0 h-full"
                  : "py-6 max-w-5xl space-y-6",
              ].join(" ")}
            >
              {/* ✅ Chat card: fixed to available height in chat mode */}
              <div
                className={[
                  "rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden w-full",
                  isChatMode ? "flex-1 min-h-0 h-full max-h-full" : "",
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

              {!isChatMode && (
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
                        className="text-left rounded-2xl border border-slate-200 p-4 shadow-sm transition
                                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: item.bgColor,
                          // optional: subtle focus ring tinted to accent
                          // @ts-ignore
                          "--tw-ring-color": item.accentColor,
                        }}
                      >
                        <div
                          className="font-semibold"
                          style={{ color: item.accentColor }}
                        >
                          {item.title}
                        </div>

                        <div
                          className="mt-1 text-sm"
                          style={{ color: `${item.accentColor}B3` }} // ~70% opacity
                        >
                          {item.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      {/* <UcdFooter/> */}
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const SUGGESTED = [
  "Roadmap for SDE",
  "How to use this website?",
  "How does HR mode work?",
  "How does Technical mode work?",
  "How to improve confidence score?",
  "Tips to crack technical interviews",
  "Why is this platform important for placements?",
];

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMessage = { from: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/api/chatbot", { message: text });
      const reply = res.data?.data?.response || "No response.";
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch (err) {
      addToast("Failed to contact AI assistant", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-fuchsia-500 shadow-glow flex items-center justify-center text-white"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((o) => !o)}
      >
        <MessageCircle className="h-7 w-7" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[90vw] rounded-2xl bg-slate-900/95 border border-white/10 shadow-glow backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                  AI
                </div>
                <div>
                  <div className="text-xs font-semibold">
                    AI Interview Assistant
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <X className="h-3 w-3 text-slate-300" />
              </button>
            </div>

            {/* Suggested questions */}
            <div className="px-3 py-2 border-b border-white/10 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto max-h-80 scroll-smooth">
              {messages.length === 0 && (
                <p className="text-xs text-slate-400">
                  Ask me anything about interview preparation, HR/technical
                  rounds, or how to use this platform.
                </p>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] text-xs px-3 py-2 rounded-2xl ${
                      m.from === "user"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm"
                        : "bg-white/5 border border-white/10 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI is typing</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-75" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-bounce delay-150" />
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/70"
                  placeholder="Ask about interviews, resumes, or tips..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-medium text-white shadow-glow disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;


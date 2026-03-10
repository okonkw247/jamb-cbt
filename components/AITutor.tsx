"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "ai"; text: string };

type Props = { subject: string; topic: string; };

export default function AITutor({ subject, topic }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: `Hi! 👋 I'm your AI tutor for **${topic}** in ${subject}. Ask me anything about this topic and I'll explain it in simple English!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic, message: userMsg, history }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply || "Sorry, I could not answer that. Try again!" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Network error. Please check your connection!" }]);
    }
    setLoading(false);
  };

  const suggestions = [
    `Explain ${topic} simply`,
    "Give me an example",
    "What do JAMB ask about this?",
    "What are common mistakes?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ background: "#16a34a" }}
      >
        <span className="text-2xl">🤖</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col max-w-md mx-auto" style={{ background: "#0e1117" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4" style={{ background: "#13171f", borderBottom: "1px solid #1e2533" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#14532d" }}>🤖</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">AI Tutor</p>
              <p className="text-xs" style={{ color: "#4ade80" }}>{topic} • {subject}</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400" style={{ background: "#1e2533" }}>✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1" style={{ background: "#14532d" }}>🤖</div>
                )}
                <div className="max-w-xs rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === "user" ? "#14532d" : "#13171f",
                    border: msg.role === "ai" ? "1px solid #1e2533" : "none",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px"
                  }}>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2" style={{ background: "#14532d" }}>🤖</div>
                <div className="rounded-2xl px-4 py-3" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => { setInput(s); }}
                  className="flex-shrink-0 text-xs px-3 py-2 rounded-xl font-medium"
                  style={{ background: "#1e2533", color: "#9ca3af", border: "1px solid #374151" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 flex gap-2" style={{ background: "#13171f", borderTop: "1px solid #1e2533" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Ask about ${topic}...`}
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "#1e2533", border: "1px solid #374151" }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: input.trim() ? "#16a34a" : "#1e2533" }}>
              <span className="text-white text-lg">↑</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

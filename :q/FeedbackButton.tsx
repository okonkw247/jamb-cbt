"use client";
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, push } from "firebase/database";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState<"bug"|"suggestion"|"compliment">("suggestion");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await push(ref(db, "feedback"), {
        text: text.trim(),
        type,
        uid: auth.currentUser?.uid || "anonymous",
        name: auth.currentUser?.displayName || "Anonymous",
        timestamp: Date.now(),
        page: window.location.pathname,
      });
      setSent(true);
      setText("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    } catch { alert("Failed to send. Try again!"); }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(true)}
        className="fixed bottom-28 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs shadow-lg"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}>
        💬 Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full rounded-3xl p-5 max-w-md"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            
            {sent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-black text-lg" style={{ color: "var(--text)" }}>Thank you!</p>
                <p className="text-sm" style={{ color: "var(--text3)" }}>Your feedback has been sent!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-black" style={{ color: "var(--text)" }}>💬 Send Feedback</p>
                  <button onClick={() => setOpen(false)} style={{ color: "var(--text3)" }}>✕</button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
                  {[
                    { id: "bug", label: "🐛 Bug", color: "var(--red)" },
                    { id: "suggestion", label: "💡 Idea", color: "var(--blue)" },
                    { id: "compliment", label: "❤️ Love it", color: "var(--green)" },
                  ].map(t => (
                    <button key={t.id} onClick={() => setType(t.id as any)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      style={{
                        background: type === t.id ? t.color : "var(--surface2)",
                        color: type === t.id ? "#fff" : "var(--text3)",
                        border: `1px solid ${type === t.id ? t.color : "var(--border)"}`,
                        opacity: type === t.id ? 1 : 0.7
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={
                    type === "bug" ? "Describe the bug you found..." :
                    type === "suggestion" ? "What feature would you like to see?" :
                    "What do you love about the app?"
                  }
                  rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none mb-4"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                />

                <button onClick={send} disabled={loading || !text.trim()}
                  className="btn-primary w-full py-3.5 rounded-2xl font-black text-sm disabled:opacity-50">
                  {loading ? "Sending..." : "Send Feedback →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

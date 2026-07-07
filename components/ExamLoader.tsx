"use client";
import { useState, useEffect } from "react";

const MESSAGES = [
  "Are you ready to ace your exam?",
  "Every question is a step closer to your dream course.",
  "Stay calm. Stay focused. You've got this.",
  "JAMB rewards preparation. You're prepared.",
  "Locking in your questions...",
];

interface Props {
  subjectsList: string[];
  loadingSubjects: { [key: string]: boolean };
  accent: string;
  tab: string;
  bg: string;
}

export default function ExamLoader({ subjectsList, loadingSubjects, accent, tab, bg }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const loadedCount = subjectsList.filter((s) => loadingSubjects[s] === false).length;
  const progressPct = subjectsList.length > 0 ? (loadedCount / subjectsList.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: `linear-gradient(160deg, ${bg}, #000)` }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 animate-bounce" style={{ background: tab }}>
        <span className="text-3xl">🎓</span>
      </div>

      <p
        key={msgIndex}
        className="text-white text-xl font-bold text-center mb-10 max-w-xs"
        style={{ animation: "fadeSlide 2.8s ease-in-out" }}
      >
        {MESSAGES[msgIndex]}
      </p>

      <div className="w-full max-w-xs mb-6">
        <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ background: accent, width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-center" style={{ color: "#6b7280" }}>
          {loadedCount}/{subjectsList.length} subjects ready
        </p>
      </div>

      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {subjectsList.map((s) => {
          const done = loadingSubjects[s] === false;
          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span style={{ color: done ? accent : "#4b5563" }}>{done ? "✓" : "○"}</span>
              <span style={{ color: done ? "#fff" : "#6b7280" }}>{s}</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface LeaderboardEntry {
  name: string;
  score: number;
  total: number;
  percent: number;
  subject: string;
  date: string;
}

export default function GlobalLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const subjects = ["All","Use of English","Mathematics","Physics","Biology","Chemistry","Economics","Government","Literature"];

  useEffect(() => {
    // Timeout fallback - never stay loading forever
    const timeout = setTimeout(() => setLoading(false), 6000);
    
    const unsub = onValue(ref(db, "leaderboard"), (snapshot) => {
      clearTimeout(timeout);
      const data = snapshot.val();
      if (!data) { setLoading(false); return; }
      const list = Object.values(data) as LeaderboardEntry[];
      const sorted = list
        .filter(e => e.percent > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 100);
      setEntries(sorted);
      setLoading(false);
    }, (error) => {
      clearTimeout(timeout);
      console.error(error);
      setLoading(false);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  const filtered = filter === "All" ? entries : entries.filter(e => e.subject === filter);

  const medal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10 font-sans"
      style={{ background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      
      {/* Header */}
      <div className="px-5 pt-10 pb-6"
        style={{ background: "linear-gradient(135deg, #92400e, #b45309)" }}>
        <a href="/" className="text-white text-sm block mb-3 opacity-80">← Home</a>
        <h1 className="text-white font-black text-2xl">🌍 Global Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          Top students across Nigeria
        </p>
        {!loading && (
          <p className="text-xs mt-1 font-bold" style={{ color: "#fbbf24" }}>
            {filtered.length} students ranked
          </p>
        )}
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 overflow-x-auto px-5 py-3 no-scroll"
        style={{ borderBottom: "1px solid var(--border)" }}>
        {subjects.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: filter === s ? "#92400e" : "var(--surface)",
              color: filter === s ? "#fff" : "var(--text3)",
              border: `1px solid ${filter === s ? "#b45309" : "var(--border)"}`
            }}>
            {s === "All" ? "🌍 All" : s.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-4xl mb-4 animate-pulse">🏆</div>
          <p className="font-bold" style={{ color: "var(--text)" }}>Loading rankings...</p>
          <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>Fetching from Firebase</p>
          <div className="mt-4 flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "var(--green)", animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="text-5xl mb-4">📊</div>
          <p className="font-bold" style={{ color: "var(--text)" }}>No rankings yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
            Complete a practice exam to appear here!
          </p>
          <a href="/exam" className="btn-primary inline-block px-6 py-3 rounded-2xl font-bold text-white mt-4">
            Start Exam →
          </a>
        </div>
      )}

      {/* Top 3 podium */}
      {!loading && filtered.length >= 3 && (
        <div className="px-5 py-4">
          <div className="flex items-end justify-center gap-3 mb-4">
            {/* 2nd */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-1"
                style={{ background: "var(--surface)", border: "2px solid #94a3b8" }}>
                {filtered[1]?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <p className="text-xs font-bold text-center truncate w-full text-center"
                style={{ color: "var(--text)" }}>{filtered[1]?.name?.split(" ")[0]}</p>
              <p className="text-xs font-black" style={{ color: "#94a3b8" }}>{filtered[1]?.percent}%</p>
              <div className="w-full h-16 rounded-t-xl flex items-center justify-center mt-1"
                style={{ background: "#475569" }}>
                <span className="text-white font-black text-xl">🥈</span>
              </div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl mb-1 animate-bounce">👑</div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1"
                style={{ background: "var(--surface)", border: "2px solid #fbbf24", boxShadow: "0 0 15px rgba(251,191,36,0.4)" }}>
                {filtered[0]?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <p className="text-xs font-bold text-center truncate w-full text-center"
                style={{ color: "var(--text)" }}>{filtered[0]?.name?.split(" ")[0]}</p>
              <p className="text-xs font-black" style={{ color: "#fbbf24" }}>{filtered[0]?.percent}%</p>
              <div className="w-full h-24 rounded-t-xl flex items-center justify-center mt-1"
                style={{ background: "#92400e" }}>
                <span className="text-white font-black text-2xl">🥇</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-1"
                style={{ background: "var(--surface)", border: "2px solid #cd7c2e" }}>
                {filtered[2]?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <p className="text-xs font-bold text-center truncate w-full text-center"
                style={{ color: "var(--text)" }}>{filtered[2]?.name?.split(" ")[0]}</p>
              <p className="text-xs font-black" style={{ color: "#cd7c2e" }}>{filtered[2]?.percent}%</p>
              <div className="w-full h-10 rounded-t-xl flex items-center justify-center mt-1"
                style={{ background: "#78350f" }}>
                <span className="text-white font-black">🥉</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      {!loading && filtered.length > 0 && (
        <div className="px-5">
          <div className="card overflow-hidden" style={{ background: "var(--surface)" }}>
            {filtered.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  background: i < 3 ? "var(--green-dim)" : "transparent" }}>
                <div className="w-8 text-center flex-shrink-0">
                  <span className="font-black text-sm" style={{ color: i < 3 ? "var(--green)" : "var(--text3)" }}>
                    {medal(i)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: "var(--surface2)", color: "var(--text)" }}>
                  {entry.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{entry.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{entry.subject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm" style={{
                    color: entry.percent >= 70 ? "var(--green)" : entry.percent >= 50 ? "var(--yellow)" : "var(--red)"
                  }}>{entry.percent}%</p>
                  <p className="text-xs" style={{ color: "var(--text3)" }}>{entry.score}/{entry.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

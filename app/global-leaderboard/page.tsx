"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
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

  useEffect(() => {
    const leaderboardRef = ref(db, "leaderboard");
    const unsub = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setLoading(false); return; }
      const list = Object.values(data) as LeaderboardEntry[];
      const sorted = list.sort((a, b) => b.percent - a.percent);
      setEntries(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">🌍 Global Leaderboard</h1>
        <p className="text-yellow-100 text-sm">Top students across Nigeria</p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-gray-700 font-semibold mb-2">No scores yet</h2>
            <p className="text-gray-400 text-sm mb-4">Be the first on the global leaderboard!</p>
            <a href="/" className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium inline-block">
              Start Exam
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border-l-4 ${
                  index === 0 ? "border-yellow-400" :
                  index === 1 ? "border-gray-400" :
                  index === 2 ? "border-orange-400" :
                  "border-transparent"
                }`}
              >
                <div className="text-2xl w-10 text-center flex-shrink-0">
                  {getMedal(index)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold">{entry.name}</p>
                  <p className="text-gray-400 text-xs">{entry.subject} · {entry.date}</p>
                  <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${entry.percent >= 50 ? "bg-green-500" : "bg-red-400"}`}
                      style={{ width: `${entry.percent}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-800 font-bold text-lg">{entry.percent}%</p>
                  <p className="text-gray-400 text-xs">{entry.score}/{entry.total}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

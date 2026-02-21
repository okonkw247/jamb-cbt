"use client";
import { useEffect, useState } from "react";

interface HistoryItem {
  name: string;
  subject: string;
  score: number;
  total: number;
  percent: number;
  date: string;
}

export default function Leaderboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("examHistory") || "[]");
    const sorted = [...data].sort((a, b) => b.percent - a.percent);
    setHistory(sorted);
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getGrade = (percent: number) => {
    if (percent >= 70) return "A";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C";
    return "F";
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">🏆 Leaderboard</h1>
        <p className="text-yellow-100 text-sm">Your best scores ranked</p>
      </div>

      <div className="px-4">
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-gray-700 font-semibold mb-2">No scores yet</h2>
            <p className="text-gray-400 text-sm mb-4">Complete an exam to appear on the leaderboard</p>
            <a href="/" className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium inline-block">
              Start Exam
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border-l-4 ${
                  index === 0 ? "border-yellow-400" :
                  index === 1 ? "border-gray-400" :
                  index === 2 ? "border-orange-400" :
                  "border-transparent"
                }`}
              >
                {/* Rank */}
                <div className="text-2xl w-10 text-center flex-shrink-0">
                  {getMedal(index)}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold">{item.name || "Anonymous"}</p>
                  <p className="text-gray-400 text-xs">{item.subject} · {item.date}</p>
                  <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${item.percent >= 50 ? "bg-green-500" : "bg-red-400"}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-800 font-bold text-lg">{item.percent}%</p>
                  <p className="text-gray-400 text-xs">{item.score}/{item.total}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.percent >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                  }`}>
                    {getGrade(item.percent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

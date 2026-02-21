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

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("examHistory") || "[]");
    setHistory(data);
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem("examHistory");
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-2xl font-bold">📊 History</h1>
            <p className="text-blue-200 text-sm">Your past exam results</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="bg-white bg-opacity-20 text-white text-xs px-3 py-2 rounded-xl"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-gray-700 font-semibold mb-2">No history yet</h2>
            <p className="text-gray-400 text-sm mb-4">Complete an exam to see your results here</p>
            <a href="/" className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium inline-block">
              Start Exam
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-800 font-semibold">{item.name || "Anonymous"}</p>
                    <p className="text-gray-400 text-xs">{item.subject} · {item.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    item.percent >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                  }`}>
                    {item.percent >= 50 ? "Pass" : "Fail"}
                  </span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${item.percent >= 50 ? "bg-green-500" : "bg-red-400"}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-xs">{item.score}/{item.total} correct</p>
                  <p className="text-gray-800 font-bold">{item.percent}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

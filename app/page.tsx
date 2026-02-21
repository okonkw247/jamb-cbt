"use client";
import { useState } from "react";

const subjects = [
  { name: "Use of English", icon: "📖", required: true, questions: 60, time: "2 hrs" },
  { name: "Mathematics", icon: "🔢", required: false, questions: 40, time: "1hr 45m" },
  { name: "Physics", icon: "⚡", required: false, questions: 40, time: "1hr 45m" },
  { name: "Biology", icon: "🧬", required: false, questions: 40, time: "1hr 45m" },
  { name: "Chemistry", icon: "🧪", required: false, questions: 40, time: "1hr 45m" },
  { name: "Economics", icon: "📈", required: false, questions: 40, time: "1hr 45m" },
  { name: "Government", icon: "🏛️", required: false, questions: 40, time: "1hr 45m" },
  { name: "Literature", icon: "📚", required: false, questions: 40, time: "1hr 45m" },
  { name: "Geography", icon: "🌍", required: false, questions: 40, time: "1hr 45m" },
  { name: "Commerce", icon: "🏪", required: false, questions: 40, time: "1hr 45m" },
  { name: "Accounting", icon: "🧾", required: false, questions: 40, time: "1hr 45m" },
  { name: "Agriculture", icon: "🌱", required: false, questions: 40, time: "1hr 45m" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(["Use of English"]);

  const toggleSubject = (subjectName: string) => {
    if (subjectName === "Use of English") return;
    if (selected.includes(subjectName)) {
      setSelected(selected.filter((s) => s !== subjectName));
    } else {
      if (selected.length >= 4) return;
      setSelected([...selected, subjectName]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 rounded-b-3xl mb-6">
        <div className="bg-white bg-opacity-20 w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">
          🎓
        </div>
        <h1 className="text-white text-2xl font-bold">Welcome, Scholar</h1>
        <p className="text-green-200 text-sm">Ready to ace your JAMB exam?</p>
      </div>

      <div className="px-4">
        {/* Student Name */}
        <p className="text-gray-700 font-semibold mb-2">Student Name</p>
        <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 mb-6 border border-gray-200">
          <span className="text-gray-400">👤</span>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 outline-none text-gray-700 bg-transparent"
          />
        </div>

        {/* Subject Selection */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-gray-700 font-semibold">Select Subjects</p>
            <p className="text-gray-400 text-xs">Choose up to 4 subjects</p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            {selected.length} Selected
          </span>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {subjects.map((subject) => {
            const isSelected = selected.includes(subject.name);
            return (
              <div
                key={subject.name}
                onClick={() => toggleSubject(subject.name)}
                className={`bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all cursor-pointer ${
                  isSelected ? "border-green-500" : "border-transparent"
                }`}
              >
                <div className="text-2xl">{subject.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 font-medium">{subject.name}</p>
                    {subject.required && (
                      <span className="bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded-full">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    📋 {subject.questions} Qs &nbsp;&nbsp; ⏱ {subject.time}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Button */}
        <a
          href={`/exam?name=${name}&subjects=${selected.join(",")}`}
          className="block bg-green-500 hover:bg-green-600 text-white text-center py-4 rounded-2xl font-bold text-lg mb-8 transition-colors"
        >

      Start Mock Exam →
        </a>

        <a
          href="/history"
          className="block bg-white border border-gray-200 text-gray-700 text-center py-4 rounded-2xl font-bold text-lg mb-3 transition-colors"
        >
          📊 My History
        </a>

        <a
          href="/leaderboard"
          className="block bg-white border border-gray-200 text-gray-700 text-center py-4 rounded-2xl font-bold text-lg mb-8 transition-colors"
        >
          🏆 Leaderboard
        </a>
      </div>
    </div>
  );
}

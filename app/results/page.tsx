"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";

interface Question {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string };
  answer: string;
}

interface ExamResult {
  name: string;
  subject: string;
  score: number;
  total: number;
  questions: Question[];
  selected: { [key: number]: string };
}

export default function Results() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("examResult");
    if (!data) { router.push("/"); return; }
    const parsed = JSON.parse(data);
    setResult(parsed);

    const percent = Math.round((parsed.score / parsed.total) * 100);

    // Save to global leaderboard
    push(ref(db, "leaderboard"), {
      name: parsed.name || "Anonymous",
      subject: parsed.subject,
      score: parsed.score,
      total: parsed.total,
      percent,
      date: new Date().toLocaleDateString(),
    });

    // Save to local history
    const history = JSON.parse(localStorage.getItem("examHistory") || "[]");
    history.unshift({
      name: parsed.name,
      subject: parsed.subject,
      score: parsed.score,
      total: parsed.total,
      percent,
      date: new Date().toLocaleDateString(),
    });
    localStorage.setItem("examHistory", JSON.stringify(history.slice(0, 20)));
  }, []);

  if (!result) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading results...</p>
    </div>
  );

  const { name, subject, score, total, questions, selected } = result;
  const percent = Math.round((score / total) * 100);
  const grade = percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : "F";
  const passed = percent >= 50;

  const shareOnWhatsApp = () => {
    const msg = `🎓 JAMB CBT Result\nName: ${name}\nSubject: ${subject}\nScore: ${score}/${total}\nPercent: ${percent}%\nGrade: ${grade}\n\nPractice at: https://jamb-cbt-chi.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      <div className="bg-green-600 p-6 text-center rounded-b-3xl mb-6">
        <a href="/" className="text-white text-left block mb-2 text-sm">← Home</a>
        <h1 className="text-white text-xl font-bold">Result Summary</h1>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-6 mb-4 text-center shadow-sm">
          <div className="text-6xl mb-3">🎓</div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {passed ? "✓ Pass" : "✗ Fail"}
          </span>
          <h2 className="text-gray-800 text-xl font-bold mt-2">{name}</h2>
          <p className="text-gray-400 text-sm">{subject} · {new Date().toLocaleDateString()}</p>
          <div className="grid grid-cols-3 gap-4 mt-6 border-t pt-4">
            <div>
              <p className="text-gray-400 text-xs">SCORE</p>
              <p className="text-gray-800 text-2xl font-bold">{score}<span className="text-sm text-gray-400">/{total}</span></p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">PERCENT</p>
              <p className="text-green-500 text-2xl font-bold">{percent}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">GRADE</p>
              <p className="text-gray-800 text-2xl font-bold">{grade}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-4 mb-4 flex items-start gap-3 ${passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <span className="text-2xl">{passed ? "🌟" : "📚"}</span>
          <div>
            <p className={`font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
              {passed ? "Excellent Performance!" : "Keep Practicing!"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {passed ? "Great job! Review your answers below." : "Don't give up! Practice more to improve."}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <a href="/" className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-center text-sm">
            🏠 Home
          </a>
          <button onClick={shareOnWhatsApp} className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold text-sm">
            📲 Share
          </button>
          <a href="/global-leaderboard" className="flex-1 bg-yellow-400 text-white py-3 rounded-2xl font-bold text-center text-sm">
            🏆 Ranks
          </a>
        </div>

        <h2 className="text-gray-800 font-bold text-lg mb-3">
          Answer Breakdown
          <span className="ml-2 text-xs font-normal text-gray-400">🟢 Correct &nbsp; 🔴 Wrong</span>
        </h2>

        <div className="flex flex-col gap-4">
          {questions.map((q, i) => {
            const userAnswer = selected[i];
            const isCorrect = userAnswer === q.answer;
            const isSkipped = !userAnswer;
            return (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${isSkipped ? "border-gray-300" : isCorrect ? "border-green-500" : "border-red-500"}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-xs font-medium">Question {i + 1}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSkipped ? "bg-gray-100 text-gray-500" : isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {isSkipped ? "Skipped" : isCorrect ? "✓ Correct" : "✗ Wrong"}
                  </span>
                </div>
                <p className="text-gray-800 text-sm mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
                <div className="flex flex-col gap-1.5">
                  {(["a", "b", "c", "d"] as const).map((opt) => (
                    <div key={opt} className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${opt === q.answer ? "bg-green-100 text-green-700 font-medium" : opt === userAnswer && !isCorrect ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-600"}`}>
                      <span className="font-bold uppercase">{opt}.</span>
                      <span dangerouslySetInnerHTML={{ __html: q.option[opt] }} />
                      {opt === q.answer && <span className="ml-auto">✓</span>}
                      {opt === userAnswer && !isCorrect && <span className="ml-auto">✗</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

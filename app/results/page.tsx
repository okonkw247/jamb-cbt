"use client";
import { useSearchParams } from "next/navigation";

export default function Results() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Candidate";
  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "40");
  const subject = searchParams.get("subject") || "Use of English";
  const percent = Math.round((score / total) * 100);
  const grade = percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : "F";
  const passed = percent >= 50;

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="bg-green-600 p-6 text-center rounded-b-3xl mb-6">
        <a href="/" className="text-white text-left block mb-2">← Back</a>
        <h1 className="text-white text-xl font-bold">Result Summary</h1>
      </div>

      <div className="px-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl p-6 mb-4 text-center">
          <div className="text-6xl mb-3">🎓</div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {passed ? "Pass" : "Fail"}
          </span>
          <h2 className="text-gray-800 text-xl font-bold mt-2">{name}</h2>
          <p className="text-gray-400 text-sm">{subject}</p>

          {/* Score grid */}
          <div className="grid grid-cols-3 gap-4 mt-6 border-t pt-4">
            <div>
              <p className="text-gray-400 text-xs">SCORE</p>
              <p className="text-gray-800 text-2xl font-bold">
                {score}<span className="text-sm text-gray-400">/{total}</span>
              </p>
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

        {/* Performance message */}
        <div className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <span className="text-2xl">{passed ? "🌟" : "📚"}</span>
          <div>
            <p className={`font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
              {passed ? "Excellent Performance!" : "Keep Practicing!"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {passed
                ? "Great job! You passed the exam. Review your answers below to identify areas for improvement."
                : "Don't give up! Practice more questions to improve your score."}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <a
            href="/"
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-center"
          >
            Go Home
          </a>
          <a
            href="/exam"
            className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-center"
          >
            Try Again
          </a>
        </div>
      </div>
    </div>
  );
}

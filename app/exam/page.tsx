"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ACCESS_TOKEN = "QB-de92a6179a6e85d1d140";

interface Question {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string };
  answer: string;
}

const subjectMap: { [key: string]: string } = {
  "Use of English": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Economics": "economics",
  "Government": "government",
  "Literature": "literature-in-english",
  "Geography": "geography",
  "Commerce": "commerce",
  "Accounting": "accounting",
  "Agriculture": "agriculture",
};

export default function Exam() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get("name") || "Candidate";
  const subjectsList = searchParams.get("subjects")?.split(",") || ["Use of English"];

  const [subject, setSubject] = useState(subjectsList[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const cache = useState<{ [key: string]: Question[] }>({})[0];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchQuestions = useCallback(async (subjectName: string) => {
    setLoading(true);
setError(false);
setCurrent(0);
setSelected({});
setFlagged([]);
try {
  // Check cache first
  if (cache[subjectName]) {
    setQuestions(cache[subjectName]);
    setLoading(false);
    return;
  }
  const key = subjectMap[subjectName] || "english";
  const res = await fetch(`/api/questions?subject=${encodeURIComponent(subjectName)}`);
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        setError(true);
      } else {
        setQuestions(data.data);
        cache[subjectName] = data.data;
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(subject);
  }, [subject, fetchQuestions]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questions, selected]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleSubmit = () => {
    const score = questions.filter((q, i) => selected[i] === q.answer).length;
    sessionStorage.setItem("examResult", JSON.stringify({
      name,
      subject,
      score,
      total: questions.length,
      questions,
      selected,
    }));
    router.push(`/results`);
  };

  const toggleFlag = () => {
    setFlagged((prev) =>
      prev.includes(current)
        ? prev.filter((i) => i !== current)
        : [...prev, current]
    );
  };

  const answeredCount = Object.keys(selected).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 px-8">
      <div className="text-5xl mb-2">📚</div>
      <p className="text-gray-800 font-bold text-lg">Preparing your exam</p>
      <p className="text-gray-400 text-sm">Loading {subject} questions...</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
        <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: "70%" }} />
      </div>
      <p className="text-gray-400 text-xs">This may take a few seconds</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-5xl">😕</div>
      <p className="text-gray-700 font-semibold text-center">Failed to load questions for {subject}</p>
      <button
        onClick={() => fetchQuestions(subject)}
        className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium"
      >
        Try Again
      </button>
      <a href="/" className="text-gray-400 text-sm">Go Home</a>
    </div>
  );

  const q = questions[current];
  if (!q) return null;

  const options = ["a", "b", "c", "d"] as const;

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="bg-orange-500 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-orange-200 text-xs font-medium">JAMB CBT 2024</p>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
            >
              {subjectsList.map((s) => (
                <option key={s} value={s} className="text-black">{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (confirm(`Submit exam? You answered ${answeredCount} of ${questions.length} questions.`)) {
                handleSubmit();
              }
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            Submit
          </button>
        </div>

        {/* Timer */}
        <div className={`rounded-xl mt-3 px-4 py-2 flex justify-between items-center ${timeLeft < 300 ? "bg-red-600" : "bg-white bg-opacity-20"}`}>
          <span className="text-white font-bold text-lg">🔴 {formatTime(timeLeft)}</span>
          <span className="text-white text-xs">
            {timeLeft < 300 ? "⚠️ Less than 5m left!" : `${answeredCount}/${questions.length} answered`}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Question header */}
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-gray-800 text-lg font-bold">Question {current + 1}</h2>
          <span className="text-gray-400 text-sm">of {questions.length}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-800 leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-6">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => setSelected({ ...selected, [current]: opt })}
              className={`bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer border-2 transition-all shadow-sm ${
                selected[current] === opt
                  ? "border-green-500 bg-green-50"
                  : "border-transparent hover:border-gray-200"
              }`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected[current] === opt
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}>
                {selected[current] === opt && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-xs mb-0.5">Option {opt.toUpperCase()}</p>
                <p className="text-gray-800">{q.option[opt]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Question number grid */}
        <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
          <p className="text-gray-400 text-xs mb-2">Question Navigator</p>
          <div className="flex gap-2 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  i === current
                    ? "bg-blue-500 text-white scale-110"
                    : flagged.includes(i)
                    ? "bg-yellow-400 text-white"
                    : selected[i]
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>🟦 Current</span>
            <span>🟩 Answered</span>
            <span>🟨 Flagged</span>
            <span>⬜ Unanswered</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => setCurrent((p) => Math.max(0, p - 1))}
            disabled={current === 0}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={toggleFlag}
            className={`px-5 py-3 rounded-xl font-medium transition-all ${
              flagged.includes(current)
                ? "bg-yellow-400 text-white"
                : "bg-white border border-gray-200 text-gray-700"
            }`}
          >
            🚩 Flag
          </button>
          <button
            onClick={() => setCurrent((p) => Math.min(questions.length - 1, p + 1))}
            disabled={current === questions.length - 1}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

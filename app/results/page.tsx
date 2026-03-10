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

interface SubjectResult {
  subject: string;
  score: number;
  total: number;
  questions: Question[];
  selected: { [key: number]: string };
}

export default function Results() {
  const router = useRouter();
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("examResult");
    if (!data) { router.push("/"); return; }
    const parsed = JSON.parse(data);

    let finalResults: SubjectResult[] = [];
    let candidateName = parsed.name || "Candidate";

    // Handle new multi-subject format
    if (parsed.multiSubject && parsed.results) {
      finalResults = parsed.results;
      candidateName = parsed.name || "Candidate";
    } else {
      // Handle old single-subject format
      finalResults = [{
        subject: parsed.subject,
        score: parsed.score,
        total: parsed.total,
        questions: parsed.questions || [],
        selected: parsed.selected || {},
      }];
    }

    setName(candidateName);
    setResults(finalResults);

    // Save each subject to leaderboard and history
    const history = JSON.parse(localStorage.getItem("examHistory") || "[]");
    finalResults.forEach((r) => {
      const percent = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      push(ref(db, "leaderboard"), {
        name: candidateName,
        subject: r.subject,
        score: r.score,
        total: r.total,
        percent,
        date: new Date().toLocaleDateString(),
      });
      history.unshift({
        name: candidateName,
        subject: r.subject,
        score: r.score,
        total: r.total,
        percent,
        date: new Date().toISOString(),
      });
    });
    localStorage.setItem("examHistory", JSON.stringify(history.slice(0, 50)));
  }, []);

  if (!results.length) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e1117" }}>
      <p style={{ color: "#6b7280" }}>Loading results...</p>
    </div>
  );

  const totalScore = results.reduce((a, r) => a + r.score, 0);
  const totalQuestions = results.reduce((a, r) => a + r.total, 0);
  const totalPercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const passed = totalPercent >= 50;
  const grade = totalPercent >= 70 ? "A" : totalPercent >= 60 ? "B" : totalPercent >= 50 ? "C" : "F";

  const activeResult = results[activeTab];
  const activePercent = activeResult?.total > 0 ? Math.round((activeResult.score / activeResult.total) * 100) : 0;

  const shareOnWhatsApp = () => {
    const lines = results.map((r) => `${r.subject}: ${r.score}/${r.total} (${Math.round((r.score/r.total)*100)}%)`).join("\n");
    const msg = `🎓 JAMB CBT Practice Result\nName: ${name}\n\n${lines}\n\nTotal: ${totalScore}/${totalQuestions} (${totalPercent}%)\nGrade: ${grade}\n\nPractice free at: https://jamb-cbt-chi.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4" style={{ borderBottom: "1px solid #1e2533" }}>
        <a href="/" className="text-xs mb-3 block" style={{ color: "#6b7280" }}>← Home</a>
        <h1 className="text-white font-bold text-xl">Exam Result</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{name} • {new Date().toLocaleDateString()}</p>
      </div>

      <div className="px-4 pt-4">
        {/* Overall score card */}
        <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: passed ? "#14532d" : "#450a0a", border: `1px solid ${passed ? "#4ade80" : "#f87171"}` }}>
          <div className="text-5xl mb-3">{passed ? "🎉" : "📚"}</div>
          <p className="text-white font-bold text-4xl mb-1">{totalPercent}%</p>
          <p className="font-bold text-lg mb-1" style={{ color: passed ? "#4ade80" : "#f87171" }}>
            {passed ? "Pass ✓" : "Fail ✗"} — Grade {grade}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {totalScore} / {totalQuestions} correct
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            {passed ? "Great performance! Keep it up 🔥" : "Don't give up! Practice more daily 💪"}
          </p>
        </div>

        {/* Per-subject breakdown */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280", borderBottom: "1px solid #1e2533" }}>Subject Scores</p>
          {results.map((r, i) => {
            const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < results.length - 1 ? "1px solid #1e2533" : "none" }}>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{r.subject}</p>
                  <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: "#1e2533" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171" }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171" }}>{pct}%</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{r.score}/{r.total}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <a href="/" className="py-3 rounded-2xl font-bold text-center text-sm text-white" style={{ background: "#1e2533" }}>🏠 Home</a>
          <button onClick={shareOnWhatsApp} className="py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "#16a34a" }}>📲 Share</button>
          <a href="/global-leaderboard" className="py-3 rounded-2xl font-bold text-center text-sm text-white" style={{ background: "#92400e" }}>🏆 Ranks</a>
        </div>

        {/* Answer breakdown toggle */}
        <button onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full py-3 rounded-2xl font-bold text-sm mb-4"
          style={{ background: "#13171f", color: "#9ca3af", border: "1px solid #1e2533" }}>
          {showBreakdown ? "Hide" : "Show"} Answer Breakdown ▾
        </button>

        {showBreakdown && (
          <>
            {/* Subject tabs */}
            {results.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-4" style={{ scrollbarWidth: "none" }}>
                {results.map((r, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: activeTab === i ? "#16a34a" : "#1e2533", color: "#fff" }}>
                    {r.subject.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Questions for active subject */}
            <div className="flex flex-col gap-3">
              {activeResult?.questions.map((q, i) => {
                const userAnswer = activeResult.selected[i];
                const isCorrect = userAnswer === q.answer;
                const isSkipped = !userAnswer;
                return (
                  <div key={i} className="rounded-2xl p-4" style={{
                    background: "#13171f",
                    borderLeft: `4px solid ${isSkipped ? "#374151" : isCorrect ? "#4ade80" : "#f87171"}`
                  }}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold" style={{ color: "#6b7280" }}>Q{i + 1}</p>
                      <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: isSkipped ? "#1e2533" : isCorrect ? "#14532d" : "#450a0a", color: isSkipped ? "#6b7280" : isCorrect ? "#4ade80" : "#f87171" }}>
                        {isSkipped ? "Skipped" : isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-3 leading-relaxed">{q.question}</p>
                    <div className="flex flex-col gap-1.5">
                      {(["a", "b", "c", "d"] as const).map((opt) => (
                        <div key={opt} className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
                          style={{
                            background: opt === q.answer ? "#14532d" : opt === userAnswer && !isCorrect ? "#450a0a" : "#1e2533",
                            color: opt === q.answer ? "#4ade80" : opt === userAnswer && !isCorrect ? "#f87171" : "#9ca3af",
                          }}>
                          <span className="font-bold text-xs">{opt.toUpperCase()}.</span>
                          <span>{q.option[opt]}</span>
                          {opt === q.answer && <span className="ml-auto text-xs">✓</span>}
                          {opt === userAnswer && !isCorrect && <span className="ml-auto text-xs">✗</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

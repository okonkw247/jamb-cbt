"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveQuestions, getQuestions } from "@/lib/questionCache";

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

const subjectColors: { [key: string]: { bg: string; tab: string; accent: string } } = {
  "Use of English":  { bg: "#0e1f0e", tab: "#14532d", accent: "#4ade80" },
  "Mathematics":     { bg: "#1a0e0e", tab: "#7f1d1d", accent: "#f87171" },
  "Physics":         { bg: "#0e1a1a", tab: "#164e63", accent: "#22d3ee" },
  "Chemistry":       { bg: "#1a0e1a", tab: "#581c87", accent: "#c084fc" },
  "Biology":         { bg: "#0e1a0e", tab: "#14532d", accent: "#86efac" },
  "Economics":       { bg: "#1a1a0e", tab: "#713f12", accent: "#fbbf24" },
  "Government":      { bg: "#0e0e1a", tab: "#1e3a8a", accent: "#60a5fa" },
  "Literature":      { bg: "#1a0e14", tab: "#881337", accent: "#fb7185" },
  "Geography":       { bg: "#0e1a1a", tab: "#134e4a", accent: "#2dd4bf" },
  "Commerce":        { bg: "#1a140e", tab: "#7c2d12", accent: "#fb923c" },
  "Accounting":      { bg: "#141a0e", tab: "#3f6212", accent: "#a3e635" },
  "Agriculture":     { bg: "#0e1a0e", tab: "#166534", accent: "#4ade80" },
};

export default function Exam() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "Candidate";
  const subjectsList = searchParams.get("subjects")?.split(",") || ["Use of English"];

  const [activeSubject, setActiveSubject] = useState(subjectsList[0]);
  const [allQuestions, setAllQuestions] = useState<{ [key: string]: Question[] }>({});
  const [loadingSubjects, setLoadingSubjects] = useState<{ [key: string]: boolean }>({});
  const [allSelected, setAllSelected] = useState<{ [subject: string]: { [idx: number]: string } }>({});
  const [current, setCurrent] = useState(0);
  const [flagged, setFlagged] = useState<{ [subject: string]: number[] }>({});
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60);
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcExpression, setCalcExpression] = useState("");
  const [calcEvaluated, setCalcEvaluated] = useState(false);
  const [showGoto, setShowGoto] = useState(false);
  const submitted = useRef(false);

  const colors = subjectColors[activeSubject] || subjectColors["Use of English"];
  const questions = allQuestions[activeSubject] || [];
  const selected = allSelected[activeSubject] || {};

  // Load ALL subjects in parallel on mount
  useEffect(() => {
    const loadAll = async () => {
      const loading: { [key: string]: boolean } = {};
      subjectsList.forEach((s) => (loading[s] = true));
      setLoadingSubjects(loading);

      await Promise.all(subjectsList.map(async (subjectName) => {
        try {
          const cached = await getQuestions(subjectName);
          if (cached && cached.length > 0) {
            setAllQuestions((prev) => ({ ...prev, [subjectName]: cached }));
            setLoadingSubjects((prev) => ({ ...prev, [subjectName]: false }));
          }
          const res = await fetch(`/api/questions?subject=${encodeURIComponent(subjectName)}`);
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setAllQuestions((prev) => ({ ...prev, [subjectName]: data.data }));
            await saveQuestions(subjectName, data.data);
          }
        } catch {
          const cached = await getQuestions(subjectName);
          if (cached && cached.length > 0) {
            setAllQuestions((prev) => ({ ...prev, [subjectName]: cached }));
          }
        } finally {
          setLoadingSubjects((prev) => ({ ...prev, [subjectName]: false }));
        }
      }));
    };
    loadAll();
  }, []);

  // Reset current question when switching subjects
  useEffect(() => { setCurrent(0); }, [activeSubject]);

  // Timer - only start when ALL subjects have loaded
  const allLoaded = Object.keys(loadingSubjects).length > 0 && 
    Object.values(loadingSubjects).every(v => v === false);
    
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [allLoaded]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleSubmit = () => {
    if (submitted.current) return;
    submitted.current = true;
    const results: any[] = [];
    subjectsList.forEach((subjectName) => {
      const qs = allQuestions[subjectName] || [];
      const sel = allSelected[subjectName] || {};
      const score = qs.filter((q, i) => sel[i] === q.answer).length;
      results.push({ subject: subjectName, score, total: qs.length, questions: qs, selected: sel });
    });
    sessionStorage.setItem("examResult", JSON.stringify({ name, results, multiSubject: true }));
    router.push("/results");
  };

  const setAnswer = (opt: string) => {
    setAllSelected((prev) => ({
      ...prev,
      [activeSubject]: { ...(prev[activeSubject] || {}), [current]: opt },
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const curr = prev[activeSubject] || [];
      return {
        ...prev,
        [activeSubject]: curr.includes(current) ? curr.filter((i) => i !== current) : [...curr, current],
      };
    });
  };

  const totalAnswered = subjectsList.reduce((acc, s) => acc + Object.keys(allSelected[s] || {}).length, 0);
  const totalQuestions = subjectsList.reduce((acc, s) => acc + (allQuestions[s]?.length || 0), 0);
  const subjectFlagged = flagged[activeSubject] || [];
  const isLoading = loadingSubjects[activeSubject];

  // Calculator
  const calcNumber = (val: string) => {
    if (calcEvaluated) { setCalcDisplay(val); setCalcExpression(val); setCalcEvaluated(false); return; }
    setCalcDisplay(calcDisplay === "0" ? val : calcDisplay + val);
    setCalcExpression(calcExpression + val);
  };
  const calcOperator = (op: string) => { setCalcEvaluated(false); setCalcExpression(calcExpression + op); setCalcDisplay(op); };
  const calcEquals = () => {
    try {
      const result = Function('"use strict"; return (' + calcExpression + ')')();
      const rounded = Math.round(result * 1000000) / 1000000;
      setCalcDisplay(String(rounded)); setCalcExpression(String(rounded)); setCalcEvaluated(true);
    } catch { setCalcDisplay("Error"); setCalcExpression(""); }
  };
  const calcClear = () => { setCalcDisplay("0"); setCalcExpression(""); setCalcEvaluated(false); };
  const calcBack = () => {
    if (calcDisplay.length === 1) { setCalcDisplay("0"); return; }
    setCalcDisplay(calcDisplay.slice(0, -1));
    setCalcExpression(calcExpression.slice(0, -1));
  };

  const q = questions[current];

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto flex flex-col" style={{ background: colors.bg, transition: "background 0.3s" }}>

      {/* Top bar - timer + submit */}
      <div className="sticky top-0 z-20 px-4 py-2 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <p className="text-white text-xs font-bold">{name}</p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>{totalAnswered}/{totalQuestions} answered</p>
        </div>
        <div className={`px-4 py-1.5 rounded-xl font-bold text-base ${timeLeft < 300 ? "bg-red-600 text-white animate-pulse" : "text-white"}`}
          style={{ background: timeLeft < 300 ? "#dc2626" : "rgba(255,255,255,0.1)" }}>
          {allLoaded ? `⏱ ${formatTime(timeLeft)}` : "⏳ Loading..."}
        </div>
        <button onClick={() => { if (confirm(`Submit exam?\n${totalAnswered} of ${totalQuestions} answered.`)) handleSubmit(); }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: colors.tab, color: "#fff" }}>
          Submit ✓
        </button>
      </div>

      {/* Subject tabs */}
      <div className="flex overflow-x-auto" style={{ background: "rgba(0,0,0,0.4)", scrollbarWidth: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {subjectsList.map((s) => {
          const sColors = subjectColors[s] || subjectColors["Use of English"];
          const sAnswered = Object.keys(allSelected[s] || {}).length;
          const sTotal = allQuestions[s]?.length || 0;
          const isActive = activeSubject === s;
          const isLoadingTab = loadingSubjects[s];
          return (
            <button key={s} onClick={() => setActiveSubject(s)}
              className="flex-shrink-0 px-4 py-2.5 text-xs font-bold transition-all relative"
              style={{ color: isActive ? "#fff" : "#6b7280", borderBottom: isActive ? `2px solid ${sColors.accent}` : "2px solid transparent" }}>
              {s.split(" ")[0]}
              {isLoadingTab ? (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sColors.accent }} />
              ) : (
                <span className="ml-1 text-xs" style={{ color: sAnswered === sTotal && sTotal > 0 ? sColors.accent : "#6b7280" }}>
                  {sAnswered}/{sTotal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-white font-bold mb-1">Loading {activeSubject}...</p>
          <p className="text-xs mb-4" style={{ color: "#6b7280" }}>Fetching questions</p>
          <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2533" }}>
            <div className="h-full rounded-full animate-pulse" style={{ background: colors.accent, width: "60%" }} />
          </div>
        </div>
      )}

      {/* No questions */}
      {!isLoading && !q && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-white font-bold mb-4">Failed to load {activeSubject} questions</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: colors.tab }}>
            Retry
          </button>
        </div>
      )}

      {/* Question */}
      {!isLoading && q && (
        <div className="flex-1 px-4 py-4">
          {/* Question header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm px-3 py-1 rounded-lg" style={{ background: colors.tab, color: "#fff" }}>Q.{current + 1}</span>
              <span className="text-xs" style={{ color: "#6b7280" }}>of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleFlag}
                className="px-3 py-1 rounded-lg text-xs font-bold"
                style={{ background: subjectFlagged.includes(current) ? "#ca8a04" : "rgba(255,255,255,0.1)", color: "#fff" }}>
                🚩 {subjectFlagged.includes(current) ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ background: colors.accent, width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question text */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white text-sm leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 mb-5">
            {(["a", "b", "c", "d"] as const).map((opt) => {
              const isSelected = selected[current] === opt;
              return (
                <button key={opt} onClick={() => setAnswer(opt)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left w-full transition-all active:scale-95"
                  style={{
                    background: isSelected ? colors.tab : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isSelected ? colors.accent : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{ background: isSelected ? colors.accent : "rgba(255,255,255,0.1)", color: isSelected ? "#000" : "#9ca3af" }}>
                    {opt.toUpperCase()}
                  </div>
                  <p className="text-sm" style={{ color: isSelected ? "#fff" : "#d1d5db" }}>{q.option[opt]}</p>
                </button>
              );
            })}
          </div>

          {/* Question grid navigator */}
          <div className="rounded-2xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: "#6b7280" }}>Question Navigator</p>
              <button onClick={() => setShowGoto(!showGoto)} className="text-xs" style={{ color: colors.accent }}>
                {showGoto ? "Hide" : "Show all"}
              </button>
            </div>
            {showGoto && (
              <div className="flex gap-1.5 flex-wrap max-h-32 overflow-y-auto">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => { setCurrent(i); setShowGoto(false); }}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: i === current ? colors.accent : subjectFlagged.includes(i) ? "#ca8a04" : selected[i] ? colors.tab : "rgba(255,255,255,0.08)",
                      color: i === current ? "#000" : "#fff",
                    }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
            {!showGoto && (
              <div className="flex gap-3 text-xs" style={{ color: "#6b7280" }}>
                <span>🟩 Answered ({Object.keys(selected).length})</span>
                <span>🟨 Flagged ({subjectFlagged.length})</span>
                <span>⬛ Left ({questions.length - Object.keys(selected).length})</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
              ‹ Back
            </button>
            <button onClick={() => setShowGoto(!showGoto)}
              className="px-4 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
              Goto ▾
            </button>
            <button onClick={() => setCurrent((p) => Math.min(questions.length - 1, p + 1))} disabled={current === questions.length - 1}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: colors.tab, color: "#fff" }}>
              Next ›
            </button>
          </div>

          {/* Submit button */}
          <button onClick={() => { if (confirm(`Submit exam?\n${totalAnswered} of ${totalQuestions} answered.`)) handleSubmit(); }}
            className="w-full py-4 rounded-2xl font-bold text-sm mt-3"
            style={{ background: "#14532d", color: "#4ade80", border: "1px solid #4ade80" }}>
            ■ Submit Exam
          </button>
        </div>
      )}

      {/* Calculator button */}
      <button onClick={() => setShowCalc(!showCalc)}
        className="fixed bottom-6 right-4 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xl z-50"
        style={{ background: colors.tab }}>
        🧮
      </button>

      {/* Calculator */}
      {showCalc && (
        <div className="fixed bottom-20 right-4 rounded-2xl shadow-2xl p-4 z-50 w-68" style={{ background: "#13171f", border: "1px solid #1e2533", width: "270px" }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-white font-bold text-sm">Calculator</p>
            <button onClick={() => setShowCalc(false)} style={{ color: "#6b7280" }}>✕</button>
          </div>
          <div className="rounded-xl p-3 mb-3" style={{ background: "#0e1117" }}>
            <p className="text-xs text-right mb-1" style={{ color: "#6b7280" }}>{calcExpression || " "}</p>
            <p className="text-white text-2xl text-right font-light">{calcDisplay}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="].map((btn) => (
              <button key={btn} onClick={() => {
                if (btn === "C") calcClear();
                else if (btn === "⌫") calcBack();
                else if (btn === "=") calcEquals();
                else if (["÷", "×", "-", "+", "%"].includes(btn)) calcOperator(btn === "÷" ? "/" : btn === "×" ? "*" : btn);
                else calcNumber(btn);
              }}
                className={`py-3 rounded-xl text-sm font-bold ${btn === "=" ? "col-span-1" : ""}`}
                style={{
                  background: btn === "=" ? colors.tab : ["C", "±", "%", "÷", "×", "-", "+"].includes(btn) ? "#374151" : "#1e2533",
                  color: "#fff",
                  gridColumn: btn === "0" ? "span 1" : undefined,
                }}>
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

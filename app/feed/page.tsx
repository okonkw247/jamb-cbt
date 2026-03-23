"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, update, increment, onValue, get } from "firebase/database";

const SUBJECTS = [
  { name: "Use of English", color: "#064e3b", accent: "#34d399", icon: "📖" },
  { name: "Mathematics", color: "#1e1b4b", accent: "#818cf8", icon: "🔢" },
  { name: "Physics", color: "#0c2a4a", accent: "#38bdf8", icon: "⚡" },
  { name: "Biology", color: "#052e16", accent: "#4ade80", icon: "🧬" },
  { name: "Chemistry", color: "#2e1065", accent: "#c084fc", icon: "🧪" },
  { name: "Economics", color: "#431407", accent: "#fb923c", icon: "📈" },
  { name: "Government", color: "#172554", accent: "#60a5fa", icon: "🏛️" },
  { name: "Literature", color: "#4a044e", accent: "#f0abfc", icon: "📚" },
];

interface Question {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string };
  answer: string;
  subject: string;
  subjectColor: string;
  subjectAccent: string;
  subjectIcon: string;
}

const XP_PER_CORRECT = 15;
const XP_PER_WRONG = 2;

export default function Feed() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [xp, setXp] = useState(0);
  const [xpPop, setXpPop] = useState<{val:number;key:number}|null>(null);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [filter, setFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<number[]>([]);
  const [reactions, setReactions] = useState<Record<number, string>>({});
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [dragStart, setDragStart] = useState<number|null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"up"|"down"|null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const xpKey = useRef(0);

  const EMOJIS = ["🔥","😂","🤯","💪","😭","👏"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const psnap = await get(ref(db, `users/${u.uid}/profile`));
      if (psnap.val()) setProfile(psnap.val());
      const statsSnap = await get(ref(db, `users/${u.uid}/feedStats`));
      if (statsSnap.val()) {
        setXp(statsSnap.val().xp || 0);
        setStreak(statsSnap.val().streak || 0);
        setTotalAnswered(statsSnap.val().totalAnswered || 0);
      }
    });
    return () => unsub();
  }, []);

  const fetchQuestions = useCallback(async (subject?: string) => {
    setLoadingMore(true);
    try {
      const subjects = subject && subject !== "All"
        ? [SUBJECTS.find(s => s.name === subject)!]
        : SUBJECTS;
      const picks = subject && subject !== "All"
        ? [subjects[0]]
        : Array.from({length: 5}, () => subjects[Math.floor(Math.random() * subjects.length)]);

      const results = await Promise.all(picks.map(async (s) => {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(s.name)}`);
        const data = await res.json();
        return (data.data || []).slice(0, 8).map((q: any) => ({
          ...q,
          subject: s.name,
          subjectColor: s.color,
          subjectAccent: s.accent,
          subjectIcon: s.icon,
        }));
      }));

      const flat = results.flat().sort(() => Math.random() - 0.5);
      setQuestions(prev => subject && subject !== "All" ? flat : [...prev, ...flat]);
      setLoading(false);
    } catch {
      setLoading(false);
    }
    setLoadingMore(false);
  }, []);

  useEffect(() => { fetchQuestions(); }, []);

  // Load more when near end
  useEffect(() => {
    if (currentIndex >= questions.length - 5 && !loadingMore) {
      fetchQuestions(filter !== "All" ? filter : undefined);
    }
  }, [currentIndex]);

  const handleAnswer = async (opt: string) => {
    const q = questions[currentIndex];
    if (answered[currentIndex] !== undefined) return;
    const isCorrect = opt === q.answer;
    setAnswered(prev => ({ ...prev, [currentIndex]: opt }));
    const xpGained = isCorrect ? XP_PER_CORRECT + (streak >= 3 ? 5 : 0) : XP_PER_WRONG;
    const newXp = xp + xpGained;
    const newStreak = isCorrect ? streak + 1 : 0;
    const newTotal = totalAnswered + 1;
    setXp(newXp);
    setStreak(newStreak);
    setTotalAnswered(newTotal);
    xpKey.current += 1;
    setXpPop({ val: xpGained, key: xpKey.current });
    setTimeout(() => setXpPop(null), 1200);
    if (user) {
      await update(ref(db, `users/${user.uid}/feedStats`), {
        xp: increment(xpGained),
        streak: newStreak,
        totalAnswered: increment(1),
      });
    }
  };

  const goNext = () => {
    setSwiping(true);
    setSwipeDir("up");
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setShowExplain(false);
      setShowReactPicker(false);
      setSwiping(false);
      setSwipeDir(null);
      setDragOffset(0);
    }, 300);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setSwiping(true);
    setSwipeDir("down");
    setTimeout(() => {
      setCurrentIndex(i => i - 1);
      setShowExplain(false);
      setShowReactPicker(false);
      setSwiping(false);
      setSwipeDir(null);
      setDragOffset(0);
    }, 300);
  };

  const toggleSave = () => {
    const q = questions[currentIndex];
    setSavedQuestions(prev =>
      prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
    );
  };

  const handleReact = (emoji: string) => {
    setReactions(prev => ({ ...prev, [currentIndex]: emoji }));
    setShowReactPicker(false);
  };

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    setDragOffset(e.touches[0].clientY - dragStart);
  };
  const onTouchEnd = () => {
    if (dragOffset < -60) goNext();
    else if (dragOffset > 60) goPrev();
    else setDragOffset(0);
    setDragStart(null);
  };

  const level = Math.floor(xp / 100) + 1;
  const levelXp = xp % 100;
  const levelLabel = level <= 3 ? "Novice" : level <= 6 ? "Student" : level <= 10 ? "Scholar" : level <= 15 ? "Expert" : "Master";

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#000" }}>
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ background: "#111", border: "1px solid #222" }}>🧠</div>
        <div className="absolute inset-0 rounded-2xl animate-ping" style={{ border: "2px solid #4ade80", opacity: 0.3 }} />
      </div>
      <p className="text-white font-black text-xl mb-2">Loading Feed</p>
      <p className="text-xs mb-6" style={{ color: "#4ade80" }}>Fetching JAMB questions...</p>
      <div className="flex gap-1.5">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: "#4ade80", animation: `bounce 1s ${i*0.15}s infinite` }} />
        ))}
      </div>
    </div>
  );

  const q = questions[currentIndex];
  if (!q) return null;
  const isAnswered = answered[currentIndex] !== undefined;
  const userAnswer = answered[currentIndex];
  const isSaved = savedQuestions.includes(q.id);
  const myReaction = reactions[currentIndex];
  const correctCount = Object.values(answered).filter((ans, i) => ans === questions[i]?.answer).length;

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden select-none"
      style={{ background: "#000", fontFamily: "'SF Pro Display', system-ui, sans-serif" }}>

      {/* XP Pop */}
      {xpPop && (
        <div key={xpPop.key} className="fixed top-24 right-4 z-50 font-black text-lg animate-bounce pointer-events-none"
          style={{ color: "#4ade80", textShadow: "0 0 20px #4ade80" }}>
          +{xpPop.val} XP
        </div>
      )}

      {/* Streak popup */}
      {streak >= 3 && isAnswered && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl font-black text-sm pointer-events-none"
          style={{ background: "#fbbf24", color: "#000" }}>
          🔥 {streak}x STREAK BONUS!
        </div>
      )}

      {/* Top HUD */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pt-8 pb-3"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            <span className="text-white text-lg">←</span>
          </button>

          {/* Level badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: q.subjectAccent, color: "#000" }}>
              {level}
            </div>
            <div>
              <p className="text-white text-xs font-black">{levelLabel}</p>
              <div className="w-16 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${levelXp}%`, background: q.subjectAccent }} />
              </div>
            </div>
            <p className="text-xs font-bold" style={{ color: q.subjectAccent }}>{xp} XP</p>
          </div>

          {/* Filter */}
          <button onClick={() => setShowFilter(!showFilter)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            <span className="text-white text-sm">⚙</span>
          </button>
        </div>

        {/* Subject filter */}
        {showFilter && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {["All", ...SUBJECTS.map(s => s.name)].map(s => (
              <button key={s} onClick={() => { setFilter(s); setShowFilter(false); setQuestions([]); setCurrentIndex(0); fetchQuestions(s !== "All" ? s : undefined); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: filter === s ? q.subjectAccent : "rgba(255,255,255,0.1)",
                  color: filter === s ? "#000" : "#fff"
                }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
{/* Main Card */}
      <div
        ref={cardRef}
        className="min-h-screen flex flex-col justify-end pb-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: swiping
            ? swipeDir === "up" ? "translateY(-100vh)" : "translateY(100vh)"
            : `translateY(${Math.max(-80, Math.min(80, dragOffset * 0.3))}px)`,
          transition: swiping ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)" : "transform 0.1s ease",
        }}>

        {/* Background gradient */}
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${q.subjectColor}cc, #000 70%)` }} />

        {/* Floating subject label */}
        <div className="absolute top-28 left-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: `1px solid ${q.subjectAccent}44` }}>
            <span className="text-lg">{q.subjectIcon}</span>
            <p className="text-xs font-bold" style={{ color: q.subjectAccent }}>{q.subject}</p>
          </div>
        </div>

        {/* Question counter */}
        <div className="absolute top-28 right-4 z-10">
          <div className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", color: "#fff" }}>
            #{currentIndex + 1}
          </div>
        </div>

        {/* Question + Options */}
        <div className="relative z-10 px-4">
          {/* Question */}
          <div className="rounded-3xl p-5 mb-3"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: `1px solid ${q.subjectAccent}33` }}>
            <p className="text-white font-bold text-base leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(["a","b","c","d"] as const).map((opt, idx) => {
              const isSelected = userAnswer === opt;
              const isCorrect = opt === q.answer;
              const showResult = isAnswered;

              let bg = "rgba(255,255,255,0.08)";
              let border = "rgba(255,255,255,0.1)";
              let textC = "#fff";
              let scale = "1";

              if (showResult) {
                if (isCorrect) { bg = `${q.subjectColor}cc`; border = q.subjectAccent; textC = q.subjectAccent; scale = "1.02"; }
                else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.2)"; border = "#ef4444"; textC = "#fca5a5"; }
                else { bg = "rgba(0,0,0,0.4)"; border = "rgba(255,255,255,0.05)"; textC = "#4b5563"; }
              }

              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={isAnswered}
                  className="py-3.5 px-3 rounded-2xl text-sm font-bold text-left transition-all active:scale-95"
                  style={{ background: bg, border: `1.5px solid ${border}`, color: textC, transform: `scale(${scale})`,
                    backdropFilter: "blur(10px)", animationDelay: `${idx * 0.05}s` }}>
                  <span className="text-xs opacity-60 mr-1">{opt.toUpperCase()}.</span>
                  {q.option[opt]}
                  {showResult && isCorrect && <span className="float-right">✓</span>}
                  {showResult && isSelected && !isCorrect && <span className="float-right">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Result + Next */}
          {isAnswered && (
            <div className="mb-3">
              <div className="rounded-2xl p-3 mb-2 flex items-center gap-3"
                style={{ background: userAnswer === q.answer ? `${q.subjectColor}aa` : "rgba(239,68,68,0.2)",
                  border: `1px solid ${userAnswer === q.answer ? q.subjectAccent : "#ef4444"}` }}>
                <span className="text-2xl">{userAnswer === q.answer ? "🎯" : "📚"}</span>
                <div>
                  <p className="font-black text-sm" style={{ color: userAnswer === q.answer ? q.subjectAccent : "#fca5a5" }}>
                    {userAnswer === q.answer ? `Correct! +${XP_PER_CORRECT + (streak > 3 ? 5 : 0)} XP` : `Wrong! Correct: ${q.answer.toUpperCase()}`}
                  </p>
                  {streak >= 2 && <p className="text-xs" style={{ color: "#fbbf24" }}>🔥 {streak} streak!</p>}
                </div>
              </div>
              <button onClick={goNext}
                className="w-full py-3.5 rounded-2xl font-black text-base text-black"
                style={{ background: q.subjectAccent }}>
                Next Question ↑
              </button>
            </div>
          )}

          {/* Swipe hint if not answered */}
          {!isAnswered && (
            <p className="text-center text-xs mb-2 animate-pulse" style={{ color: "rgba(255,255,255,0.3)" }}>
              Tap an answer • Swipe up to skip
            </p>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="fixed right-3 bottom-32 z-40 flex flex-col gap-4 items-center">
        {/* React */}
        <div className="relative">
          <button onClick={() => setShowReactPicker(!showReactPicker)}
            className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <span className="text-xl">{myReaction || "😀"}</span>
          </button>
          {showReactPicker && (
            <div className="absolute right-14 bottom-0 flex gap-1 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(e)} className="text-2xl active:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button onClick={toggleSave}
          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5"
          style={{ background: isSaved ? `${q.subjectAccent}33` : "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: `1px solid ${isSaved ? q.subjectAccent : "rgba(255,255,255,0.15)"}` }}>
          <span className="text-xl">{isSaved ? "🔖" : "🔖"}</span>
          <span className="text-xs font-bold" style={{ color: isSaved ? q.subjectAccent : "#9ca3af" }}>{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Share */}
        <button onClick={() => {
          const msg = `🧠 JAMB Question:\n\n${q.question}\n\nA. ${q.option.a}\nB. ${q.option.b}\nC. ${q.option.c}\nD. ${q.option.d}\n\nCan you answer? 👉 https://jamb-cbt-chi.vercel.app/feed`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        }}
          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-xl">📲</span>
          <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>Share</span>
        </button>

        {/* Stats */}
        <button onClick={() => router.push("/history")}
          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-xl">📊</span>
          <span className="text-xs font-bold" style={{ color: "#9ca3af" }}>{correctCount}</span>
        </button>
      </div>

      {/* Bottom nav hint */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pb-4 pt-8"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{q.subjectIcon}</span>
            <div>
              <p className="text-white text-xs font-black">{q.subject}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{totalAnswered} answered today</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <span className="text-sm">🔥</span>
                <span className="text-xs font-black" style={{ color: "#fbbf24" }}>{streak}</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <button onClick={goPrev} disabled={currentIndex === 0} style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>▲</button>
              <button onClick={goNext} style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>▼</button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-4 py-2 rounded-xl"
          style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-white text-xs font-bold animate-pulse">Loading more... 🧠</p>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

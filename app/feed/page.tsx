"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, update, increment, get } from "firebase/database";

const SUBJECTS = [
  { name: "Use of English", icon: "📖" },
  { name: "Mathematics", icon: "🔢" },
  { name: "Physics", icon: "⚡" },
  { name: "Biology", icon: "🧬" },
  { name: "Chemistry", icon: "🧪" },
  { name: "Economics", icon: "📈" },
  { name: "Government", icon: "🏛️" },
  { name: "Literature", icon: "📚" },
];

interface Question {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string };
  answer: string;
  subject: string;
  icon: string;
}

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
  const [streak, setStreak] = useState(0);
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"forYou" | "subjects">("forYou");
  const [showSubjects, setShowSubjects] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");
  const [xpAnim, setXpAnim] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliding, setSliding] = useState(false);
  const [slideDir, setSlideDir] = useState<"up" | "down" | null>(null);

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
      }
    });
    return () => unsub();
  }, []);

  const fetchQuestions = useCallback(async (subject?: string) => {
    setLoadingMore(true);
    try {
      const picks = subject && subject !== "All"
        ? [SUBJECTS.find(s => s.name === subject)!]
        : Array.from({ length: 4 }, () => SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]);

      const results = await Promise.all(picks.map(async (s) => {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(s.name)}`);
        const data = await res.json();
        return (data.data || []).slice(0, 10).map((q: any) => ({
          ...q, subject: s.name, icon: s.icon,
        }));
      }));
      const flat = results.flat().sort(() => Math.random() - 0.5);
      setQuestions(prev => [...prev, ...flat]);
      setLoading(false);
    } catch { setLoading(false); }
    setLoadingMore(false);
  }, []);

  useEffect(() => { fetchQuestions(); }, []);

  useEffect(() => {
    if (currentIndex >= questions.length - 5 && !loadingMore) {
      fetchQuestions(filterSubject !== "All" ? filterSubject : undefined);
    }
  }, [currentIndex]);

  const goTo = (dir: "up" | "down") => {
    if (sliding) return;
    if (dir === "down" && currentIndex === 0) return;
    setSliding(true);
    setSlideDir(dir);
    setTimeout(() => {
      setCurrentIndex(i => dir === "up" ? i + 1 : i - 1);
      setSliding(false);
      setSlideDir(null);
    }, 250);
  };

  const handleAnswer = async (opt: string) => {
    if (answered[currentIndex] !== undefined) return;
    const q = questions[currentIndex];
    const isCorrect = opt === q.answer;
    setAnswered(prev => ({ ...prev, [currentIndex]: opt }));
    const newStreak = isCorrect ? streak + 1 : 0;
    const xpGained = isCorrect ? 10 + (newStreak >= 3 ? 5 : 0) : 2;
    setXp(x => x + xpGained);
    setStreak(newStreak);
    setXpAnim(`+${xpGained} XP`);
    setTimeout(() => setXpAnim(null), 1000);
    if (user) {
      await update(ref(db, `users/${user.uid}/feedStats`), {
        xp: increment(xpGained),
        streak: newStreak,
        totalAnswered: increment(1),
      });
    }
  };

  const toggleLike = (i: number) => setLikes(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleSave = (i: number) => setSaved(prev => ({ ...prev, [i]: !prev[i] }));

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? "up" : "down");
    touchStart.current = null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
      <div className="text-center">
        <p className="text-white font-bold text-lg mb-2">🧠 Loading Feed...</p>
        <p className="text-sm" style={{ color: "#6b7280" }}>Getting JAMB questions</p>
      </div>
    </div>
  );

  const q = questions[currentIndex];
  if (!q) return null;
  const isAnswered = answered[currentIndex] !== undefined;
  const userAns = answered[currentIndex];
  const likeCount = Object.values(likes).filter(Boolean).length + 24;
  const saveCount = Object.values(saved).filter(Boolean).length + 8;

  return (
    <div className="fixed inset-0 max-w-md mx-auto overflow-hidden"
      style={{ background: "#000", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>

      {/* TikTok top tabs */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-8 pb-3 flex items-center justify-between px-4"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
        <button onClick={() => router.push("/")}
          className="text-white font-bold text-sm px-2">←</button>
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveTab("subjects")}
            className="font-bold text-sm"
            style={{ color: activeTab === "subjects" ? "#fff" : "rgba(255,255,255,0.5)" }}>
            Subjects
            {activeTab === "subjects" && <div className="h-0.5 bg-white rounded-full mt-0.5" />}
          </button>
          <button onClick={() => setActiveTab("forYou")}
            className="font-bold text-sm"
            style={{ color: activeTab === "forYou" ? "#fff" : "rgba(255,255,255,0.5)" }}>
            For You
            {activeTab === "forYou" && <div className="h-0.5 bg-white rounded-full mt-0.5" />}
          </button>
        </div>
        <button onClick={() => setShowSubjects(!showSubjects)}
          className="text-white text-sm">🔍</button>
      </div>

      {/* Subject filter dropdown */}
      {showSubjects && (
        <div className="absolute top-20 left-4 right-4 z-40 rounded-2xl p-3"
          style={{ background: "rgba(0,0,0,0.95)", border: "1px solid #1e2533" }}>
          <div className="flex flex-wrap gap-2">
            {["All", ...SUBJECTS.map(s => s.name)].map(s => (
              <button key={s} onClick={() => {
                setFilterSubject(s);
                setShowSubjects(false);
                setQuestions([]);
                setCurrentIndex(0);
                setAnswered({});
                fetchQuestions(s !== "All" ? s : undefined);
              }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: filterSubject === s ? "#16a34a" : "#1e2533", color: "#fff" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* XP animation */}
      {xpAnim && (
        <div className="absolute top-24 right-4 z-50 font-black text-base pointer-events-none"
          style={{ color: "#4ade80", animation: "fadeUp 1s forwards" }}>
          {xpAnim}
        </div>
      )}

      {/* Streak */}
      {streak >= 3 && (
        <div className="absolute top-24 left-4 z-50 px-3 py-1 rounded-xl font-black text-sm pointer-events-none"
          style={{ background: "#fbbf24", color: "#000" }}>
          🔥 {streak}x
        </div>
      )}

      {/* Main question card */}
      <div className="absolute inset-0 flex flex-col justify-end pb-4"
        style={{
          transform: sliding ? (slideDir === "up" ? "translateY(-100%)" : "translateY(100%)") : "translateY(0)",
          transition: sliding ? "transform 0.25s ease" : "none",
        }}>

        {/* Dark gradient bg */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0.3))" }} />

        {/* Content */}
        <div className="relative z-10 px-4">
          {/* Subject tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{q.icon}</span>
            <span className="text-white font-bold text-sm">{q.subject}</span>
            <span className="text-xs px-2 py-0.5 rounded-lg font-bold" style={{ background: "#1e2533", color: "#9ca3af" }}>
              #{currentIndex + 1}
            </span>
          </div>

          {/* Question */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(30,37,51,0.9)" }}>
            <p className="text-white font-bold text-sm leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 mb-3">
            {(["a", "b", "c", "d"] as const).map((opt) => {
              const isSelected = userAns === opt;
              const isCorrect = opt === q.answer;
              let bg = "rgba(30,37,51,0.9)";
              let border = "transparent";
              let color = "#fff";

              if (isAnswered) {
                if (isCorrect) { bg = "#14532d"; border = "#4ade80"; color = "#4ade80"; }
                else if (isSelected) { bg = "#450a0a"; border = "#f87171"; color = "#f87171"; }
                else { bg = "rgba(15,17,23,0.7)"; color = "#4b5563"; }
              }

              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={isAnswered}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold text-left flex items-center gap-3"
                  style={{ background: bg, border: `1.5px solid ${border}`, color }}>
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: isAnswered && isCorrect ? "#4ade80" : isAnswered && isSelected ? "#f87171" : "#374151", color: isAnswered && (isCorrect || isSelected) ? "#000" : "#9ca3af" }}>
                    {opt.toUpperCase()}
                  </span>
                  <span>{q.option[opt]}</span>
                  {isAnswered && isCorrect && <span className="ml-auto">✓</span>}
                  {isAnswered && isSelected && !isCorrect && <span className="ml-auto">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Next button after answering */}
          {isAnswered && (
            <button onClick={() => goTo("up")}
              className="w-full py-3 rounded-xl font-black text-sm text-white mb-2"
              style={{ background: "#16a34a" }}>
              Next Question ↑
            </button>
          )}

          {/* Bottom info bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Swipe up for next · {xp} XP
            </p>
            {streak > 0 && (
              <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>🔥 {streak} streak</p>
            )}
          </div>
        </div>
      </div>

      {/* Right side TikTok actions */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col gap-5 items-center">
        {/* Profile */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-white"
            style={{ background: "#1e2533" }}>
            {profile?.avatar || "🎓"}
          </div>
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center -mt-3 border-2 border-black">
            <span className="text-xs text-white font-black">+</span>
          </div>
        </div>

        {/* Like */}
        <button onClick={() => toggleLike(currentIndex)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="text-xl">{likes[currentIndex] ? "❤️" : "🤍"}</span>
          </div>
          <span className="text-white text-xs font-bold">{likes[currentIndex] ? likeCount + 1 : likeCount}</span>
        </button>
{/* Save */}
        <button onClick={() => toggleSave(currentIndex)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="text-xl">{saved[currentIndex] ? "🔖" : "🔖"}</span>
          </div>
          <span className="text-white text-xs font-bold">{saved[currentIndex] ? saveCount + 1 : saveCount}</span>
        </button>

        {/* Share */}
        <button onClick={() => {
          const msg = `🧠 JAMB Question!\n\n${q.question}\n\nA. ${q.option.a}\nB. ${q.option.b}\nC. ${q.option.c}\nD. ${q.option.d}\n\nAnswer at: https://jamb-cbt-chi.vercel.app/feed`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        }} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="text-xl">↗️</span>
          </div>
          <span className="text-white text-xs font-bold">Share</span>
        </button>

        {/* XP */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(74,222,128,0.2)", border: "1px solid #4ade80" }}>
            <span className="text-sm font-black" style={{ color: "#4ade80" }}>{Math.floor(xp / 100) + 1}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: "#4ade80" }}>Lv</span>
        </div>
      </div>

      {/* Loading more */}
      {loadingMore && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-30">
          <div className="px-4 py-2 rounded-xl text-xs text-white font-bold animate-pulse"
            style={{ background: "rgba(0,0,0,0.8)" }}>
            Loading more questions...
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
      `}</style>
    </div>
  );
}

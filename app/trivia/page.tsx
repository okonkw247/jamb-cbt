"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  { q: "What year was Nigeria's independence?", opts: ["1960","1963","1956","1970"], a: "1960", subject: "Government" },
  { q: "What is the chemical symbol for Gold?", opts: ["Go","Gd","Au","Ag"], a: "Au", subject: "Chemistry" },
  { q: "What is the powerhouse of the cell?", opts: ["Nucleus","Ribosome","Mitochondria","Vacuole"], a: "Mitochondria", subject: "Biology" },
  { q: "Who wrote 'Things Fall Apart'?", opts: ["Wole Soyinka","Chinua Achebe","Ngugi wa Thiong'o","Bolaji Abdullahi"], a: "Chinua Achebe", subject: "Literature" },
  { q: "What is the speed of light in m/s?", opts: ["3×10⁶","3×10⁸","3×10¹⁰","3×10⁴"], a: "3×10⁸", subject: "Physics" },
  { q: "Solve: If 2x + 5 = 15, find x", opts: ["3","4","5","6"], a: "5", subject: "Mathematics" },
  { q: "What is the capital of Nigeria?", opts: ["Lagos","Kano","Abuja","Ibadan"], a: "Abuja", subject: "Government" },
  { q: "Which gas is most abundant in the atmosphere?", opts: ["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"], a: "Nitrogen", subject: "Chemistry" },
  { q: "What is the process by which plants make food?", opts: ["Respiration","Photosynthesis","Digestion","Transpiration"], a: "Photosynthesis", subject: "Biology" },
  { q: "Newton's second law: F = ?", opts: ["mv","ma","mg","m/a"], a: "ma", subject: "Physics" },
  { q: "What is the Pythagorean theorem?", opts: ["a+b=c","a²+b²=c²","a×b=c²","a²-b²=c"], a: "a²+b²=c²", subject: "Mathematics" },
  { q: "Who is the author of 'The Lion and the Jewel'?", opts: ["Chinua Achebe","Ngugi wa Thiong'o","Wole Soyinka","J.P. Clark"], a: "Wole Soyinka", subject: "Literature" },
  { q: "What is the SI unit of force?", opts: ["Watt","Joule","Newton","Pascal"], a: "Newton", subject: "Physics" },
  { q: "Which organ produces insulin?", opts: ["Liver","Kidney","Pancreas","Spleen"], a: "Pancreas", subject: "Biology" },
  { q: "What is the atomic number of Carbon?", opts: ["6","8","12","14"], a: "6", subject: "Chemistry" },
  { q: "What is 15% of 200?", opts: ["25","30","35","40"], a: "30", subject: "Mathematics" },
  { q: "Nigeria has how many states?", opts: ["30","36","37","42"], a: "36", subject: "Government" },
  { q: "What is the largest planet in the solar system?", opts: ["Saturn","Earth","Jupiter","Neptune"], a: "Jupiter", subject: "Physics" },
  { q: "What is the formula for water?", opts: ["H₂O₂","HO","H₂O","H₃O"], a: "H₂O", subject: "Chemistry" },
  { q: "DNA stands for?", opts: ["Deoxyribose Nucleic Acid","Deoxyribonucleic Acid","Diribonucleic Acid","Dioxyribonucleic Acid"], a: "Deoxyribonucleic Acid", subject: "Biology" },
  { q: "What is the derivative of x²?", opts: ["x","2x","x²","2x²"], a: "2x", subject: "Mathematics" },
  { q: "Who was Nigeria's first president?", opts: ["Tafawa Balewa","Nnamdi Azikiwe","Obafemi Awolowo","Ahmadu Bello"], a: "Nnamdi Azikiwe", subject: "Government" },
  { q: "What is the unit of electrical resistance?", opts: ["Volt","Ampere","Ohm","Watt"], a: "Ohm", subject: "Physics" },
  { q: "Mitosis produces how many daughter cells?", opts: ["1","2","4","8"], a: "2", subject: "Biology" },
  { q: "What is the main gas in the sun?", opts: ["Oxygen","Helium","Hydrogen","Nitrogen"], a: "Hydrogen", subject: "Chemistry" },
  { q: "Simplify: 3(x+2) - 2(x-1)", opts: ["x+4","x+8","x+6","x+5"], a: "x+8", subject: "Mathematics" },
  { q: "Which figure of speech is 'The wind whispered'?", opts: ["Metaphor","Simile","Personification","Alliteration"], a: "Personification", subject: "English" },
  { q: "What is the BODMAS rule used for?", opts: ["Spelling","Order of operations","Grammar","Biology"], a: "Order of operations", subject: "Mathematics" },
  { q: "Who wrote 'Weep Not Child'?", opts: ["Chinua Achebe","Wole Soyinka","Ngugi wa Thiong'o","Bolaji Abdullahi"], a: "Ngugi wa Thiong'o", subject: "Literature" },
  { q: "What is the chemical formula for table salt?", opts: ["NaCl","KCl","CaCl","MgCl"], a: "NaCl", subject: "Chemistry" },
];

const SUBJECT_COLORS: Record<string, string> = {
  "Government": "#1e3a5f",
  "Chemistry": "#2a1a2e",
  "Biology": "#1a2e1a",
  "Literature": "#3b1f1f",
  "Physics": "#1f2d1f",
  "Mathematics": "#1a1a2e",
  "English": "#1e2a1e",
};

const SUBJECT_ACCENT: Record<string, string> = {
  "Government": "#60a5fa",
  "Chemistry": "#c084fc",
  "Biology": "#4ade80",
  "Literature": "#fb7185",
  "Physics": "#22d3ee",
  "Mathematics": "#818cf8",
  "English": "#86efac",
};

const TIME_PER_Q = 10;

export default function Trivia() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro"|"playing"|"result">("intro");
  const [questions, setQuestions] = useState<typeof QUESTIONS>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [answers, setAnswers] = useState<{correct:boolean;skipped:boolean}[]>([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const timerRef = useRef<any>(null);

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  const startGame = () => {
    const qs = shuffle(QUESTIONS).slice(0, 15);
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setCombo(0);
    setTimeLeft(TIME_PER_Q);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current]);

  const handleTimeout = () => {
    if (selected) return;
    setAnswers(prev => [...prev, { correct: false, skipped: true }]);
    setStreak(0);
    setCombo(0);
    setTimeout(() => nextQuestion(), 1200);
  };

  const handleAnswer = (opt: string) => {
    if (selected) return;
    clearInterval(timerRef.current);
    setSelected(opt);
    const q = questions[current];
    const isCorrect = opt === q.a;
    const timeBonus = Math.floor(timeLeft / 2);
    const newStreak = isCorrect ? streak + 1 : 0;
    const newCombo = isCorrect ? combo + 1 : 0;
    const points = isCorrect ? (10 + timeBonus + (newCombo >= 3 ? 5 : 0)) : 0;

    setAnswers(prev => [...prev, { correct: isCorrect, skipped: false }]);
    if (isCorrect) {
      setScore(s => s + points);
      setStreak(newStreak);
      setCombo(newCombo);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newCombo >= 3) { setShowCombo(true); setTimeout(() => setShowCombo(false), 1500); }
    } else {
      setStreak(0);
      setCombo(0);
    }
    setTimeout(() => nextQuestion(), 1200);
  };

  const nextQuestion = () => {
    if (current >= questions.length - 1) {
      setPhase("result");
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setTimeLeft(TIME_PER_Q);
  };

  const q = questions[current];
  const correctCount = answers.filter(a => a.correct).length;
  const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const grade = percent >= 80 ? "S" : percent >= 60 ? "A" : percent >= 40 ? "B" : "C";
  const gradeColor = percent >= 80 ? "#fbbf24" : percent >= 60 ? "#4ade80" : percent >= 40 ? "#60a5fa" : "#9ca3af";

  // INTRO
  if (phase === "intro") return (
    <div className="min-h-screen font-sans max-w-md mx-auto flex flex-col" style={{ background: "#0e1117" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6"
          style={{ background: "#14532d", boxShadow: "0 0 40px #4ade8044" }}>
          🧠
        </div>
        <h1 className="text-white font-black text-3xl mb-2">JAMB Trivia</h1>
        <p className="mb-8" style={{ color: "#6b7280" }}>Quick fire questions across all subjects. 10 seconds each. How fast are you?</p>

        <div className="w-full rounded-2xl p-4 mb-6" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Questions", value: "15", icon: "📝" },
              { label: "Time each", value: "10s", icon: "⏱" },
              { label: "Max score", value: "225", icon: "🏆" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-white font-black text-lg">{s.value}</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full rounded-2xl p-4 mb-8" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Scoring</p>
          {[
            { label: "Correct answer", pts: "+10 pts" },
            { label: "Speed bonus", pts: "+up to 5 pts" },
            { label: "3x combo", pts: "+5 bonus pts" },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center mb-2">
              <p className="text-sm text-white">{r.label}</p>
              <p className="text-xs font-bold" style={{ color: "#4ade80" }}>{r.pts}</p>
            </div>
          ))}
        </div>

        <button onClick={startGame}
          className="w-full py-5 rounded-2xl font-black text-xl text-white mb-3"
          style={{ background: "#16a34a", boxShadow: "0 0 20px #16a34a44" }}>
          🚀 Start Trivia!
        </button>
        <button onClick={() => router.push("/")} className="text-sm" style={{ color: "#6b7280" }}>← Back to Home</button>
      </div>
    </div>
  );

  // PLAYING
  if (phase === "playing" && q) {
    const accent = SUBJECT_ACCENT[q.subject] || "#4ade80";
    const bgColor = SUBJECT_COLORS[q.subject] || "#13171f";
    const timerPct = (timeLeft / TIME_PER_Q) * 100;

    return (
      <div className="min-h-screen font-sans max-w-md mx-auto flex flex-col" style={{ background: "#0e1117" }}>

        {/* Combo popup */}
        {showCombo && (
          <div className="fixed top-20 left-0 right-0 flex justify-center z-50">
            <div className="px-6 py-3 rounded-2xl font-black text-xl animate-bounce"
              style={{ background: "#fbbf24", color: "#000" }}>
              🔥 {combo}x COMBO!
            </div>
          </div>
        )}
{/* Header */}
        <div className="px-4 pt-8 pb-3" style={{ borderBottom: "1px solid #1e2533" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-xl" style={{ background: bgColor, color: accent }}>
                {q.subject}
              </span>
              {streak >= 2 && <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>🔥{streak}x</span>}
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">{score}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>pts</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold" style={{ color: "#6b7280" }}>Q{current+1}/{questions.length}</p>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1e2533" }}>
              <div className="h-full rounded-full transition-all" style={{ background: accent, width: `${((current+1)/questions.length)*100}%` }} />
            </div>
          </div>

          {/* Answer dots */}
          <div className="flex gap-1 flex-wrap">
            {questions.map((_, i) => (
              <div key={i} className="w-4 h-1.5 rounded-full" style={{
                background: i < answers.length
                  ? answers[i].correct ? "#4ade80" : "#f87171"
                  : i === current ? "#fbbf24" : "#1e2533"
              }} />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0"
              style={{
                background: timeLeft <= 3 ? "#450a0a" : "#13171f",
                color: timeLeft <= 3 ? "#f87171" : "#fff",
                border: `2px solid ${timeLeft <= 3 ? "#f87171" : "#1e2533"}`,
                animation: timeLeft <= 3 ? "pulse 0.5s infinite" : "none"
              }}>
              {timeLeft}
            </div>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#1e2533" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPct}%`,
                  background: timerPct > 50 ? "#4ade80" : timerPct > 25 ? "#fbbf24" : "#f87171"
                }} />
            </div>
          </div>

          {/* Question */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: bgColor, border: `1px solid ${accent}33`, minHeight: "100px" }}>
            <p className="text-white font-bold text-base leading-relaxed text-center">{q.q}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {q.opts.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === q.a;
              const showResult = selected !== null;

              let bg = "#13171f";
              let border = "#1e2533";
              let textColor = "#fff";

              if (showResult) {
                if (isCorrect) { bg = "#14532d"; border = "#4ade80"; textColor = "#4ade80"; }
                else if (isSelected && !isCorrect) { bg = "#450a0a"; border = "#f87171"; textColor = "#f87171"; }
                else { bg = "#0e1117"; border = "#1e2533"; textColor = "#374151"; }
              }

              return (
                <button key={opt} onClick={() => handleAnswer(opt)}
                  disabled={!!selected}
                  className="py-4 px-3 rounded-2xl font-bold text-sm text-center transition-all active:scale-95"
                  style={{ background: bg, border: `2px solid ${border}`, color: textColor }}>
                  {opt}
                  {showResult && isCorrect && <span className="ml-1">✓</span>}
                  {showResult && isSelected && !isCorrect && <span className="ml-1">✗</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  if (phase === "result") return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>
      <div className="px-6 pt-10 text-center">
        <div className="text-6xl mb-2">{percent >= 80 ? "🏆" : percent >= 60 ? "🎉" : percent >= 40 ? "📚" : "💪"}</div>
        <p className="font-black text-5xl mb-1" style={{ color: gradeColor }}>{grade}</p>
        <p className="text-white font-bold text-xl mb-1">{score} points</p>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
          {percent >= 80 ? "Outstanding! You're JAMB ready! 🔥" :
           percent >= 60 ? "Great job! Keep it up!" :
           percent >= 40 ? "Not bad! Practice more!" : "Keep studying! You'll get there!"}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Correct", value: correctCount, color: "#4ade80", bg: "#14532d" },
            { label: "Wrong", value: answers.filter(a=>!a.correct&&!a.skipped).length, color: "#f87171", bg: "#450a0a" },
            { label: "Skipped", value: answers.filter(a=>a.skipped).length, color: "#fbbf24", bg: "#422006" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: s.bg }}>
              <p className="font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-white">Accuracy</p>
            <p className="font-bold" style={{ color: gradeColor }}>{percent}%</p>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "#1e2533" }}>
            <div className="h-full rounded-full" style={{ width: `${percent}%`, background: gradeColor }} />
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-xs" style={{ color: "#6b7280" }}>Best streak</p>
            <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>🔥 {bestStreak}x</p>
          </div>
        </div>

        {/* Answers review */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left" style={{ color: "#6b7280", borderBottom: "1px solid #1e2533" }}>Quick Review</p>
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: i < questions.length-1 ? "1px solid #1e2533" : "none" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: answers[i]?.correct ? "#14532d" : "#450a0a", color: answers[i]?.correct ? "#4ade80" : "#f87171" }}>
                {answers[i]?.correct ? "✓" : "✗"}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-xs leading-relaxed">{q.q}</p>
                {!answers[i]?.correct && <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>✓ {q.a}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={startGame}
            className="w-full py-4 rounded-2xl font-black text-white"
            style={{ background: "#16a34a" }}>
            🔄 Play Again
          </button>
          <button onClick={() => {
            const msg = `🧠 JAMB Trivia Result!\nScore: ${score} pts | Grade: ${grade}\nAccuracy: ${percent}% | Streak: ${bestStreak}x\n\nCan you beat me? 👉 https://jamb-cbt-chi.vercel.app/trivia`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
          }} className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ background: "#13171f", border: "1px solid #1e2533" }}>
            📲 Share Score
          </button>
          <a href="/" className="w-full py-4 rounded-2xl font-bold text-center"
            style={{ background: "#13171f", color: "#6b7280", border: "1px solid #1e2533" }}>
            🏠 Home
          </a>
        </div>
      </div>
    </div>
  );

  return null;
}

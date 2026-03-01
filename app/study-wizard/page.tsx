"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface HistoryItem {
  name: string;
  subject: string;
  score: number;
  total: number;
  percent: number;
  date: string;
}

interface SubjectAnalysis {
  subject: string;
  avgScore: number;
  attempts: number;
  trend: "improving" | "declining" | "stable";
  level: "weak" | "average" | "strong";
  icon: string;
}

const SUBJECT_ICONS: { [key: string]: string } = {
  "Use of English": "📖",
  "Mathematics": "🔢",
  "Physics": "⚡",
  "Chemistry": "🧪",
  "Biology": "🧬",
  "Economics": "📈",
  "Government": "🏛️",
  "Literature": "📚",
};

const STUDY_TIPS: { [key: string]: string[] } = {
  "Use of English": [
    "Read newspapers daily to improve comprehension",
    "Practice 20 past questions every day",
    "Focus on comprehension passages and summary",
    "Learn common idioms and proverbs",
  ],
  "Mathematics": [
    "Practice algebra and calculus daily",
    "Memorize key formulas",
    "Solve past questions on statistics",
    "Focus on word problems and sequences",
  ],
  "Physics": [
    "Understand key concepts before formulas",
    "Practice calculations on mechanics",
    "Study waves, electricity and magnetism",
    "Draw diagrams to understand concepts",
  ],
  "Chemistry": [
    "Memorize periodic table groups",
    "Practice balancing chemical equations",
    "Study organic chemistry reactions",
    "Focus on mole concept calculations",
  ],
  "Biology": [
    "Study diagrams and label them",
    "Focus on genetics and cell biology",
    "Learn ecological concepts",
    "Practice past questions on nutrition",
  ],
  "Economics": [
    "Understand demand and supply curves",
    "Study Nigerian economic policies",
    "Practice calculation questions",
    "Learn key economic theories",
  ],
  "Government": [
    "Study Nigerian constitution",
    "Learn about electoral systems",
    "Focus on international organizations",
    "Study arms of government",
  ],
  "Literature": [
    "Read all set texts thoroughly",
    "Practice literary device identification",
    "Study themes and characters",
    "Write practice essays on set books",
  ],
};

const STUDY_PLANS = [
  { time: "15 mins", label: "Quick Practice", icon: "⚡", desc: "5 questions per subject" },
  { time: "30 mins", label: "Standard Session", icon: "📚", desc: "10 questions per subject" },
  { time: "1 hour", label: "Deep Study", icon: "🔥", desc: "Full mock exam" },
  { time: "2 hours", label: "Marathon", icon: "🏆", desc: "Multiple subjects" },
];

export default function StudyWizard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analysis, setAnalysis] = useState<SubjectAnalysis[]>([]);
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [studySubject, setStudySubject] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const data: HistoryItem[] = JSON.parse(localStorage.getItem("examHistory") || "[]");
    setHistory(data);
    analyzeHistory(data);
    setLoading(false);
  }, []);

  const analyzeHistory = (data: HistoryItem[]) => {
    if (data.length === 0) { setAnalysis([]); return; }

    // Group by subject
    const grouped: { [key: string]: number[] } = {};
    data.forEach((item) => {
      if (!grouped[item.subject]) grouped[item.subject] = [];
      grouped[item.subject].push(item.percent);
    });

    const result: SubjectAnalysis[] = Object.entries(grouped).map(([subject, scores]) => {
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const trend = scores.length >= 2
        ? scores[scores.length - 1] > scores[0] ? "improving"
        : scores[scores.length - 1] < scores[0] ? "declining" : "stable"
        : "stable";
      const level = avgScore >= 70 ? "strong" : avgScore >= 50 ? "average" : "weak";
      return {
        subject,
        avgScore,
        attempts: scores.length,
        trend,
        level,
        icon: SUBJECT_ICONS[subject] || "📝",
      };
    });

    // Sort by score ascending (weakest first)
    result.sort((a, b) => a.avgScore - b.avgScore);
    setAnalysis(result);
    if (result.length > 0) setStudySubject(result[0].subject);
  };

  const getWeakSubjects = () => analysis.filter(a => a.level === "weak");
  const getStrongSubjects = () => analysis.filter(a => a.level === "strong");
  const getOverallAvg = () => {
    if (analysis.length === 0) return 0;
    return Math.round(analysis.reduce((a, b) => a + b.avgScore, 0) / analysis.length);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 font-sans max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-950" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #3b82f6 0%, transparent 50%)" }} />
        <div className="relative px-4 pt-10 pb-6">
          <button onClick={() => router.push("/")} className="text-blue-300 text-sm mb-4 block">← Home</button>
          <h1 className="text-white text-2xl font-bold">🧙 Study Wizard</h1>
          <p className="text-blue-300 text-sm">AI-powered study recommendations</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 px-4 py-3 bg-gray-900 border-b border-gray-800 overflow-x-auto">
        {["📊 Analysis", "📅 Study Plan", "💡 Tips", "🚀 Practice"].map((t, i) => (
          <button
            key={t}
            onClick={() => setStep(i)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              step === i ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">

        {/* ANALYSIS TAB */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <div className="bg-gray-900 rounded-3xl p-8 text-center border border-gray-800">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-white font-bold text-lg mb-2">No Data Yet!</h3>
                <p className="text-gray-400 text-sm mb-6">Take some practice exams first so the wizard can analyze your performance!</p>
                <button
                  onClick={() => router.push("/exam")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold"
                >
                  Start Practice Exam
                </button>
              </div>
            ) : (
              <>
                {/* Overall score */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-5 border border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Overall Performance</p>
                      <p className="text-white text-4xl font-bold mt-1">{getOverallAvg()}%</p>
                    </div>
                    <div className="text-5xl">
                      {getOverallAvg() >= 70 ? "🏆" : getOverallAvg() >= 50 ? "📈" : "💪"}
                    </div>
                  </div>
                  <div className="w-full bg-blue-950 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all"
                      style={{ width: `${getOverallAvg()}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-blue-400 text-xs">{history.length} exams taken</p>
                    <p className="text-blue-400 text-xs">{analysis.length} subjects</p>
                  </div>
                </div>

                {/* Weak subjects alert */}
                {getWeakSubjects().length > 0 && (
                  <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-2xl p-4">
                    <p className="text-red-400 font-bold text-sm mb-2">⚠️ Needs Attention</p>
                    <div className="flex flex-wrap gap-2">
                      {getWeakSubjects().map(s => (
                        <span key={s.subject} className="bg-red-500 bg-opacity-20 text-red-300 text-xs px-3 py-1 rounded-full">
                          {s.icon} {s.subject} — {s.avgScore}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject breakdown */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Subject Breakdown</p>
                  </div>
                  {analysis.map((a) => (
                    <div key={a.subject} className="px-4 py-3 border-b border-gray-800 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{a.icon}</span>
                          <div>
                            <p className="text-white text-sm font-medium">{a.subject}</p>
                            <p className="text-gray-500 text-xs">{a.attempts} attempt{a.attempts !== 1 ? "s" : ""} • {
                              a.trend === "improving" ? "📈 Improving" :
                              a.trend === "declining" ? "📉 Declining" : "➡️ Stable"
                            }</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            a.level === "strong" ? "text-green-400" :
                            a.level === "average" ? "text-yellow-400" : "text-red-400"
                          }`}>{a.avgScore}%</p>
                          <p className={`text-xs ${
                            a.level === "strong" ? "text-green-600" :
                            a.level === "average" ? "text-yellow-600" : "text-red-600"
                          }`}>{a.level}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            a.level === "strong" ? "bg-green-500" :
                            a.level === "average" ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${a.avgScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* STUDY PLAN TAB */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Choose Study Session</p>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_PLANS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setSelectedPlan(i)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedPlan === i
                        ? "border-blue-500 bg-blue-500 bg-opacity-10"
                        : "border-gray-700 bg-gray-800"
                    }`}
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <p className={`font-bold text-sm ${selectedPlan === i ? "text-blue-400" : "text-white"}`}>{p.label}</p>
                    <p className="text-gray-500 text-xs">{p.time}</p>
                    <p className="text-gray-400 text-xs mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Today's recommended plan */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-4 border border-indigo-800">
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">🧙 Wizard Recommendation</p>
              {analysis.length === 0 ? (
                <p className="text-gray-400 text-sm">Take some exams first to get personalized recommendations!</p>
              ) : (
                <>
                  <p className="text-white font-bold mb-3">Today's Focus Plan:</p>
                  {analysis.slice(0, 3).map((a, i) => (
                    <div key={a.subject} className="flex items-center gap-3 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-red-500" : i === 1 ? "bg-yellow-500" : "bg-blue-500"
                      } text-white`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{a.icon} {a.subject}</p>
                        <p className="text-indigo-300 text-xs">
                          {i === 0 ? "Start here — needs most work" :
                          i === 1 ? "Second priority" : "Maintain this subject"}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${
                        a.level === "weak" ? "text-red-400" :
                        a.level === "average" ? "text-yellow-400" : "text-green-400"
                      }`}>{a.avgScore}%</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Weekly schedule */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">📅 Weekly Schedule</p>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                const subj = analysis[i % Math.max(analysis.length, 1)];
                return (
                  <div key={day} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <p className="text-gray-500 text-xs w-8">{day}</p>
                    <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2">
                      <p className="text-white text-xs">
                        {subj ? `${subj.icon} ${subj.subject}` : "📝 General Practice"}
                      </p>
                    </div>
                    <p className="text-gray-500 text-xs">{STUDY_PLANS[selectedPlan].time}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TIPS TAB */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            {/* Subject selector */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Select Subject</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(STUDY_TIPS).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStudySubject(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      studySubject === s
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {SUBJECT_ICONS[s]} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            {studySubject && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-4">
                  <p className="text-white font-bold text-lg">{SUBJECT_ICONS[studySubject]} {studySubject}</p>
                  <p className="text-blue-300 text-xs">Study tips from past JAMB patterns</p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {(STUDY_TIPS[studySubject] || []).map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-xl p-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General JAMB tips */}
            <div className="bg-gradient-to-br from-yellow-900 to-orange-900 rounded-2xl p-4 border border-yellow-800">
              <p className="text-yellow-300 font-bold text-sm mb-3">⭐ General JAMB Tips</p>
              {[
                "Read questions carefully before answering",
                "Attempt easy questions first",
                "Don't spend too long on one question",
                "Use elimination method for MCQs",
                "Practice with past questions daily",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-yellow-400 text-xs mt-1">✓</span>
                  <p className="text-yellow-100 text-xs">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRACTICE TAB */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-3xl p-6 border border-green-700 text-center">
              <div className="text-5xl mb-3">🚀</div>
              <h3 className="text-white font-bold text-xl mb-2">Ready to Practice?</h3>
              <p className="text-green-300 text-sm mb-4">
                {analysis.length > 0
                  ? `Focus on ${analysis[0]?.subject} — your weakest subject at ${analysis[0]?.avgScore}%`
                  : "Start practicing to get personalized recommendations!"}
              </p>
              <button
                onClick={() => router.push("/exam")}
                className="w-full bg-white text-green-800 py-3 rounded-2xl font-bold text-base"
              >
          📝 Start Practice Exam
              </button>
            </div>

            {/* Quick practice by subject */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Practice by Subject</p>
              </div>
              {Object.keys(SUBJECT_ICONS).map((s) => {
                const subjectAnalysis = analysis.find(a => a.subject === s);
                return (
                  <button
                    key={s}
                    onClick={() => router.push(`/exam?subject=${encodeURIComponent(s)}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-xl">{SUBJECT_ICONS[s]}</span>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-medium">{s}</p>
                      {subjectAnalysis ? (
                        <p className={`text-xs ${
                          subjectAnalysis.level === "weak" ? "text-red-400" :
                          subjectAnalysis.level === "average" ? "text-yellow-400" : "text-green-400"
                        }`}>
                          {subjectAnalysis.avgScore}% avg • {subjectAnalysis.attempts} attempts
                        </p>
                      ) : (
                        <p className="text-gray-500 text-xs">Not practiced yet</p>
                      )}
                    </div>
                    <span className="text-gray-600">→</span>
                  </button>
                );
              })}
            </div>

            {/* Battle recommendation */}
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-4 border border-purple-800">
              <p className="text-purple-300 font-bold text-sm mb-2">⚔️ Ready for Battle?</p>
              <p className="text-gray-300 text-xs mb-3">
                Test your knowledge against other students in real time!
              </p>
              <button
                onClick={() => router.push("/battle")}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm"
              >
                ⚔️ Start a Battle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

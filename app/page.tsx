"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue, get } from "firebase/database";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";

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

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", id: "home" },
  { label: "Practice", icon: "📝", id: "practice" },
  { label: "Battle", icon: "⚔️", id: "battle" },
  { label: "More", icon: "☰", id: "more" },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(["Use of English"]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setName(u.displayName || "");
      setAuthLoading(false);
      const done = localStorage.getItem("onboardingComplete");
      if (!done) setShowOnboarding(true);

      // Load profile
      const profileSnap = await get(ref(db, `users/${u.uid}/profile`));
      if (profileSnap.val()) setProfile(profileSnap.val());

      // Load stats
      const statsSnap = await get(ref(db, `users/${u.uid}/stats`));
      if (statsSnap.val()) setStats(statsSnap.val());

      // Check updates
      onValue(ref(db, "appUpdate"), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        const lastSeen = localStorage.getItem("lastUpdateVersion");
        if (data.version && data.version !== lastSeen) {
          setHasNewUpdate(true);
          setUpdateData(data);
        }
      });
    });
    return () => unsub();
  }, []);

  const toggleSubject = (subjectName: string) => {
    if (subjectName === "Use of English") return;
    if (selected.includes(subjectName)) {
      setSelected(selected.filter((s) => s !== subjectName));
    } else {
      if (selected.length >= 4) return;
      setSelected([...selected, subjectName]);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 font-sans"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)" }}>
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl mb-6 animate-pulse">
        🎓
      </div>
      <h1 className="text-white text-2xl font-bold mb-2">JAMB CBT Practice</h1>
      <p className="text-green-400 text-sm">Prepare. Practice. Pass.</p>
      <div className="mt-8 w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (showOnboarding && user) return (
    <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
  );

  const avatar = profile?.avatar || "🎓";
  const targetScore = profile?.targetScore || "300";
  const examHistory = JSON.parse(localStorage.getItem("examHistory") || "[]");
  const avgScore = examHistory.length > 0
    ? Math.round(examHistory.reduce((a: number, b: any) => a + b.percent, 0) / examHistory.length)
    : 0;

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-24"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>

      {/* Update Banner */}
      {hasNewUpdate && updateData && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg animate-bounce">🎉</span>
            <div>
              <p className="text-white text-xs font-bold">v{updateData.version} is available!</p>
              <p className="text-green-100 text-xs">{updateData.changelog?.[0]}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("lastUpdateVersion", updateData.version);
              setHasNewUpdate(false);
              window.location.reload();
            }}
            className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl"
          >
            Update
          </button>
        </div>
      )}

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div>
          {/* Hero Header */}
          <div className="relative overflow-hidden px-5 pt-10 pb-6">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #22c55e 0%, transparent 50%)" }} />
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-green-400 text-sm font-medium">Good day 👋</p>
                <h1 className="text-white text-2xl font-bold">{name || "Scholar"}</h1>
                <p className="text-gray-400 text-xs mt-0.5">Target: {targetScore} points</p>
              </div>
              <button onClick={() => router.push("/settings")} className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  {avatar}
                </div>
                {hasNewUpdate && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
                )}
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Score", value: `${avgScore}%`, icon: "📈", color: "from-blue-600 to-blue-800" },
                { label: "Exams", value: examHistory.length, icon: "📝", color: "from-purple-600 to-purple-800" },
                { label: "Target", value: targetScore, icon: "🎯", color: "from-green-600 to-green-800" },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 text-center`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                  <p className="text-white text-opacity-70 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-5 mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("practice")}
                className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-4 text-left shadow-lg shadow-green-900"
              >
                <div className="text-3xl mb-2">📝</div>
                <p className="text-white font-bold text-base">Start Exam</p>
                <p className="text-green-200 text-xs">Mock JAMB practice</p>
              </button>
              <button
                onClick={() => setActiveTab("battle")}
                className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 text-left shadow-lg shadow-purple-900"
              >
                <div className="text-3xl mb-2">⚔️</div>
                <p className="text-white font-bold text-base">Battle</p>
                <p className="text-purple-200 text-xs">Challenge friends</p>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="px-5 mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Features</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "History", icon: "📊", href: "/history", color: "bg-blue-900" },
                { label: "Leaderboard", icon: "🏆", href: "/leaderboard", color: "bg-yellow-900" },
                { label: "Global", icon: "🌍", href: "/global-leaderboard", color: "bg-orange-900" },
                { label: "Calculator", icon: "🧮", href: "/calculator", color: "bg-gray-800" },
                { label: "Study Wizard", icon: "🧙", href: "/study-wizard", color: "bg-indigo-900" },
                { label: "Watch Live", icon: "🔴", href: "/watch", color: "bg-red-900" },
                { label: "Study Mode", icon: "📖", href: "/study-mode", color: "bg-blue-900" },
              ].map((f) => (
                <a
                  key={f.label}
                  href={f.href}
                  className={`${f.color} rounded-2xl p-3 text-center border border-white border-opacity-5`}
                >
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <p className="text-white text-xs font-medium">{f.label}</p>
                </a>
              ))}
            </div>
          </div>
             {/* Recent Activity */}
          {examHistory.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Recent Exams</p>
                <a href="/history" className="text-green-400 text-xs">See all →</a>
              </div>
              <div className="flex flex-col gap-2">
                {examHistory.slice(-3).reverse().map((h: any, i: number) => (
                  <div key={i} className="bg-white bg-opacity-5 rounded-2xl px-4 py-3 flex items-center gap-3 border border-white border-opacity-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      h.percent >= 70 ? "bg-green-500 bg-opacity-20 text-green-400" :
                      h.percent >= 50 ? "bg-yellow-500 bg-opacity-20 text-yellow-400" :
                      "bg-red-500 bg-opacity-20 text-red-400"
                    }`}>
                      {h.percent}%
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{h.subject}</p>
                      <p className="text-gray-500 text-xs">{h.score}/{h.total} correct</p>
                    </div>
                    <p className="text-gray-600 text-xs">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Banner */}
          <div className="px-5 mb-6">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-5xl opacity-30">🏆</div>
              <p className="text-white font-bold text-lg mb-1">Ready to pass JAMB?</p>
              <p className="text-yellow-100 text-sm mb-4">Practice daily to reach your {targetScore} target!</p>
              <button
                onClick={() => setActiveTab("practice")}
                className="bg-white text-orange-600 font-bold px-4 py-2 rounded-xl text-sm"
              >
                Start Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRACTICE TAB */}
      {activeTab === "practice" && (
        <div>
          <div className="px-5 pt-10 pb-4">
            <h2 className="text-white text-2xl font-bold mb-1">Practice Exam</h2>
            <p className="text-gray-400 text-sm">Select your subjects and start</p>
          </div>

          {/* Name Input */}
          <div className="px-5 mb-4">
            <div className="bg-white bg-opacity-5 rounded-2xl px-4 py-3 flex items-center gap-3 border border-white border-opacity-10">
              <span className="text-xl">{avatar}</span>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 outline-none text-white bg-transparent text-sm placeholder-gray-500"
              />
            </div>
          </div>

          {/* Selected subjects display */}
          <div className="px-5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Selected Subjects ({selected.length}/4)</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.map((s) => (
                <span key={s} className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500 border-opacity-30">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Subject picker */}
          <div className="px-5 mb-6">
            <div className="flex flex-col gap-2">
              {subjects.map((subject) => {
                const isSelected = selected.includes(subject.name);
                return (
                  <button
                    key={subject.name}
                    onClick={() => toggleSubject(subject.name)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? "bg-green-500 bg-opacity-10 border-green-500 border-opacity-50"
                        : "bg-white bg-opacity-5 border-white border-opacity-5"
                    }`}
                  >
                    <div className="text-2xl">{subject.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${isSelected ? "text-green-400" : "text-white"}`}>{subject.name}</p>
                        {subject.required && (
                          <span className="bg-red-500 bg-opacity-20 text-red-400 text-xs px-2 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{subject.questions} questions • {subject.time}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "bg-green-500 border-green-500" : "border-gray-600"
                    }`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start button */}
          <div className="px-5">
            <a
              href={`/exam?name=${name}&subjects=${selected.join(",")}`}
              className="block bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900"
            >
              Start Mock Exam 🚀
            </a>
          </div>
        </div>
      )}

      {/* BATTLE TAB */}
      {activeTab === "battle" && (
        <div>
          <div className="px-5 pt-10 pb-4">
            <h2 className="text-white text-2xl font-bold mb-1">Battle Arena</h2>
            <p className="text-gray-400 text-sm">Challenge students across Nigeria</p>
          </div>

          <div className="px-5 flex flex-col gap-4">
            {/* Battle modes */}
            <a href="/battle" className="block bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-6 shadow-lg shadow-purple-900">
              <div className="text-4xl mb-3">⚔️</div>
              <h3 className="text-white font-bold text-xl mb-1">Quiz Battle</h3>
              <p className="text-purple-200 text-sm mb-4">Challenge friends to a real-time quiz battle. Create a room, share the code, compete!</p>
              <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 inline-block">
                <p className="text-white text-sm font-bold">Enter Battle Room →</p>
              </div>
            </a>

            <a href="/battle" className="block bg-gradient-to-br from-yellow-600 to-orange-600 rounded-3xl p-6 shadow-lg shadow-orange-900">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-white font-bold text-xl mb-1">Tournament Mode</h3>
              <p className="text-yellow-100 text-sm mb-4">8 players compete in brackets. Semifinals and finals. One champion crowned!</p>
              <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 inline-block">
                <p className="text-white text-sm font-bold">Start Tournament →</p>
              </div>
            </a>

            <a href="/watch" className="block bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🔴</div>
                <div>
                  <h3 className="text-white font-bold text-lg">Watch Live</h3>
                  <p className="text-red-200 text-sm">Spectate ongoing battles</p>
                </div>
                <span className="ml-auto text-white text-xl">→</span>
              </div>
            </a>

            {/* Leaderboards */}
            <div className="grid grid-cols-2 gap-3">
              <a href="/leaderboard" className="bg-white bg-opacity-5 rounded-2xl p-4 border border-white border-opacity-5 text-center">
                <div className="text-3xl mb-2">🏅</div>
                <p className="text-white font-bold text-sm">Local Board</p>
                <p className="text-gray-400 text-xs">Your group</p>
              </a>
              <a href="/global-leaderboard" className="bg-white bg-opacity-5 rounded-2xl p-4 border border-white border-opacity-5 text-center">
                <div className="text-3xl mb-2">🌍</div>
                <p className="text-white font-bold text-sm">Global Board</p>
                <p className="text-gray-400 text-xs">All Nigeria</p>
              </a>
            </div>
          </div>
        </div>
      )}
        {/* MORE TAB */}
      {activeTab === "more" && (
        <div>
          <div className="px-5 pt-10 pb-4">
            <h2 className="text-white text-2xl font-bold mb-1">More</h2>
            <p className="text-gray-400 text-sm">Tools and settings</p>
          </div>

          <div className="px-5 flex flex-col gap-3">
            {[
              { label: "Study Wizard", desc: "AI-powered study recommendations", icon: "🧙", href: "/study-wizard", color: "from-blue-600 to-indigo-600" },
              { label: "My History", desc: "View all your past exams", icon: "📊", href: "/history", color: "from-gray-700 to-gray-800" },
              { label: "Calculator", desc: "Scientific calculator", icon: "🧮", href: "/calculator", color: "from-gray-700 to-gray-800" },
              { label: "Account & Settings", desc: "Profile, stats and preferences", icon: "⚙️", href: "/settings", color: "from-gray-700 to-gray-800" },
              { label: "About", desc: "About JAMB CBT Practice", icon: "ℹ️", href: "/about", color: "from-gray-700 to-gray-800" },
              { label: "Privacy Policy", desc: "How we handle your data", icon: "🔒", href: "/privacy", color: "from-gray-700 to-gray-800" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${item.color} border border-white border-opacity-5`}
              >
                <div className="w-12 h-12 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-gray-300 text-xs">{item.desc}</p>
                </div>
                <span className="text-gray-400 text-xl">→</span>
              </a>
            ))}

            {/* Sign out */}
            <button
              onClick={() => signOut(auth).then(() => router.push("/login"))}
              className="flex items-center gap-4 p-4 rounded-2xl bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 w-full"
            >
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                🚪
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-400 font-bold text-sm">Sign Out</p>
                <p className="text-gray-500 text-xs">See you next time!</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50"
        style={{ background: "rgba(10, 22, 40, 0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-around px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all ${
                activeTab === item.id ? "bg-green-500 bg-opacity-10" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium ${activeTab === item.id ? "text-green-400" : "text-gray-500"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

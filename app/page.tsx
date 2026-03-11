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

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(["Use of English"]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<any>(null);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setName(u.displayName || "");
      setAuthLoading(false);
      const done = localStorage.getItem("onboardingComplete");
      if (!done) setShowOnboarding(true);
      await import('firebase/database').then(({ update, ref: dbRef }) => update(dbRef(db, `users/${u.uid}`), { online: true, lastSeen: Date.now() }));
      const profileSnap = await get(ref(db, `users/${u.uid}/profile`));
      if (profileSnap.val()) setProfile(profileSnap.val());
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
    <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{ background: "#0e1117" }}>
      <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center text-3xl mb-4">🎓</div>
      <p className="text-white font-bold text-lg">JAMB CBT Practice</p>
      <p className="text-gray-500 text-sm mt-1">Loading...</p>
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

  const navItems = [
    { id: "home", label: "Home", icon: "⊞" },
    { id: "practice", label: "Practice", icon: "✏" },
    { id: "battle", label: "Battle", icon: "⚔" },
    { id: "more", label: "More", icon: "≡" },
  ];

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-24" style={{ background: "#0e1117", color: "#fff" }}>

      {/* Update Banner */}
      {hasNewUpdate && updateData && (
        <div style={{ background: "#166534" }} className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-bold">v{updateData.version} available</p>
            <p className="text-green-200 text-xs">{updateData.changelog?.[0]}</p>
          </div>
          <button onClick={() => { localStorage.setItem("lastUpdateVersion", updateData.version); setHasNewUpdate(false); window.location.reload(); }}
            className="bg-white text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg">
            Update
          </button>
        </div>
      )}

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div>
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-10 pb-5">
            <div>
              <p className="text-gray-400 text-sm">Welcome back 👋</p>
              <h1 className="text-white text-xl font-bold mt-0.5">{name || "Scholar"}</h1>
            </div>
            <button onClick={() => router.push("/settings")} className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#1a1f2e" }}>
              {avatar}
              {hasNewUpdate && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />}
            </button>
          </div>

          {/* Stats */}
          <div className="px-5 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Score", value: `${avgScore}%`, color: "#1a2a1a", text: "#4ade80" },
                { label: "Exams Done", value: examHistory.length, color: "#1a1a2a", text: "#818cf8" },
                { label: "Target", value: targetScore, color: "#2a1a1a", text: "#f87171" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: s.color }}>
                  <p className="font-bold text-lg" style={{ color: s.text }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab("practice")}
                className="rounded-2xl p-4 text-left" style={{ background: "#14532d" }}>
                <p className="text-2xl mb-2">✏️</p>
                <p className="text-white font-bold text-sm">Start Exam</p>
                <p className="text-xs mt-0.5" style={{ color: "#86efac" }}>Mock practice</p>
              </button>
              <button onClick={() => setActiveTab("battle")}
                className="rounded-2xl p-4 text-left" style={{ background: "#1e1b4b" }}>
                <p className="text-2xl mb-2">⚔️</p>
                <p className="text-white font-bold text-sm">Battle</p>
                <p className="text-xs mt-0.5" style={{ color: "#a5b4fc" }}>Challenge friends</p>
              </button>
            </div>
          </div>
{/* Features */}
          <div className="px-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>All Features</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
              {[
                { label: "Study Mode", desc: "Read AI notes then practice", icon: "📖", href: "/study-mode" },
                { label: "Study Wizard", desc: "Personalized study plan", icon: "🧙", href: "/study-wizard" },
                { label: "My History", desc: "View past exam results", icon: "📊", href: "/history" },
                { label: "Leaderboard", desc: "Your group ranking", icon: "🏆", href: "/leaderboard" },
                { label: "Global Board", desc: "Compete with Nigeria", icon: "🌍", href: "/global-leaderboard" },
                { label: "Calculator", desc: "Scientific calculator", icon: "🧮", href: "/calculator" },
                { label: "Watch Live", desc: "Spectate battles", icon: "🔴", href: "/watch" },
              ].map((f, i, arr) => (
                <a key={f.label} href={f.href}
                  className="flex items-center gap-3 px-4 py-3.5 active:opacity-70"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #1e2533" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#1e2533" }}>
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{f.label}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{f.desc}</p>
                  </div>
                  <span style={{ color: "#374151" }}>›</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Exams */}
          {examHistory.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Recent Exams</p>
                <a href="/history" className="text-xs" style={{ color: "#4ade80" }}>See all →</a>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
                {examHistory.slice(-3).reverse().map((h: any, i: number, arr: any[]) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #1e2533" : "none" }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0`}
                      style={{ background: h.percent >= 70 ? "#14532d" : h.percent >= 50 ? "#422006" : "#450a0a", color: h.percent >= 70 ? "#4ade80" : h.percent >= 50 ? "#fb923c" : "#f87171" }}>
                      {h.percent}%
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{h.subject}</p>
                      <p className="text-xs" style={{ color: "#6b7280" }}>{h.score}/{h.total} correct</p>
                    </div>
                    <p className="text-xs" style={{ color: "#374151" }}>{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-5 mb-6">
            <div className="rounded-2xl p-5" style={{ background: "#14532d" }}>
              <p className="text-white font-bold text-base mb-1">Keep pushing! 💪</p>
              <p className="text-sm mb-4" style={{ color: "#86efac" }}>Target score: {targetScore}. Practice daily to get there.</p>
              <button onClick={() => setActiveTab("practice")}
                className="bg-white text-green-800 font-bold px-4 py-2 rounded-xl text-sm">
                Practice Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRACTICE TAB */}
      {activeTab === "practice" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-white text-xl font-bold">Practice Exam</h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Select subjects and start your mock exam</p>
          </div>

          <div className="px-5 mb-4">
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#13171f" }}>
              <span className="text-xl">{avatar}</span>
              <input type="text" placeholder="Enter your name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 outline-none text-white text-sm bg-transparent placeholder-gray-600" />
            </div>
          </div>

          <div className="px-5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Selected ({selected.length}/4)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "#14532d", color: "#4ade80" }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="px-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Choose Subjects</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
              {subjects.map((subject, i) => {
                const isSelected = selected.includes(subject.name);
                return (
                  <button key={subject.name} onClick={() => toggleSubject(subject.name)}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                    style={{ borderBottom: i < subjects.length - 1 ? "1px solid #1e2533" : "none", background: isSelected ? "#0f2918" : "transparent" }}>
                    <span className="text-xl flex-shrink-0">{subject.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: isSelected ? "#4ade80" : "#fff" }}>{subject.name}</p>
                        {subject.required && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#450a0a", color: "#f87171" }}>Required</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{subject.questions} questions • {subject.time}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: isSelected ? "#4ade80" : "#374151", background: isSelected ? "#4ade80" : "transparent" }}>
                      {isSelected && <span className="text-xs font-bold text-gray-900">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5">
            <a href={`/exam?name=${name}&subjects=${selected.join(",")}`}
              className="block text-white text-center py-4 rounded-2xl font-bold text-base" style={{ background: "#16a34a" }}>
              Start Mock Exam →
            </a>
          </div>
        </div>
      )}

      {/* BATTLE TAB */}
      {activeTab === "battle" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-white text-xl font-bold">Battle Arena</h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Challenge students across Nigeria</p>
          </div>

          <div className="px-5">
            <div className="rounded-2xl overflow-hidden mb-3" style={{ background: "#13171f" }}>
              {[
                { label: "Quiz Battle", desc: "Create room and challenge a friend", icon: "⚔️", href: "/battle" },
                { label: "Tournament Mode", desc: "8 players, one champion", icon: "🏆", href: "/battle" },
                { label: "Watch Live Battle", desc: "Spectate ongoing battles", icon: "🔴", href: "/watch" },
                { label: "Flashcards", desc: "Memorize with AI flashcards", icon: "🃏", href: "/flashcards" },
                { label: "JAMB Novels", desc: "Set books and summaries", icon: "📚", href: "/jamb-novel" },
                { label: "Friends", desc: "Free Fire style friends", icon: "👥", href: "/friends" },
                { label: "Local Leaderboard", desc: "Your group ranking", icon: "🏅", href: "/leaderboard" },
                { label: "Global Leaderboard", desc: "All of Nigeria", icon: "🌍", href: "/global-leaderboard" },
              ].map((item, i, arr) => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-4 active:opacity-70"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #1e2533" : "none" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#1e2533" }}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{item.desc}</p>
                  </div>
                  <span style={{ color: "#374151" }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MORE TAB */}
      {activeTab === "more" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-white text-xl font-bold">More</h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Tools and settings</p>
          </div>

          <div className="px-5">
            <div className="rounded-2xl overflow-hidden mb-3" style={{ background: "#13171f" }}>
              {[
                { label: "Account & Settings", desc: "Profile, stats, preferences", icon: "⚙️", href: "/settings" },
                { label: "Study Wizard", desc: "AI-powered study plan", icon: "🧙", href: "/study-wizard" },
                { label: "Study Mode", desc: "Read notes, then practice", icon: "📖", href: "/study-mode" },
                { label: "Flashcards", desc: "AI flashcards for quick revision", icon: "🃏", href: "/flashcards" },
                { label: "JAMB Novels", desc: "Set books, characters, themes", icon: "📚", href: "/jamb-novel" },
                { label: "My History", desc: "Past exam results", icon: "📊", href: "/history" },
                { label: "Calculator", desc: "Scientific calculator", icon: "🧮", href: "/calculator" },
                { label: "About", desc: "About this app", icon: "ℹ️", href: "/about" },
                { label: "Friends", desc: "Add friends, battle online", icon: "👥", href: "/friends" },
              { label: "Privacy Policy", desc: "How we handle your data", icon: "🔒", href: "/privacy" },
              ].map((item, i, arr) => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-4 active:opacity-70"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #1e2533" : "none" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#1e2533" }}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{item.desc}</p>
                  </div>
                  <span style={{ color: "#374151" }}>›</span>
                </a>
              ))}
            </div>

            <button onClick={() => signOut(auth).then(() => router.push("/login"))}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: "#1a0a0a" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#450a0a" }}>🚪</div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm" style={{ color: "#f87171" }}>Sign Out</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>See you next time!</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50"
        style={{ background: "#0e1117", borderTop: "1px solid #1e2533" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all"
              style={{ background: activeTab === item.id ? "#14532d" : "transparent" }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium" style={{ color: activeTab === item.id ? "#4ade80" : "#6b7280" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

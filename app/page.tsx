"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";
import ThemeToggle from "@/components/ThemeToggle";

const subjects = [
  { name: "Use of English", icon: "📖", required: true, questions: 60 },
  { name: "Mathematics",    icon: "🔢", required: false, questions: 40 },
  { name: "Physics",        icon: "⚡", required: false, questions: 40 },
  { name: "Biology",        icon: "🧬", required: false, questions: 40 },
  { name: "Chemistry",      icon: "🧪", required: false, questions: 40 },
  { name: "Economics",      icon: "📈", required: false, questions: 40 },
  { name: "Government",     icon: "🏛️", required: false, questions: 40 },
  { name: "Literature",     icon: "📚", required: false, questions: 40 },
  { name: "Geography",      icon: "🌍", required: false, questions: 40 },
  { name: "Commerce",       icon: "🏪", required: false, questions: 40 },
  { name: "Accounting",     icon: "🧾", required: false, questions: 40 },
  { name: "Agriculture",    icon: "🌱", required: false, questions: 40 },
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setName(u.displayName || "");
      setAuthLoading(false);
      const done = localStorage.getItem("onboardingComplete");
      if (!done) setShowOnboarding(true);
      const profileSnap = await get(ref(db, `users/${u.uid}/profile`));
      if (profileSnap.val()) setProfile(profileSnap.val());
      // set online
      const { update: upd, ref: dbRef } = await import("firebase/database");
      upd(dbRef(db, `users/${u.uid}`), { online: true, lastSeen: Date.now() });
    });
    return () => unsub();
  }, []);

  const toggleSubject = (s: string) => {
    if (s === "Use of English") return;
    if (selected.includes(s)) { setSelected(selected.filter(x => x !== s)); return; }
    if (selected.length >= 4) return;
    setSelected([...selected, s]);
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="animate-float mb-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-glow"
          style={{ background: "var(--green-dim)", border: "1px solid var(--green)" }}>🎓</div>
      </div>
      <p className="font-bold text-lg" style={{ color: "var(--text)" }}>JAMB CBT Practice</p>
      <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Loading your profile...</p>
    </div>
  );

  if (showOnboarding && user) return <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />;

  const avatar = profile?.avatar || "🎓";
  const targetScore = profile?.targetScore || "300";
  const examHistory = JSON.parse(localStorage.getItem("examHistory") || "[]");
  const avgScore = examHistory.length > 0
    ? Math.round(examHistory.reduce((a: number, b: any) => a + b.percent, 0) / examHistory.length) : 0;

  const navItems = [
    { id: "home",     label: "Home",     icon: "⊞" },
    { id: "practice", label: "Practice", icon: "✏" },
    { id: "battle",   label: "Battle",   icon: "⚔" },
    { id: "more",     label: "More",     icon: "≡" },
  ];

  const features = [
    { label: "Study Mode",    desc: "AI notes + practice",      icon: "📖", href: "/study-mode"  },
    { label: "Flashcards",    desc: "Memorize key terms",        icon: "🃏", href: "/flashcards"  },
    { label: "Study Wizard",  desc: "Personalized plan",         icon: "🧙", href: "/study-wizard"},
    { label: "JAMB Novels",   desc: "Set books & summaries",     icon: "📚", href: "/jamb-novel"  },
    { label: "Trivia Game",   desc: "Quick fire questions",      icon: "🧠", href: "/trivia"      },
    { label: "Online Lobby",  desc: "See who's online",          icon: "🌍", href: "/online"      },
    { label: "Friends",       desc: "Add & challenge friends",   icon: "👥", href: "/friends"     },
    { label: "My History",    desc: "Past exam results",         icon: "📊", href: "/history"     },
    { label: "Leaderboard",   desc: "Group rankings",            icon: "🏆", href: "/leaderboard" },
    { label: "Calculator",    desc: "Scientific calculator",     icon: "🧮", href: "/calculator"  },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24 animate-fade-in"
      style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "'Plus Jakarta Sans', system-ui" }}>

      {/* ── HOME TAB ── */}
      {activeTab === "home" && (
        <div>
          {/* Hero header */}
          <div className="px-5 pt-10 pb-6 relative overflow-hidden"
            style={{ background: "var(--grad-hero)" }}>
            {/* Decorative circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5"
              style={{ background: "var(--green)" }} />
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text3)" }}>Welcome back 👋</p>
                <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>{name || "Scholar"}</h1>
              </div>
              <button onClick={() => router.push("/settings")}
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl card"
                style={{ background: "var(--surface)" }}>
                {avatar}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Score", value: `${avgScore}%`, color: "var(--green)" },
                { label: "Exams Done", value: examHistory.length, color: "var(--blue)" },
                { label: "Target", value: targetScore, color: "var(--yellow)" },
              ].map(s => (
                <div key={s.label} className="card p-3 text-center"
                  style={{ background: "var(--surface)" }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Feed banner */}
          <div className="px-5 mt-5 mb-4">
            <a href="/feed" className="card card-hover block p-4 relative overflow-hidden"
              style={{ background: "var(--surface)", borderColor: "var(--green)" }}>
              <div className="absolute right-4 top-0 bottom-0 flex items-center text-5xl opacity-10">🧠</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "var(--green-dim)" }}>🧠</div>
                <div>
                  <p className="font-black" style={{ color: "var(--text)" }}>Question Feed</p>
                  <p className="text-xs" style={{ color: "var(--green)" }}>Scroll JAMB questions · Earn XP ↑</p>
                </div>
                <div className="ml-auto">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                    style={{ background: "var(--green)", color: "#fff" }}>▶</div>
                </div>
              </div>
            </a>
          </div>

          {/* Quick Actions */}
          <div className="px-5 mb-5">
            <p className="section-label mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab("practice")}
                className="card card-hover p-4 text-left"
                style={{ background: "var(--surface)" }}>
                <p className="text-2xl mb-2">✏️</p>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Start Exam</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--green)" }}>Mock practice</p>
              </button>
              <button onClick={() => setActiveTab("battle")}
                className="card card-hover p-4 text-left"
                style={{ background: "var(--surface)" }}>
                <p className="text-2xl mb-2">⚔️</p>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Battle</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--blue)" }}>Challenge friends</p>
              </button>
              <a href="/trivia" className="card card-hover p-4 text-left"
                style={{ background: "var(--surface)" }}>
                <p className="text-2xl mb-2">🧠</p>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Trivia</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--yellow)" }}>Quick fire quiz</p>
              </a>
              <a href="/online" className="card card-hover p-4 text-left"
                style={{ background: "var(--surface)" }}>
                <p className="text-2xl mb-2">🌍</p>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Online</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--green)" }}>See who's online</p>
              </a>
            </div>
          </div>

          {/* All Features */}
          <div className="px-5 mb-5">
            <p className="section-label mb-3">All Features</p>
            <div className="card overflow-hidden" style={{ background: "var(--surface)" }}>
              {features.map((f, i) => (
                <a key={f.label} href={f.href}
                  className="flex items-center gap-3 px-4 py-3.5 card-hover"
                  style={{ borderBottom: i < features.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--surface2)" }}>{f.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{f.label}</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>{f.desc}</p>
                  </div>
                  <span style={{ color: "var(--text3)" }}>›</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Exams */}
          {examHistory.length > 0 && (
            <div className="px-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Recent Exams</p>
                <a href="/history" className="text-xs font-bold" style={{ color: "var(--green)" }}>See all →</a>
              </div>
              <div className="card overflow-hidden" style={{ background: "var(--surface)" }}>
                {examHistory.slice(-3).reverse().map((h: any, i: number, arr: any[]) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{
                        background: h.percent >= 70 ? "var(--green-dim)" : h.percent >= 50 ? "rgba(245,158,11,0.12)" : "var(--red-dim)",
                        color: h.percent >= 70 ? "var(--green)" : h.percent >= 50 ? "var(--yellow)" : "var(--red)"
                      }}>
                      {h.percent}%
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{h.subject}</p>
                      <p className="text-xs" style={{ color: "var(--text3)" }}>{h.score}/{h.total} correct</p>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-5 mb-5">
            <div className="card p-5 relative overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--green)" }}>
              <div className="absolute -right-4 -top-4 text-7xl opacity-5">🏆</div>
              <p className="font-black text-base mb-1" style={{ color: "var(--text)" }}>Ready to pass JAMB? 💪</p>
              <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>Target: {targetScore}. Practice daily to reach it!</p>
              <button onClick={() => setActiveTab("practice")} className="btn-primary px-5 py-2.5 text-sm rounded-xl">
                Start Practising →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRACTICE TAB ── */}
      {activeTab === "practice" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>Practice Exam</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Select subjects and start your mock exam</p>
          </div>
          <div className="px-5 mb-4">
            <div className="card px-4 py-3 flex items-center gap-3"
              style={{ background: "var(--surface)" }}>
              <span className="text-xl">{avatar}</span>
              <input type="text" placeholder="Enter your name" value={name}
                onChange={e => setName(e.target.value)}
                className="input flex-1 bg-transparent border-none text-sm"
                style={{ color: "var(--text)" }} />
            </div>
          </div>
          <div className="px-5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="section-label">Selected ({selected.length}/4)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.map(s => (
                <span key={s} className="badge badge-green">{s}</span>
              ))}
            </div>
          </div>
          <div className="px-5 mb-6">
            <p className="section-label mb-3">Choose Subjects</p>
            <div className="card overflow-hidden" style={{ background: "var(--surface)" }}>
              {subjects.map((s, i) => {
                const isSel = selected.includes(s.name);
                return (
                  <button key={s.name} onClick={() => toggleSubject(s.name)}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left card-hover"
                    style={{ borderBottom: i < subjects.length - 1 ? "1px solid var(--border)" : "none",
                      background: isSel ? "var(--green-dim)" : "transparent" }}>
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: isSel ? "var(--green)" : "var(--text)" }}>{s.name}</p>
                        {s.required && <span className="badge badge-red">Required</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{s.questions} questions</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: isSel ? "var(--green)" : "var(--text3)", background: isSel ? "var(--green)" : "transparent" }}>
                      {isSel && <span className="text-xs font-black text-white">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5">
            <a href={`/exam?name=${name}&subjects=${selected.join(",")}`}
              className="btn-primary block text-center py-4 rounded-2xl text-base font-black">
              Start Mock Exam →
            </a>
          </div>
        </div>
      )}

      {/* ── BATTLE TAB ── */}
      {activeTab === "battle" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>Battle Arena</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Challenge students across Nigeria</p>
          </div>
          <div className="px-5">
            <div className="card overflow-hidden mb-3" style={{ background: "var(--surface)" }}>
              {[
                { label: "Online Lobby",    desc: "See who's online and battle",  icon: "🌍", href: "/online"           },
                { label: "Quiz Battle",     desc: "Create room, challenge friend", icon: "⚔️", href: "/battle"           },
                { label: "Tournament",      desc: "8 players, one champion",       icon: "🏆", href: "/battle"           },
                { label: "Watch Live",      desc: "Spectate ongoing battles",      icon: "🔴", href: "/watch"            },
                { label: "Leaderboard",     desc: "Your group ranking",            icon: "🏅", href: "/leaderboard"      },
                { label: "Global Board",    desc: "All of Nigeria",                icon: "🌐", href: "/global-leaderboard"},
              ].map((item, i, arr) => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-4 card-hover"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--surface2)" }}>{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>{item.desc}</p>
                  </div>
                  <span style={{ color: "var(--text3)" }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
{/* ── MORE TAB ── */}
      {activeTab === "more" && (
        <div>
          <div className="px-5 pt-10 pb-5">
            <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>More</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Settings and tools</p>
          </div>
          <div className="px-5">
            {/* Theme toggle */}
            <div className="card p-4 mb-3 flex items-center justify-between"
              style={{ background: "var(--surface)" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Appearance</p>
                <p className="text-xs" style={{ color: "var(--text3)" }}>Switch light or dark mode</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="card overflow-hidden mb-3" style={{ background: "var(--surface)" }}>
              {[
                { label: "Settings",        desc: "Profile, stats, preferences",  icon: "⚙️", href: "/settings"   },
                { label: "Study Wizard",    desc: "AI-powered study plan",         icon: "🧙", href: "/study-wizard"},
                { label: "Study Mode",      desc: "Read notes, then practice",     icon: "📖", href: "/study-mode"  },
                { label: "JAMB Novels",     desc: "Set books for Literature",      icon: "📚", href: "/jamb-novel"  },
                { label: "Flashcards",      desc: "AI flashcards",                 icon: "🃏", href: "/flashcards"  },
                { label: "My History",      desc: "Past exam results",             icon: "📊", href: "/history"     },
                { label: "Calculator",      desc: "Scientific calculator",         icon: "🧮", href: "/calculator"  },
                { label: "Friends",         desc: "Your friends list",             icon: "👥", href: "/friends"     },
                { label: "About",           desc: "About this app",                icon: "ℹ️", href: "/about"       },
                { label: "Privacy Policy",  desc: "How we handle your data",       icon: "🔒", href: "/privacy"     },
              ].map((item, i, arr) => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-3 px-4 py-4 card-hover"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--surface2)" }}>{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--text3)" }}>{item.desc}</p>
                  </div>
                  <span style={{ color: "var(--text3)" }}>›</span>
                </a>
              ))}
            </div>

            <button onClick={() => signOut(auth).then(() => router.push("/login"))}
              className="card w-full flex items-center gap-3 px-4 py-4 mb-6 card-hover"
              style={{ background: "var(--surface)", border: "1px solid var(--red-dim)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "var(--red-dim)" }}>🚪</div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm" style={{ color: "var(--red)" }}>Sign Out</p>
                <p className="text-xs" style={{ color: "var(--text3)" }}>See you next time!</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === item.id ? "var(--green-dim)" : "transparent",
                color: activeTab === item.id ? "var(--green)" : "var(--text3)"
              }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

const SUBJECTS = [
  { name: "Use of English", icon: "📖" },
  { name: "Mathematics", icon: "🔢" },
  { name: "Physics", icon: "⚡" },
  { name: "Chemistry", icon: "🧪" },
  { name: "Biology", icon: "🧬" },
  { name: "Economics", icon: "📈" },
  { name: "Government", icon: "🏛️" },
  { name: "Literature", icon: "📚" },
];

const AVATARS = ["🎓", "🦁", "🔥", "⚡", "🎯", "🏆", "🦅", "🌟"];

const APP_TOUR = [
  {
    icon: "📝",
    title: "Practice Exam",
    desc: "Take full JAMB mock exams with real past questions. Each exam is timed just like the real JAMB. You get instant results and explanations after!",
    highlight: "Start by clicking 'Start Practice Exam' on the home screen",
    color: "from-green-600 to-green-800",
  },
  {
    icon: "⚔️",
    title: "Quiz Battle",
    desc: "Challenge your friends to a real-time quiz battle! Create a room, share the code, and compete head to head. Tournament mode lets up to 8 players compete!",
    highlight: "Click 'Quiz Battle' to start or join a battle room",
    color: "from-purple-600 to-purple-800",
  },
  {
    icon: "🔴",
    title: "Watch Live",
    desc: "Watch your friends battle in real time! Enter a room code to spectate any ongoing battle. You can even react with emojis as you watch!",
    highlight: "Click 'Watch Live Battle' to spectate",
    color: "from-red-600 to-red-800",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "Compete with students across Nigeria on the Global Leaderboard. The more you practice and win battles, the higher you climb!",
    highlight: "Click 'Global Leaderboard' to see rankings",
    color: "from-yellow-600 to-yellow-800",
  },
  {
    icon: "🧮",
    title: "Calculator",
    desc: "Built-in scientific calculator available during practice. Use it for Mathematics and Physics calculations just like in the real exam!",
    highlight: "Click 'Calculator' to access it anytime",
    color: "from-blue-600 to-blue-800",
  },
  {
    icon: "⚙️",
    title: "Settings",
    desc: "Customize your profile, track your stats, set your target JAMB score, and manage your account. Your progress is saved automatically!",
    highlight: "Click 'My Account & Settings' to set up your profile",
    color: "from-gray-600 to-gray-800",
  },
];

interface Props {
  user: any;
  onComplete: () => void;
}

export default function OnboardingWizard({ user, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState("🎓");
  const [name, setName] = useState(user?.displayName || "");
  const [school, setSchool] = useState("");
  const [targetScore, setTargetScore] = useState("300");
  const [subjects, setSubjects] = useState(["Use of English"]);
  const [tourIndex, setTourIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);

  const TOTAL_STEPS = 7;

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimating(false);
    }, 300);
  };

  const skip = () => {
    localStorage.setItem("onboardingComplete", "true");
    onComplete();
  };

  const toggleSubject = (s: string) => {
    if (s === "Use of English") return;
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const finish = async () => {
    setSaving(true);
    try {
      if (user?.uid) {
        await update(ref(db, `users/${user.uid}/profile`), {
          avatar,
          school,
          targetScore,
          favoriteSubjects: subjects,
          onboardingComplete: true,
          updatedAt: Date.now(),
        });
      }
      localStorage.setItem("onboardingComplete", "true");
      onComplete();
    } catch (err) {
      localStorage.setItem("onboardingComplete", "true");
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col font-sans">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-1 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      {step < 6 && (
        <button onClick={skip} className="absolute top-4 right-4 text-gray-500 text-sm z-10">
          Skip →
        </button>
      )}

      {/* Step counter */}
      <div className="absolute top-4 left-4 text-gray-500 text-xs z-10">
        {step + 1} / {TOTAL_STEPS}
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>

        {/* STEP 0 - Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center text-6xl shadow-2xl shadow-green-900 animate-bounce">
                🎓
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                ✨
              </div>
            </div>
            <h1 className="text-white text-3xl font-bold mb-3">Welcome to<br />JAMB CBT! 🇳🇬</h1>
            <p className="text-gray-400 text-base leading-relaxed mb-4">
              The smartest way to prepare for your JAMB exam. Real past questions, live battles with friends, and detailed analytics!
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[
                "✅ Real JAMB past questions",
                "⚔️ Battle friends in real time",
                "📊 Track your progress",
                "🏆 Compete on leaderboard",
              ].map((f) => (
                <div key={f} className="bg-gray-900 rounded-xl px-4 py-2.5 text-left">
                  <p className="text-gray-300 text-sm">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1 - Pick Avatar */}
        {step === 1 && (
          <div className="flex-1 flex flex-col px-6 pt-16">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{avatar}</div>
              <h2 className="text-white text-2xl font-bold mb-2">Pick Your Avatar</h2>
              <p className="text-gray-400 text-sm">This is how other students will see you in battles!</p>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`h-16 rounded-2xl text-3xl transition-all ${
                    avatar === a
                      ? "bg-green-500 bg-opacity-20 border-2 border-green-500 scale-110"
                      : "bg-gray-900 border-2 border-gray-800"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs mb-2">Your Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 2 - School & Target */}
        {step === 2 && (
          <div className="flex-1 flex flex-col px-6 pt-16">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-white text-2xl font-bold mb-2">Set Your Goals</h2>
              <p className="text-gray-400 text-sm">Tell us about yourself so we can personalize your experience</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-2">🏫 Your School</p>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Federal Government College"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 text-sm"
                />
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-2">🎯 Target JAMB Score</p>
                <div className="grid grid-cols-4 gap-2">
                  {["200", "250", "300", "350"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTargetScore(s)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        targetScore === s
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="Or enter custom score"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 text-sm mt-2"
                  min={100}
                  max={400}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Subjects */}
        {step === 3 && (
          <div className="flex-1 flex flex-col px-6 pt-16 overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-white text-2xl font-bold mb-2">Choose Your Subjects</h2>
              <p className="text-gray-400 text-sm">Select the subjects you'll be writing in JAMB</p>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {SUBJECTS.map((s) => {
                const selected = subjects.includes(s.name);
                const required = s.name === "Use of English";
                return (
                  <button
                    key={s.name}
                    onClick={() => toggleSubject(s.name)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ${
                      selected
                        ? "bg-green-500 bg-opacity-10 border-green-500 border-opacity-50"
                        : "bg-gray-900 border-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${selected ? "text-green-400" : "text-gray-300"}`}>{s.name}</p>
                        {required && <p className="text-xs text-gray-500">Required for all</p>}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected ? "bg-green-500 border-green-500" : "border-gray-600"
                    }`}>
                      {selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs text-center">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {/* STEP 4 - App Tour */}
        {step === 4 && (
          <div className="flex-1 flex flex-col px-6 pt-10">
            <div className="text-center mb-6">
              <h2 className="text-white text-2xl font-bold mb-1">App Tour 🗺️</h2>
              <p className="text-gray-400 text-sm">Here's everything you can do</p>
            </div>

            {/* Tour card */}
            <div className={`bg-gradient-to-br ${APP_TOUR[tourIndex].color} rounded-3xl p-6 mb-4 min-h-48 flex flex-col justify-between`}>
              <div className="text-5xl mb-3">{APP_TOUR[tourIndex].icon}</div>
              <div>
                <h3 className="text-white text-xl font-bold mb-2">{APP_TOUR[tourIndex].title}</h3>
                <p className="text-white text-opacity-80 text-sm leading-relaxed">{APP_TOUR[tourIndex].desc}</p>
              </div>
            </div>

            {/* Highlight tip */}
            <div className="bg-gray-900 rounded-2xl p-3 mb-4 border border-gray-800 flex items-start gap-3">
              <span className="text-yellow-400 text-lg flex-shrink-0">💡</span>
              <p className="text-gray-300 text-xs leading-relaxed">{APP_TOUR[tourIndex].highlight}</p>
            </div>

            {/* Tour navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTourIndex(i => Math.max(0, i - 1))}
                disabled={tourIndex === 0}
                className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-gray-400 disabled:opacity-30"
              >
                ←
              </button>
              <div className="flex-1 flex justify-center gap-1.5">
                {APP_TOUR.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tourIndex ? "w-6 bg-green-500" : "w-1.5 bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (tourIndex < APP_TOUR.length - 1) {
                    setTourIndex(i => i + 1);
                  } else {
                    goNext();
                  }
                }}
                className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white"
              >
                →
              </button>
            </div>
            <p className="text-gray-600 text-xs text-center mt-2">
              {tourIndex + 1} of {APP_TOUR.length} features
            </p>
          </div>
        )}

        {/* STEP 5 - Notifications */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-7xl mb-6 animate-bounce">🔔</div>
            <h2 className="text-white text-2xl font-bold mb-3">Stay in the Loop!</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Enable notifications to get alerts when:
            </p>
            <div className="flex flex-col gap-3 w-full mb-8">
              {[
                { icon: "🎉", text: "New features are added to the app" },
                { icon: "⚔️", text: "Friends challenge you to a battle" },
                { icon: "🔥", text: "Your daily study streak is at risk" },
                { icon: "🏆", text: "Tournament results are announced" },
              ].map((n) => (
                <div key={n.text} className="bg-gray-900 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-800">
                  <span className="text-xl">{n.icon}</span>
                  <p className="text-gray-300 text-sm text-left">{n.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                try {
                  await Notification.requestPermission();
                } catch (e) {}
                goNext();
              }}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-base mb-2"
            >
              🔔 Enable Notifications
            </button>
            <button onClick={goNext} className="text-gray-500 text-sm">
              Maybe later
            </button>
          </div>
        )}

        {/* STEP 6 - All Done */}
        {step === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center text-6xl shadow-2xl shadow-yellow-900">
                🏆
              </div>
              <div className="absolute -top-3 -right-3 text-3xl animate-bounce">🎉</div>
              <div className="absolute -bottom-3 -left-3 text-3xl animate-bounce" style={{ animationDelay: "0.2s" }}>⭐</div>
            </div>
            <h1 className="text-white text-3xl font-bold mb-3">You're All Set! 🚀</h1>
            <p className="text-gray-400 text-base leading-relaxed mb-2">
              Welcome to JAMB CBT, <span className="text-green-400 font-bold">{name || "Champion"}</span>!
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Your target is <span className="text-yellow-400 font-bold">{targetScore} points</span>. Let's make it happen!
            </p>
            <div className="flex flex-col gap-3 w-full">
              {[
                { icon: avatar, text: `Profile set up as ${name || "Student"}` },
                { icon: "📚", text: `${subjects.length} subjects selected` },
                { icon: "🎯", text: `Target score: ${targetScore}` },
              ].map((i) => (
                <div key={i.text} className="bg-gray-900 rounded-2xl px-4 py-3 flex items-center gap-3 border border-green-900">
                  <span className="text-xl">{i.icon}</span>
                  <p className="text-gray-300 text-sm">{i.text}</p>
                  <span className="ml-auto text-green-500 text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 pt-4 bg-gray-950">
        {step < 6 && step !== 4 && step !== 5 && (
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={goBack} className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-800">
                ←
              </button>
            )}
            <button
              onClick={goNext}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-900"
            >
              {step === 0 ? "Get Started 🚀" : "Continue →"}
            </button>
          </div>
        )}

        {step === 4 && (
          <button
            onClick={goNext}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-bold text-base"
          >
            Got it! Continue →
          </button>
        )}

         {step === 6 && (
          <button
            onClick={finish}
            disabled={saving}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-900 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                Setting up...
              </span>
            ) : "🏆 Start Practicing!"}
          </button>
        )}
      </div>
    </div>
  );
}

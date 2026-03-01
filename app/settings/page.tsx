"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, onValue, update, get } from "firebase/database";
import {
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useRouter } from "next/navigation";

interface UserStats {
  totalExams: number;
  avgScore: number;
  bestScore: number;
  totalBattles: number;
  battlesWon: number;
  streak: number;
  subjects: string[];
}

const TABS = ["Profile", "Stats", "Subjects", "Notifications", "Account"];
const TAB_ICONS = ["👤", "📊", "📚", "🔔", "⚙️"];

const SUBJECTS = [
  "Use of English", "Mathematics", "Physics",
  "Chemistry", "Biology", "Economics",
  "Government", "Literature"
];

const AVATARS = ["🎓", "🦁", "🔥", "⚡", "🎯", "🏆", "🦅", "🌟"];

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎓");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [targetScore, setTargetScore] = useState("300");
  const [examYear, setExamYear] = useState("2025");

  // Stats
  const [stats, setStats] = useState<UserStats>({
    totalExams: 0, avgScore: 0, bestScore: 0,
    totalBattles: 0, battlesWon: 0, streak: 0, subjects: []
  });

  // Subjects
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);

  // Notifications
  const [notifUpdate, setNotifUpdate] = useState(true);
  const [notifBattle, setNotifBattle] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifNewFeature, setNotifNewFeature] = useState(true);

  // Account
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setDisplayName(u.displayName || "");

      // Load profile from Firebase
      const profileSnap = await get(ref(db, `users/${u.uid}/profile`));
      const profile = profileSnap.val();
      if (profile) {
        setSelectedAvatar(profile.avatar || "🎓");
        setBio(profile.bio || "");
        setSchool(profile.school || "");
        setTargetScore(profile.targetScore || "300");
        setExamYear(profile.examYear || "2025");
        setFavoriteSubjects(profile.favoriteSubjects || []);
        setNotifUpdate(profile.notifUpdate !== false);
        setNotifBattle(profile.notifBattle !== false);
        setNotifStreak(profile.notifStreak !== false);
        setNotifNewFeature(profile.notifNewFeature !== false);
      }

      // Load stats
      const statsSnap = await get(ref(db, `users/${u.uid}/stats`));
      const s = statsSnap.val();
      if (s) setStats(s);

      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await update(ref(db, `users/${user.uid}/profile`), {
        avatar: selectedAvatar,
        bio,
        school,
        targetScore,
        examYear,
        favoriteSubjects,
        notifUpdate,
        notifBattle,
        notifStreak,
        notifNewFeature,
        updatedAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user || !currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) { setError("Passwords don't match!"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setSaving(true);
    setError("");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setError("Current password is incorrect");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      router.push("/login");
    } catch (err) {
      setError("Incorrect password. Account not deleted.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (s: string) => {
    setFavoriteSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 font-sans max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-gray-900" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #16a34a 0%, transparent 40%)" }} />
        <div className="relative px-4 pt-10 pb-6">
          <button onClick={() => router.push("/")} className="text-green-300 text-sm mb-4 flex items-center gap-1">
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white bg-opacity-10 rounded-3xl flex items-center justify-center text-4xl border border-white border-opacity-20 backdrop-blur-sm">
              {selectedAvatar}
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">{displayName || "Student"}</h1>
              <p className="text-green-300 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500 border-opacity-30">
                  🎯 Target: {targetScore}
                </span>
                <span className="bg-blue-500 bg-opacity-20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500 border-opacity-30">
                  📅 {examYear}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 px-4 py-3 bg-gray-900 sticky top-0 z-10 border-b border-gray-800">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === i
                ? "bg-green-500 text-white shadow-lg shadow-green-900"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>{TAB_ICONS[i]}</span>
            <span>{t}</span>
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">

        {/* PROFILE TAB */}
        {tab === 0 && (
          <div className="flex flex-col gap-4">
            {/* Avatar picker */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Choose Avatar</p>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSelectedAvatar(a)}
                    className={`h-14 rounded-2xl text-2xl transition-all ${
                      selectedAvatar === a
                        ? "bg-green-500 bg-opacity-20 border-2 border-green-500 scale-105"
                        : "bg-gray-800 border-2 border-transparent hover:border-gray-600"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Display name */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Display Name</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
              />
            </div>

            {/* Bio */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Bio</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm resize-none"
              />
            </div>

            {/* School */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">School</p>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Your school name"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
              />
            </div>

            {/* Target & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Target Score</p>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
                  max={400}
                  min={100}
                />
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Exam Year</p>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
                >
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === 1 && (
          <div className="flex flex-col gap-4">
            {/* Main stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Exams", value: stats.totalExams, icon: "📝", color: "blue" },
                { label: "Avg Score", value: `${stats.avgScore}%`, icon: "📈", color: "green" },
                { label: "Best Score", value: `${stats.bestScore}%`, icon: "🏆", color: "yellow" },
                { label: "Day Streak", value: stats.streak, icon: "🔥", color: "orange" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-white text-2xl font-bold">{s.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Battle stats */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Battle Record</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 text-center">
                  <p className="text-white text-3xl font-bold">{stats.totalBattles}</p>
                  <p className="text-gray-400 text-xs">Played</p>
                </div>
                <div className="w-px h-12 bg-gray-700" />
                <div className="flex-1 text-center">
                  <p className="text-green-400 text-3xl font-bold">{stats.battlesWon}</p>
                  <p className="text-gray-400 text-xs">Won</p>
                </div>
                <div className="w-px h-12 bg-gray-700" />
                <div className="flex-1 text-center">
                  <p className="text-red-400 text-3xl font-bold">{stats.totalBattles - stats.battlesWon}</p>
                  <p className="text-gray-400 text-xs">Lost</p>
                </div>
              </div>
              {/* Win rate bar */}
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalBattles > 0 ? (stats.battlesWon / stats.totalBattles) * 100 : 0}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1 text-right">
                {stats.totalBattles > 0 ? Math.floor((stats.battlesWon / stats.totalBattles) * 100) : 0}% win rate
              </p>
            </div>

            {/* Performance level */}
            <div className="bg-gradient-to-br from-green-900 to-gray-900 rounded-2xl p-4 border border-green-800">
              <div className="flex items-center gap-3">
                <div className="text-4xl">
                  {stats.avgScore >= 80 ? "🏆" : stats.avgScore >= 60 ? "⭐" : stats.avgScore >= 40 ? "📈" : "💪"}
                </div>
                <div>
                  <p className="text-white font-bold">
                    {stats.avgScore >= 80 ? "JAMB Champion" : stats.avgScore >= 60 ? "Above Average" : stats.avgScore >= 40 ? "Improving" : "Keep Practicing"}
                  </p>
                  <p className="text-green-300 text-xs">
                    {stats.avgScore >= 80 ? "You're crushing it! 🔥" : stats.avgScore >= 60 ? "Great progress! Keep going!" : "Practice more to improve!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {tab === 2 && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Favorite Subjects</p>
              <p className="text-gray-500 text-xs mb-4">Select subjects you want to focus on</p>
              <div className="flex flex-col gap-2">
                {SUBJECTS.map((s) => {
                  const selected = favoriteSubjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        selected
                          ? "bg-green-500 bg-opacity-10 border-green-500 border-opacity-50"
                          : "bg-gray-800 border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <span className={`text-sm font-medium ${selected ? "text-green-400" : "text-gray-300"}`}>{s}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected ? "bg-green-500 border-green-500" : "border-gray-600"
                      }`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {favoriteSubjects.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Focus Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteSubjects.map((s) => (
                    <span key={s} className="bg-green-500 bg-opacity-20 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500 border-opacity-30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          {/* NOTIFICATIONS TAB */}
        {tab === 3 && (
          <div className="flex flex-col gap-3">
            {[
              { label: "App Updates", desc: "Get notified when new features are added", value: notifUpdate, set: setNotifUpdate, icon: "🔄" },
              { label: "Battle Challenges", desc: "When friends challenge you to a battle", value: notifBattle, set: setNotifBattle, icon: "⚔️" },
              { label: "Streak Reminders", desc: "Daily reminder to keep your streak alive", value: notifStreak, set: setNotifStreak, icon: "🔥" },
              { label: "New Features", desc: "Be first to know about new features", value: notifNewFeature, set: setNotifNewFeature, icon: "✨" },
            ].map((n) => (
              <div key={n.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {n.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{n.label}</p>
                  <p className="text-gray-500 text-xs">{n.desc}</p>
                </div>
                <button
                  onClick={() => n.set(!n.value)}
                  className={`w-12 h-6 rounded-full transition-all flex-shrink-0 relative ${n.value ? "bg-green-500" : "bg-gray-700"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${n.value ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {tab === 4 && (
          <div className="flex flex-col gap-4">
            {/* Account info */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Account Info</p>
              <div className="flex items-center gap-3 py-2">
                <span className="text-gray-500 text-sm w-20">Email</span>
                <span className="text-white text-sm">{user?.email}</span>
              </div>
              <div className="h-px bg-gray-800 my-2" />
              <div className="flex items-center gap-3 py-2">
                <span className="text-gray-500 text-sm w-20">Joined</span>
                <span className="text-white text-sm">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Change Password</p>
              {pwSuccess && (
                <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-xl p-3 mb-3">
                  <p className="text-green-400 text-sm">✅ Password updated successfully!</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-green-500 transition-colors text-sm"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  onClick={changePassword}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-1"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full bg-gray-900 border border-gray-700 text-gray-300 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              🚪 Sign Out
            </button>

            {/* Delete account */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 py-4 rounded-2xl font-semibold"
              >
                🗑️ Delete Account
              </button>
            ) : (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-2xl p-4">
                <p className="text-red-400 font-bold text-sm mb-1">⚠️ Delete Account</p>
                <p className="text-gray-400 text-xs mb-3">This cannot be undone! All your data will be lost.</p>
                <input
                  type="password"
                  placeholder="Enter password to confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-red-500 border-opacity-30 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium">
                    Cancel
                  </button>
                  <button onClick={handleDeleteAccount} disabled={saving} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save button - show on Profile, Subjects, Notifications tabs */}
        {(tab === 0 || tab === 2 || tab === 3) && (
          <div className="mt-6">
            <button
              onClick={saveProfile}
              disabled={saving}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-900"
              } disabled:opacity-50`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saved ? "✅ Saved!" : "💾 Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

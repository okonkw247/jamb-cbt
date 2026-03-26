"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { ref, update } from "firebase/database";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle redirect result on page load
  useEffect(() => {
    setGoogleLoading(true);
    getRedirectResult(auth).then(async (cred) => {
      if (cred?.user) {
        await update(ref(db, `users/${cred.user.uid}`), {
          name: cred.user.displayName || "Student",
          email: cred.user.email,
          online: true,
          lastSeen: Date.now(),
        });
        router.push("/");
      }
    }).catch(() => {}).finally(() => setGoogleLoading(false));
  }, []);

  const handleError = (code: string) => {
    const errors: Record<string, string> = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/email-already-in-use": "Email already registered. Please login.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/popup-closed-by-user": "Google sign in was cancelled.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    setError(errors[code] || "Something went wrong. Please try again.");
  };

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill all fields."); return; }
    if (isSignup && !name) { setError("Please enter your name."); return; }
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await update(ref(db, `users/${cred.user.uid}`), {
          name, email, online: true, lastSeen: Date.now(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      handleError(err.code);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      handleError(err.code);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto"
      style={{ background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', system-ui" }}>

      {/* Top visual */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center pt-16 pb-10 px-6"
        style={{ background: "linear-gradient(160deg, #071a0e 0%, #0d2b18 60%, #0a1a0f 100%)" }}>
        {/* Decorative rings */}
        <div className="absolute w-64 h-64 rounded-full opacity-10"
          style={{ border: "1px solid #22c55e", top: "-40px", right: "-40px" }} />
        <div className="absolute w-40 h-40 rounded-full opacity-10"
          style={{ border: "1px solid #22c55e", bottom: "-20px", left: "-20px" }} />

        {/* Logo */}
        <div className="mb-5 animate-fade-in">
          <img src="/logo-512.png" alt="JAMB CBT" width={80} height={80}
            style={{ borderRadius: "18px", boxShadow: "0 0 30px rgba(34,197,94,0.3)" }} />
        </div>

        <h1 className="text-white font-black text-2xl mb-1 text-center">JAMB CBT Practice</h1>
        <p className="text-center text-sm font-medium" style={{ color: "#22c55e" }}>
          Nigeria's #1 Free JAMB Prep App 🇳🇬
        </p>

        {/* Stats row */}
        <div className="flex gap-6 mt-6">
          {[
            { value: "10K+", label: "Students" },
            { value: "50K+", label: "Questions" },
            { value: "Free", label: "Forever" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white font-black text-lg">{s.value}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6 pb-10" style={{ background: "var(--bg)" }}>
        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 mb-6" style={{ background: "var(--surface2)" }}>
          <button onClick={() => { setIsSignup(false); setError(""); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: !isSignup ? "var(--surface)" : "transparent",
              color: !isSignup ? "var(--text)" : "var(--text3)",
              boxShadow: !isSignup ? "var(--shadow-sm)" : "none"
            }}>
            Login
          </button>
          <button onClick={() => { setIsSignup(true); setError(""); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isSignup ? "var(--surface)" : "transparent",
              color: isSignup ? "var(--text)" : "var(--text3)",
              boxShadow: isSignup ? "var(--shadow-sm)" : "none"
            }}>
            Sign Up
          </button>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm mb-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text)" }}>
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--text3)" }}>or use email</p>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-3 mb-4">
          {isSignup && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text3)" }}>👤</span>
              <input type="text" placeholder="Full name" value={name}
                onChange={e => setName(e.target.value)}
                className="flex-1 outline-none bg-transparent text-sm font-medium"
                style={{ color: "var(--text)" }} />
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text3)" }}>✉️</span>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="flex-1 outline-none bg-transparent text-sm font-medium"
              style={{ color: "var(--text)" }} />
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text3)" }}>🔒</span>
            <input type={showPassword ? "text" : "password"} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="flex-1 outline-none bg-transparent text-sm font-medium"
              style={{ color: "var(--text)" }} />
            <button onClick={() => setShowPassword(!showPassword)}
              className="text-xs font-bold" style={{ color: "var(--text3)" }}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: "var(--red-dim)", border: "1px solid var(--red)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>⚠️ {error}</p>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          className="btn-primary w-full py-4 rounded-2xl text-base font-black mb-3 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Please wait...
            </span>
          ) : isSignup ? "Create Account →" : "Login →"}
        </button>

        {/* Features list */}
        <div className="rounded-2xl p-4 mt-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "var(--text3)" }}>
            WHY JOIN JAMB CBT?
          </p>
          {[
            "✅ Real JAMB past questions — all subjects",
            "⚔️ Battle friends live in real time",
            "🧠 AI Study Tutor for every topic",
            "📚 JAMB Novels — Lekki Headmaster + more",
            "🏆 Nationwide leaderboard",
            "💯 Completely FREE — no subscription",
          ].map(f => (
            <p key={f} className="text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>{f}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

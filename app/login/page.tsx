"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
    const msg = err.code;
if (msg === "auth/user-not-found") setError("No account found with this email.");
else if (msg === "auth/wrong-password") setError("Incorrect password.");
else if (msg === "auth/invalid-email") setError("Please enter a valid email address.");
else if (msg === "auth/email-already-in-use") setError("Email already registered. Please login.");
else if (msg === "auth/weak-password") setError("Password must be at least 6 characters.");
else if (msg === "auth/invalid-credential") setError("Invalid email or password.");
else setError("Something went wrong. Please try again.");
      
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center px-4 font-sans">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-gray-800 text-2xl font-bold">JAMB CBT</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignup ? "Create your account" : "Welcome back!"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {isSignup && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-200">
              <span className="text-gray-400">👤</span>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 outline-none bg-transparent text-gray-700"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-200">
            <span className="text-gray-400">✉️</span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 outline-none bg-transparent text-gray-700"
            />
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-200">
            <span className="text-gray-400">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 outline-none bg-transparent text-gray-700"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>

          <button
            onClick={() => { setIsSignup(!isSignup); setError(""); }}
            className="text-gray-400 text-sm text-center"
          >
            {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

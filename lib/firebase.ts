import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-xldRxhFqOsxv3xnjWsaOmcFG-nqG1n4",
  authDomain: "jamb-cbt-8fa5d.firebaseapp.com",
  projectId: "jamb-cbt-8fa5d",
  storageBucket: "jamb-cbt-8fa5d.firebasestorage.app",
  messagingSenderId: "136310165119",
  appId: "1:136310165119:web:9549495df4da9ceda5b94a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
Save with Ctrl + X, Y, Enter.
Then create the login page:
mkdir -p app/login
nano app/login/page.tsx
Paste this:
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
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center px-4 font-sans">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-gray-800 text-2xl font-bold">JAMB CBT</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignup ? "Create your account" : "Welcome back!"}
          </p>
        </div>

        {/* Form */}
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

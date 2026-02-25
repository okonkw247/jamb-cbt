"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { ref, set } from "firebase/database";

const ADMIN_PASSWORD = "adams2024";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [version, setVersion] = useState("1.6.0");
  const [size, setSize] = useState("2.1 MB");
  const [changelog, setChangelog] = useState([
    "New feature added",
    "Bug fixes",
    "Performance improvements"
  ]);
  const [sent, setSent] = useState(false);

  const login = () => {
    if (password === ADMIN_PASSWORD) setLoggedIn(true);
    else alert("Wrong password!");
  };

  const sendUpdate = async () => {
    await set(ref(db, "appUpdate"), {
      version,
      size,
      changelog,
      timestamp: Date.now(),
    });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  if (!loggedIn) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-gray-800 font-bold text-xl mb-6 text-center">🔐 Admin Panel</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700 mb-4"
        />
        <button onClick={login} className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold">
          Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      <div className="bg-gradient-to-br from-green-700 to-green-900 p-6 rounded-b-3xl mb-6">
        <h1 className="text-white text-2xl font-bold">🛠️ Admin Panel</h1>
        <p className="text-green-200 text-sm">Send update notifications to all users</p>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">New Version Number</p>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Download Size</p>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700"
            placeholder="e.g. 2.1 MB"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-3">What's New (one per line)</p>
          {changelog.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...changelog];
                  updated[i] = e.target.value;
                  setChangelog(updated);
                }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-700 text-sm"
              />
              <button
                onClick={() => setChangelog(changelog.filter((_, idx) => idx !== i))}
                className="text-red-400 px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setChangelog([...changelog, "New feature"])}
            className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium mt-1"
          >
            + Add item
          </button>
        </div>

        <button
          onClick={sendUpdate}
          className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg"
        >
          {sent ? "✅ Notification Sent!" : "🚀 Send Update Notification"}
        </button>
      </div>
    </div>
  );
}

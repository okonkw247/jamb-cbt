"use client";
import { useState, useEffect, useRef } from "react";
import { db, requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

const CURRENT_VERSION = "1.5.0";

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataSize, setDataSize] = useState("0 KB");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState("");

  useEffect(() => {
    // Ask for notification permission on first visit
    const askedPermission = localStorage.getItem("notifPermissionAsked");
    if (!askedPermission) {
      setTimeout(() => setShowPermission(true), 3000);
    }

    // Listen for updates from Firebase
    const updateRef = ref(db, "appUpdate");
    const unsub = onValue(updateRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const lastSeen = localStorage.getItem("lastUpdateVersion");
      if (data.version && data.version !== CURRENT_VERSION && data.version !== lastSeen) {
        setNewVersion(data.version);
        setChangelog(data.changelog || []);
        setDataSize(data.size || "2.1 MB");
        setShowUpdate(true);
      }
    });

    // Listen for foreground notifications
    onForegroundMessage((payload) => {
      if (payload.data?.type === "update") {
        setShowUpdate(true);
      }
    });

    return () => unsub();
  }, []);

const enableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      alert("Token: " + (token ? token.slice(0, 30) + "..." : "NULL - permission denied or not supported"));
      if (token) {
        localStorage.setItem("fcmToken", token);
        localStorage.setItem("notifPermissionAsked", "true");
        const res = await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        alert("Save result: " + JSON.stringify(data));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setShowPermission(false);
    localStorage.setItem("notifPermissionAsked", "true");
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setProgress(0);

    // Simulate update progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          localStorage.setItem("lastUpdateVersion", newVersion);
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return 100;
        }
        return p + Math.random() * 15;
      });
    }, 200);
  };

  // PERMISSION REQUEST
  if (showPermission) return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-4xl text-center mb-3">🔔</div>
        <h2 className="text-gray-800 font-bold text-lg text-center mb-2">Enable Notifications</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Get notified when new features are added, tournaments start, and when friends challenge you!
        </p>
        <button
          onClick={enableNotifications}
          className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold mb-2"
        >
          🔔 Enable Notifications
        </button>
        <button
          onClick={() => {
            setShowPermission(false);
            localStorage.setItem("notifPermissionAsked", "true");
          }}
          className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-medium text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  );

  // UPDATE AVAILABLE
  if (showUpdate && !updating) return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-4">
      <div className="bg-white rounded-3xl p-4 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
            🎉
          </div>
          <div>
            <h2 className="text-gray-800 font-bold text-lg">New Update Available!</h2>
            <p className="text-gray-400 text-xs">Version {newVersion} • {dataSize}</p>
          </div>
        </div>

<div className="bg-gray-50 rounded-2xl p-3 mb-3 max-h-40 overflow-y-auto">
          <p className="text-gray-700 font-semibold text-xs mb-2">What's new 🚀</p>
          {changelog.map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <span className="text-green-500 text-xs mt-0.5">✓</span>
              <p className="text-gray-600 text-xs">{item}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold text-base mb-2"
        >
          🔄 Update Now
        </button>
        <button
          onClick={() => {
            localStorage.setItem("lastUpdateVersion", newVersion);
            setShowUpdate(false);
          }}
          className="w-full bg-gray-100 text-gray-500 py-2 rounded-2xl font-medium text-sm"
        >
          Later
        </button>

      </div>
    </div>
  );

  // UPDATING PROGRESS
  if (updating) return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="text-5xl mb-4">
          {progress < 100 ? "⬇️" : "✅"}
        </div>
        <h2 className="text-gray-800 font-bold text-xl mb-1">
          {progress < 100 ? "Updating..." : "Update Complete!"}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {progress < 100 ? `Downloading ${dataSize}...` : "Restarting app..."}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-4 mb-3">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-gray-500 text-sm font-medium">{Math.min(Math.floor(progress), 100)}%</p>
      </div>
    </div>
  );

  return null;
}

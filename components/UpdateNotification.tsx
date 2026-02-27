"use client";
import { useState, useEffect } from "react";
import { db, requestNotificationPermission } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

const CURRENT_VERSION = "1.5.0";

const UPDATE_STEPS = [
  { label: "Checking for updates...", duration: 800 },
  { label: "Downloading new features...", duration: 1200 },
  { label: "Installing tournament mode...", duration: 1000 },
  { label: "Updating question cache...", duration: 900 },
  { label: "Applying performance fixes...", duration: 700 },
  { label: "Finalizing update...", duration: 600 },
  { label: "Almost done...", duration: 400 },
];

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [done, setDone] = useState(false);
  const [dataSize, setDataSize] = useState("2.1 MB");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [newVersion, setNewVersion] = useState("");
  const [bytesLoaded, setBytesLoaded] = useState("0 KB");

  useEffect(() => {
    const resetRef = ref(db, "forceNotifReset");
    onValue(resetRef, (snapshot) => {
      const resetKey = snapshot.val();
      if (!resetKey) return;
      const lastReset = localStorage.getItem("lastNotifReset");
      if (resetKey !== lastReset) {
        localStorage.removeItem("notifPermissionAsked");
        localStorage.setItem("lastNotifReset", resetKey);
        setTimeout(() => setShowPermission(true), 3000);
        return;
      }
      const asked = localStorage.getItem("notifPermissionAsked");
      if (!asked) setTimeout(() => setShowPermission(true), 3000);
    });

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

    return () => unsub();
  }, []);

  const enableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        localStorage.setItem("fcmToken", token);
        await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    } catch (err) {
      console.log("Notification error:", err);
    }
    setShowPermission(false);
    localStorage.setItem("notifPermissionAsked", "true");
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setProgress(0);
    setStepIndex(0);
    setDone(false);

    // Parse total size in bytes for display
    const totalKB = parseFloat(dataSize) * 1024;
    let currentProgress = 0;
    let currentStep = 0;
    let elapsed = 0;
    const totalDuration = UPDATE_STEPS.reduce((a, b) => a + b.duration, 0);

    setStepLabel(UPDATE_STEPS[0].label);

    const tick = setInterval(() => {
      elapsed += 100;
      currentProgress = Math.min((elapsed / totalDuration) * 100, 99);
      setProgress(currentProgress);

      // Update bytes loaded display
      const kb = Math.floor((currentProgress / 100) * totalKB);
      setBytesLoaded(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

      // Update step label
      let stepElapsed = 0;
      for (let i = 0; i < UPDATE_STEPS.length; i++) {
        stepElapsed += UPDATE_STEPS[i].duration;
        if (elapsed <= stepElapsed) {
          if (currentStep !== i) {
            currentStep = i;
            setStepIndex(i);
            setStepLabel(UPDATE_STEPS[i].label);
          }
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(tick);
        setProgress(100);
        setBytesLoaded(dataSize);
        setStepLabel("✅ Update complete!");
        setDone(true);
        localStorage.setItem("lastUpdateVersion", newVersion);
        setTimeout(() => window.location.reload(), 2000);
      }
    }, 100);
  };

  // PERMISSION REQUEST
  if (showPermission) return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 px-4 pb-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔔</div>
        <h2 className="text-gray-800 font-bold text-lg text-center mb-1">Stay Updated!</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Get instant notifications when new features drop, tournaments start, and friends challenge you!
        </p>
        <button onClick={enableNotifications} className="w-full bg-green-500 text-white py-3 rounded-2xl font-bold mb-2">
          🔔 Enable Notifications
        </button>
        <button
          onClick={() => { setShowPermission(false); localStorage.setItem("notifPermissionAsked", "true"); }}
          className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-medium text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  );

  // UPDATE AVAILABLE
  if (showUpdate && !updating) return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 px-4 pb-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            🎓
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-gray-800 font-bold text-base">JAMB CBT</h2>
              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>
            </div>
            <p className="text-gray-400 text-xs">Version {newVersion} • {dataSize}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-4" />

        {/* Changelog */}
        <p className="text-gray-700 font-bold text-sm mb-3">What's new 🚀</p>
        <div className="bg-gray-50 rounded-2xl p-3 mb-4 max-h-36 overflow-y-auto">
          {changelog.map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        {/* Size info */}
        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-sm">📦</span>
            <span className="text-blue-600 text-xs font-medium">Download size</span>
          </div>
          <span className="text-blue-700 text-xs font-bold">{dataSize}</span>
        </div>

        {/* Buttons */}
        <button onClick={handleUpdate} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-2xl font-bold text-base mb-2 shadow-lg shadow-green-200">
          ⬇️ Update Now
        </button>
        <button
          onClick={() => { localStorage.setItem("lastUpdateVersion", newVersion); setShowUpdate(false); }}
          className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-2xl font-medium text-sm"
        >
          Later
        </button>
      </div>
    </div>
  );

  // UPDATING PROGRESS - Real SaaS style
  if (updating) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}>
      <div className="w-full max-w-sm">
        {/* App icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-green-900">
              🎓
            </div>
            {!done && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs">↓</span>
              </div>
            )}
            {done && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-white text-xl font-bold text-center mb-1">
          {done ? "Update Complete!" : "Updating JAMB CBT"}
        </h2>
        <p className="text-blue-300 text-sm text-center mb-8">
          {done ? "Restarting app..." : `Version ${newVersion}`}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="w-full bg-white bg-opacity-10 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: done
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)",
                backgroundSize: "200% 100%",
                animation: done ? "none" : "shimmer 1.5s infinite",
              }}
            />
          </div>
        </div>

        {/* Progress info */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-blue-300 text-xs">{bytesLoaded} / {dataSize}</p>
          <p className="text-white text-sm font-bold">{Math.min(Math.floor(progress), 100)}%</p>
        </div>

        {/* Step label */}
        <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            {!done ? (
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <p className="text-white text-sm">{stepLabel}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5">
          {UPDATE_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < stepIndex ? "w-4 bg-green-500" :
                i === stepIndex ? "w-6 bg-blue-400" :
                "w-1.5 bg-white bg-opacity-20"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );

  return null;
}

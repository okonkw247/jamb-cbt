"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!showPrompt) return;
    // If user skips, show again after 5 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    // Show again after 5 seconds
    setTimeout(() => setShowPrompt(true), 5000);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="JAMB CBT" className="w-16 h-16 rounded-2xl" />
          <div>
            <h2 className="text-gray-800 font-bold text-lg">JAMB CBT Practice</h2>
            <p className="text-gray-400 text-sm">jamb-cbt-chi.vercel.app</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-green-50 rounded-2xl p-4 mb-4">
          <p className="text-green-800 font-semibold text-sm mb-2">Install this app to get:</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-green-700 text-sm">✓ Quick access from your home screen</p>
            <p className="text-green-700 text-sm">✓ Full screen experience</p>
            <p className="text-green-700 text-sm">✓ Works offline</p>
            <p className="text-green-700 text-sm">✓ Faster loading</p>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={handleInstall}
          className="block w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg text-center mb-3"
        >
          📲 Install App
        </button>
        <button
          onClick={handleSkip}
          className="block w-full text-gray-400 text-sm text-center py-2"
        >
          Not now (will remind in 5s)
        </button>
      </div>
    </div>
  );
}

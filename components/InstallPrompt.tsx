"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIphone, setIsIphone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iPhone/iPad
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

    if (isIOS) {
      setIsIphone(true);
      const dismissed = localStorage.getItem("iphoneInstallDismissed");
      if (!dismissed) setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
    if (isIphone) {
      localStorage.setItem("iphoneInstallDismissed", "true");
    } else {
      setTimeout(() => setShowPrompt(true), 30000);
    }
  };

  if (isInstalled || !showPrompt) return null;

  // IPHONE INSTRUCTIONS
  if (isIphone) return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="JAMB CBT" className="w-16 h-16 rounded-2xl" />
          <div>
            <h2 className="text-gray-800 font-bold text-lg">Install JAMB CBT</h2>
            <p className="text-gray-400 text-sm">For iPhone users</p>
          </div>
        </div>

        {step === 0 && (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Follow these 3 simple steps to install the app on your iPhone:
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Tap the Share button</p>
                  <p className="text-gray-500 text-xs">Tap the <span className="font-bold">⬆️ Share</span> icon at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Add to Home Screen</p>
                  <p className="text-gray-500 text-xs">Scroll down and tap <span className="font-bold">"Add to Home Screen"</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Tap Add</p>
                  <p className="text-gray-500 text-xs">Tap <span className="font-bold">"Add"</span> in the top right corner</p>
                </div>
              </div>
            </div>

            {/* Animated arrow pointing down for Safari bar */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-xs">Look for this icon in Safari 👇</p>
              <div className="text-4xl animate-bounce mt-1">⬆️</div>
              <p className="text-gray-400 text-xs">(Share button at bottom of screen)</p>
            </div>
          </>
        )}

        <button
          onClick={handleSkip}
          className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-medium text-sm"
        >
          I'll do it later
        </button>
      </div>
    </div>
  );

  // ANDROID PROMPT
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="JAMB CBT" className="w-16 h-16 rounded-2xl" />
          <div>
            <h2 className="text-gray-800 font-bold text-lg">JAMB CBT Practice</h2>
            <p className="text-gray-400 text-sm">jamb-cbt-chi.vercel.app</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 mb-4">
          <p className="text-green-800 font-semibold text-sm mb-2">Install this app to get:</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-green-700 text-sm">✓ Quick access from your home screen</p>
            <p className="text-green-700 text-sm">✓ Full screen experience</p>
            <p className="text-green-700 text-sm">✓ Works offline</p>
            <p className="text-green-700 text-sm">✓ Push notifications</p>
            <p className="text-green-700 text-sm">✓ Faster loading</p>
          </div>
        </div>

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
          Not now
        </button>
      </div>
    </div>
  );
}"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIphone, setIsIphone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iPhone/iPad
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

    if (isIOS) {
      setIsIphone(true);
      const dismissed = localStorage.getItem("iphoneInstallDismissed");
      if (!dismissed) setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
    if (isIphone) {
      localStorage.setItem("iphoneInstallDismissed", "true");
    } else {
      setTimeout(() => setShowPrompt(true), 30000);
    }
  };

  if (isInstalled || !showPrompt) return null;

  // IPHONE INSTRUCTIONS
  if (isIphone) return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="JAMB CBT" className="w-16 h-16 rounded-2xl" />
          <div>
            <h2 className="text-gray-800 font-bold text-lg">Install JAMB CBT</h2>
            <p className="text-gray-400 text-sm">For iPhone users</p>
          </div>
        </div>

        {step === 0 && (
          <>
            <p className="text-gray-600 text-sm mb-4">
              Follow these 3 simple steps to install the app on your iPhone:
            </p>
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Tap the Share button</p>
                  <p className="text-gray-500 text-xs">Tap the <span className="font-bold">⬆️ Share</span> icon at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Add to Home Screen</p>
                  <p className="text-gray-500 text-xs">Scroll down and tap <span className="font-bold">"Add to Home Screen"</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Tap Add</p>
                  <p className="text-gray-500 text-xs">Tap <span className="font-bold">"Add"</span> in the top right corner</p>
                </div>
              </div>
            </div>

            {/* Animated arrow pointing down for Safari bar */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-xs">Look for this icon in Safari 👇</p>
              <div className="text-4xl animate-bounce mt-1">⬆️</div>
              <p className="text-gray-400 text-xs">(Share button at bottom of screen)</p>
            </div>
          </>
        )}

        <button
          onClick={handleSkip}
          className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-medium text-sm"
        >
          I'll do it later
        </button>
      </div>
    </div>
  );

  // ANDROID PROMPT
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="JAMB CBT" className="w-16 h-16 rounded-2xl" />
          <div>
            <h2 className="text-gray-800 font-bold text-lg">JAMB CBT Practice</h2>
            <p className="text-gray-400 text-sm">jamb-cbt-chi.vercel.app</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 mb-4">
          <p className="text-green-800 font-semibold text-sm mb-2">Install this app to get:</p>
          <div className="flex flex-col gap-1.5">
            <p className="text-green-700 text-sm">✓ Quick access from your home screen</p>
            <p className="text-green-700 text-sm">✓ Full screen experience</p>
            <p className="text-green-700 text-sm">✓ Works offline</p>
            <p className="text-green-700 text-sm">✓ Push notifications</p>
            <p className="text-green-700 text-sm">✓ Faster loading</p>
          </div>
        </div>

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
          Not now
        </button>
      </div>
    </div>
  );
}

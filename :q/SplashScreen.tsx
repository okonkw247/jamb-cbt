"use client";
import { useState, useEffect } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  // Phase 0: logo drops in
  // Phase 1: logo settles + ring pulse
  // Phase 2: text slides up
  // Phase 3: tagline fades
  // Phase 4: fade out

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => onDone(), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const messages = [
    "Nigeria's #1 JAMB Practice App 🇳🇬",
    "Real Past Questions. Real Results.",
    "Battle Friends. Earn XP. Pass JAMB.",
    "Welcome to the Future of JAMB Prep! 🔥",
  ];
  const msg = messages[Math.floor(Date.now() / 1000) % messages.length];

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #071a0e 0%, #0a1a0f 50%, #060f09 100%)",
        opacity: phase === 4 ? 0 : 1,
        transition: phase === 4 ? "opacity 0.5s ease" : "none",
        pointerEvents: phase === 4 ? "none" : "all",
      }}>

      {/* Background dots pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {Array.from({length: 20}).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: "#22c55e",
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 2}s`,
            }} />
        ))}
      </div>

      {/* Outer glow rings */}
      {phase >= 1 && (
        <>
          <div className="absolute w-64 h-64 rounded-full"
            style={{
              border: "1px solid rgba(34,197,94,0.15)",
              animation: "ping 2s ease-out infinite",
            }} />
          <div className="absolute w-52 h-52 rounded-full"
            style={{
              border: "1px solid rgba(34,197,94,0.2)",
              animation: "ping 2s ease-out 0.3s infinite",
            }} />
          <div className="absolute w-40 h-40 rounded-full"
            style={{
              border: "2px solid rgba(34,197,94,0.25)",
              animation: "ping 2s ease-out 0.6s infinite",
            }} />
        </>
      )}

      {/* Logo */}
      <div style={{
        transform: phase === 0
          ? "translateY(-120px) scale(0.5)"
          : phase === 1
          ? "translateY(0px) scale(1.08)"
          : "translateY(0px) scale(1)",
        opacity: phase === 0 ? 0 : 1,
        transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        filter: phase >= 1 ? "drop-shadow(0 0 30px rgba(34,197,94,0.5))" : "none",
      }}>
        <img src="/logo-512.png" alt="JAMB CBT" width={100} height={100}
          style={{ borderRadius: "22px" }} />
      </div>

      {/* App name */}
      <div style={{
        transform: phase >= 2 ? "translateY(0)" : "translateY(30px)",
        opacity: phase >= 2 ? 1 : 0,
        transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        marginTop: 24,
        textAlign: "center",
      }}>
        <p style={{
          color: "#fff",
          fontSize: 26,
          fontWeight: 900,
          fontFamily: "'Plus Jakarta Sans', system-ui",
          letterSpacing: "-0.5px",
        }}>JAMB CBT Practice</p>
        <p style={{
          color: "#22c55e",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', system-ui",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginTop: 4,
        }}>Prepare • Practice • Pass</p>
      </div>

      {/* Tagline message */}
      <div style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        textAlign: "center",
        padding: "0 32px",
        transform: phase >= 3 ? "translateY(0)" : "translateY(20px)",
        opacity: phase >= 3 ? 1 : 0,
        transition: "all 0.6s ease",
      }}>
        <p style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', system-ui",
        }}>{msg}</p>
      </div>

      {/* Loading bar */}
      <div style={{
        position: "absolute",
        bottom: 50,
        left: "20%",
        right: "20%",
        height: 3,
        borderRadius: 4,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}>
        <div style={{
          height: "100%",
          borderRadius: 4,
          background: "linear-gradient(90deg, #16a34a, #22c55e)",
          width: phase >= 3 ? "100%" : phase >= 2 ? "60%" : "0%",
          transition: "width 1.2s ease",
          boxShadow: "0 0 8px #22c55e",
        }} />
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

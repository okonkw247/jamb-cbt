"use client";
import { useEffect, useState } from "react";

type Props = {
  name: string;
  avatar: string;
  onDone: () => void;
};

export default function FriendRequestAnimation({ name, avatar, onDone }: Props) {
  const [phase, setPhase] = useState<"drop" | "land" | "text" | "done">("drop");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("land"), 600);
    const t2 = setTimeout(() => setPhase("text"), 1200);
    const t3 = setTimeout(() => setPhase("done"), 3200);
    const t4 = setTimeout(onDone, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "rgba(0,0,0,0.92)" }}>

      {/* Shockwave rings */}
      {phase === "land" && (
        <>
          <div className="absolute w-32 h-32 rounded-full border-4 border-green-400 animate-ping opacity-60" style={{ top: "42%" }} />
          <div className="absolute w-48 h-48 rounded-full border-2 border-green-300 animate-ping opacity-30" style={{ top: "38%", animationDelay: "0.1s" }} />
          <div className="absolute w-64 h-64 rounded-full border border-green-200 animate-ping opacity-20" style={{ top: "34%", animationDelay: "0.2s" }} />
        </>
      )}

      {/* Particle sparks */}
      {phase !== "drop" && (
        <div className="absolute" style={{ top: "48%" }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-green-400"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-${40 + Math.random() * 30}px)`,
                animation: "ping 0.8s ease-out forwards",
                opacity: 0.8,
              }} />
          ))}
        </div>
      )}

      {/* Avatar dropping from top */}
      <div className="flex flex-col items-center" style={{
        transform: phase === "drop" ? "translateY(-200px) scale(0.5)" : phase === "land" ? "translateY(0px) scale(1.15)" : "translateY(0px) scale(1)",
        transition: phase === "drop" ? "none" : phase === "land" ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" : "transform 0.3s ease",
        opacity: phase === "done" ? 0 : 1,
      }}>
        {/* Glow ring */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-4 relative"
          style={{ background: "linear-gradient(135deg, #16a34a, #4ade80)", boxShadow: "0 0 40px #4ade8088, 0 0 80px #4ade8044" }}>
          <span className="text-6xl">{avatar}</span>
          {/* Crown for accepted friend */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👑</div>
        </div>

        {/* Name banner */}
        {(phase === "text" || phase === "done") && (
          <div className="text-center" style={{
            animation: "fadeInUp 0.5s ease forwards",
          }}>
            <div className="px-8 py-3 rounded-2xl mb-2" style={{ background: "linear-gradient(90deg, #14532d, #16a34a, #14532d)", boxShadow: "0 0 20px #4ade8066" }}>
              <p className="text-white font-black text-2xl tracking-wide">{name}</p>
            </div>
            <p className="text-green-400 font-bold text-sm tracking-widest uppercase">Friend Joined! 🎮</p>
            <div className="flex gap-2 justify-center mt-3">
              {["🔥", "⚡", "💪", "🎯", "🏆"].map((e, i) => (
                <span key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32"
        style={{ background: "linear-gradient(to top, #4ade8022, transparent)" }} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

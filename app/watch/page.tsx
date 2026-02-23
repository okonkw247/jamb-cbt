"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface Player {
  name: string;
  score: number;
  answered: number;
  streak: number;
}

interface Room {
  subject: string;
  status: string;
  players: { [key: string]: Player };
  questions: any[];
  reactions: { [key: string]: { emoji: string; name: string; time: number } };
}

export default function Watch() {
  const [inputCode, setInputCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [watching, setWatching] = useState(false);
  const [reactions, setReactions] = useState<{ emoji: string; name: string; id: string }[]>([]);

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, `battles/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoom(data);
      if (data.reactions) {
        const now = Date.now();
        const fresh = Object.entries(data.reactions)
          .filter(([_, r]: any) => now - r.time < 2000)
          .map(([id, r]: any) => ({ id, emoji: r.emoji, name: r.name }));
        setReactions(fresh);
      }
    });
    return () => unsub();
  }, [roomCode]);

  const watchRoom = () => {
    if (!inputCode.trim()) return alert("Enter room code!");
    setRoomCode(inputCode.toUpperCase());
    setWatching(true);
  };

  const getPlayers = () => {
    if (!room) return [];
    return Object.entries(room.players)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);
  };

  if (!watching) return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      <div className="bg-gradient-to-br from-red-600 to-orange-500 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">🔴 Live Watch</h1>
        <p className="text-red-100 text-sm">Watch battles in real time!</p>
      </div>
      <div className="px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Enter Room Code</p>
          <input
            type="text"
            placeholder="Enter code to watch"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700 mb-4 text-center text-2xl font-bold tracking-widest"
            maxLength={5}
          />
          <button
            onClick={watchRoom}
            className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-lg"
          >
            🔴 Watch Live
          </button>
        </div>
      </div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔴</div>
        <p className="text-gray-600">Connecting to room {roomCode}...</p>
      </div>
    </div>
  );

  const players = getPlayers();

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
      <div className="bg-gradient-to-br from-red-600 to-orange-500 p-4 rounded-b-3xl mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold uppercase">Live</span>
            </div>
            <h1 className="text-white text-lg font-bold">{room.subject} Battle</h1>
          </div>
          <div className="bg-white bg-opacity-20 px-3 py-1.5 rounded-xl">
            <p className="text-white text-sm font-bold">{roomCode}</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className={`rounded-2xl p-3 mb-4 text-center font-bold ${
          room.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
          room.status === "playing" ? "bg-green-100 text-green-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {room.status === "waiting" ? "⏳ Waiting to start..." :
           room.status === "playing" ? "🎮 Battle in progress!" :
           "🏁 Battle finished!"}
        </div>

        {reactions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {reactions.map((r) => (
              <div key={r.id} className="bg-white rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2 animate-bounce">
                <span className="text-lg">{r.emoji}</span>
                <span className="text-gray-600 text-xs">{r.name}</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-gray-800 font-bold mb-3">🏆 Live Standings</h2>
        <div className="flex flex-col gap-3 mb-6">
          {players.map((p, i) => (
            <div key={p.id} className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border-l-4 ${
              i === 0 ? "border-yellow-400" : i === 1 ? "border-gray-400" : i === 2 ? "border-orange-400" : "border-transparent"
            }`}>
              <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
              <div className="flex-1">
                <p className="text-gray-800 font-bold">{p.name}</p>
                <p className="text-gray-400 text-xs">{p.answered} answered · 🔥 {p.streak} streak</p>
                <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((p.score / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{p.score}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const msg = `👀 Watch this JAMB CBT Battle LIVE!\nRoom Code: ${roomCode}\nJoin here: https://jamb-cbt-chi.vercel.app/watch\n\nEnter code ${roomCode} to watch!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
          }}
          className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg mb-3"
        >
          📲 Share Live Link
        </button>
      </div>
    </div>
  );
}

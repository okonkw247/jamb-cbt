"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, set, onValue, push, update } from "firebase/database";
import { useRouter } from "next/navigation";

interface Player {
  name: string;
  score: number;
  answered: number;
  ready: boolean;
}

interface Room {
  host: string;
  subject: string;
  status: "waiting" | "playing" | "finished";
  players: { [key: string]: Player };
  questions: any[];
  currentQuestion: number;
}

export default function Battle() {
  const router = useRouter();
  const [screen, setScreen] = useState<"lobby" | "waiting" | "playing" | "finished">("lobby");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [subject, setSubject] = useState("Use of English");
  const [loading, setLoading] = useState(false);

  const subjects = [
    "Use of English", "Mathematics", "Physics",
    "Chemistry", "Biology", "Economics",
    "Government", "Literature"
  ];

  // Listen to room changes
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, `battles/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoom(data);
      if (data.status === "playing" && screen === "waiting") {
        setScreen("playing");
        setCurrentIndex(0);
        setTimeLeft(15);
      }
      if (data.status === "finished") {
        setScreen("finished");
      }
    });
    return () => unsub();
  }, [roomCode, screen]);

  // Question timer
  useEffect(() => {
    if (screen !== "playing") return;
    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

  const createRoom = async () => {
    if (!playerName.trim()) return alert("Enter your name!");
    setLoading(true);
    try {
      const code = generateCode();
      const pid = generateCode();
      const res = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}`);
      const data = await res.json();
      const questions = (data.data || []).slice(0, 10);

      await set(ref(db, `battles/${code}`), {
        host: pid,
        subject,
        status: "waiting",
        questions,
        currentQuestion: 0,
        players: {
          [pid]: { name: playerName, score: 0, answered: 0, ready: true }
        }
      });

      setRoomCode(code);
      setPlayerId(pid);
      setScreen("waiting");
    } catch (err) {
      alert("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) return alert("Enter your name!");
    if (!inputCode.trim()) return alert("Enter room code!");
    setLoading(true);
    try {
      const pid = generateCode();
      const roomRef = ref(db, `battles/${inputCode.toUpperCase()}`);
      const snapshot = await new Promise<any>((resolve) => onValue(roomRef, resolve, { onlyOnce: true }));
      const data = snapshot.val();

      if (!data) return alert("Room not found!");
      if (data.status !== "waiting") return alert("Game already started!");
      if (Object.keys(data.players).length >= 4) return alert("Room is full!");

      await update(ref(db, `battles/${inputCode.toUpperCase()}/players/${pid}`), {
        name: playerName, score: 0, answered: 0, ready: true
      });

      setRoomCode(inputCode.toUpperCase());
      setPlayerId(pid);
      setScreen("waiting");
    } catch (err) {
      alert("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!room) return;
    const players = Object.keys(room.players);
    if (players.length < 2) return alert("Need at least 2 players to start!");
    await update(ref(db, `battles/${roomCode}`), { status: "playing" });
  };

  const handleAnswer = async (opt: string) => {
    if (selected || !room) return;
    setSelected(opt);
    const q = room.questions[currentIndex];
    const isCorrect = opt === q.answer;
    const currentScore = room.players[playerId]?.score || 0;
    const currentAnswered = room.players[playerId]?.answered || 0;

    await update(ref(db, `battles/${roomCode}/players/${playerId}`), {
      score: isCorrect ? currentScore + 1 : currentScore,
      answered: currentAnswered + 1,
    });
  };

  const handleNextQuestion = async () => {
    if (!room) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= room.questions.length) {
      await update(ref(db, `battles/${roomCode}`), { status: "finished" });
      return;
    }
    setCurrentIndex(nextIndex);
    setSelected(null);
    setTimeLeft(15);
  };

  const getPlayers = () => {
    if (!room) return [];
    return Object.entries(room.players)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);
  };

  // LOBBY SCREEN
  if (screen === "lobby") return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      <div className="bg-gradient-to-br from-purple-700 to-indigo-700 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">⚔️ Quiz Battle</h1>
        <p className="text-purple-200 text-sm">Challenge friends in real time!</p>
      </div>

      <div className="px-4">
        {/* Name input */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Your Name</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700"
          />
        </div>

        {/* Create room */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Select Subject</p>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700 mb-3"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Creating..." : "⚔️ Create Battle Room"}
          </button>
        </div>

        {/* Join room */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Join a Room</p>
          <input
            type="text"
            placeholder="Enter room code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700 mb-3 text-center text-2xl font-bold tracking-widest"
            maxLength={5}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Joining..." : "🚀 Join Battle"}
          </button>
        </div>
      </div>
    </div>
  );

  // WAITING SCREEN
  if (screen === "waiting") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-700 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <h2 className="text-white text-2xl font-bold mb-2">Waiting for players...</h2>
      <p className="text-purple-200 mb-6">Share this code with friends</p>

      {/* Room code */}
      <div className="bg-white rounded-3xl px-10 py-6 mb-8 text-center">
        <p className="text-gray-400 text-sm mb-1">Room Code</p>
        <p className="text-gray-800 text-5xl font-bold tracking-widest">{roomCode}</p>
      </div>

      {/* Players */}
      <div className="w-full bg-white bg-opacity-10 rounded-2xl p-4 mb-6">
        <p className="text-white font-semibold mb-3">Players ({Object.keys(room?.players || {}).length}/4)</p>
        {getPlayers().map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {p.name[0].toUpperCase()}
            </div>
            <p className="text-white font-medium">{p.name}</p>
            {room?.host === p.id && <span className="text-yellow-300 text-xs">👑 Host</span>}
          </div>
        ))}
      </div>

      {/* Start button (host only) */}
      {room?.host === playerId && (
        <button
          onClick={startGame}
          className="w-full bg-yellow-400 text-gray-900 py-4 rounded-2xl font-bold text-lg mb-3"
        >
          🎮 Start Game!
        </button>
      )}
      {room?.host !== playerId && (
        <p className="text-purple-200 text-sm">Waiting for host to start...</p>
      )}
    </div>
  );

  // PLAYING SCREEN
  if (screen === "playing" && room) {
    const q = room.questions[currentIndex];
    const options = ["a", "b", "c", "d"] as const;

    return (
      <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
        {/* Header */}
        <div className="bg-purple-700 p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white font-bold">Question {currentIndex + 1}/{room.questions.length}</p>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${timeLeft <= 5 ? "bg-red-500 text-white" : "bg-white text-purple-700"}`}>
              {timeLeft}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-purple-900 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / room.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Live scores */}
        <div className="bg-purple-600 px-4 py-2 flex gap-3 overflow-x-auto">
          {getPlayers().map((p, i) => (
            <div key={p.id} className="flex-shrink-0 flex items-center gap-2 bg-white bg-opacity-20 rounded-xl px-3 py-1.5">
              <span className="text-white text-xs font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
              <span className="text-white text-xs">{p.name.split(" ")[0]}</span>
              <span className="text-yellow-300 text-xs font-bold">{p.score}</span>
            </div>
          ))}
        </div>

        <div className="px-4 py-4">
          {/* Question */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {options.map((opt) => {
              let style = "bg-white border-2 border-transparent";
              if (selected) {
                if (opt === q.answer) style = "bg-green-100 border-2 border-green-500";
                else if (opt === selected) style = "bg-red-100 border-2 border-red-500";
                else style = "bg-gray-50 border-2 border-transparent opacity-60";
              }
              return (
                <div
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`${style} rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all shadow-sm`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {opt.toUpperCase()}
                  </div>
                  <p className="text-gray-800" dangerouslySetInnerHTML={{ __html: q.option[opt] }} />
                </div>
              );
            })}
          </div>

          {selected && (
            <button
              onClick={handleNextQuestion}
              className="w-full mt-4 bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    );
  }

  // FINISHED SCREEN
  if (screen === "finished") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-700 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <h1 className="text-white text-3xl font-bold mb-2">🏆 Battle Over!</h1>
      <p className="text-purple-200 mb-8">Final Rankings</p>

      <div className="w-full flex flex-col gap-3 mb-8">
        {getPlayers().map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-4 rounded-2xl p-4 ${
              i === 0 ? "bg-yellow-400" : "bg-white bg-opacity-20"
            }`}
          >
            <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
            <div className="flex-1">
              <p className={`font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>{p.name}</p>
              <p className={`text-sm ${i === 0 ? "text-gray-700" : "text-purple-200"}`}>{p.answered} answered</p>
            </div>
            <p className={`text-2xl font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>{p.score}</p>
          </div>
        ))}
      </div>

      <a href="/" className="w-full bg-white text-purple-700 py-4 rounded-2xl font-bold text-lg text-center">
        🏠 Go Home
      </a>
    </div>
  );

  return null;
}

"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, set, onValue, push, update, get } from "firebase/database";
import { useRouter } from "next/navigation";

interface Player {
  name: string;
  score: number;
  answered: number;
  streak: number;
  ready: boolean;
}

interface Room {
  host: string;
  subject: string;
  status: "waiting" | "playing" | "finished";
  players: { [key: string]: Player };
  questions: any[];
  reactions: { [key: string]: { emoji: string; name: string; time: number } };
}

const EMOJIS = ["🔥", "😂", "👏", "😱", "💪", "🎯"];
const REACTION_DURATION = 2000;

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
  const [visibleReactions, setVisibleReactions] = useState<{ emoji: string; name: string; id: string }[]>([]);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [answerTime, setAnswerTime] = useState(15);
  const [showStreak, setShowStreak] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const timerRef = useRef<any>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const correctSound = useRef<any>(null);
const wrongSound = useRef<any>(null);
const tickSound = useRef<any>(null);

const playSound = (type: "correct" | "wrong" | "tick") => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === "wrong") {
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } else if (type === "tick") {
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
};

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
  setShowIntro(true);
  setIntroIndex(0);
  const players = Object.values(data.players) as Player[];
  players.forEach((_, i) => {
    setTimeout(() => setIntroIndex(i), i * 2000);
  });
  setTimeout(() => {
    setShowIntro(false);
    setScreen("playing");
    setCurrentIndex(0);
    setTimeLeft(15);
  }, players.length * 2000 + 500);
}

      if (data.status === "finished" && screen === "playing") {
        setScreen("finished");
      }
      if (data.status === "waiting" && screen === "finished") {
        setScreen("waiting");
        setCurrentIndex(0);
        setSelected(null);
        setFiftyUsed(false);
        setHiddenOptions([]);
      }

      // Handle reactions
      if (data.reactions) {
        const now = Date.now();
        const fresh = Object.entries(data.reactions)
          .filter(([_, r]: any) => now - r.time < REACTION_DURATION)
          .map(([id, r]: any) => ({ id, emoji: r.emoji, name: r.name }));
        setVisibleReactions(fresh);
      }
    });
    return () => unsub();
  }, [roomCode, screen]);

  // Question timer
  useEffect(() => {
    if (screen !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => {
  if (p <= 5 && p > 1) playSound("tick");
  if (p <= 1) {
          clearInterval(timerRef.current);
          handleNextQuestion();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, currentIndex]);

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
        reactions: {},
        players: {
          [pid]: { name: playerName, score: 0, answered: 0, streak: 0, ready: true }
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
      const code = inputCode.toUpperCase();
      const snapshot = await get(ref(db, `battles/${code}`));
      const data = snapshot.val();

      if (!data) { alert("Room not found!"); setLoading(false); return; }
      if (data.status !== "waiting") { alert("Game already started!"); setLoading(false); return; }
      if (Object.keys(data.players).length >= 4) { alert("Room is full!"); setLoading(false); return; }

      await update(ref(db, `battles/${code}/players/${pid}`), {
        name: playerName, score: 0, answered: 0, streak: 0, ready: true
      });

      setRoomCode(code);
      setPlayerId(pid);
      setScreen("waiting");
    } catch (err) {
      alert("Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!room) return;
    if (Object.keys(room.players).length < 2) return alert("Need at least 2 players!");
    await update(ref(db, `battles/${roomCode}`), { status: "playing" });
  };

  const handleAnswer = async (opt: string) => {
    if (selected || !room) return;
    setSelected(opt);
    clearInterval(timerRef.current);

    const q = room.questions[currentIndex];
    const isCorrect = opt === q.answer;
    const player = room.players[playerId];
    const currentScore = player?.score || 0;
    const currentStreak = player?.streak || 0;
    const currentAnswered = player?.answered || 0;

    // Speed bonus — faster answer = more points
    const timeBonus = Math.floor(timeLeft / 3);
    const streakBonus = isCorrect ? Math.floor(currentStreak / 2) : 0;
    const pointsEarned = isCorrect ? 1 + timeBonus + streakBonus : 0;
    playSound(isCorrect ? "correct" : "wrong");
    const newStreak = isCorrect ? currentStreak + 1 : 0;

    if (isCorrect && newStreak >= 3) {
      setShowStreak(true);
      setStreakCount(newStreak);
      setTimeout(() => setShowStreak(false), 2000);
    }

    await update(ref(db, `battles/${roomCode}/players/${playerId}`), {
      score: currentScore + pointsEarned,
      answered: currentAnswered + 1,
      streak: newStreak,
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
    setAnswerTime(15);
    setHiddenOptions([]);
  };

  const useFiftyFifty = () => {
    if (fiftyUsed || !room || selected) return;
    const q = room.questions[currentIndex];
    const wrong = (["a", "b", "c", "d"] as const).filter(o => o !== q.answer);
    const toHide = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
    setFiftyUsed(true);
  };

  const sendReaction = async (emoji: string) => {
    if (!roomCode || !playerName) return;
    const id = generateCode();
    await update(ref(db, `battles/${roomCode}/reactions/${id}`), {
      emoji,
      name: playerName,
      time: Date.now(),
    });
  };

  const rematch = async () => {
    if (!room || room.host !== playerId) return;
    const res = await fetch(`/api/questions?subject=${encodeURIComponent(room.subject)}`);
    const data = await res.json();
    const questions = (data.data || []).slice(0, 10);

    // Reset all players scores
    const resetPlayers: any = {};
    Object.keys(room.players).forEach((pid) => {
      resetPlayers[pid] = { ...room.players[pid], score: 0, answered: 0, streak: 0 };
    });

    await update(ref(db, `battles/${roomCode}`), {
      status: "waiting",
      questions,
      reactions: {},
      players: resetPlayers,
    });
  };

  const shareResult = () => {
    const players = getPlayers();
    const winner = players[0];
    const me = players.find(p => p.id === playerId);
    const rank = players.findIndex(p => p.id === playerId) + 1;
    const msg = `⚔️ JAMB CBT Battle Result!\n🏆 Winner: ${winner.name} (${winner.score} pts)\n\nMy rank: #${rank} - ${me?.name} (${me?.score} pts)\n\nChallenge me at: https://jamb-cbt-chi.vercel.app/battle`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const getPlayers = () => {
    if (!room) return [];
    return Object.entries(room.players)
      .map(([id, p]) => ({ id, ...p as Player }))
      .sort((a, b) => b.score - a.score);
  };

  // LOBBY
  if (screen === "lobby") return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      <div className="bg-gradient-to-br from-purple-700 to-indigo-700 p-6 rounded-b-3xl mb-6">
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">⚔️ Quiz Battle</h1>
        <p className="text-purple-200 text-sm">Challenge friends in real time!</p>
      </div>
      <div className="px-4">
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
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Select Subject</p>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none text-gray-700 mb-3"
          >
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Creating..." : "⚔️ Create Battle Room"}
          </button>
        </div>
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

  // WAITING
  if (screen === "waiting") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-700 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <h2 className="text-white text-2xl font-bold mb-2">Waiting for players...</h2>
      <p className="text-purple-200 mb-6">Share this code with friends</p>
      <div className="bg-white rounded-3xl px-10 py-6 mb-8 text-center">
        <p className="text-gray-400 text-sm mb-1">Room Code</p>
        <p className="text-gray-800 text-5xl font-bold tracking-widest">{roomCode}</p>
      </div>
      <div className="w-full bg-white bg-opacity-10 rounded-2xl p-4 mb-6">
        <p className="text-white font-semibold mb-3">Players ({Object.keys(room?.players || {}).length}/4)</p>
        {getPlayers().map((p) => (
          <div key={p.id} className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {p.name[0].toUpperCase()}
            </div>
            <p className="text-white font-medium">{p.name}</p>
            {room?.host === p.id && <span className="text-yellow-300 text-xs">👑 Host</span>}
          </div>
        ))}
      </div>
      {room?.host === playerId ? (
        <button onClick={startGame} className="w-full bg-yellow-400 text-gray-900 py-4 rounded-2xl font-bold text-lg mb-3">
          🎮 Start Game!
        </button>
      ) : (
        <p className="text-purple-200 text-sm">Waiting for host to start...</p>
      )}
    </div>
  );
   // INTRO SCREEN
if (showIntro && room) {
  const players = getPlayers();
  const p = players[introIndex];
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <p className="text-purple-300 text-sm mb-4 uppercase tracking-widest">Player {introIndex + 1} of {players.length}</p>
      <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-6xl mb-6 animate-bounce">
        {p?.name[0].toUpperCase()}
      </div>
      <h1 className="text-white text-4xl font-bold text-center mb-2">{p?.name}</h1>
      <p className="text-yellow-400 text-lg font-semibold">⚔️ Ready to Battle!</p>
      <div className="flex gap-2 mt-8">
        {players.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i === introIndex ? "bg-yellow-400" : "bg-white bg-opacity-30"}`} />
        ))}
      </div>
    </div>
  );
}

  // PLAYING
  if (screen === "playing" && room) {
    const q = room.questions[currentIndex];
    const options = ["a", "b", "c", "d"] as const;

    return (
      <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10 relative">
        {/* Streak notification */}
        {showStreak && (
          <div className="fixed top-20 left-0 right-0 flex justify-center z-50">
            <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-2xl font-bold text-lg shadow-xl animate-bounce">
              🔥 {streakCount}x Streak! Bonus points!
            </div>
          </div>
        )}

        {/* Floating reactions */}
        <div className="fixed top-32 left-4 z-40 flex flex-col gap-2">
          {visibleReactions.map((r) => (
            <div key={r.id} className="bg-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 animate-bounce">
              <span className="text-xl">{r.emoji}</span>
              <span className="text-gray-600 text-xs">{r.name}</span>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="bg-purple-700 p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white font-bold">Q {currentIndex + 1}/{room.questions.length}</p>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${timeLeft <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-white text-purple-700"}`}>
              {timeLeft}
            </div>
          </div>
          <div className="w-full bg-purple-900 rounded-full h-2 mb-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / room.questions.length) * 100}%` }}
            />
          </div>
          {/* Live scores */}
          <div className="flex gap-2 overflow-x-auto mt-2">
            {getPlayers().map((p, i) => (
              <div key={p.id} className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 ${p.id === playerId ? "bg-yellow-400" : "bg-white bg-opacity-20"}`}>
                <span className="text-xs">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
                <span className={`text-xs font-medium ${p.id === playerId ? "text-gray-900" : "text-white"}`}>{p.name.split(" ")[0]}</span>
                <span className={`text-xs font-bold ${p.id === playerId ? "text-gray-900" : "text-yellow-300"}`}>{p.score}</span>
                {(p.streak || 0) >= 2 && <span className="text-xs">🔥{p.streak}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Power ups */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={useFiftyFifty}
              disabled={fiftyUsed || !!selected}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${fiftyUsed ? "bg-gray-200 text-gray-400" : "bg-indigo-100 text-indigo-700"}`}
            >
              {fiftyUsed ? "✓ Used" : "⚡ 50/50"}
            </button>
            <div className="flex gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-4">
            {options.map((opt) => {
              if (hiddenOptions.includes(opt)) return null;
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
            <div className="mb-4">
              <div className={`rounded-2xl p-3 mb-3 text-center ${selected === room.questions[currentIndex].answer ? "bg-green-100" : "bg-red-100"}`}>
                <p className={`font-bold ${selected === room.questions[currentIndex].answer ? "text-green-700" : "text-red-700"}`}>
                  {selected === room.questions[currentIndex].answer
                    ? `✓ Correct! +${1 + Math.floor(timeLeft/3) + Math.floor((room.players[playerId]?.streak || 0) / 2)} pts`
                    : "✗ Wrong!"}
                </p>
              </div>
              <button
                onClick={handleNextQuestion}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }


// FINISHED
  if (screen === "finished") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-700 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <h1 className="text-white text-3xl font-bold mb-2">🏆 Battle Over!</h1>
      <p className="text-purple-200 mb-6">Final Rankings</p>

      <div className="w-full flex flex-col gap-3 mb-6">
        {getPlayers().map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-4 rounded-2xl p-4 ${
              p.id === playerId ? "border-2 border-yellow-300" : ""
            } ${i === 0 ? "bg-yellow-400" : "bg-white bg-opacity-20"}`}
          >
            <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
            <div className="flex-1">
              <p className={`font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>
                {p.name} {p.id === playerId ? "(You)" : ""}
              </p>
              <p className={`text-xs ${i === 0 ? "text-gray-700" : "text-purple-200"}`}>
                {p.answered} answered · 🔥 Best streak: {p.streak}
              </p>
            </div>
            <p className={`text-2xl font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>{p.score} pts</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full mb-4">
        <button
          onClick={shareResult}
          className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold"
        >
          📲 Share
        </button>

        <button
  onClick={() => {
    if (room?.host !== playerId) {
      alert("Only the host can start a rematch!");
      return;
    }
    rematch();
  }}
  className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-2xl font-bold"
>
  🔄 Rematch
</button>      

        )}
      </div>
      <a href="/" className="w-full bg-white bg-opacity-20 text-white py-3 rounded-2xl font-bold text-center">
        🏠 Go Home
      </a>
    </div>
  );

  return null;
}

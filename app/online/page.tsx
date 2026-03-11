"use client";
import { useRef } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, update, remove, set, get } from "firebase/database";

const SUBJECTS = [
  "Use of English", "Mathematics", "Physics",
  "Chemistry", "Biology", "Economics", "Government", "Literature"
];

interface OnlinePlayer {
  uid: string;
  name: string;
  avatar: string;
  username: string;
  online: boolean;
  lastSeen: number;
  profile?: any;
}

export default function OnlineLobby() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const [myInvite, setMyInvite] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("Use of English");
  const [creating, setCreating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [animData, setAnimData] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);

      // Set self online
      await update(ref(db, `users/${u.uid}`), {
        online: true,
        lastSeen: Date.now(),
      });

      // Load own profile
      const psnap = await get(ref(db, `users/${u.uid}/profile`));
      if (psnap.val()) setProfile(psnap.val());

      // Listen to ALL online users
      onValue(ref(db, "users"), (snap) => {
        const data = snap.val() || {};
        const now = Date.now();
        const online: OnlinePlayer[] = Object.entries(data)
          .filter(([uid, val]: any) =>
            uid !== u.uid &&
            val.online === true &&
            now - (val.lastSeen || 0) < 5 * 60 * 1000 // online in last 5 mins
          )
          .map(([uid, val]: any) => ({
            uid,
            name: val.name || val.profile?.name || "Student",
            avatar: val.profile?.avatar || "🎓",
            username: val.username || "",
            online: true,
            lastSeen: val.lastSeen || 0,
          }));
        setPlayers(online);
        setLoading(false);
      });

      // Listen for incoming battle invites
      onValue(ref(db, `battleInvites/${u.uid}`), (snap) => {
        const data = snap.val();
        if (data) setMyInvite(data);
        else setMyInvite(null);
      });

      // Set offline on leave
      window.addEventListener("beforeunload", () => {
        update(ref(db, `users/${u.uid}`), { online: false, lastSeen: Date.now() });
      });

      // Ping every 60s to stay online
      const ping = setInterval(() => {
        update(ref(db, `users/${u.uid}`), { online: true, lastSeen: Date.now() });
      }, 60000);

      return () => clearInterval(ping);
    });
    return () => unsub();
  }, []);

  const openInviteModal = (player: OnlinePlayer) => {
    setSelectedPlayer(player);
    setSelectedSubject("Use of English");
    setShowInviteModal(true);
  };

  const sendBattleInvite = async () => {
    if (!user || !selectedPlayer || !profile) return;
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();

      // Create the battle room
      const pid = Math.random().toString(36).substring(2, 7).toUpperCase();
      let questions: any[] = [];
      try {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(selectedSubject)}`);
        const data = await res.json();
        if (data.data?.length > 0) questions = data.data.slice(0, 30);
      } catch {}

      await set(ref(db, `battles/${code}`), {
        host: pid,
        subject: selectedSubject,
        mode: "casual",
        status: "waiting",
        questions,
        reactions: {},
        maxPlayers: 4,
        tournament: null,
        players: {
          [pid]: {
            name: profile.name || user.displayName || "Student",
            score: 0, answered: 0, streak: 0, ready: true, wins: 0
          }
        }
      });

      // Send invite to the player
      await set(ref(db, `battleInvites/${selectedPlayer.uid}`), {
        roomCode: code,
        hostPlayerId: pid,
        fromName: profile.name || user.displayName || "Student",
        fromAvatar: profile.avatar || "🎓",
        fromUid: user.uid,
        subject: selectedSubject,
        timestamp: Date.now(),
      });

      setInviteSent(selectedPlayer.uid);
      setShowInviteModal(false);

      // Go to waiting room
      router.push(`/battle?room=${code}&pid=${pid}&name=${encodeURIComponent(profile.name || "Student")}`);
    } catch (err) {
      alert("Failed to send invite. Try again!");
    }
    setCreating(false);
  };

  const acceptInvite = async () => {
    if (!myInvite || !user || !profile) return;
    await remove(ref(db, `battleInvites/${user.uid}`));
    const pid = Math.random().toString(36).substring(2, 7).toUpperCase();
    await update(ref(db, `battles/${myInvite.roomCode}/players/${pid}`), {
      name: profile.name || user.displayName || "Student",
      score: 0, answered: 0, streak: 0, ready: true, wins: 0
    });
    router.push(`/battle?room=${myInvite.roomCode}&pid=${pid}&name=${encodeURIComponent(profile.name || "Student")}`);
  };

  const declineInvite = async () => {
    if (!user) return;
    await remove(ref(db, `battleInvites/${user.uid}`));
    setMyInvite(null);
  };

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>

      {/* Incoming invite popup */}
      {myInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full rounded-3xl overflow-hidden" style={{ background: "#13171f", border: "1px solid #4ade80" }}>
            {/* Green top bar */}
            <div className="px-5 pt-5 pb-3" style={{ background: "#14532d" }}>
              <div className="flex items-center gap-3">
                <div className="text-4xl animate-bounce">{myInvite.fromAvatar || "🎓"}</div>
                <div>
                  <p className="text-white font-black text-lg">{myInvite.fromName}</p>
                  <p className="text-green-300 text-xs">is challenging you! ⚔️</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-4 p-3 rounded-2xl" style={{ background: "#1e2533" }}>
                <span className="text-xl">📚</span>
                <div>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Subject</p>
                  <p className="text-white font-bold text-sm">{myInvite.subject}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs" style={{ color: "#6b7280" }}>Room</p>
                  <p className="text-white font-bold text-sm">{myInvite.roomCode}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={declineInvite}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                  style={{ background: "#450a0a", color: "#f87171" }}>
                  ✗ Decline
                </button>
                <button onClick={acceptInvite}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                  style={{ background: "#16a34a", color: "#fff" }}>
                  ⚔️ Accept Battle!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full rounded-3xl p-5" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#1e2533" }}>
                {selectedPlayer.avatar}
              </div>
              <div>
                <p className="text-white font-black">Challenge {selectedPlayer.name}</p>
                <p className="text-xs" style={{ color: "#4ade80" }}>● Online now</p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>Choose Subject</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSelectedSubject(s)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-left"
                  style={{
                    background: selectedSubject === s ? "#14532d" : "#1e2533",
                    color: selectedSubject === s ? "#4ade80" : "#9ca3af",
                    border: `1px solid ${selectedSubject === s ? "#4ade80" : "#374151"}`
                  }}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: "#1e2533", color: "#9ca3af" }}>
                Cancel
              </button>
              <button onClick={sendBattleInvite} disabled={creating}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: "#16a34a", color: "#fff" }}>
                {creating ? "Creating..." : "⚔️ Send Challenge!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-8 pb-4" style={{ borderBottom: "1px solid #1e2533" }}>
        <button onClick={() => router.push("/")}
          className="text-xs mb-3 block" style={{ color: "#6b7280" }}>← Back</button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-xl">🌍 Online Lobby</h1>
            <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>
              {loading ? "Finding players..." : `${players.length} student${players.length !== 1 ? "s" : ""} online now`}
            </p>
          </div>
          {/* Self indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0f2918", border: "1px solid #14532d" }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-white">{profile?.avatar || "🎓"} You</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-4xl mb-4 animate-pulse">🌍</div>
          <p className="text-white font-bold">Scanning lobby...</p>
          <div className="mt-4 flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && players.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="text-6xl mb-4">😴</div>
          <p className="text-white font-bold text-lg mb-1">No one online right now</p>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            Share the app with friends and battle them!
          </p>
          <button onClick={() => {
            const msg = `🎓 Join me on JAMB CBT Practice!\nPractice JAMB questions and battle friends!\n\nhttps://jamb-cbt-chi.vercel.app`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
          }}
            className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: "#16a34a" }}>
            📲 Invite Friends on WhatsApp
          </button>
        </div>
      )}

      {/* Players list */}
      {!loading && players.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>
            🟢 Online Players
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
            {players.map((player, i) => (
              <div key={player.uid}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < players.length - 1 ? "1px solid #1e2533" : "none" }}>
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "#1e2533" }}>
                    {player.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2"
                    style={{ borderColor: "#13171f" }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{player.name}</p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                    {player.username ? `@${player.username}` : "● Online"}
                  </p>
                </div>

                {/* Battle button */}
                <button
                  onClick={() => openInviteModal(player)}
                  disabled={inviteSent === player.uid}
                  className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs"
                  style={{
                    background: inviteSent === player.uid ? "#1e2533" : "#14532d",
                    color: inviteSent === player.uid ? "#6b7280" : "#4ade80",
                    border: `1px solid ${inviteSent === player.uid ? "#374151" : "#4ade80"}`
                  }}>
                  {inviteSent === player.uid ? "Invited ✓" : "⚔️ Battle"}
                </button>
              </div>
            ))}
          </div>

          {/* Refresh hint */}
          <p className="text-center text-xs mt-4" style={{ color: "#374151" }}>
            Updates automatically • {players.length} online
          </p>
        </div>
      )}

      {/* Share button bottom */}
      <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
        <button onClick={() => {
          const msg = `🎓 Join me on JAMB CBT Practice!\nBattle me and other students live!\n\nhttps://jamb-cbt-chi.vercel.app`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
        }}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{ background: "#13171f", border: "1px solid #1e2533" }}>
          📲 Invite More Players
        </button>
      </div>
    </div>
  );
}

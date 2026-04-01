"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, set, onValue, push, update, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { saveQuestions, getQuestions } from "@/lib/questionCache";

interface Player {
  name: string;
  score: number;
  answered: number;
  streak: number;
  ready: boolean;
  wins: number;
}

interface Match {
  players: string[];
  scores: { [key: string]: number };
  status: "waiting" | "playing" | "finished";
  winner?: string;
}

interface Room {
  host: string;
  subject: string;
  mode: "casual" | "tournament";
  status: "waiting" | "playing" | "finished";
  players: { [key: string]: Player };
  questions: any[];
  reactions: { [key: string]: { emoji: string; name: string; time: number } };
  maxPlayers: number;
  tournament?: {
    bracket: Match[];
    round: number;
    semifinals: Match[];
    final: Match | null;
    champion: string | null;
  };
}

const EMOJIS = ["🔥", "😂", "👏", "😱", "💪", "🎯"];
const REACTION_DURATION = 2000;

// ─── Lobby Screen Component ──────────────────────────────────────
function LobbyScreen({ mode, setMode, playerName, setPlayerName, subject, setSubject, subjects, createRoom, joinRoom, inputCode, setInputCode, loading }: any) {
  const [lobbyTab, setLobbyTab] = useState<"battle"|"online"|"friends">("battle");
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [inviteSent, setInviteSent] = useState<string|null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<any>(null);
  const [inviteSubject, setInviteSubject] = useState("Use of English");
  const [creating, setCreating] = useState(false);
  const [myInvite, setMyInvite] = useState<any>(null);
  const [showAnim, setShowAnim] = useState(false);
  const [animData, setAnimData] = useState<any>(null);
  const router = useRouter ? useRouter() : null;

  useEffect(() => {
    const { auth: fbAuth, db: fbDb } = require("@/lib/firebase");
    const { onAuthStateChanged } = require("firebase/auth");
    const { ref, onValue, update, get, set, remove } = require("firebase/database");

    const unsub = onAuthStateChanged(fbAuth, async (u: any) => {
      if (!u) return;
      setCurrentUser(u);
      await update(ref(fbDb, `users/${u.uid}`), { online: true, lastSeen: Date.now() });
      const psnap = await get(ref(fbDb, `users/${u.uid}/profile`));
      if (psnap.val()) setCurrentProfile(psnap.val());

      // Online players
      onValue(ref(fbDb, "users"), (snap: any) => {
        const data = snap.val() || {};
        const now = Date.now();
        const list = Object.entries(data)
          .filter(([uid, val]: any) => uid !== u.uid && val.online === true && now - (val.lastSeen||0) < 5*60*1000)
          .map(([uid, val]: any) => ({
            uid, name: val.name || val.profile?.name || "Student",
            avatar: val.profile?.avatar || "🎓", username: val.username || "",
          }));
        setOnlinePlayers(list);
      });

      // Friends
      onValue(ref(fbDb, `friends/${u.uid}`), async (snap: any) => {
        const data = snap.val() || {};
        const list = await Promise.all(Object.entries(data).map(async ([fuid, fdata]: any) => {
          const fsnap = await get(ref(fbDb, `users/${fuid}`));
          const finfo = fsnap.val() || {};
          return { uid: fuid, name: fdata.name, avatar: fdata.avatar || "🎓",
            online: finfo.online === true && Date.now() - (finfo.lastSeen||0) < 5*60*1000 };
        }));
        setFriends(list.sort((a,b) => (b.online?1:0)-(a.online?1:0)));
      });

      // Incoming invites
      onValue(ref(fbDb, `battleInvites/${u.uid}`), (snap: any) => {
        if (snap.val()) setMyInvite(snap.val());
        else setMyInvite(null);
      });

      // Global entrance animation
      onValue(ref(fbDb, "battleEntrances"), (snap: any) => {
        const data = snap.val();
        if (!data) return;
        if (Date.now() - (data.timestamp||0) < 3000) {
          setAnimData({ challenger: data, isSpectator: true });
          setShowAnim(true);
          setTimeout(() => setShowAnim(false), 3000);
        }
      });
    });
    return () => unsub();
  }, []);

  const sendChallenge = async () => {
    if (!currentUser || !inviteTarget || !currentProfile) return;
    setCreating(true);
    try {
      const { db: fbDb } = require("@/lib/firebase");
      const { ref, set, update } = require("firebase/database");
      const code = Math.random().toString(36).substring(2,7).toUpperCase();
      const pid = Math.random().toString(36).substring(2,7).toUpperCase();
      let questions: any[] = [];
      try {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(inviteSubject)}`);
        const data = await res.json();
        if (data.data?.length > 0) questions = data.data.slice(0, 30);
      } catch {}
      await set(ref(fbDb, `battles/${code}`), {
        host: pid, subject: inviteSubject, mode: "casual", status: "waiting",
        questions, reactions: {}, maxPlayers: 4, tournament: null,
        players: { [pid]: { name: currentProfile.name || "Student", score:0, answered:0, streak:0, ready:true, wins:0 } }
      });
      await set(ref(fbDb, `battleInvites/${inviteTarget.uid}`), {
        roomCode: code, hostPlayerId: pid,
        fromName: currentProfile.name || "Student",
        fromAvatar: currentProfile.avatar || "🎓",
        fromUid: currentUser.uid, subject: inviteSubject, timestamp: Date.now(),
      });
      // Show animation to host
      setAnimData({
        challenger: { challengerName: currentProfile.name || "Student", challengerAvatar: currentProfile.avatar || "🎓",
          acceptorName: inviteTarget.name, acceptorAvatar: inviteTarget.avatar,
          subject: inviteSubject, roomCode: code },
        pid, isSpectator: false, isHost: true,
      });
      setShowAnim(true);
      setShowInviteModal(false);
      setInviteSent(inviteTarget.uid);
      setTimeout(() => {
        setShowAnim(false);
        window.location.href = `/battle?room=${code}&pid=${pid}&name=${encodeURIComponent(currentProfile.name || "Student")}`;
      }, 2800);
    } catch { alert("Failed. Try again!"); }
    setCreating(false);
  };

  const acceptBattleInvite = async () => {
    if (!myInvite || !currentUser || !currentProfile) return;
    const { db: fbDb } = require("@/lib/firebase");
    const { ref, remove, update, set } = require("firebase/database");
    await remove(ref(fbDb, `battleInvites/${currentUser.uid}`));
    const pid = Math.random().toString(36).substring(2,7).toUpperCase();
    await update(ref(fbDb, `battles/${myInvite.roomCode}/players/${pid}`), {
      name: currentProfile.name || "Student", score:0, answered:0, streak:0, ready:true, wins:0
    });
    // Broadcast entrance to ALL
    await set(ref(fbDb, "battleEntrances"), {
      challengerName: myInvite.fromName, challengerAvatar: myInvite.fromAvatar,
      acceptorName: currentProfile.name || "Student", acceptorAvatar: currentProfile.avatar || "🎓",
      subject: myInvite.subject, roomCode: myInvite.roomCode, timestamp: Date.now(),
    });
    setAnimData({ challenger: {
      challengerName: myInvite.fromName, challengerAvatar: myInvite.fromAvatar,
      acceptorName: currentProfile.name || "Student", acceptorAvatar: currentProfile.avatar || "🎓",
      subject: myInvite.subject, roomCode: myInvite.roomCode,
    }, pid, isSpectator: false, isHost: false });
    setMyInvite(null);
    setShowAnim(true);
    setTimeout(() => {
      setShowAnim(false);
      window.location.href = `/battle?room=${myInvite.roomCode}&pid=${pid}&name=${encodeURIComponent(currentProfile.name || "Student")}`;
    }, 2800);
  };

  const doSearchUser = async () => {
    if (!searchUser.trim()) return;
    setSearchLoading(true); setSearchResult(null);
    try {
      const { db: fbDb } = require("@/lib/firebase");
      const { ref, get } = require("firebase/database");
      const snap = await get(ref(fbDb, "users"));
      const all = snap.val() || {};
      const found = Object.entries(all).find(([uid, d]: any) =>
        d.username?.toLowerCase() === searchUser.trim().toLowerCase() && uid !== currentUser?.uid
      );
      if (found) { const [uid, d]: any = found; setSearchResult({ uid, ...d }); }
      else setSearchResult({ notFound: true });
    } catch {}
    setSearchLoading(false);
  };

  const sendFriendRequest = async (toUid: string, toData: any) => {
    if (!currentUser || !currentProfile) return;
    const { db: fbDb } = require("@/lib/firebase");
    const { ref, set } = require("firebase/database");
    await set(ref(fbDb, `friendRequests/${toUid}/${currentUser.uid}`), {
      name: currentProfile.name || "Student", avatar: currentProfile.avatar || "🎓",
      username: currentProfile.username || "", timestamp: Date.now(),
    });
    alert("Friend request sent! 🎮");
    setSearchResult(null); setSearchUser("");
  };

  const C = "#0e1117"; const CARD = "#13171f"; const BORDER = "#1e2533";

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: C }}>

      {/* FREE FIRE ENTRANCE ANIMATION */}
      {showAnim && animData && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: "#000" }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,100,0.1) 2px,rgba(0,255,100,0.1) 4px)" }} />
          <div className="absolute top-0 left-0 right-0 py-3 text-center" style={{ background: "linear-gradient(90deg,transparent,#14532d,transparent)" }}>
            <p className="text-green-400 text-xs font-black uppercase tracking-widest animate-pulse">⚔️ BATTLE STARTING ⚔️</p>
          </div>
          <div className="absolute w-40 h-40 rounded-full border-4 border-green-400 animate-ping" style={{ opacity:0.4 }} />
          <div className="absolute w-72 h-72 rounded-full border-2 border-green-500 animate-ping" style={{ opacity:0.2, animationDelay:"0.2s" }} />
          <div className="absolute w-96 h-96 rounded-full border border-green-600 animate-ping" style={{ opacity:0.1, animationDelay:"0.4s" }} />
          <div className="flex items-center gap-6 mb-8 relative z-10">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-2" style={{ background:"#1e3a1e", border:"3px solid #4ade80", boxShadow:"0 0 30px #4ade8088" }}>
                {animData.challenger.challengerAvatar}
              </div>
              <p className="text-white font-black text-sm">{animData.challenger.challengerName}</p>
              <p className="text-xs" style={{ color:"#4ade80" }}>Challenger</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-black text-5xl animate-pulse" style={{ color:"#fbbf24", textShadow:"0 0 30px #fbbf24" }}>VS</p>
              <p className="text-xs mt-1" style={{ color:"#6b7280" }}>{animData.challenger.subject}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-2" style={{ background:"#1a1a2e", border:"3px solid #60a5fa", boxShadow:"0 0 30px #60a5fa88" }}>
                {animData.challenger.acceptorAvatar}
              </div>
              <p className="text-white font-black text-sm">{animData.challenger.acceptorName}</p>
              <p className="text-xs" style={{ color:"#60a5fa" }}>{animData.isSpectator ? "Accepted" : animData.isHost ? "You" : "You"}</p>
            </div>
          </div>
          <div className="px-8 py-3 rounded-2xl" style={{ background:"#14532d", border:"1px solid #4ade80" }}>
            <p className="text-white font-black text-xl">
              {animData.isSpectator ? "🔥 Battle Started in Lobby!" : "Entering Room..."}
            </p>
          </div>
          {!animData.isSpectator && <p className="text-xs mt-3" style={{ color:"#374151" }}>Room: {animData.challenger.roomCode}</p>}
        </div>
      )}
{/* Incoming invite */}
      {myInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8" style={{ background:"rgba(0,0,0,0.88)" }}>
          <div className="w-full rounded-3xl overflow-hidden" style={{ background: CARD, border:"1px solid #4ade80" }}>
            <div className="px-5 pt-5 pb-3" style={{ background:"#14532d" }}>
              <div className="flex items-center gap-3">
                <div className="text-4xl animate-bounce">{myInvite.fromAvatar || "🎓"}</div>
                <div>
                  <p className="text-white font-black text-lg">{myInvite.fromName}</p>
                  <p className="text-green-300 text-xs font-bold">is challenging you! ⚔️</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl" style={{ background: BORDER }}>
                <span className="text-xl">📚</span>
                <div className="flex-1"><p className="text-xs" style={{ color:"#6b7280" }}>Subject</p><p className="text-white font-bold text-sm">{myInvite.subject}</p></div>
                <div><p className="text-xs" style={{ color:"#6b7280" }}>Room</p><p className="text-white font-bold text-sm">{myInvite.roomCode}</p></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { const {db:d}=require("@/lib/firebase");const{ref,remove}=require("firebase/database");remove(ref(d,`battleInvites/${currentUser?.uid}`));setMyInvite(null); }}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm" style={{ background:"#450a0a", color:"#f87171" }}>✗ Decline</button>
                <button onClick={acceptBattleInvite}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm" style={{ background:"#16a34a", color:"#fff" }}>⚔️ Accept!</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge modal */}
      {showInviteModal && inviteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8" style={{ background:"rgba(0,0,0,0.88)" }}>
          <div className="w-full rounded-3xl p-5" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: BORDER }}>{inviteTarget.avatar}</div>
              <div><p className="text-white font-black">Challenge {inviteTarget.name}</p><p className="text-xs font-bold" style={{ color:"#4ade80" }}>● Online</p></div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Pick Subject</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Use of English","Mathematics","Physics","Chemistry","Biology","Economics","Government","Literature"].map(s => (
                <button key={s} onClick={() => setInviteSubject(s)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-left"
                  style={{ background: inviteSubject===s?"#14532d":"#1e2533", color: inviteSubject===s?"#4ade80":"#9ca3af", border:`1px solid ${inviteSubject===s?"#4ade80":"#374151"}` }}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm" style={{ background:"#1e2533", color:"#9ca3af" }}>Cancel</button>
              <button onClick={sendChallenge} disabled={creating} className="flex-1 py-3.5 rounded-2xl font-bold text-sm" style={{ background:"#16a34a", color:"#fff" }}>
                {creating ? "Creating..." : "⚔️ Challenge!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-8 pb-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <a href="/" className="text-xs mb-3 block" style={{ color:"#6b7280" }}>← Home</a>
        <h1 className="text-white font-black text-2xl">⚔️ Battle Arena</h1>
        <p className="text-xs mt-0.5" style={{ color:"#6b7280" }}>
          {onlinePlayers.length > 0 ? `🟢 ${onlinePlayers.length} players online` : "No players online right now"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom:`1px solid ${BORDER}` }}>
        {[{id:"battle",label:"⚔️ Battle"},{id:"online",label:`🌍 Online (${onlinePlayers.length})`},{id:"friends",label:`👥 Friends (${friends.length})`}].map(tab => (
          <button key={tab.id} onClick={() => setLobbyTab(tab.id as any)}
            className="flex-1 py-3 text-xs font-bold"
            style={{ color: lobbyTab===tab.id?"#4ade80":"#6b7280", borderBottom: lobbyTab===tab.id?"2px solid #4ade80":"2px solid transparent" }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">

        {/* BATTLE TAB */}
        {lobbyTab === "battle" && (
          <div>
            {/* Mode */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Game Mode</p>
              <div className="flex gap-2">
                <button onClick={() => setMode("casual")} className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: mode==="casual"?"#14532d":"#1e2533", color: mode==="casual"?"#4ade80":"#9ca3af", border:`1px solid ${mode==="casual"?"#4ade80":"#374151"}` }}>
                  ⚔️ Casual
                </button>
                <button onClick={() => setMode("tournament")} className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: mode==="tournament"?"#92400e":"#1e2533", color: mode==="tournament"?"#fbbf24":"#9ca3af", border:`1px solid ${mode==="tournament"?"#fbbf24":"#374151"}` }}>
                  🏆 Tournament
                </button>
              </div>
              {mode === "tournament" && (
                <p className="text-xs mt-2" style={{ color:"#fbbf24" }}>4-8 players · Elimination rounds · One champion!</p>
              )}
            </div>

            {/* Name */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Your Name</p>
              <input type="text" placeholder="Enter your name" value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background:"#1e2533", border:`1px solid ${BORDER}` }} />
            </div>

            {/* Subject + Create */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Subject</p>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
                style={{ background:"#1e2533", border:`1px solid ${BORDER}` }}>
                {subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={createRoom} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-50"
                style={{ background: mode==="tournament"?"#92400e":"#16a34a" }}>
                {loading ? "Creating..." : mode==="tournament" ? "🏆 Create Tournament" : "⚔️ Create Battle Room"}
              </button>
            </div>

            {/* Join */}
            <div className="rounded-2xl p-4" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Join a Room</p>
              <input type="text" placeholder="ENTER ROOM CODE" value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full rounded-xl px-4 py-3 text-white outline-none mb-3 text-center text-2xl font-black tracking-widest"
                style={{ background:"#1e2533", border:`1px solid ${BORDER}` }} />
              <button onClick={joinRoom} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-50"
                style={{ background:"#1d4ed8" }}>
                {loading ? "Joining..." : "🚀 Join Room"}
              </button>
            </div>
          </div>
        )}

        {/* ONLINE TAB */}
        {lobbyTab === "online" && (
          <div>
            {onlinePlayers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">😴</div>
                <p className="text-white font-bold mb-1">No one online right now</p>
                <p className="text-sm mb-4" style={{ color:"#6b7280" }}>Share the app to get players online!</p>
                <button onClick={() => { const msg=`🎓 Join JAMB CBT Practice! Battle me live!
https://jamb-cbt-chi.vercel.app`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`); }}
                  className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background:"#16a34a" }}>
                  📲 Invite on WhatsApp
                </button>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD }}>
                {onlinePlayers.map((p, i) => (
                  <div key={p.uid} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < onlinePlayers.length-1 ? `1px solid ${BORDER}` : "none" }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:"#1e2533" }}>{p.avatar}</div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2" style={{ borderColor: CARD }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{p.name}</p>
                      <p className="text-xs" style={{ color:"#6b7280" }}>{p.username ? `@${p.username}` : "● Online"}</p>
                    </div>
                    <button onClick={() => { setInviteTarget(p); setShowInviteModal(true); }}
                      disabled={inviteSent === p.uid}
                      className="px-3 py-2 rounded-xl font-bold text-xs"
                      style={{ background: inviteSent===p.uid?"#1e2533":"#14532d", color: inviteSent===p.uid?"#6b7280":"#4ade80", border:`1px solid ${inviteSent===p.uid?"#374151":"#4ade80"}` }}>
                      {inviteSent===p.uid ? "Invited ✓" : "⚔️ Battle"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FRIENDS TAB */}
        {lobbyTab === "friends" && (
          <div>
            {/* Search */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#6b7280" }}>Find by Username</p>
              <div className="flex gap-2">
                <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key==="Enter" && doSearchUser()}
                  placeholder="@username"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  style={{ background:"#1e2533", border:`1px solid ${BORDER}` }} />
                <button onClick={doSearchUser} disabled={searchLoading}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background:"#16a34a" }}>
                  {searchLoading ? "..." : "Find"}
                </button>
              </div>
              {searchResult && !searchResult.notFound && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl" style={{ background:"#1e2533" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"#13171f" }}>{searchResult.profile?.avatar||"🎓"}</div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{searchResult.profile?.name||searchResult.username}</p>
                    <p className="text-xs" style={{ color:"#6b7280" }}>@{searchResult.username}</p>
                  </div>
                  <button onClick={() => sendFriendRequest(searchResult.uid, searchResult)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background:"#16a34a" }}>
                    ➕ Add
                  </button>
                </div>
              )}
              {searchResult?.notFound && <p className="text-xs mt-2" style={{ color:"#f87171" }}>No user found!</p>}
            </div>

            {/* Friends list */}
            {friends.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-white font-bold mb-1">No friends yet</p>
                <p className="text-xs" style={{ color:"#6b7280" }}>Search by username above to add friends</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD }}>
                {friends.map((f, i) => (
                  <div key={f.uid} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < friends.length-1 ? `1px solid ${BORDER}` : "none" }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background:"#1e2533" }}>{f.avatar}</div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2" style={{ background: f.online?"#4ade80":"#374151", borderColor: CARD }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{f.name}</p>
                      <p className="text-xs" style={{ color: f.online?"#4ade80":"#6b7280" }}>{f.online?"● Online":"● Offline"}</p>
                    </div>
                    {f.online && (
                      <button onClick={() => { setInviteTarget(f); setShowInviteModal(true); }}
                        className="px-3 py-2 rounded-xl font-bold text-xs"
                        style={{ background:"#14532d", color:"#4ade80", border:"1px solid #4ade80" }}>
                        ⚔️ Battle
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ─── End LobbyScreen ─────────────────────────────────────────────


export default function Battle() {
  const router = useRouter();
  const [screen, setScreen] = useState<"lobby" | "waiting" | "playing" | "finished" | "bracket">("lobby");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(35);
  const [subject, setSubject] = useState("Use of English");
  const [mode, setMode] = useState<"casual" | "tournament">("casual");
  const [loading, setLoading] = useState(false);
  const [visibleReactions, setVisibleReactions] = useState<{ emoji: string; name: string; id: string }[]>([]);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [answerTime, setAnswerTime] = useState(35);
  const [showStreak, setShowStreak] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [showCalc, setShowCalc] = useState(false);
const [calcDisplay, setCalcDisplay] = useState("0");
const [calcExpression, setCalcExpression] = useState("");
const [calcEvaluated, setCalcEvaluated] = useState(false);
const [showChat, setShowChat] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);
const [lastSeenCount, setLastSeenCount] = useState(0);

const [chatMessage, setChatMessage] = useState("");
const [messages, setMessages] = useState<{name: string; text: string; time: number}[]>([]);

const calcNumber = (val: string) => {
  if (calcEvaluated) { setCalcDisplay(val); setCalcExpression(val); setCalcEvaluated(false); return; }
  setCalcDisplay(calcDisplay === "0" ? val : calcDisplay + val);
  setCalcExpression(calcExpression + val);
};
const calcOperator = (op: string) => { setCalcEvaluated(false); setCalcExpression(calcExpression + op); setCalcDisplay(op); };
const calcEquals = () => {
  try {
    const result = Function('"use strict"; return (' + calcExpression + ')')();
    const rounded = Math.round(result * 1000000) / 1000000;
    setCalcDisplay(String(rounded));
    setCalcExpression(String(rounded));
    setCalcEvaluated(true);
  } catch { setCalcDisplay("Error"); setCalcExpression(""); }
};
const calcClear = () => { setCalcDisplay("0"); setCalcExpression(""); setCalcEvaluated(false); };
const calcBack = () => {
  if (calcDisplay.length === 1) { setCalcDisplay("0"); return; }
  setCalcDisplay(calcDisplay.slice(0, -1));
  setCalcExpression(calcExpression.slice(0, -1));
};
  const [showIntro, setShowIntro] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const [myMatch, setMyMatch] = useState<Match | null>(null);
  const [myMatchIndex, setMyMatchIndex] = useState(-1);
  const [myRound, setMyRound] = useState<"bracket" | "semifinals" | "final">("bracket");
  const timerRef = useRef<any>(null);

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

  // Auto-rejoin if user accidentally left
  useEffect(() => {
    const saved = localStorage.getItem("activeRoom");
    if (saved && screen === "lobby") {
      try {
        const { roomCode: savedCode, playerId: savedPid, playerName: savedName } = JSON.parse(saved);
        if (savedCode && savedPid) {
          // Check if room still exists and is active
          get(ref(db, `battles/${savedCode}`)).then((snap) => {
            const data = snap.val();
            if (data && data.status !== "finished" && data.players?.[savedPid]) {
              setRoomCode(savedCode);
              setPlayerId(savedPid);
              setPlayerName(savedName || "");
              if (data.status === "playing") {
                setRoom(data);
                setScreen("playing");
                setCurrentIndex(0);
                setTimeLeft(35);
              } else {
                setScreen("waiting");
              }
            } else {
              localStorage.removeItem("activeRoom");
            }
          });
        }
      } catch {
        localStorage.removeItem("activeRoom");
      }
    }
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, `battles/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setRoom(data);

      if (data.status === "playing" && screen === "waiting") {
        if (data.mode === "tournament") {
          setScreen("bracket");
        } else {
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
            setTimeLeft(35);
          }, players.length * 2000 + 500);
        }
      }

      // Tournament match detection
      if (data.mode === "tournament" && data.tournament) {
        const rounds = ["bracket", "semifinals", "final"] as const;
        for (const round of rounds) {
          const matches = round === "final"
            ? (data.tournament.final ? [data.tournament.final] : [])
            : (data.tournament[round] || []);
          const idx = matches.findIndex((m: Match) => m.players?.includes(playerId));
          if (idx !== -1) {
            setMyMatch(matches[idx]);
            setMyMatchIndex(idx);
            setMyRound(round);
            if (matches[idx].status === "playing" && screen === "bracket") {
              setShowIntro(true);
              setIntroIndex(0);
              const players = matches[idx].players.map((pid: string) => ({ name: data.players[pid]?.name || "?" }));
              players.forEach((_: any, i: number) => {
                setTimeout(() => setIntroIndex(i), i * 2000);
              });
              setTimeout(() => {
                setShowIntro(false);
                setScreen("playing");
                setCurrentIndex(0);
                setTimeLeft(35);
                setSelected(null);
              }, players.length * 2000 + 500);
            }
            if (matches[idx].status === "finished" && screen === "playing") {
              setScreen("bracket");
            }
            break;
          }
        }
        if (data.tournament.champion) setScreen("finished");
      }

      if (data.status === "finished" && screen === "playing" && data.mode === "casual") {
        setScreen("finished");
      }

       if (data.status === "waiting" && screen === "finished") {
        setScreen("waiting");
        setCurrentIndex(0);
        setSelected(null);
        setTimeLeft(35);
        setFiftyUsed(false);
      }
       
      if (data.chat) {
  const msgs = Object.values(data.chat) as {name: string; text: string; time: number}[];
  if (!showChat) {
    setUnreadCount(msgs.length - lastSeenCount);
  }
  setMessages(msgs.sort((a, b) => a.time - b.time).slice(-50));
}
      if (data.reactions) {
        const now = Date.now();
        const fresh = Object.entries(data.reactions)
          .filter(([_, r]: any) => now - r.time < REACTION_DURATION)
          .map(([id, r]: any) => ({ id, emoji: r.emoji, name: r.name }));
        setVisibleReactions(fresh);
      }
    });
    return () => unsub();
  }, [roomCode, screen, playerId]);

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
      let questions: any[] = [];
      // Try API first with timeout
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          questions = data.data.slice(0, 30);
          await saveQuestions(subject, data.data);
        }
      } catch {
        // API failed - try cache
      }
      // Fallback to cache
      if (questions.length === 0) {
        const cached = await getQuestions(subject);
        if (cached && cached.length > 0) {
          questions = cached.slice(0, 30);
        }
      }
      // Use dummy questions if everything fails
      if (questions.length === 0) {
        alert("Could not load questions. Please check your internet and try again.");
        setLoading(false);
        return;
      }

      await set(ref(db, `battles/${code}`), {
        host: pid,
        subject,
        mode,
        status: "waiting",
        questions,
        reactions: {},
        maxPlayers: mode === "tournament" ? 8 : 4,
        tournament: mode === "tournament" ? {
          bracket: [], semifinals: [], final: null, champion: null, round: 1
        } : null,
        players: {
          [pid]: { name: playerName, score: 0, answered: 0, streak: 0, ready: true, wins: 0 }
        }
      });

      setRoomCode(code);
      setPlayerId(pid);
      setScreen("waiting");
    } catch (err: any) {
      console.error("Create room error:", err);
      alert("Failed to create room: " + (err?.message || "Check your internet connection and try again."));
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
      if (Object.keys(data.players).length >= (data.maxPlayers || 4)) {
        alert("Room is full!"); setLoading(false); return;
      }

      await update(ref(db, `battles/${code}/players/${pid}`), {
        name: playerName, score: 0, answered: 0, streak: 0, ready: true, wins: 0
      });

      setRoomCode(code);
      setPlayerId(pid);
      setScreen("waiting");
      // Save to localStorage so user can rejoin if they accidentally leave
      localStorage.setItem("activeRoom", JSON.stringify({ roomCode: code, playerId: pid, playerName }));
    } catch (err) {
      alert("Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {

       
   if (!room) return;
    const playerIds = Object.keys(room.players);
    const minPlayers = room.mode === "tournament" ? 4 : 2;
    if (playerIds.length < minPlayers) {
      return alert(`Need at least ${minPlayers} players to start!`);
    }
    if (room.mode === "tournament") {
      const shuffled = playerIds.sort(() => Math.random() - 0.5);
      const bracket: Match[] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          bracket.push({
            players: [shuffled[i], shuffled[i + 1]],
            scores: { [shuffled[i]]: 0, [shuffled[i + 1]]: 0 },
            status: "waiting",
          });
        }
      }
      await update(ref(db, `battles/${roomCode}`), {
        status: "playing",
        "tournament/bracket": bracket,
      });
    } else {
      await update(ref(db, `battles/${roomCode}`), { status: "playing" });
    }
  };
  
  const startMyMatch = async () => {
    if (!myMatch || myMatchIndex === -1) return;
    if (!myMatch.players.includes(playerId)) return alert("You are not in this match!");

    const path = myRound === "final"
      ? `battles/${roomCode}/tournament/final`
      : `battles/${roomCode}/tournament/${myRound}/${myMatchIndex}`;
    await update(ref(db, path), { status: "playing" });
  };

  const handleAnswer = async (opt: string) => {
    if (selected || !room) return;
    setSelected(opt);
    clearInterval(timerRef.current);
    const q = room.questions[currentIndex];
    const isCorrect = opt === q.answer;
    playSound(isCorrect ? "correct" : "wrong");

    if (room.mode === "tournament" && myMatch) {
      const currentScore = myMatch.scores?.[playerId] || 0;
      const timeBonus = Math.floor(timeLeft / 5); // Max 7 bonus points for speed
      const points = isCorrect ? 1 + timeBonus : 0;
      const path = myRound === "final"
        ? `battles/${roomCode}/tournament/final/scores/${playerId}`
        : `battles/${roomCode}/tournament/${myRound}/${myMatchIndex}/scores/${playerId}`;
      await update(ref(db, `battles/${roomCode}/tournament/${myRound === "final" ? "final/scores" : `${myRound}/${myMatchIndex}/scores`}`), {
  [playerId]: currentScore + points
});

    } else {
      const player = room.players[playerId];
      const currentScore = player?.score || 0;
      const currentStreak = player?.streak || 0;
      const currentAnswered = player?.answered || 0;
      const timeBonus = Math.floor(timeLeft / 5); // Max 7 bonus points for speed
      const streakBonus = isCorrect ? Math.floor(currentStreak / 2) : 0;
      const pointsEarned = isCorrect ? 1 + timeBonus + streakBonus : 0;
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
    }
  };

  const handleNextQuestion = async () => {
    if (!room) return;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= room.questions.length) {
      if (room.mode === "tournament" && myMatch) {
        const scores = myMatch.scores || {};
        const winner = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
        const path = myRound === "final"
          ? `battles/${roomCode}/tournament/final`
          : `battles/${roomCode}/tournament/${myRound}/${myMatchIndex}`;
        await update(ref(db, path), { status: "finished", winner });

        if (myRound === "final") {
          await update(ref(db, `battles/${roomCode}/tournament`), { champion: winner });
        } else {
          // Check if all matches done and advance
          const snapshot = await get(ref(db, `battles/${roomCode}/tournament/${myRound}`));
          const matches: Match[] = Object.values(snapshot.val() || {});
          const allDone = matches.every(m => m.status === "finished");
          if (allDone) {
            const winners = matches.map(m => m.winner).filter(Boolean) as string[];
            if (myRound === "bracket" && winners.length >= 2) {
              const semifinals: Match[] = [];
              for (let i = 0; i < winners.length; i += 2) {
                if (winners[i + 1]) {
                  semifinals.push({
                    players: [winners[i], winners[i + 1]],
                    scores: { [winners[i]]: 0, [winners[i + 1]]: 0 },
                    status: "waiting",
                  });
                }
              }
              await update(ref(db, `battles/${roomCode}/tournament`), {
                semifinals, round: 2
              });
            } else if (myRound === "semifinals" && winners.length >= 2) {
              await update(ref(db, `battles/${roomCode}/tournament`), {
                final: {
                  players: [winners[0], winners[1]],
                  scores: { [winners[0]]: 0, [winners[1]]: 0 },
                  status: "waiting",
                },
                round: 3
              });
            }
          }
        }
      } else {
        await update(ref(db, `battles/${roomCode}`), { status: "finished" });
      }
      return;
    }

    setCurrentIndex(nextIndex);
    setSelected(null);
    setTimeLeft(35);
    setAnswerTime(35);
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

   const sendChat = async () => {
  if (!chatMessage.trim() || !roomCode) return;
  const id = generateCode();
  await update(ref(db, `battles/${roomCode}/chat/${id}`), {
    name: playerName,
    text: chatMessage.trim(),
    time: Date.now(),
  });
  setChatMessage("");
};

const exitRoom = async () => {
  if (!confirm("Are you sure you want to exit?")) return;
  if (room?.host === playerId) {
    await update(ref(db, `battles/${roomCode}`), { status: "finished" });
  } else {
    const updatedPlayers = { ...room?.players };
    delete updatedPlayers[playerId];
    await update(ref(db, `battles/${roomCode}`), { players: updatedPlayers });
  }
  setScreen("lobby");
  setRoomCode("");
  setRoom(null);
};

const removePlayer = async (pid: string) => {
  if (room?.host !== playerId) return;
  if (!confirm(`Remove ${room?.players[pid]?.name}?`)) return;
  const updatedPlayers = { ...room?.players };
  delete updatedPlayers[pid];
  await update(ref(db, `battles/${roomCode}`), { players: updatedPlayers });
};

  const sendReaction = async (emoji: string) => {
    if (!roomCode || !playerName) return;
    const id = generateCode();
    await update(ref(db, `battles/${roomCode}/reactions/${id}`), {
      emoji, name: playerName, time: Date.now(),
    });
  };

  const rematch = async () => {
    if (!room) return;
    if (room.host !== playerId) {
      alert("Only the host can start a rematch!");
      return;
    }

    let questions: any[] = [];
      try {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(room.subject)}`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          questions = data.data.slice(0, 30);
          await saveQuestions(room.subject, data.data);
        }
      } catch {
        // API failed - use cached
      }
      if (questions.length === 0) {
        const cached = await getQuestions(room.subject);
        if (cached && cached.length > 0) {
          questions = cached.slice(0, 30);
        } else {
          alert("No questions available!");
          return;
        }
      }
    const resetPlayers: any = {};
    Object.keys(room.players).forEach((pid) => {
      resetPlayers[pid] = { ...room.players[pid], score: 0, answered: 0, streak: 0 };
    });
    await update(ref(db, `battles/${roomCode}`), {
      status: "waiting", questions, reactions: {}, players: resetPlayers,
      tournament: room.mode === "tournament" ? {
        bracket: [], semifinals: [], final: null, champion: null, round: 1
      } : null,
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

    const getPlayerName = (pid: string) => room?.players[pid]?.name || "Unknown";
 
   
   // LOBBY
  if (screen === "lobby") return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto">
      <div className={`bg-gradient-to-br ${mode === "tournament" ? "bg-gray-900" : "bg-gray-900"} p-6 rounded-b-3xl mb-6`}>
        <a href="/" className="text-white text-sm block mb-2">← Home</a>
        <h1 className="text-white text-2xl font-bold">
          {mode === "tournament" ? "🏆 Tournament" : "⚔️ Quiz Battle"}
        </h1>
        <p className="text-white text-opacity-80 text-sm">
          {mode === "tournament" ? "Elimination rounds — one champion!" : "Challenge friends in real time!"}
        </p>
      </div>
      <div className="px-4">
        {/* Mode selector */}
        <div className="rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Game Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("casual")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "casual" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}`}
            >
              ⚔️ Casual Battle
            </button>
            <button
              onClick={() => setMode("tournament")}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "tournament" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-400"}`}
            >
              🏆 Tournament
            </button>
          </div>
          {mode === "tournament" && (
            <div className="mt-3 bg-yellow-50 rounded-xl p-3">
              <p className="text-yellow-700 text-xs font-medium">4-8 players · Elimination rounds · One champion crowned!</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Your Name</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border border-gray-700 rounded-xl bg-gray-700 text-white px-4 py-3 outline-none text-white"
          />
        </div>

        <div className="rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-gray-700 font-semibold mb-2">Select Subject</p>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-700 rounded-xl bg-gray-700 text-white px-4 py-3 outline-none text-gray-700 mb-3"
          >
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={createRoom}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-50 text-white ${mode === "tournament" ? "bg-yellow-500" : "bg-green-600"}`}
          >
            {loading ? "Creating..." : mode === "tournament" ? "🏆 Create Tournament" : "⚔️ Create Battle Room"}
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <p className="text-gray-700 font-semibold mb-2">Join a Room</p>
          <input
            type="text"
            placeholder="Enter room code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-700 rounded-xl bg-gray-700 text-white px-4 py-3 outline-none text-gray-700 mb-3 text-center text-2xl font-bold tracking-widest"
            maxLength={5}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Joining..." : "🚀 Join Room"}
          </button>
        </div>
      </div>
    </div>
  );

  // WAITING
  if (screen === "waiting") return (
    <div className={`min-h-screen bg-gradient-to-br ${room?.mode === "tournament" ? "bg-gray-900" : "bg-gray-900"} font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6`}>
      <h2 className="text-white text-2xl font-bold mb-2">
        {room?.mode === "tournament" ? "🏆 Tournament Lobby" : "⚔️ Battle Lobby"}
      </h2>
      <p className="text-white text-opacity-80 mb-6">Share this code with friends</p>
      <div className="rounded-3xl px-10 py-6 mb-8 text-center">
        <p className="text-gray-400 text-sm mb-1">Room Code</p>
        <p className="text-white text-5xl font-bold tracking-widest">{roomCode}</p>
      </div>
      <div className="w-full bg-white bg-opacity-10 rounded-2xl p-4 mb-6">
        <p className="text-white font-semibold mb-3">
          Players ({Object.keys(room?.players || {}).length}/{room?.maxPlayers || 4})
          {room?.mode === "tournament" && <span className="text-xs ml-2 text-yellow-200">Min 4 to start</span>}
        </p>

        {getPlayers().map((p) => (
  <div key={p.id} className="flex items-center gap-3 mb-2">
    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-sm">
      {p.name[0].toUpperCase()}
    </div>
    <p className="text-white font-medium flex-1">{p.name}</p>
    {room?.host === p.id && <span className="text-yellow-300 text-xs">👑 Host</span>}
    {room?.host === playerId && p.id !== playerId && (
      <button onClick={() => removePlayer(p.id)} className="text-red-300 text-xs bg-red-500 bg-opacity-30 px-2 py-1 rounded-lg">
        Remove
      </button>
    )}
  </div>
 ))}

      </div>
       {room?.host === playerId ? (
        <button onClick={startGame} className="w-full bg-white text-purple-700 py-4 rounded-2xl font-bold text-lg mb-3">
          🎮 Start {room?.mode === "tournament" ? "Tournament" : "Game"}!
        </button>
      ) : (
        <p className="text-white text-opacity-80 text-sm">Waiting for host to start...</p>
      )}
    </div>
  );

  // INTRO SCREEN
  if (showIntro && room) {
    const introPlayers = room.mode === "tournament" && myMatch
      ? myMatch.players.map(pid => ({ id: pid, name: room.players[pid]?.name || "?" }))
      : getPlayers();
    const p = introPlayers[introIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6">
        {room.mode === "tournament" && (
          <p className="text-yellow-400 text-sm mb-2 font-bold uppercase tracking-widest">
            {myRound === "bracket" ? "🥊 Round 1" : myRound === "semifinals" ? "⚡ Semi Finals" : "🏆 Grand Final"}
          </p>
        )}
        <p className="text-purple-300 text-sm mb-4 uppercase tracking-widest">
          Player {introIndex + 1} of {introPlayers.length}
        </p>
        <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-6xl mb-6 animate-bounce">
          {p?.name[0].toUpperCase()}
        </div>
        <h1 className="text-white text-4xl font-bold text-center mb-2">{p?.name}</h1>
        <p className="text-yellow-400 text-lg font-semibold">⚔️ Ready to Battle!</p>
        <div className="flex gap-2 mt-8">
          {introPlayers.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i === introIndex ? "bg-yellow-400" : "bg-white bg-opacity-30"}`} />
          ))}
        </div>
      </div>
    );
  }

  // BRACKET SCREEN (tournament only)
  if (screen === "bracket" && room?.mode === "tournament" && room.tournament) {
    const t = room.tournament;
    const getRoundLabel = () => {
      if (t.round === 1) return "🥊 Round 1";
      if (t.round === 2) return "⚡ Semi Finals";
      return "🏆 Grand Final";
    };

    const allMatches = [
      ...( t.bracket || []).map((m, i) => ({ ...m, roundKey: "bracket", idx: i, label: "Round 1" })),
      ...( t.semifinals || []).map((m, i) => ({ ...m, roundKey: "semifinals", idx: i, label: "Semi Final" })),
      ...(t.final ? [{ ...t.final, roundKey: "final", idx: 0, label: "Grand Final" }] : []),
    ];

    return (
      <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto pb-10">
        <div className="bg-gradient-to-br bg-gray-900 p-4 rounded-b-3xl mb-4">
          <h1 className="text-white text-xl font-bold">{getRoundLabel()}</h1>
          <p className="text-yellow-100 text-sm">{room.subject} Tournament</p>
        </div>
        <div className="px-4">
          {allMatches.map((match, i) => {
            const isMyMatch = match.players?.includes(playerId);
            return (
              <div key={i} className={`rounded-2xl p-4 mb-3 shadow-sm border-l-4 ${isMyMatch ? "border-yellow-400" : "border-transparent"}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">{match.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    match.status === "waiting" ? "bg-gray-100 text-gray-500" :
                    match.status === "playing" ? "bg-green-100 text-green-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    {match.status === "waiting" ? "⏳ Waiting" : match.status === "playing" ? "🎮 Live" : "✓ Done"}
                  </span>
                </div>
                {match.players?.map((pid: string) => (
                  <div key={pid} className={`flex justify-between items-center py-2 px-3 rounded-xl mb-1 ${match.winner === pid ? "bg-yellow-50 border border-yellow-300" : "bg-gray-50"}`}>
                    <p className={`font-medium ${match.winner === pid ? "text-yellow-600" : "text-white"}`}>
                      {match.winner === pid ? "🥇 " : ""}{getPlayerName(pid)}{pid === playerId ? " (You)" : ""}
                    </p>
                    <p className="font-bold text-white">{match.scores?.[pid] || 0} pts</p>
                  </div>
                ))}
                {isMyMatch && match.status === "waiting" && match.players[0] === playerId && (
                  <button onClick={startMyMatch} className="w-full mt-2 bg-yellow-400 text-gray-900 py-2 rounded-xl font-bold text-sm">
                    ⚔️ Start My Match
                  </button>
                )}
                {isMyMatch && match.status === "waiting" && match.players[0] !== playerId && (
                  <p className="text-center text-gray-400 text-xs mt-2">Waiting for opponent to start...</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // PLAYING
  if (screen === "playing" && room) {
    const q = room.questions[currentIndex];
    const options = ["a", "b", "c", "d"] as const;
    const opponent = room.mode === "tournament" && myMatch
      ? myMatch.players.find(p => p !== playerId)
      : null;

    return (
      <div className="min-h-screen font-sans max-w-md mx-auto pb-10 relative" style={{background:"#0e1117"}}>
        {showStreak && (
          <div className="fixed top-20 left-0 right-0 flex justify-center z-50">
            <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-2xl font-bold text-lg shadow-xl animate-bounce">
              🔥 {streakCount}x Streak! Bonus points!
            </div>
          </div>
        )}

        <div className="fixed top-32 left-4 z-40 flex flex-col gap-2">
          {visibleReactions.map((r) => (
            <div key={r.id} className="rounded-xl px-3 py-1.5 flex items-center gap-2 animate-bounce" style={{background:"#1e2533"}}>
              <span className="text-xl">{r.emoji}</span>
              <span className="text-gray-300 text-xs">{r.name}</span>
            </div>
          ))}
        </div>

        <div className="p-4 sticky top-0 z-10" style={{background:"#13171f",borderBottom:"1px solid #1e2533"}}>
          <div className="flex justify-between items-center mb-2">
            <div>
              {room.mode === "tournament" && (
                <p className="text-yellow-100 text-xs">
                  {myRound === "bracket" ? "🥊 Round 1" : myRound === "semifinals" ? "⚡ Semi Finals" : "🏆 Grand Final"}
                </p>
              )}
              <p className="text-white font-bold">Q {currentIndex + 1}/{room.questions.length}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${timeLeft <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-[#1e2533] text-white"}`}>
              {timeLeft}
            </div>
          </div>

          <div className="w-full rounded-full h-2 mb-2" style={{background:"#1e2533"}}>
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / room.questions.length) * 100}%` }}
            />
          </div>

          {/* VS bar for tournament */}
          {room.mode === "tournament" && myMatch && opponent ? (
            <div className="flex items-center gap-2 rounded-xl p-2 mt-2" style={{background:"#1e2533"}}>
              <div className="flex-1 text-center">
                <p className="text-white text-xs">You</p>
                <p className="text-yellow-300 text-lg font-bold">{myMatch.scores?.[playerId] || 0}</p>
              </div>
              <p className="text-white font-bold text-lg">VS</p>
              <div className="flex-1 text-center">
                <p className="text-white text-xs">{getPlayerName(opponent)}</p>
                <p className="text-yellow-300 text-lg font-bold">{myMatch.scores?.[opponent] || 0}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto mt-2">
              {getPlayers().map((p, i) => (
                <div key={p.id} className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 ${p.id === playerId ? "bg-yellow-500" : "bg-[#1e2533]"}`}>
                  <span className="text-xs">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
                  <span className={`text-xs font-medium ${p.id === playerId ? "text-gray-900" : "text-white"}`}>{p.name.split(" ")[0]}</span>
                  <span className={`text-xs font-bold ${p.id === playerId ? "text-gray-900" : "text-green-400"}`}>{p.score}</span>
                  {(p.streak || 0) >= 2 && <span className="text-xs">🔥{p.streak}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={useFiftyFifty}
              disabled={fiftyUsed || !!selected}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${fiftyUsed ? "bg-gray-800 text-gray-600" : "bg-indigo-900 text-indigo-300"}`}
            >
              {fiftyUsed ? "✓ Used" : "⚡ 50/50"}
            </button>
            <div className="flex gap-1">
              {EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{background:"#1e2533"}}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question }} />
          </div>

          <div className="flex flex-col gap-3 mb-4">
            {options.map((opt) => {
              if (hiddenOptions.includes(opt)) return null;
              let style = "bg-gray-800 border-2 border-[#1e2533]";
              if (selected) {
                if (opt === q.answer) style = "bg-green-900 border-2 border-green-500";
                else if (opt === selected) style = "bg-red-900 border-2 border-red-500";
                else style = "bg-gray-900 border-2 border-[#1e2533] opacity-40";
              }
              return (
                <div key={opt} onClick={() => handleAnswer(opt)} className={`${style} rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all shadow-sm`}>
                  <div className="w-8 h-8 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {opt.toUpperCase()}
                  </div>
                  <p className="text-white" dangerouslySetInnerHTML={{ __html: q.option[opt] }} />
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="mb-4">
              <div className={`rounded-2xl p-3 mb-3 text-center ${selected === room.questions[currentIndex].answer ? "bg-green-900" : "bg-red-900"}`}>
                <p className={`font-bold ${selected === room.questions[currentIndex].answer ? "text-green-300" : "text-red-300"}`}>
                  {selected === room.questions[currentIndex].answer
                    ? `✓ Correct! +${1 + Math.floor(timeLeft / 3)} pts`
                    : "✗ Wrong!"}
                </p>
              </div>
              <button onClick={handleNextQuestion} className={`w-full ${room.mode === "tournament" ? "bg-orange-500" : "bg-green-600"} text-white py-4 rounded-2xl font-bold text-lg`}>
                Next →
              </button>
            </div>
             )}
        </div>

          {/* Floating Calculator */}

          <button
            onClick={() => setShowCalc(!showCalc)}
            className="fixed bottom-20 right-4 bg-green-500 text-white rounded-2xl shadow-lg z-50 flex flex-col items-center justify-center px-3 py-2 gap-0.5"
          >
            <span className="text-xl">🧮</span>
            <span className="text-white text-xs font-bold">Calc</span>
          </button>

          {/* Chat Button */}
          <div className="fixed bottom-36 right-4 z-50">
            <button
              onClick={() => {
                setShowChat(!showChat);
                setUnreadCount(0);
                setLastSeenCount(messages.length);
              }}
              style={{
                background: showChat ? "#7c3aed" : "#18181b",
                border: "1px solid #27272a",
                boxShadow: showChat ? "0 0 20px rgba(124,58,237,0.4)" : "0 4px 24px rgba(0,0,0,0.6)",
                transition: "all 0.2s ease",
              }}
              className="relative rounded-2xl flex flex-col items-center justify-center px-3 py-2 gap-0.5"
            >
              <span className="text-xl">💬</span>
              <span className="text-white text-xs font-bold">Chat</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-bounce shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
            
          {/* Calculator Popup */}
          {showCalc && (
            <div className="fixed bottom-36 right-4 rounded-2xl shadow-2xl p-4 z-50 w-72">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-white">Calculator</p>
                <button onClick={() => setShowCalc(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 mb-3">
                <p className="text-gray-400 text-xs text-right">{calcExpression || " "}</p>
                <p className="text-white text-2xl text-right font-light">{calcDisplay}</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ["AC", () => calcClear(), "bg-red-100 text-red-600"],
                  ["⌫", () => calcBack(), "bg-orange-100 text-orange-600"],
                  ["%", () => { const n = parseFloat(calcDisplay)/100; setCalcDisplay(String(n)); setCalcExpression(String(n)); }, "bg-gray-100 text-gray-400"],
                  ["÷", () => calcOperator("/"), "bg-orange-400 text-white"],
                  ["7", () => calcNumber("7"), "bg-gray-50 text-white"],
                  ["8", () => calcNumber("8"), "bg-gray-50 text-white"],
                  ["9", () => calcNumber("9"), "bg-gray-50 text-white"],
                  ["×", () => calcOperator("*"), "bg-orange-400 text-white"],
                  ["4", () => calcNumber("4"), "bg-gray-50 text-white"],
                  ["5", () => calcNumber("5"), "bg-gray-50 text-white"],
                  ["6", () => calcNumber("6"), "bg-gray-50 text-white"],
                  ["−", () => calcOperator("-"), "bg-orange-400 text-white"],
                  ["1", () => calcNumber("1"), "bg-gray-50 text-white"],
                  ["2", () => calcNumber("2"), "bg-gray-50 text-white"],
                  ["3", () => calcNumber("3"), "bg-gray-50 text-white"],
                  ["+", () => calcOperator("+"), "bg-orange-400 text-white"],
                  ["0", () => calcNumber("0"), "bg-gray-50 text-white col-span-2"],
                  [".", () => { if (!calcDisplay.includes(".")) { setCalcDisplay(calcDisplay+"."); setCalcExpression(calcExpression+"."); }}, "bg-gray-50 text-white"],
                  ["=", () => calcEquals(), "bg-green-500 text-white"],
                ].map(([label, onClick, style]) => (
                  <button
                    key={String(label)}
                    onClick={onClick as () => void}
                    className={`${style} h-10 rounded-xl text-sm font-semibold active:scale-95 transition-all`}
                  >
                    {String(label)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Popup - Whop Style */}
          {showChat && (
            <div
              className="fixed bottom-48 right-4 z-50 flex flex-col rounded-2xl overflow-hidden"
              style={{
                width: "300px",
                height: "360px",
                background: "#09090b",
                border: "1px solid #27272a",
                boxShadow: "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ade80" }} />
                  <p className="font-bold text-sm" style={{ color: "#fafafa", letterSpacing: "-0.01em" }}>Live Chat</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#1f1f23", color: "#71717a" }}>
                    {messages.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#1f1f23", color: "#71717a" }}
                >✕</button>
              </div>
              <div
                className="flex-1 overflow-y-auto flex flex-col gap-3 px-3 py-3"
                style={{ background: "#09090b", scrollbarWidth: "none" }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#18181b" }}>💬</div>
                    <p className="text-xs font-medium" style={{ color: "#52525b" }}>No messages yet</p>
                    <p className="text-xs" style={{ color: "#3f3f46" }}>Be the first to say something!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.name === playerName;
                    return (
                      <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <p className="text-xs mb-1 px-1 font-semibold" style={{ color: isMe ? "#a78bfa" : "#71717a" }}>
                          {isMe ? "You" : msg.name}
                        </p>
                        <div
                          className="px-3 py-2 rounded-2xl text-sm max-w-[210px] leading-snug"
                          style={isMe ? {
                            background: "#7c3aed",
                            color: "#fff",
                            borderBottomRightRadius: "4px",
                            boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
                          } : {
                            background: "#18181b",
                            color: "#e4e4e7",
                            border: "1px solid #27272a",
                            borderBottomLeftRadius: "4px",
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                style={{ background: "#111113", borderTop: "1px solid #1f1f23" }}
              >
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Send a message..."
                  className="flex-1 text-sm outline-none rounded-xl px-3 py-2"
                  style={{ background: "#18181b", border: "1px solid #27272a", color: "#fafafa", caretColor: "#7c3aed" }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatMessage.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30"
                  style={{ background: "#7c3aed", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.name === playerName ? "items-end" : "items-start"}`}>
                    <p className="text-gray-400 text-xs mb-0.5">{msg.name}</p>
                    <div className={`px-3 py-2 rounded-xl text-sm max-w-48 ${msg.name === playerName ? "bg-purple-500 text-white" : "bg-gray-100 text-white"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-700 rounded-xl bg-gray-700 text-white px-3 py-2 text-sm outline-none"
                />
                <button onClick={sendChat} className="bg-purple-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                  Send
                </button>
              </div>
            </div>
          )}
      </div>
    );
   }

  // FINISHED
  if (screen === "finished") {
    const champion = room?.mode === "tournament" && room.tournament?.champion
      ? room.players[room.tournament.champion]
      : null;
    const players = getPlayers();

    return (
      <div className={`min-h-screen bg-gradient-to-br ${room?.mode === "tournament" ? "bg-gray-900" : "bg-gray-900"} font-sans max-w-md mx-auto flex flex-col items-center justify-center px-6`}>
        {room?.mode === "tournament" ? (
          <>
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-white text-3xl font-bold mb-2">Tournament Over!</h1>
            <p className="text-yellow-100 mb-6">We have a champion!</p>
            <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 w-full text-center mb-6">
              <p className="text-gray-400 text-sm mb-2">👑 Tournament Champion</p>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                {champion?.name[0].toUpperCase()}
              </div>
              <h2 className="text-white text-2xl font-bold">{champion?.name}</h2>
              {room.tournament?.champion === playerId && (
                <div className="mt-3 bg-yellow-50 rounded-xl p-3">
                  <p className="text-yellow-600 font-bold">🎉 That's you! Congratulations!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-white text-3xl font-bold mb-2">🏆 Battle Over!</h1>
            <p className="text-purple-200 mb-6">Final Rankings</p>
            <div className="w-full flex flex-col gap-3 mb-6">
              {players.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-4 rounded-2xl p-4 ${p.id === playerId ? "border-2 border-yellow-300" : ""} ${i === 0 ? "bg-yellow-400" : "bg-white bg-opacity-20"}`}>
                  <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>
                      {p.name} {p.id === playerId ? "(You)" : ""}
                    </p>
                    <p className={`text-xs ${i === 0 ? "text-white" : "text-purple-200"}`}>
                      {p.answered} answered · 🔥 streak: {p.streak}
                    </p>
                      </div>
                  <p className={`text-2xl font-bold ${i === 0 ? "text-gray-900" : "text-white"}`}>{p.score} pts</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 w-full mb-4">
          <button onClick={shareResult} className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold">
            📲 Share
          </button>
          <button
            onClick={rematch}
            className="flex-1 bg-white text-purple-700 py-3 rounded-2xl font-bold"
          >
            🔄 Rematch
          </button>
        </div>
        <a href="/" className="w-full bg-white bg-opacity-20 text-white py-3 rounded-2xl font-bold text-center">
          🏠 Go Home
        </a>
      </div>
    );
  }
 
 return null;
}

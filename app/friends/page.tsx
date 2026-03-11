"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, update, remove, get, set } from "firebase/database";
import FriendRequestAnimation from "@/components/FriendRequestAnimation";

interface FriendRequest {
  uid: string;
  name: string;
  avatar: string;
  username: string;
  timestamp: number;
}

interface Friend {
  uid: string;
  name: string;
  avatar: string;
  username: string;
  online: boolean;
  lastSeen?: number;
}

interface BattleInvite {
  roomCode: string;
  fromName: string;
  fromUid: string;
  subject: string;
  timestamp: number;
}

export default function Friends() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "find">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [animation, setAnimation] = useState<{ name: string; avatar: string } | null>(null);
  const [battleInvite, setBattleInvite] = useState<BattleInvite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);

      // Set online status
      await update(ref(db, `users/${u.uid}`), {
        online: true,
        lastSeen: Date.now(),
      });

      // Get profile
      const profileSnap = await get(ref(db, `users/${u.uid}/profile`));
      if (profileSnap.val()) setProfile(profileSnap.val());

      setLoading(false);

      // Listen to friend requests
      onValue(ref(db, `friendRequests/${u.uid}`), (snap) => {
        const data = snap.val() || {};
        const reqs: FriendRequest[] = Object.entries(data).map(([uid, val]: any) => ({
          uid, ...val
        }));
        setRequests(reqs.sort((a, b) => b.timestamp - a.timestamp));
      });

      // Listen to friends list
      onValue(ref(db, `friends/${u.uid}`), (snap) => {
        const data = snap.val() || {};
        const friendUids = Object.keys(data);
        if (friendUids.length === 0) { setFriends([]); return; }

        // Get online status for each friend
        const friendList: Friend[] = [];
        let loaded = 0;
        friendUids.forEach((fuid) => {
          get(ref(db, `users/${fuid}`)).then((fsnap) => {
            const fdata = fsnap.val() || {};
            friendList.push({
              uid: fuid,
              name: data[fuid].name,
              avatar: data[fuid].avatar || "🎓",
              username: data[fuid].username || "",
              online: fdata.online === true,
              lastSeen: fdata.lastSeen,
            });
            loaded++;
            if (loaded === friendUids.length) {
              setFriends(friendList.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0)));
            }
          });
        });
      });

      // Listen for battle invites
      onValue(ref(db, `battleInvites/${u.uid}`), (snap) => {
        const data = snap.val();
        if (data) setBattleInvite(data);
        else setBattleInvite(null);
      });

      // Set offline on disconnect
      window.addEventListener("beforeunload", () => {
        update(ref(db, `users/${u.uid}`), { online: false, lastSeen: Date.now() });
      });
    });
    return () => unsub();
  }, []);

  const searchUser = async () => {
    if (!searchUsername.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const snap = await get(ref(db, "users"));
      const allUsers = snap.val() || {};
      const found = Object.entries(allUsers).find(([uid, data]: any) =>
        data.username?.toLowerCase() === searchUsername.trim().toLowerCase() && uid !== user.uid
      );
      if (found) {
        const [uid, data]: any = found;
        setSearchResult({ uid, ...data });
      } else {
        setSearchError("No user found with that username!");
      }
    } catch {
      setSearchError("Search failed. Try again!");
    }
    setSearchLoading(false);
  };

  const sendRequest = async (toUid: string, toData: any) => {
    if (!user || !profile) return;
    await set(ref(db, `friendRequests/${toUid}/${user.uid}`), {
      name: profile.name || user.displayName || "Student",
      avatar: profile.avatar || "🎓",
      username: profile.username || "",
      timestamp: Date.now(),
    });
    alert("Friend request sent! 🎮");
    setSearchResult(null);
    setSearchUsername("");
  };

  const acceptRequest = async (req: FriendRequest) => {
    if (!user || !profile) return;
    // Add to both friends lists
    await set(ref(db, `friends/${user.uid}/${req.uid}`), {
      name: req.name,
      avatar: req.avatar,
      username: req.username,
      addedAt: Date.now(),
    });
    await set(ref(db, `friends/${req.uid}/${user.uid}`), {
      name: profile.name || user.displayName || "Student",
      avatar: profile.avatar || "🎓",
      username: profile.username || "",
      addedAt: Date.now(),
    });
    // Remove request
    await remove(ref(db, `friendRequests/${user.uid}/${req.uid}`));
    // Show animation
    setAnimation({ name: req.name, avatar: req.avatar });
  };

  const declineRequest = async (req: FriendRequest) => {
    await remove(ref(db, `friendRequests/${user.uid}/${req.uid}`));
  };

  const removeFriend = async (friendUid: string) => {
    if (!confirm("Remove this friend?")) return;
    await remove(ref(db, `friends/${user.uid}/${friendUid}`));
    await remove(ref(db, `friends/${friendUid}/${user.uid}`));
  };

  const inviteToBattle = async (friend: Friend) => {
    if (!user || !profile) return;
    // Create a battle room first, then invite
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    await set(ref(db, `battleInvites/${friend.uid}`), {
      roomCode: code,
      fromName: profile.name || user.displayName || "Student",
      fromUid: user.uid,
      subject: "Use of English",
      timestamp: Date.now(),
    });
    alert(`Battle invite sent to ${friend.name}! Room: ${code}`);
  };

  const acceptBattleInvite = async () => {
    if (!battleInvite || !user) return;
    await remove(ref(db, `battleInvites/${user.uid}`));
    router.push(`/battle?invite=${battleInvite.roomCode}&name=${profile?.name || "Student"}`);
  };

  const declineBattleInvite = async () => {
    if (!user) return;
    await remove(ref(db, `battleInvites/${user.uid}`));
    setBattleInvite(null);
  };

  const onlineFriends = friends.filter((f) => f.online);
  const offlineFriends = friends.filter((f) => !f.online);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e1117" }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">👥</div>
        <p className="text-white font-bold">Loading Friends...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>
      {/* Animation overlay */}
      {animation && (
        <FriendRequestAnimation
          name={animation.name}
          avatar={animation.avatar}
          onDone={() => setAnimation(null)}
        />
      )}

      {/* Battle Invite popup */}
      {battleInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full rounded-3xl p-6 text-center" style={{ background: "#13171f", border: "1px solid #4ade80" }}>
            <div className="text-5xl mb-3 animate-bounce">⚔️</div>
            <p className="text-white font-black text-xl mb-1">Battle Invite!</p>
            <p className="text-green-400 font-bold mb-1">{battleInvite.fromName}</p>
            <p className="text-gray-400 text-sm mb-4">is challenging you to a battle!</p>
            <p className="text-xs mb-5" style={{ color: "#6b7280" }}>Room: {battleInvite.roomCode} • {battleInvite.subject}</p>
            <div className="flex gap-3">
              <button onClick={declineBattleInvite}
                className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: "#450a0a", color: "#f87171" }}>
                ✗ Decline
              </button>
              <button onClick={acceptBattleInvite}
                className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: "#14532d", color: "#4ade80" }}>
                ⚔️ Accept!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4" style={{ borderBottom: "1px solid #1e2533" }}>
        <button onClick={() => router.push("/")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "#1e2533" }}>←</button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">👥 Friends</h1>
          <p className="text-xs" style={{ color: "#4ade80" }}>{onlineFriends.length} online</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color: "#6b7280" }}>Your ID</p>
          <p className="text-xs font-bold text-white">@{profile?.username || "set username"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid #1e2533" }}>
        {[
          { id: "friends", label: `Friends (${friends.length})` },
          { id: "requests", label: `Requests${requests.length > 0 ? ` (${requests.length})` : ""}` },
          { id: "find", label: "Find" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 py-3 text-xs font-bold transition-all"
            style={{ color: activeTab === tab.id ? "#4ade80" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #4ade80" : "2px solid transparent" }}>
            {tab.label}
            {tab.id === "requests" && requests.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs inline-flex items-center justify-center">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-white font-bold mb-1">No friends yet!</p>
                <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Search by username to add friends</p>
                <button onClick={() => setActiveTab("find")}
                  className="px-6 py-3 rounded-2xl font-bold text-white" style={{ background: "#16a34a" }}>
                  Find Friends
                </button>
              </div>
            ) : (
              <div>
                {onlineFriends.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#4ade80" }}>🟢 Online Now</p>
                    <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
                      {onlineFriends.map((friend, i) => (
                        <div key={friend.uid} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderBottom: i < onlineFriends.length - 1 ? "1px solid #1e2533" : "none" }}>
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#1e2533" }}>
                              {friend.avatar}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-gray-900" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">{friend.name}</p>
                            <p className="text-xs" style={{ color: "#4ade80" }}>● Online</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => inviteToBattle(friend)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "#14532d", color: "#4ade80" }}>
                              ⚔️ Battle
                            </button>
                            <button onClick={() => removeFriend(friend.uid)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "#1e2533", color: "#6b7280" }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {offlineFriends.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>⚫ Offline</p>
                    <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
                      {offlineFriends.map((friend, i) => (
                        <div key={friend.uid} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderBottom: i < offlineFriends.length - 1 ? "1px solid #1e2533" : "none", opacity: 0.7 }}>
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#1e2533" }}>
                              {friend.avatar}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-gray-600 border-2 border-gray-900" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">{friend.name}</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>
                              Last seen {friend.lastSeen ? new Date(friend.lastSeen).toLocaleDateString() : "a while ago"}
                            </p>
                          </div>
                          <button onClick={() => removeFriend(friend.uid)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "#1e2533", color: "#6b7280" }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div>
            {requests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-white font-bold mb-1">No friend requests</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>Share your username with friends</p>
                <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                  <p className="text-xs mb-1" style={{ color: "#6b7280" }}>Your username</p>
                  <p className="text-white font-bold">@{profile?.username || "not set — go to Settings"}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
                {requests.map((req, i) => (
                  <div key={req.uid} className="px-4 py-4" style={{ borderBottom: i < requests.length - 1 ? "1px solid #1e2533" : "none" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#1e2533" }}>
                        {req.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{req.name}</p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>@{req.username} • wants to be friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => declineRequest(req)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "#450a0a", color: "#f87171" }}>
                        ✗ Decline
                      </button>
                      <button onClick={() => acceptRequest(req)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "#14532d", color: "#4ade80" }}>
                        ✓ Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FIND TAB */}
        {activeTab === "find" && (
          <div>
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
              <p className="text-white font-bold text-sm mb-1">🔍 Find by Username</p>
              <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>Ask your friend for their username and search here</p>
              <div className="flex gap-2">
                <input value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()}
                  placeholder="Enter username..."
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "#1e2533", border: "1px solid #374151" }} />
                <button onClick={searchUser} disabled={searchLoading}
                  className="px-4 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "#16a34a" }}>
                  {searchLoading ? "..." : "Search"}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: "#450a0a" }}>
                <p className="text-red-400 text-sm">{searchError}</p>
              </div>
            )}

            {searchResult && (
              <div className="rounded-2xl p-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "#1e2533" }}>
                    {searchResult.profile?.avatar || "🎓"}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{searchResult.profile?.name || searchResult.username}</p>
<p className="text-xs" style={{ color: "#6b7280" }}>@{searchResult.username}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: searchResult.online ? "#4ade80" : "#374151" }} />
                      <p className="text-xs" style={{ color: searchResult.online ? "#4ade80" : "#6b7280" }}>
                        {searchResult.online ? "Online now" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => sendRequest(searchResult.uid, searchResult)}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "#16a34a" }}>
                  ➕ Send Friend Request
                </button>
              </div>
            )}

            {/* How to share username */}
            <div className="rounded-2xl p-4 mt-4" style={{ background: "#0f1f0f", border: "1px solid #1e3a1e" }}>
              <p className="font-bold text-sm mb-2" style={{ color: "#4ade80" }}>Your Username</p>
              <p className="text-white font-bold text-lg mb-1">@{profile?.username || "not set"}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {profile?.username ? "Share this with friends so they can find you!" : "Go to Settings → Profile to set your username"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

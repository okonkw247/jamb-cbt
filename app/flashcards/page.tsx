"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS: Record<string, { icon: string; color: string; topics: string[] }> = {
  "Use of English": { icon: "📖", color: "#1e3a5f", topics: ["Comprehension", "Figures of Speech", "Synonyms and Antonyms", "Sentence Structure"] },
  "Mathematics": { icon: "🔢", color: "#3b1f1f", topics: ["Algebra", "Geometry", "Statistics", "Trigonometry"] },
  "Physics": { icon: "⚡", color: "#1f2d1f", topics: ["Motion", "Forces", "Waves", "Electricity"] },
  "Biology": { icon: "🧬", color: "#1a2e1a", topics: ["Cell Biology", "Genetics", "Photosynthesis", "Ecology"] },
  "Chemistry": { icon: "🧪", color: "#2a1a2e", topics: ["Atomic Structure", "Chemical Bonding", "Organic Chemistry", "Periodic Table"] },
  "Economics": { icon: "📈", color: "#1a2a2a", topics: ["Demand and Supply", "National Income", "Money and Banking", "International Trade"] },
  "Government": { icon: "🏛️", color: "#1f1f2e", topics: ["Democracy", "Constitution", "Federalism", "Legislature"] },
};

type Flashcard = { front: string; back: string };

export default function Flashcards() {
  const router = useRouter();
  const [step, setStep] = useState<"subject" | "topic" | "cards">("subject");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [known, setKnown] = useState<number[]>([]);
  const [unknown, setUnknown] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const loadCards = async (subject: string, topic: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        setCurrentCard(0);
        setFlipped(false);
        setKnown([]);
        setUnknown([]);
        setDone(false);
        setStep("cards");
      } else {
        setError(data.error || "Failed to load flashcards!");
      }
    } catch {
      setError("Network error. Try again!");
    }
    setLoading(false);
  };

  const handleKnow = () => {
    setKnown([...known, currentCard]);
    next();
  };

  const handleDontKnow = () => {
    setUnknown([...unknown, currentCard]);
    next();
  };

  const next = () => {
    setFlipped(false);
    if (currentCard >= cards.length - 1) {
      setDone(true);
    } else {
      setTimeout(() => setCurrentCard(currentCard + 1), 150);
    }
  };

  const restart = () => {
    setCurrentCard(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
    setDone(false);
  };

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4" style={{ borderBottom: "1px solid #1e2533" }}>
        <button onClick={() => step === "subject" ? router.push("/") : step === "topic" ? setStep("subject") : setStep("topic")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "#1e2533" }}>←</button>
        <div>
          <h1 className="text-white font-bold text-base">🃏 Flashcards</h1>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            {step === "subject" ? "Choose a subject" : step === "topic" ? selectedSubject : `${selectedTopic} • ${cards.length} cards`}
          </p>
        </div>
      </div>

      {/* STEP 1 - Subject */}
      {step === "subject" && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
            <p className="text-white font-bold text-sm mb-1">How Flashcards Work 🃏</p>
            <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>AI generates question and answer cards for your chosen topic. Tap to flip, then mark if you know it or not. Great for memorizing definitions!</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Choose Subject</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SUBJECTS).map(([subject, data]) => (
              <button key={subject} onClick={() => { setSelectedSubject(subject); setStep("topic"); }}
                className="rounded-2xl p-4 text-left" style={{ background: data.color }}>
                <div className="text-3xl mb-2">{data.icon}</div>
                <p className="text-white font-bold text-sm">{subject}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{data.topics.length} topics</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 - Topic */}
      {step === "topic" && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Choose Topic</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#13171f" }}>
            {SUBJECTS[selectedSubject]?.topics.map((topic, i, arr) => (
              <button key={topic} onClick={() => { setSelectedTopic(topic); loadCards(selectedSubject, topic); }}
                className="flex items-center gap-3 px-4 py-4 w-full text-left active:opacity-70"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #1e2533" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#1e2533" }}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-white font-medium text-sm flex-1">{topic}</span>
                <span style={{ color: "#374151" }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 animate-pulse" style={{ background: "#13171f" }}>🃏</div>
          <p className="text-white font-bold text-lg mb-1">Generating Flashcards...</p>
          <p className="text-xs text-center" style={{ color: "#6b7280" }}>AI is creating cards for {selectedTopic}</p>
          <div className="mt-6 w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 text-center py-10">
          <p className="text-white font-bold mb-2">Something went wrong</p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => loadCards(selectedSubject, selectedTopic)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold">Try Again</button>
        </div>
      )}

      {/* CARDS */}
      {step === "cards" && cards.length > 0 && !loading && !done && (
        <div className="px-4 pt-4">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs" style={{ color: "#6b7280" }}>Card {currentCard + 1} of {cards.length}</p>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#14532d", color: "#4ade80" }}>✓ {known.length}</span>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#450a0a", color: "#f87171" }}>✗ {unknown.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mb-6" style={{ background: "#1e2533" }}>
            <div className="h-full rounded-full transition-all" style={{ background: "#4ade80", width: `${((currentCard) / cards.length) * 100}%` }} />
          </div>

          {/* Card */}
          <div onClick={() => setFlipped(!flipped)}
            className="w-full rounded-3xl p-6 mb-4 cursor-pointer active:scale-95 transition-transform min-h-48 flex flex-col items-center justify-center"
            style={{ background: flipped ? "#14532d" : "#13171f", border: `2px solid ${flipped ? "#4ade80" : "#1e2533"}`, minHeight: "220px" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: flipped ? "#86efac" : "#6b7280" }}>
              {flipped ? "ANSWER" : "QUESTION — Tap to reveal"}
            </p>
            <p className="text-white font-bold text-lg text-center leading-relaxed">
              {flipped ? cards[currentCard]?.back : cards[currentCard]?.front}
            </p>
            {!flipped && <p className="text-xs mt-6" style={{ color: "#374151" }}>👆 Tap card to see answer</p>}
          </div>

          {/* Action buttons */}
          {flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleDontKnow}
                className="py-4 rounded-2xl font-bold text-sm" style={{ background: "#450a0a", color: "#f87171" }}>
                ✗ Don't Know
              </button>
              <button onClick={handleKnow}
                className="py-4 rounded-2xl font-bold text-sm" style={{ background: "#14532d", color: "#4ade80" }}>
                ✓ I Know This!
              </button>
            </div>
          ) : (
            <button onClick={() => setFlipped(true)}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white" style={{ background: "#1e2533" }}>
              Reveal Answer 👁
            </button>
          )}
        </div>
      )}

      {/* DONE */}
      {done && (
        <div className="px-4 pt-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-white font-bold text-2xl mb-2">Session Complete!</p>
          <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>{selectedTopic} • {cards.length} cards</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl p-4" style={{ background: "#14532d" }}>
              <p className="font-bold text-2xl" style={{ color: "#4ade80" }}>{known.length}</p>
              <p className="text-xs mt-1" style={{ color: "#86efac" }}>Cards Known ✓</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#450a0a" }}>
              <p className="font-bold text-2xl" style={{ color: "#f87171" }}>{unknown.length}</p>
              <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>Need Review ✗</p>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-6" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
            <p className="text-white font-bold text-sm mb-1">Score: {Math.round((known.length / cards.length) * 100)}%</p>
            <p className="text-xs" style={{ color: known.length >= cards.length * 0.7 ? "#4ade80" : "#f87171" }}>
              {known.length >= cards.length * 0.7 ? "Great job! You're ready to practice 🔥" : "Keep studying! Review the cards you missed."}
            </p>
          </div>

          <button onClick={restart} className="w-full py-4 rounded-2xl font-bold text-white mb-3" style={{ background: "#16a34a" }}>
            🔄 Restart Cards
          </button>
          <a href={`/exam?name=Student&subjects=${encodeURIComponent(selectedSubject)}`}
            className="block w-full py-4 rounded-2xl font-bold text-white" style={{ background: "#1e2533" }}>
            ✅ Practice Exam Now
          </a>
        </div>
      )}
    </div>
  );
}

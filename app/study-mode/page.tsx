"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS: Record<string, { icon: string; color: string; topics: string[] }> = {
  "Use of English": { icon: "📖", color: "from-blue-600 to-blue-800", topics: ["Comprehension", "Summary Writing", "Lexis and Structure", "Oral English", "Figures of Speech", "Synonyms and Antonyms", "Sentence Structure", "Punctuation"] },
  "Mathematics": { icon: "🔢", color: "from-red-600 to-red-800", topics: ["Number and Numeration", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Probability", "Matrices and Determinants"] },
  "Physics": { icon: "⚡", color: "from-yellow-600 to-orange-700", topics: ["Measurements and Units", "Motion", "Forces", "Work Energy and Power", "Waves", "Light", "Electricity", "Magnetism", "Atomic Physics"] },
  "Biology": { icon: "🧬", color: "from-green-600 to-green-800", topics: ["Cell Biology", "Genetics", "Ecology", "Evolution", "Photosynthesis", "Respiration", "Reproduction", "Nutrition", "Excretion"] },
  "Chemistry": { icon: "🧪", color: "from-purple-600 to-purple-800", topics: ["Atomic Structure", "Chemical Bonding", "Acids Bases and Salts", "Electrolysis", "Organic Chemistry", "Reaction Rates", "Equilibrium", "Periodic Table"] },
  "Economics": { icon: "📈", color: "from-teal-600 to-teal-800", topics: ["Demand and Supply", "Market Structures", "National Income", "Money and Banking", "International Trade", "Public Finance", "Population", "Agriculture"] },
  "Government": { icon: "🏛️", color: "from-indigo-600 to-indigo-800", topics: ["Democracy", "Constitution", "Legislature", "Executive", "Judiciary", "Political Parties", "Federalism", "International Organizations"] },
  "Literature": { icon: "📚", color: "from-pink-600 to-pink-800", topics: ["Poetry", "Prose Fiction", "Drama", "Figures of Speech", "Literary Devices", "African Literature", "Oral Literature"] },
  "Geography": { icon: "🌍", color: "from-cyan-600 to-cyan-800", topics: ["Map Reading", "Climate", "Vegetation", "Population", "Agriculture", "Mining", "Rivers and Drainage", "Rocks and Minerals"] },
  "Commerce": { icon: "🏪", color: "from-orange-600 to-orange-800", topics: ["Trade", "Banking", "Insurance", "Transportation", "Advertising", "Warehousing", "Communication", "Business Organizations"] },
  "Accounting": { icon: "🧾", color: "from-lime-600 to-lime-800", topics: ["Double Entry", "Trial Balance", "Balance Sheet", "Income Statement", "Bank Reconciliation", "Depreciation", "Partnership Accounts", "Company Accounts"] },
  "Agriculture": { icon: "🌱", color: "from-emerald-600 to-emerald-800", topics: ["Crop Production", "Animal Husbandry", "Soil Science", "Farm Machinery", "Agricultural Economics", "Pest and Diseases", "Irrigation", "Fish Farming"] },
};

type Notes = {
  title: string;
  overview: string;
  keyPoints: string[];
  definitions: { term: string; meaning: string }[];
  diagrams: { title: string; description: string }[];
  workedExamples: { question: string; answer: string; explanation: string }[];
  examTips: string[];
  commonMistakes: string[];
  videoSearch: string;
  summary: string;
};

export default function StudyMode() {
  const router = useRouter();
  const [step, setStep] = useState<"subject" | "topic" | "notes">("subject");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(0);

  const sections = ["Overview", "Key Points", "Definitions", "Diagrams", "Examples", "Exam Tips", "Mistakes", "Summary"];

  const loadNotes = async (subject: string, topic: string) => {
    setLoading(true);
    setError("");
    setActiveSection(0);
    try {
      const res = await fetch("/api/study-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
        setStep("notes");
      } else {
        setError(data.error || "Failed to load notes. Try again!");
      }
    } catch {
      setError("Network error. Check your connection!");
    }
    setLoading(false);
  };

  const goBack = () => {
    if (step === "notes") { setStep("topic"); setNotes(null); }
    else if (step === "topic") setStep("subject");
    else router.push("/");
  };

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-8 pb-3 flex items-center gap-3"
        style={{ background: "rgba(10,22,40,0.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={goBack} className="w-9 h-9 bg-white bg-opacity-10 rounded-xl flex items-center justify-center text-white flex-shrink-0">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-base font-bold truncate">
            {step === "subject" && "📖 Study Mode"}
            {step === "topic" && `${SUBJECTS[selectedSubject]?.icon} ${selectedSubject}`}
            {step === "notes" && notes?.title}
          </h1>
          <div className="flex items-center gap-1">
            {["Subject", "Topic", "Notes"].map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`text-xs ${
                  (step === "subject" && i === 0) || (step === "topic" && i === 1) || (step === "notes" && i === 2)
                    ? "text-green-400 font-bold" : "text-gray-600"
                }`}>{s}</span>
                {i < 2 && <span className="text-gray-700 text-xs">›</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1 - Pick Subject */}
      {step === "subject" && (
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-4 mb-5">
            <p className="text-white font-bold text-base mb-3">How to use Study Mode 📖</p>
            {[
              "1️⃣ Pick your subject",
              "2️⃣ Choose a topic you want to study",
              "3️⃣ Read detailed AI-generated notes",
              "4️⃣ Practice JAMB questions on ONLY that topic",
            ].map((s) => (
              <p key={s} className="text-blue-100 text-sm mb-1">{s}</p>
            ))}
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Choose Your Subject</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SUBJECTS).map(([subject, data]) => (
              <button key={subject}
                onClick={() => { setSelectedSubject(subject); setStep("topic"); }}
                className={`bg-gradient-to-br ${data.color} rounded-2xl p-4 text-left shadow-lg`}>
                <div className="text-3xl mb-2">{data.icon}</div>
                <p className="text-white font-bold text-sm">{subject}</p>
                <p className="text-white text-opacity-60 text-xs">{data.topics.length} topics</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 - Pick Topic */}
      {step === "topic" && (
        <div className="px-4 pt-4">
          <div className={`bg-gradient-to-br ${SUBJECTS[selectedSubject]?.color} rounded-2xl p-4 mb-4 flex items-center gap-3`}>
            <div className="text-4xl">{SUBJECTS[selectedSubject]?.icon}</div>
            <div>
              <p className="text-white font-bold text-lg">{selectedSubject}</p>
              <p className="text-white text-opacity-70 text-sm">Select a topic to study</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Choose a Topic</p>
          <div className="flex flex-col gap-2">
            {SUBJECTS[selectedSubject]?.topics.map((topic, i) => (
              <button key={topic}
                onClick={() => { setSelectedTopic(topic); loadNotes(selectedSubject, topic); }}
                className="bg-white bg-opacity-5 rounded-2xl px-4 py-4 flex items-center gap-3 border border-white border-opacity-5 text-left w-full active:scale-95 transition-transform">
                <div className="w-8 h-8 bg-white bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-white font-medium text-sm flex-1">{topic}</span>
                <span className="text-gray-500">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-4 flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl mb-5 animate-pulse">🤖</div>
          <p className="text-white font-bold text-xl mb-2">Preparing Your Notes...</p>
          <p className="text-gray-400 text-sm text-center">AI is generating comprehensive</p>
          <p className="text-green-400 font-bold text-center">{selectedTopic} study notes</p>
          <p className="text-gray-500 text-xs text-center mt-2">This may take 10-15 seconds</p>
          <div className="mt-6 w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 text-center py-10">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-bold text-lg mb-2">Something went wrong</p>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button onClick={() => loadNotes(selectedSubject, selectedTopic)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold mr-3">Try Again</button>
          <button onClick={() => setStep("topic")} className="bg-white bg-opacity-10 text-white px-6 py-3 rounded-2xl font-bold">Go Back</button>
        </div>
      )}

      {/* STEP 3 - Notes */}
      {step === "notes" && notes && !loading && (
        <div>
          {/* Section tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {sections.map((s, i) => (
              <button key={s} onClick={() => setActiveSection(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeSection === i ? "bg-green-500 text-white" : "bg-white bg-opacity-10 text-gray-400"
                }`}>
                {s}
              </button>
            ))}
          </div>

          <div className="px-4">
            {/* Overview */}
            {activeSection === 0 && (
              <div>
                <div className={`bg-gradient-to-br ${SUBJECTS[selectedSubject]?.color} rounded-2xl p-5 mb-4`}>
                  <p className="text-white text-opacity-70 text-xs mb-1">{selectedSubject}</p>
                  <h2 className="text-white font-bold text-xl mb-3">{notes.title}</h2>
                  <p className="text-white text-opacity-90 text-sm leading-relaxed">{notes.overview}</p>
                </div>
                {notes.videoSearch && (
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(notes.videoSearch)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-red-600 bg-opacity-20 border border-red-500 border-opacity-30 rounded-2xl p-4 mb-4">
                    <div className="text-3xl">▶️</div>
                    <div>
                      <p className="text-red-300 font-bold text-sm">Watch Video Explanation</p>
                      <p className="text-gray-400 text-xs">{notes.videoSearch}</p>
                    </div>
                    <span className="text-gray-500 ml-auto">→</span>
                  </a>
                )}
                <button onClick={() => setActiveSection(1)}
                  className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm">
                  Continue to Key Points →
                </button>
              </div>
            )}

            {/* Key Points */}
            {activeSection === 1 && (
              <div>
                <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                  <p className="text-green-400 font-bold text-sm mb-1">🔑 Key Points to Master</p>
                  <p className="text-gray-400 text-xs">Read and understand each point carefully</p>
                </div>
                {notes.keyPoints.map((point, i) => (
                  <div key={i} className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5 flex items-start gap-3">
                    <div className="w-7 h-7 bg-green-500 bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
                <button onClick={() => setActiveSection(2)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Definitions →
                </button>
              </div>
            )}

            {/* Definitions */}
            {activeSection === 2 && (
              <div>
                <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                  <p className="text-yellow-400 font-bold text-sm mb-1">📝 Key Definitions</p>
                  <p className="text-gray-400 text-xs">Memorize these — JAMB loves asking definitions!</p>
                </div>
                {notes.definitions?.map((def, i) => (
                  <div key={i} className="bg-yellow-500 bg-opacity-5 rounded-2xl p-4 mb-3 border-l-4 border-yellow-500">
                    <p className="text-yellow-300 font-bold text-sm mb-1">{def.term}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{def.meaning}</p>
                  </div>
                ))}
                <button onClick={() => setActiveSection(3)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Diagrams →
                </button>
              </div>
            )}

            {/* Diagrams */}
            {activeSection === 3 && (
              <div>
                <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                  <p className="text-blue-400 font-bold text-sm mb-1">🖼️ Diagrams & Visuals</p>
                  <p className="text-gray-400 text-xs">Understand the visuals — JAMB includes diagram questions!</p>
                </div>
                {notes.diagrams?.map((diagram, i) => (
                  <div key={i} className="bg-blue-500 bg-opacity-5 rounded-2xl p-4 mb-3 border border-blue-500 border-opacity-20">
<p className="text-blue-300 font-bold text-sm mb-2">📊 {diagram.title}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{diagram.description}</p>
                  </div>
                ))}
                <button onClick={() => setActiveSection(4)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Worked Examples →
                </button>
              </div>
            )}

            {/* Worked Examples */}
            {activeSection === 4 && (
              <div>
                <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                  <p className="text-purple-400 font-bold text-sm mb-1">💡 Worked Examples</p>
                  <p className="text-gray-400 text-xs">Real JAMB-style questions with step by step solutions</p>
                </div>
                {notes.workedExamples?.map((ex, i) => (
                  <div key={i} className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2">Question {i + 1}</p>
                    <p className="text-white text-sm font-medium mb-3">{ex.question}</p>
                    <div className="bg-green-500 bg-opacity-10 rounded-xl p-3 mb-2">
                      <p className="text-green-400 text-xs font-bold mb-1">✅ Answer</p>
                      <p className="text-green-300 text-sm">{ex.answer}</p>
                    </div>
                    <div className="bg-blue-500 bg-opacity-10 rounded-xl p-3">
                      <p className="text-blue-400 text-xs font-bold mb-1">📝 Explanation</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{ex.explanation}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => setActiveSection(5)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Exam Tips →
                </button>
              </div>
            )}

            {/* Exam Tips */}
            {activeSection === 5 && (
              <div>
                <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-2xl p-4 mb-3 border border-orange-700">
                  <p className="text-orange-300 font-bold text-sm mb-1">💡 JAMB Exam Tips</p>
                  <p className="text-orange-200 text-opacity-70 text-xs">What examiners love to ask — don't skip this!</p>
                </div>
                {notes.examTips?.map((tip, i) => (
                  <div key={i} className="bg-orange-500 bg-opacity-5 rounded-2xl p-4 mb-3 border border-orange-500 border-opacity-20 flex items-start gap-3">
                    <span className="text-orange-400 text-lg flex-shrink-0">💡</span>
                    <p className="text-orange-100 text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
                <button onClick={() => setActiveSection(6)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Common Mistakes →
                </button>
              </div>
            )}

            {/* Common Mistakes */}
            {activeSection === 6 && (
              <div>
                <div className="bg-red-500 bg-opacity-10 rounded-2xl p-4 mb-3 border border-red-500 border-opacity-20">
                  <p className="text-red-400 font-bold text-sm mb-1">⚠️ Common Mistakes to Avoid</p>
                  <p className="text-gray-400 text-xs">Most students fail because of these mistakes!</p>
                </div>
                {notes.commonMistakes?.map((mistake, i) => (
                  <div key={i} className="bg-red-500 bg-opacity-5 rounded-2xl p-4 mb-3 border border-red-500 border-opacity-20 flex items-start gap-3">
                    <span className="text-red-400 text-lg flex-shrink-0">❌</span>
                    <p className="text-red-100 text-sm leading-relaxed">{mistake}</p>
                  </div>
                ))}
                <button onClick={() => setActiveSection(7)} className="w-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 text-green-400 py-3 rounded-2xl font-bold text-sm mt-2">
                  Continue to Summary →
                </button>
              </div>
            )}

            {/* Summary + Practice */}
            {activeSection === 7 && (
              <div>
                <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-3 border border-white border-opacity-5">
                  <p className="text-blue-400 font-bold text-sm mb-2">📌 Final Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{notes.summary}</p>
                </div>

                <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-5 mb-3 border border-green-700">
                  <p className="text-white font-bold text-lg mb-1">Ready to test yourself? 🎓</p>
                  <p className="text-green-200 text-sm mb-4">Practice JAMB questions on <span className="font-bold">{selectedTopic}</span> only!</p>
                  <a href={`/exam?name=Student&subjects=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(selectedTopic)}`}
                    className="block bg-white text-green-800 text-center py-4 rounded-2xl font-bold text-base mb-3">
                    ✅ Start Practice Questions →
                  </a>
                  <button onClick={() => { setStep("topic"); setNotes(null); }}
                    className="w-full bg-white bg-opacity-10 text-white py-3 rounded-2xl text-sm font-medium">
                    📖 Study Another Topic
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

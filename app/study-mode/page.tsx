"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS: Record<string, { icon: string; topics: string[] }> = {
  "Use of English": {
    icon: "📖",
    topics: ["Comprehension", "Summary Writing", "Lexis and Structure", "Oral English", "Figures of Speech", "Synonyms and Antonyms", "Sentence Structure", "Punctuation"]
  },
  "Mathematics": {
    icon: "🔢",
    topics: ["Number and Numeration", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics", "Probability", "Matrices and Determinants"]
  },
  "Physics": {
    icon: "⚡",
    topics: ["Measurements and Units", "Motion", "Forces", "Work Energy and Power", "Waves", "Light", "Electricity", "Magnetism", "Atomic Physics"]
  },
  "Biology": {
    icon: "🧬",
    topics: ["Cell Biology", "Genetics", "Ecology", "Evolution", "Photosynthesis", "Respiration", "Reproduction", "Nutrition", "Excretion"]
  },
  "Chemistry": {
    icon: "🧪",
    topics: ["Atomic Structure", "Chemical Bonding", "Acids Bases and Salts", "Electrolysis", "Organic Chemistry", "Reaction Rates", "Equilibrium", "Periodic Table"]
  },
  "Economics": {
    icon: "📈",
    topics: ["Demand and Supply", "Market Structures", "National Income", "Money and Banking", "International Trade", "Public Finance", "Population", "Agriculture"]
  },
  "Government": {
    icon: "🏛️",
    topics: ["Democracy", "Constitution", "Legislature", "Executive", "Judiciary", "Political Parties", "Federalism", "International Organizations"]
  },
  "Literature": {
    icon: "📚",
    topics: ["Poetry", "Prose Fiction", "Drama", "Figures of Speech", "Literary Devices", "African Literature", "Oral Literature"]
  },
  "Geography": {
    icon: "🌍",
    topics: ["Map Reading", "Climate", "Vegetation", "Population", "Agriculture", "Mining", "Rivers and Drainage", "Rocks and Minerals"]
  },
  "Commerce": {
    icon: "🏪",
    topics: ["Trade", "Banking", "Insurance", "Transportation", "Advertising", "Warehousing", "Communication", "Business Organizations"]
  },
  "Accounting": {
    icon: "🧾",
    topics: ["Double Entry", "Trial Balance", "Balance Sheet", "Income Statement", "Bank Reconciliation", "Depreciation", "Partnership Accounts", "Company Accounts"]
  },
  "Agriculture": {
    icon: "🌱",
    topics: ["Crop Production", "Animal Husbandry", "Soil Science", "Farm Machinery", "Agricultural Economics", "Pest and Diseases", "Irrigation", "Fish Farming"]
  },
};

type Notes = {
  title: string;
  overview: string;
  keyPoints: string[];
  definitions: { term: string; meaning: string }[];
  examTips: string[];
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

  const loadNotes = async (subject: string, topic: string) => {
    setLoading(true);
    setError("");
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
      <div className="sticky top-0 z-10 px-5 pt-8 pb-4 flex items-center gap-3"
        style={{ background: "rgba(10,22,40,0.95)", backdropFilter: "blur(10px)" }}>
        <button onClick={goBack}
          className="w-10 h-10 bg-white bg-opacity-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-white text-lg font-bold">
            {step === "subject" && "📖 Study Mode"}
            {step === "topic" && `📚 ${selectedSubject}`}
            {step === "notes" && `📝 ${selectedTopic}`}
          </h1>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-xs ${step === "subject" ? "text-green-400" : "text-gray-500"}`}>Subject</span>
            <span className="text-gray-600 text-xs">→</span>
            <span className={`text-xs ${step === "topic" ? "text-green-400" : "text-gray-500"}`}>Topic</span>
            <span className="text-gray-600 text-xs">→</span>
            <span className={`text-xs ${step === "notes" ? "text-green-400" : "text-gray-500"}`}>Study Notes</span>
          </div>
        </div>
      </div>

      {/* STEP 1 - Pick Subject */}
      {step === "subject" && (
        <div className="px-5 pt-2">
          {/* How it works */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 mb-5">
            <p className="text-white font-bold text-base mb-3">How Study Mode Works 👇</p>
            <div className="flex flex-col gap-2">
              {[
                { step: "1", text: "Choose your subject below", icon: "📚" },
                { step: "2", text: "Pick the topic you want to study", icon: "📌" },
                { step: "3", text: "Read AI-generated study notes", icon: "🤖" },
                { step: "4", text: "Practice past questions on that topic", icon: "✅" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  <p className="text-blue-100 text-sm">{s.icon} {s.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Step 1 — Choose a Subject
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SUBJECTS).map(([subject, data]) => (
              <button key={subject}
                onClick={() => { setSelectedSubject(subject); setStep("topic"); }}
                className="bg-white bg-opacity-5 rounded-2xl p-4 text-left border border-white border-opacity-5 active:bg-opacity-10">
                <div className="text-3xl mb-2">{data.icon}</div>
                <p className="text-white font-semibold text-sm">{subject}</p>
                <p className="text-gray-500 text-xs mt-0.5">{data.topics.length} topics</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 - Pick Topic */}
      {step === "topic" && (
        <div className="px-5 pt-2">
          <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-4 border border-white border-opacity-5 flex items-center gap-3">
            <div className="text-3xl">{SUBJECTS[selectedSubject]?.icon}</div>
            <div>
              <p className="text-white font-bold">{selectedSubject}</p>
              <p className="text-gray-400 text-xs">Choose a topic to study below</p>
            </div>
          </div>

          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Step 2 — Choose a Topic
          </p>
          <div className="flex flex-col gap-2">
            {SUBJECTS[selectedSubject]?.topics.map((topic, i) => (
              <button key={topic}
                onClick={() => { setSelectedTopic(topic); loadNotes(selectedSubject, topic); }}
                className="bg-white bg-opacity-5 rounded-2xl px-4 py-4 flex items-center gap-3 border border-white border-opacity-5 text-left w-full active:bg-opacity-10">
                <div className="w-8 h-8 bg-blue-500 bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-white font-medium text-sm flex-1">{topic}</span>
                <span className="text-gray-500 text-lg">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-5 flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl mb-5 animate-pulse">
            🤖
          </div>
          <p className="text-white font-bold text-xl mb-2">Generating Notes...</p>
          <p className="text-gray-400 text-sm text-center mb-1">AI is preparing your</p>
          <p className="text-green-400 text-sm font-bold text-center">{selectedTopic} notes</p>
          <div className="mt-8 w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-5 text-center py-10">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-bold text-lg mb-2">Something went wrong</p>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button onClick={() => loadNotes(selectedSubject, selectedTopic)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold mr-3">
            Try Again
          </button>
          <button onClick={() => setStep("topic")}
            className="bg-white bg-opacity-10 text-white px-6 py-3 rounded-2xl font-bold">
            Go Back
          </button>
        </div>
      )}

      {/* STEP 3 - Study Notes */}
      {step === "notes" && notes && !loading && (
        <div className="px-5 pt-2">

          {/* Progress indicator */}
          <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-green-400 text-lg">✅</span>
            <p className="text-green-300 text-sm">Notes ready! Read carefully then practice below</p>
          </div>

          {/* Overview */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 mb-4">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">{selectedSubject}</p>
            <h2 className="text-white font-bold text-xl mb-3">{notes.title}</h2>
            <p className="text-blue-100 text-sm leading-relaxed">{notes.overview}</p>
          </div>

          {/* Key Points */}
          <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-4 border border-white border-opacity-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔑</span>
              <h3 className="text-green-400 font-bold text-sm">Key Points to Remember</h3>
            </div>
            <div className="flex flex-col gap-3">
              {notes.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Definitions */}
          {notes.definitions?.length > 0 && (
            <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-4 border border-white border-opacity-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <h3 className="text-yellow-400 font-bold text-sm">Important Definitions</h3>
              </div>
              <div className="flex flex-col gap-3">
                {notes.definitions.map((def, i) => (
                  <div key={i} className="bg-yellow-500 bg-opacity-5 rounded-2xl p-3 border-l-4 border-yellow-500">
                    <p className="text-yellow-300 font-bold text-sm">{def.term}</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{def.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Tips */}
          <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-3xl p-5 mb-4 border border-orange-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h3 className="text-orange-300 font-bold text-sm">JAMB Exam Tips</h3>
            </div>
            <div className="flex flex-col gap-2">
              {notes.examTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <p className="text-orange-100 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-6 border border-white border-opacity-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📌</span>
              <h3 className="text-blue-400 font-bold text-sm">Quick Summary</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{notes.summary}</p>
          </div>

          {/* CTA */}
          <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-4 border border-white border-opacity-5">
            <p className="text-white font-bold text-base mb-1">Done reading? 🎓</p>
            <p className="text-gray-400 text-sm mb-4">Now test yourself with past questions on this topic!</p>
            <a
              href={`/exam?name=Student&subjects=${encodeURIComponent(selectedSubject)}`}
              className="block bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-900 mb-3"
            >
              ✅ Practice Questions Now →
            </a>
            <button
              onClick={() => { setStep("topic"); setNotes(null); }}
              className="w-full bg-white bg-opacity-5 text-gray-400 py-3 rounded-2xl text-sm"
            >
              📖 Study Another Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

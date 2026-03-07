"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS: Record<string, string[]> = {
  "Use of English": [
    "Comprehension", "Summary Writing", "Lexis and Structure", "Oral English",
    "Figures of Speech", "Synonyms and Antonyms", "Sentence Structure", "Punctuation"
  ],
  "Mathematics": [
    "Number and Numeration", "Algebra", "Geometry", "Trigonometry",
    "Calculus", "Statistics", "Probability", "Matrices and Determinants"
  ],
  "Physics": [
    "Measurements and Units", "Motion", "Forces", "Work Energy and Power",
    "Waves", "Light", "Electricity", "Magnetism", "Atomic Physics"
  ],
  "Biology": [
    "Cell Biology", "Genetics", "Ecology", "Evolution",
    "Photosynthesis", "Respiration", "Reproduction", "Nutrition", "Excretion"
  ],
  "Chemistry": [
    "Atomic Structure", "Chemical Bonding", "Acids Bases and Salts", "Electrolysis",
    "Organic Chemistry", "Reaction Rates", "Equilibrium", "Periodic Table"
  ],
  "Economics": [
    "Demand and Supply", "Market Structures", "National Income", "Money and Banking",
    "International Trade", "Public Finance", "Population", "Agriculture"
  ],
  "Government": [
    "Democracy", "Constitution", "Legislature", "Executive",
    "Judiciary", "Political Parties", "Federalism", "International Organizations"
  ],
  "Literature": [
    "Poetry", "Prose Fiction", "Drama", "Figures of Speech",
    "Literary Devices", "African Literature", "Oral Literature"
  ],
  "Geography": [
    "Map Reading", "Climate", "Vegetation", "Population",
    "Agriculture", "Mining", "Rivers and Drainage", "Rocks and Minerals"
  ],
  "Commerce": [
    "Trade", "Banking", "Insurance", "Transportation",
    "Advertising", "Warehousing", "Communication", "Business Organizations"
  ],
  "Accounting": [
    "Double Entry", "Trial Balance", "Balance Sheet", "Income Statement",
    "Bank Reconciliation", "Depreciation", "Partnership Accounts", "Company Accounts"
  ],
  "Agriculture": [
    "Crop Production", "Animal Husbandry", "Soil Science", "Farm Machinery",
    "Agricultural Economics", "Pest and Diseases", "Irrigation", "Fish Farming"
  ],
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
  const [step, setStep] = useState<"subject" | "topic" | "notes" | "done">("subject");
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
        setError("Failed to load notes. Try again!");
      }
    } catch {
      setError("Network error. Try again!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>

      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => step === "subject" ? router.push("/") : setStep(step === "notes" ? "topic" : "subject")}
          className="w-10 h-10 bg-white bg-opacity-10 rounded-xl flex items-center justify-center text-white">
          ←
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">Study Mode</h1>
          <p className="text-gray-400 text-xs">Read • Understand • Practice</p>
        </div>
      </div>

      {/* STEP 1 - Pick Subject */}
      {step === "subject" && (
        <div className="px-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 mb-6">
            <div className="text-4xl mb-2">📖</div>
            <h2 className="text-white font-bold text-lg mb-1">Choose a Subject</h2>
            <p className="text-blue-100 text-sm">AI will generate study notes for your chosen topic</p>
          </div>
          <div className="flex flex-col gap-2">
            {Object.keys(SUBJECTS).map((subject) => (
              <button key={subject}
                onClick={() => { setSelectedSubject(subject); setStep("topic"); }}
                className="bg-white bg-opacity-5 rounded-2xl px-4 py-4 flex items-center justify-between border border-white border-opacity-5 text-left">
                <span className="text-white font-medium text-sm">{subject}</span>
                <span className="text-gray-500">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 - Pick Topic */}
      {step === "topic" && (
        <div className="px-5">
          <p className="text-green-400 text-sm font-medium mb-4">📚 {selectedSubject}</p>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Choose a Topic</p>
          <div className="flex flex-col gap-2">
            {SUBJECTS[selectedSubject]?.map((topic) => (
              <button key={topic}
                onClick={() => { setSelectedTopic(topic); loadNotes(selectedSubject, topic); }}
                className="bg-white bg-opacity-5 rounded-2xl px-4 py-4 flex items-center justify-between border border-white border-opacity-5 text-left">
                <span className="text-white font-medium text-sm">{topic}</span>
                <span className="text-gray-500">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-5 flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl mb-4 animate-pulse">
            🤖
          </div>
          <p className="text-white font-bold text-lg mb-2">Generating Notes...</p>
          <p className="text-gray-400 text-sm text-center">AI is preparing your {selectedTopic} notes</p>
          <div className="mt-6 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-5 text-center py-10">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => loadNotes(selectedSubject, selectedTopic)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold">
            Try Again
          </button>
        </div>
      )}

      {/* STEP 3 - Study Notes */}
      {step === "notes" && notes && !loading && (
        <div className="px-5">
          {/* Topic header */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 mb-5">
            <p className="text-blue-200 text-xs mb-1">{selectedSubject}</p>
            <h2 className="text-white font-bold text-xl mb-2">{notes.title}</h2>
            <p className="text-blue-100 text-sm leading-relaxed">{notes.overview}</p>
          </div>

          {/* Key Points */}
          <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-4 border border-white border-opacity-5">
            <h3 className="text-green-400 font-bold text-sm mb-3">🔑 Key Points</h3>
            <div className="flex flex-col gap-2">
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
              <h3 className="text-yellow-400 font-bold text-sm mb-3">📝 Key Definitions</h3>
              <div className="flex flex-col gap-3">
                {notes.definitions.map((def, i) => (
                  <div key={i} className="border-l-2 border-yellow-500 pl-3">
                    <p className="text-yellow-300 font-bold text-sm">{def.term}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{def.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Tips */}
          <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-3xl p-5 mb-4 border border-orange-700">
            <h3 className="text-orange-300 font-bold text-sm mb-3">💡 JAMB Exam Tips</h3>
            <div className="flex flex-col gap-2">
              {notes.examTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <p className="text-orange-100 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white bg-opacity-5 rounded-3xl p-5 mb-6 border border-white border-opacity-5">
            <h3 className="text-blue-400 font-bold text-sm mb-2">📌 Summary</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{notes.summary}</p>
          </div>

          {/* Practice Button */}
          <a
            href={`/exam?name=Student&subjects=${selectedSubject}&topic=${encodeURIComponent(selectedTopic)}`}
            className="block bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900 mb-3"
          >
            ✅ Practice Questions Now
          </a>
          <button
            onClick={() => setStep("topic")}
            className="w-full bg-white bg-opacity-5 text-gray-400 py-3 rounded-2xl text-sm"
          >
            Study Another Topic
          </button>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, set, push, onValue, remove, get } from "firebase/database";

const ADMIN_PASSWORD = "adams2024";

const SUBJECTS = [
  "Use of English", "Mathematics", "Physics", "Chemistry",
  "Biology", "Economics", "Government", "Literature",
  "Geography", "Commerce", "Accounting", "Agriculture"
];

interface Question {
  id?: string;
  question: string;
  option: { a: string; b: string; c: string; d: string };
  answer: string;
  subject: string;
  year?: string;
  explanation?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");

  // Question form
  const [subject, setSubject] = useState("Use of English");
  const [question, setQuestion] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [answer, setAnswer] = useState("a");
  const [year, setYear] = useState("2023");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Bulk import
  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("Use of English");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState("");

  // Questions list
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterSubject, setFilterSubject] = useState("All");
  const [questionsCount, setQuestionsCount] = useState<Record<string, number>>({});
  const [loadingQ, setLoadingQ] = useState(false);

  // Update panel
  const [version, setVersion] = useState("2.0.0");
  const [changelog, setChangelog] = useState(["New features added", "Bug fixes"]);
  const [updateSent, setUpdateSent] = useState(false);

  // Stats
  const [stats, setStats] = useState({ users: 0, battles: 0, feedback: 0, totalQ: 0 });

  useEffect(() => {
    if (!loggedIn) return;
    // Load stats
    get(ref(db, "users")).then(s => setStats(p => ({ ...p, users: Object.keys(s.val() || {}).length })));
    get(ref(db, "battles")).then(s => setStats(p => ({ ...p, battles: Object.keys(s.val() || {}).length })));
    get(ref(db, "feedback")).then(s => setStats(p => ({ ...p, feedback: Object.keys(s.val() || {}).length })));

    // Load question counts
    SUBJECTS.forEach(sub => {
      get(ref(db, `questions/${sub.replace(/ /g, "_")}`)).then(s => {
        const count = Object.keys(s.val() || {}).length;
        setQuestionsCount(p => ({ ...p, [sub]: count }));
        setStats(prev => ({ ...prev, totalQ: prev.totalQ + count }));
      });
    });
  }, [loggedIn]);

  const login = () => {
    if (password === ADMIN_PASSWORD) setLoggedIn(true);
    else alert("Wrong password!");
  };

  const saveQuestion = async () => {
    if (!question || !optA || !optB || !optC || !optD) {
      alert("Fill all fields!"); return;
    }
    setSaving(true);
    try {
      const subjectKey = subject.replace(/ /g, "_");
      await push(ref(db, `questions/${subjectKey}`), {
        question,
        option: { a: optA, b: optB, c: optC, d: optD },
        answer,
        subject,
        year,
        explanation,
        addedAt: Date.now(),
      });
      setSaved(true);
      // Clear form
      setQuestion(""); setOptA(""); setOptB(""); setOptC(""); setOptD("");
      setExplanation(""); setAnswer("a");
      setTimeout(() => setSaved(false), 2000);
      // Update count
      setQuestionsCount(p => ({ ...p, [subject]: (p[subject] || 0) + 1 }));
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
    setSaving(false);
  };

  const loadQuestions = async (sub: string) => {
    setLoadingQ(true);
    const key = sub === "All" ? null : sub.replace(/ /g, "_");
    if (key) {
      const snap = await get(ref(db, `questions/${key}`));
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, q]: any) => ({ id, ...q }));
      setQuestions(list);
    }
    setLoadingQ(false);
  };

  const deleteQuestion = async (sub: string, id: string) => {
    if (!confirm("Delete this question?")) return;
    const key = sub.replace(/ /g, "_");
    await remove(ref(db, `questions/${key}/${id}`));
    setQuestions(prev => prev.filter(q => q.id !== id));
    setQuestionsCount(p => ({ ...p, [sub]: Math.max(0, (p[sub] || 1) - 1) }));
  };

  const parseBulk = async () => {
    if (!bulkText.trim()) { alert("Paste some questions first!"); return; }
    setBulkLoading(true);
    setBulkResult("");

    // Parse format:
    // Q: Question text
    // A: Option A
    // B: Option B
    // C: Option C
    // D: Option D
    // ANS: a
    // EXP: explanation (optional)
    // ---

    const blocks = bulkText.split("---").map(b => b.trim()).filter(Boolean);
    let added = 0;
    let failed = 0;

    for (const block of blocks) {
      try {
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
        const q: any = { subject: bulkSubject, year: "2024", addedAt: Date.now() };

        for (const line of lines) {
          if (line.startsWith("Q:")) q.question = line.slice(2).trim();
          else if (line.startsWith("A:")) q.option = { ...q.option, a: line.slice(2).trim() };
          else if (line.startsWith("B:")) q.option = { ...q.option, b: line.slice(2).trim() };
          else if (line.startsWith("C:")) q.option = { ...q.option, c: line.slice(2).trim() };
          else if (line.startsWith("D:")) q.option = { ...q.option, d: line.slice(2).trim() };
          else if (line.startsWith("ANS:")) q.answer = line.slice(4).trim().toLowerCase();
          else if (line.startsWith("EXP:")) q.explanation = line.slice(4).trim();
          else if (line.startsWith("YEAR:")) q.year = line.slice(5).trim();
        }

        if (q.question && q.option?.a && q.option?.b && q.option?.c && q.option?.d && q.answer) {
          const key = bulkSubject.replace(/ /g, "_");
          await push(ref(db, `questions/${key}`), q);
          added++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setBulkResult(`✅ Added ${added} questions! ${failed > 0 ? `❌ ${failed} failed (check format)` : ""}`);
    setQuestionsCount(p => ({ ...p, [bulkSubject]: (p[bulkSubject] || 0) + added }));
    setBulkLoading(false);
  };

  const sendUpdate = async () => {
    await set(ref(db, "appUpdate"), {
      version, changelog, timestamp: Date.now(),
    });
    setUpdateSent(true);
    setTimeout(() => setUpdateSent(false), 3000);
  };

  const loadFeedback = async () => {
    const snap = await get(ref(db, "feedback"));
    const data = snap.val() || {};
    return Object.values(data) as any[];
  };

  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);

  const showFeedback = async () => {
    const list = await loadFeedback();
    setFeedback(list.sort((a, b) => b.timestamp - a.timestamp));
    setFeedbackLoaded(true);
  };

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}>
      <div className="card p-8 w-full max-w-sm" style={{ background: "var(--surface)" }}>
        <div className="text-center mb-6">
          <img src="/logo-512.png" width={60} height={60} style={{ borderRadius: "14px", margin: "0 auto 12px" }} alt="logo" />
          <h1 className="font-black text-xl" style={{ color: "var(--text)" }}>Admin Panel</h1>
          <p className="text-sm" style={{ color: "var(--text3)" }}>JAMB CBT Practice</p>
        </div>
        <input type="password" placeholder="Admin password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          className="input w-full px-4 py-3 mb-4"
          style={{ background: "var(--surface2)" }} />
        <button onClick={login} className="btn-primary w-full py-3 rounded-2xl font-bold">
          Login →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto pb-10"
      style={{ background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', system-ui" }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-xl" style={{ color: "var(--text)" }}>⚙️ Admin Panel</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>JAMB CBT Practice</p>
          </div>
          <a href="/" className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: "var(--surface2)", color: "var(--text3)" }}>← App</a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Users", value: stats.users, color: "var(--blue)" },
            { label: "Battles", value: stats.battles, color: "var(--green)" },
            { label: "Questions", value: Object.values(questionsCount).reduce((a, b) => a + b, 0), color: "var(--yellow)" },
            { label: "Feedback", value: stats.feedback, color: "var(--red)" },
          ].map(s => (
            <div key={s.label} className="card p-2 text-center" style={{ background: "var(--surface)" }}>
              <p className="font-black text-base" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scroll px-5 py-3 gap-2"
        style={{ borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "questions", label: "➕ Add Question" },
          { id: "bulk", label: "📦 Bulk Import" },
          { id: "manage", label: "📋 Manage" },
          { id: "feedback", label: "💬 Feedback" },
          { id: "update", label: "🔔 Update" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: activeTab === tab.id ? "var(--green)" : "var(--surface)",
              color: activeTab === tab.id ? "#fff" : "var(--text3)",
              border: "1px solid var(--border)"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4">

        {/* ADD QUESTION */}
        {activeTab === "questions" && (
          <div className="flex flex-col gap-3">
            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-3">Subject</p>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="input w-full px-4 py-3"
                style={{ background: "var(--surface2)" }}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Question</p>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Type the question here..."
                rows={3} className="input w-full px-4 py-3 resize-none"
                style={{ background: "var(--surface2)" }} />
            </div>

            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-3">Options</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "A", value: optA, set: setOptA },
                  { label: "B", value: optB, set: setOptB },
                  { label: "C", value: optC, set: setOptC },
                  { label: "D", value: optD, set: setOptD },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: answer === opt.label.toLowerCase() ? "var(--green)" : "var(--surface2)", color: answer === opt.label.toLowerCase() ? "#fff" : "var(--text3)" }}>
                      {opt.label}
                    </div>
                    <input value={opt.value} onChange={e => opt.set(e.target.value)}
                      placeholder={`Option ${opt.label}`}
                      className="input flex-1 px-3 py-2.5 text-sm"
                      style={{ background: "var(--surface2)" }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Correct Answer</p>
              <div className="flex gap-2">
                {["a", "b", "c", "d"].map(opt => (
                  <button key={opt} onClick={() => setAnswer(opt)}
                    className="flex-1 py-2.5 rounded-xl font-black text-sm"
                    style={{
                      background: answer === opt ? "var(--green)" : "var(--surface2)",
                      color: answer === opt ? "#fff" : "var(--text3)"
                    }}>
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Year & Explanation (optional)</p>
              <input value={year} onChange={e => setYear(e.target.value)}
                placeholder="Year e.g 2023"
                className="input w-full px-4 py-3 mb-2 text-sm"
                style={{ background: "var(--surface2)" }} />
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)}
                placeholder="Explain why this answer is correct..."
                rows={2} className="input w-full px-4 py-3 resize-none text-sm"
                style={{ background: "var(--surface2)" }} />
            </div>

            {saved && (
              <div className="rounded-2xl p-3 text-center"
                style={{ background: "var(--green-dim)", border: "1px solid var(--green)" }}>
                <p className="font-bold text-sm" style={{ color: "var(--green)" }}>✅ Question saved!</p>
              </div>
            )}

            <button onClick={saveQuestion} disabled={saving}
              className="btn-primary w-full py-4 rounded-2xl font-black text-base disabled:opacity-50">
              {saving ? "Saving..." : "💾 Save Question"}
            </button>
          </div>
        )}

        {/* BULK IMPORT */}
        {activeTab === "bulk" && (
          <div>
            <div className="card p-4 mb-4" style={{ background: "var(--surface)" }}>
              <p className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>📦 Bulk Import Format</p>
              <div className="rounded-xl p-3 text-xs font-mono mb-3"
                style={{ background: "var(--surface2)", color: "var(--text2)" }}>
                {`Q: What is the chemical symbol for Gold?
A: Go
B: Gd
C: Au
D: Ag
ANS: c
EXP: Gold's symbol Au comes from Latin 'Aurum'
YEAR: 2022
---
Q: Next question here...
A: Option A
B: Option B
C: Option C
D: Option D
ANS: a
---`}
              </div>
              <p className="text-xs" style={{ color: "var(--text3)" }}>
                Separate each question with <strong>---</strong>. ANS should be a, b, c or d.
              </p>
            </div>

            <div className="card p-4 mb-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Subject for all questions</p>
              <select value={bulkSubject} onChange={e => setBulkSubject(e.target.value)}
                className="input w-full px-4 py-3 mb-3"
                style={{ background: "var(--surface2)" }}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <p className="section-label mb-2">Paste questions below</p>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                placeholder="Paste your questions in the format above..."
                rows={10} className="input w-full px-4 py-3 resize-none text-xs"
                style={{ background: "var(--surface2)" }} />
            </div>

            {bulkResult && (
              <div className="rounded-2xl p-3 mb-4 text-center"
                style={{ background: "var(--green-dim)", border: "1px solid var(--green)" }}>
                <p className="font-bold text-sm" style={{ color: "var(--green)" }}>{bulkResult}</p>
              </div>
            )}

            <button onClick={parseBulk} disabled={bulkLoading}
              className="btn-primary w-full py-4 rounded-2xl font-black text-base disabled:opacity-50">
              {bulkLoading ? "Importing..." : "📦 Import All Questions"}
            </button>
          </div>
        )}

        {/* MANAGE QUESTIONS */}
        {activeTab === "manage" && (
          <div>
            <div className="card p-4 mb-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-3">Questions per Subject</p>
              <div className="flex flex-col gap-2">
                {SUBJECTS.map(sub => (
                  <div key={sub} className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{sub}</p>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green">{questionsCount[sub] || 0} questions</span>
                      <button onClick={() => { setFilterSubject(sub); loadQuestions(sub); }}
                        className="text-xs px-2 py-1 rounded-lg font-bold"
                        style={{ background: "var(--surface2)", color: "var(--text3)" }}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filterSubject !== "All" && (
              <div>
                <p className="section-label mb-3">{filterSubject} Questions ({questions.length})</p>
                {loadingQ ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-2xl">⏳</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {questions.map((q, i) => (
                      <div key={q.id} className="card p-4" style={{ background: "var(--surface)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold flex-1" style={{ color: "var(--text)" }}>
                            {i + 1}. {q.question}
                          </p>
                          <button onClick={() => deleteQuestion(filterSubject, q.id!)}
                            className="flex-shrink-0 text-xs px-2 py-1 rounded-lg"
                            style={{ background: "var(--red-dim)", color: "var(--red)" }}>
                            🗑
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {(["a","b","c","d"] as const).map(opt => (
                            <p key={opt} className="text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: q.answer === opt ? "var(--green-dim)" : "var(--surface2)",
                                color: q.answer === opt ? "var(--green)" : "var(--text3)"
                              }}>
                              {opt.toUpperCase()}. {q.option[opt]}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && (
          <div>
            {!feedbackLoaded ? (
              <button onClick={showFeedback}
                className="btn-primary w-full py-4 rounded-2xl font-black mb-4">
                Load Feedback ({stats.feedback})
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-4xl mb-2">📭</p>
                    <p style={{ color: "var(--text3)" }}>No feedback yet</p>
                  </div>
                ) : feedback.map((f, i) => (
                  <div key={i} className="card p-4" style={{ background: "var(--surface)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${f.type === "bug" ? "badge-red" : f.type === "compliment" ? "badge-green" : "badge-blue"}`}>
                        {f.type === "bug" ? "🐛 Bug" : f.type === "compliment" ? "❤️ Love" : "💡 Idea"}
                      </span>
                      <p className="text-xs font-bold" style={{ color: "var(--text3)" }}>{f.name}</p>
                      <p className="text-xs ml-auto" style={{ color: "var(--text3)" }}>
                        {new Date(f.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text)" }}>{f.text}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>Page: {f.page}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPDATE */}
        {activeTab === "update" && (
          <div className="flex flex-col gap-4">
            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Version</p>
              <input value={version} onChange={e => setVersion(e.target.value)}
                className="input w-full px-4 py-3"
                style={{ background: "var(--surface2)" }} />
            </div>
            <div className="card p-4" style={{ background: "var(--surface)" }}>
              <p className="section-label mb-2">Changelog</p>
              {changelog.map((c, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={c} onChange={e => {
                    const n = [...changelog]; n[i] = e.target.value; setChangelog(n);
                  }} className="input flex-1 px-3 py-2 text-sm"
                    style={{ background: "var(--surface2)" }} />
                  <button onClick={() => setChangelog(changelog.filter((_, j) => j !== i))}
                    style={{ color: "var(--red)" }}>✕</button>
                </div>
              ))}
              <button onClick={() => setChangelog([...changelog, ""])}
                className="text-xs font-bold" style={{ color: "var(--green)" }}>
                + Add line
              </button>
            </div>
            {updateSent && (
              <div className="rounded-2xl p-3 text-center"
                style={{ background: "var(--green-dim)", border: "1px solid var(--green)" }}>
                <p className="font-bold text-sm" style={{ color: "var(--green)" }}>✅ Update notification sent!</p>
              </div>
            )}
            <button onClick={sendUpdate} className="btn-primary w-full py-4 rounded-2xl font-black text-base">
              🔔 Send Update Notification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

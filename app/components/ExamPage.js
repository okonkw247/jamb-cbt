'use client';

import { useState, useEffect, useRef } from 'react';

export default function ExamPage({ subject, onFinish }) {

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(subject.time);

  const submittedRef = useRef(false);
  const endTimeRef = useRef(Date.now() + subject.time * 1000);

  // =========================
  // TIMER (real time accurate)
  // =========================
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((endTimeRef.current - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        submitExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =========================
  // SCROLL TO TOP ON QUESTION CHANGE
  // =========================
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current]);

  // =========================
  // FORMAT TIME
  // =========================
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  // =========================
  // SELECT ANSWER (BY QUESTION ID)
  // =========================
  const selectAnswer = (option) => {
    const qId = subject.questions[current].id;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // =========================
  // FLAG QUESTION
  // =========================
  const toggleFlag = () => {
    const qId = subject.questions[current].id;
    setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // =========================
  // SUBMIT EXAM (SAFE)
  // =========================
  const submitExam = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const questions = subject.questions;
    let score = 0;

    const breakdown = questions.map(q => {
      const selected = answers[q.id] || null;
      const isCorrect = selected === q.answer;
      if (isCorrect) score++;

      return {
        question: q.question,
        selected,
        correct: q.answer,
        isCorrect
      };
    });

    onFinish({
      score,
      total: questions.length,
      breakdown,
      subjectName: subject.name
    });
  };

  // =========================
  // DERIVED VALUES
  // =========================
  const q = subject.questions[current];
  const totalQ = subject.questions.length;
  const answered = Object.keys(answers).length;
  const isLow = timeLeft < 300;

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* TOP BAR */}
      <div className="bg-green-800 text-white p-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-bold text-sm">{subject.name}</p>
          <p className="text-green-300 text-xs">{answered}/{totalQ} Answered</p>
        </div>
        <div className={`text-xl font-mono font-bold px-4 py-1 rounded-lg ${isLow ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* QUESTION AREA */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">

        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              Question {current + 1} of {totalQ}
            </span>

            <button
              onClick={toggleFlag}
              className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                flagged[q.id]
                  ? 'bg-yellow-400 border-yellow-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              {flagged[q.id] ? '🚩 Flagged' : '🏳 Flag'}
            </button>
          </div>

          <p className="text-gray-800 font-medium text-base leading-relaxed">
            {q.question}
          </p>
        </div>

        {/* OPTIONS */}
        <div className="space-y-3 mb-4">
          {q.options.map((option, i) => {
            const letters = ['A','B','C','D'];
            const isSelected = answers[q.id] === option;

            return (
              <button
                key={i}
                onClick={() => selectAnswer(option)}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 font-medium transition-all ${
                  isSelected
                    ? 'bg-green-600 border-green-700 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isSelected ? 'bg-white text-green-700' : 'bg-green-100 text-green-800'
                }`}>
                  {letters[i]}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* NAVIGATION */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
            disabled={current === 0}
            className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold disabled:opacity-40"
          >
            ← Prev
          </button>

          <button
            onClick={() => setCurrent(prev => Math.min(totalQ - 1, prev + 1))}
            disabled={current === totalQ - 1}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        {/* QUESTION NAVIGATOR */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">QUESTION NAVIGATOR</p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] gap-1">
            {subject.questions.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setCurrent(i)}
                className={`h-7 text-xs rounded font-bold ${
                  i === current ? 'bg-blue-600 text-white' :
                  flagged[item.id] ? 'bg-yellow-400 text-white' :
                  answers[item.id] ? 'bg-green-500 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span>🟦 Current</span>
            <span>🟩 Answered</span>
            <span>🟨 Flagged</span>
            <span>⬜ Unanswered</span>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={() => {
            if (confirm(`Submit exam? You've answered ${answered}/${totalQ} questions.`)) {
              submitExam();
            }
          }}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg"
        >
          Submit Exam
        </button>

      </div>
    </div>
  );
}

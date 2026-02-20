'use client';

import { useState } from 'react';

import { subjects } from '../lib/questions';

import ExamPage from './components/ExamPage';

import ResultPage from './components/ResultPage';

export default function Home() {

const [screen, setScreen] = useState('home');

const [selectedSubject, setSelectedSubject] = useState(null);

const [results, setResults] = useState(null);

const handleStart = (subjectKey) => {

setSelectedSubject(subjectKey);

setScreen('exam');

};

const handleFinish = (resultData) => {

setResults(resultData);

setScreen('result');

};

const handleRestart = () => {

setScreen('home');

setSelectedSubject(null);

setResults(null);

};

if (screen === 'exam') {

return <ExamPage subject={subjects[selectedSubject]} subjectKey={selectedSubject} onFinish={handleFinish} />;

}

if (screen === 'result') {

return <ResultPage results={results} onRestart={handleRestart} />;

}

return (

<main className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">

  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">

    <div className="text-center mb-8">

      <div className="bg-green-700 text-white rounded-xl p-4 mb-4">

        <h1 className="text-2xl font-bold">JAMB CBT PRACTICE</h1>

        <p className="text-green-200 text-sm">Joint Admissions and Matriculation Board</p>

      </div>

      <p className="text-gray-600 text-sm">Select a subject to begin your practice exam</p>

    </div>



    <div className="grid grid-cols-1 gap-4">

      {Object.entries(subjects).map(([key, subject]) => (

        <button

          key={key}

          onClick={() => handleStart(key)}

          className="flex items-center justify-between bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-500 rounded-xl p-4 transition-all duration-200 group"

        >

          <div className="text-left">

            <p className="font-bold text-green-900 text-lg">{subject.name}</p>

            <p className="text-green-600 text-sm">{subject.questions.length} Questions • 1hr 45mins</p>

          </div>

          <div className="bg-green-600 group-hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold">

            Start →

          </div>

        </button>

      ))}

    </div>

   <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
  <p className="text-yellow-800 text-xs text-center font-medium">
    ⚠️ Once you start a test, the timer will begin immediately. 
    Do not refresh the page or your progress may be lost.
  </p>
</div>

</div>
</main>
);
}

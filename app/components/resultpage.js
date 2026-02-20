'use client';

export default function ResultPage({ results, onRestart }) {

const { score, total, breakdown, subjectName } = results;

const percentage = Math.round((score / total) * 100);

const passed = percentage >= 50;

const getGrade = () => {

if (percentage >= 80) return { grade: 'A', color: 'text-green-600', msg: 'Excellent! Outstanding performance!' };

if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', msg: 'Very Good! Keep it up!' };

if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', msg: 'Good! Room for improvement.' };

if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', msg: 'Pass! But study harder.' };

return { grade: 'F', color: 'text-red-600', msg: 'Failed! Please study more.' };

};

const { grade, color, msg } = getGrade();

return (

<div className="min-h-screen bg-green-900 p-4 flex flex-col items-center justify-start py-8">

  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">



    {/* Header */}

    <div className="bg-green-700 text-white rounded-t-2xl p-6 text-center">

      <h2 className="text-xl font-bold">Exam Results</h2>

      <p className="text-green-200 text-sm">{subjectName}</p>

    </div>



    {/* Score */}

    <div className="p-6 text-center border-b">

      <div className={`text-7xl font-black mb-1 ${color}`}>{grade}</div>

      <div className="text-4xl font-bold text-gray-800">{percentage}%</div>

      <div className="text-gray-500 mt-1">{score} out of {total} correct</div>

      <div className={`mt-3 inline-block px-4 py-1 rounded-full text-sm font-semibold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>

        {passed ? '✅ PASSED' : '❌ FAILED'}

      </div>

      <p className="text-gray-600 text-sm mt-2">{msg}</p>

    </div>



    {/* Breakdown */}

    <div className="p-4">

      <p className="font-bold text-gray-700 mb-3 text-sm">ANSWER BREAKDOWN</p>

      <div className="space-y-3 max-h-80 overflow-y-auto">

        {breakdown.map((item, i) => (

          <div key={i} className={`rounded-xl p-3 border-l-4 ${item.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>

            <p className="text-xs font-bold text-gray-500 mb-1">Q{i + 1}</p>

            <p className="text-sm text-gray-800 font-medium mb-2">{item.question}</p>

            {!item.isCorrect && item.selected && (

              <p className="text-xs text-red-600">❌ Your answer: {item.selected}</p>

            )}

            {!item.selected && (

              <p className="text-xs text-gray-400">⚪ Not answered</p>

            )}

            <p className="text-xs text-green-700 font-semibold">✅ Correct: {item.correct}</p>

          </div>

        ))}

      </div>

    </div>



    {/* Buttons */}

    <div className="p-4 flex gap-3">

      <button

        onClick={onRestart}

        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"

      >

        🏠 Home

      </button>

      <button

        onClick={onRestart}

        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"

      >

        🔄 Try Again

      </button>

    </div>



  </div>

</div>

);

}

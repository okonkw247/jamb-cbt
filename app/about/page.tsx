export default function About() {
  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>
      <div className="px-5 pt-10 pb-6">
        <a href="/" className="text-green-400 text-sm mb-6 block">← Back</a>
      </div>
      <div className="px-5 mb-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-green-900 mx-auto mb-4">🎓</div>
        <h1 className="text-white text-3xl font-bold mb-2">JAMB CBT Practice</h1>
        <p className="text-green-400 text-sm font-medium mb-1">Version 2.0.0</p>
        <p className="text-gray-400 text-sm">Prepare. Practice. Pass. 🇳🇬</p>
      </div>
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-3xl p-5 border border-green-700">
          <h2 className="text-white font-bold text-lg mb-2">Our Mission 🎯</h2>
          <p className="text-green-100 text-sm leading-relaxed">To give every Nigerian student — regardless of location or financial background — access to world-class JAMB preparation tools. We believe every student deserves a fair chance at passing JAMB and achieving their dreams.</p>
        </div>
      </div>
      <div className="px-5 mb-6">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">What We Offer</h2>
        <div className="flex flex-col gap-3">
          {[
            { icon: "📝", title: "Real Past Questions", desc: "Thousands of actual JAMB past questions across all subjects" },
            { icon: "⚔️", title: "Live Battle Mode", desc: "Challenge friends to real-time quiz battles and tournaments" },
            { icon: "📊", title: "Performance Analytics", desc: "Track your progress and identify weak areas with our Study Wizard" },
            { icon: "📶", title: "Works Offline", desc: "Practice anywhere, even without internet connection" },
            { icon: "🏆", title: "National Leaderboard", desc: "Compete with students across Nigeria and see how you rank" },
            { icon: "🆓", title: "Completely Free", desc: "All core features are free for every Nigerian student" },
          ].map((f) => (
            <div key={f.title} className="bg-white bg-opacity-5 rounded-2xl p-4 flex items-start gap-3 border border-white border-opacity-5">
              <div className="text-2xl flex-shrink-0">{f.icon}</div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 mb-6">
        <div className="bg-white bg-opacity-5 rounded-3xl p-5 border border-white border-opacity-5 text-center">
          <div className="text-4xl mb-3">👨‍💻</div>
          <h2 className="text-white font-bold text-lg mb-1">Built by Adams</h2>
          <p className="text-gray-400 text-sm leading-relaxed">A Nigerian developer passionate about using technology to improve education and give every student a fair chance at success.</p>
        </div>
      </div>
      <div className="px-5 mb-6">
        <div className="flex flex-col gap-2">
          <a href="/privacy" className="bg-white bg-opacity-5 rounded-2xl px-4 py-3 flex items-center justify-between border border-white border-opacity-5">
            <span className="text-white text-sm">🔒 Privacy Policy</span>
            <span className="text-gray-500">→</span>
          </a>
          <a href="/" className="bg-white bg-opacity-5 rounded-2xl px-4 py-3 flex items-center justify-between border border-white border-opacity-5">
            <span className="text-white text-sm">🏠 Back to App</span>
            <span className="text-gray-500">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

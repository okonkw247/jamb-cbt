export default function Privacy() {
  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>
      <div className="px-5 pt-10 pb-6">
        <a href="/" className="text-green-400 text-sm mb-6 block">← Back</a>
        <h1 className="text-white text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: March 2026</p>
      </div>

      <div className="px-5 flex flex-col gap-6">
        {[
          {
            title: "1. Information We Collect",
            content: "We collect information you provide when creating an account, including your name and email address. We also collect usage data such as exam scores, subjects practiced, and battle history to improve your experience."
          },
          {
            title: "2. How We Use Your Information",
            content: "We use your information to provide and improve our services, personalize your learning experience, show your progress on leaderboards, and send you important updates about the app."
          },
          {
            title: "3. Data Storage",
            content: "Your data is stored securely using Google Firebase. We use industry-standard encryption to protect your personal information. Exam history is stored locally on your device using localStorage and IndexedDB."
          },
          {
            title: "4. Third Party Services",
            content: "We use Google Firebase for authentication and database services. We may use Google AdSense to display advertisements. These third parties have their own privacy policies governing the use of your information."
          },
          {
            title: "5. Advertisements",
            content: "JAMB CBT Practice may display advertisements served by Google AdSense. These ads may use cookies to show you relevant advertisements. You can opt out of personalized ads through Google's ad settings."
          },
          {
            title: "6. Children's Privacy",
            content: "Our service is intended for students preparing for JAMB examinations. We do not knowingly collect personal information from children under 13 without parental consent."
          },
          {
            title: "7. Your Rights",
            content: "You have the right to access, update, or delete your personal information at any time through the Account Settings page. You may also contact us to request deletion of your account and all associated data."
          },
          {
            title: "8. Cookies",
            content: "We use cookies and similar tracking technologies to improve your experience on our platform. You can control cookie settings through your browser preferences."
          },
          {
            title: "9. Changes to This Policy",
            content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the date at the top."
          },
          {
            title: "10. Contact Us",
            content: "If you have any questions about this Privacy Policy, please contact us at support@jamb-cbt.com or through the feedback option in the app settings."
          },
        ].map((section) => (
          <div key={section.title} className="bg-white bg-opacity-5 rounded-2xl p-4 border border-white border-opacity-5">
            <h2 className="text-green-400 font-bold text-sm mb-2">{section.title}</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
Save with Ctrl + X, Y, Enter. Now create the About page:
nano app/about/page.tsx
Paste this:
export default function About() {
  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f1f35 100%)" }}>
      <div className="px-5 pt-10 pb-6">
        <a href="/" className="text-green-400 text-sm mb-6 block">← Back</a>
      </div>

      {/* Hero */}
      <div className="px-5 mb-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-green-900 mx-auto mb-4">
          🎓
        </div>
        <h1 className="text-white text-3xl font-bold mb-2">JAMB CBT Practice</h1>
        <p className="text-green-400 text-sm font-medium mb-1">Version 2.0.0</p>
        <p className="text-gray-400 text-sm">Prepare. Practice. Pass. 🇳🇬</p>
      </div>

      {/* Mission */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-3xl p-5 border border-green-700">
          <h2 className="text-white font-bold text-lg mb-2">Our Mission 🎯</h2>
          <p className="text-green-100 text-sm leading-relaxed">
            To give every Nigerian student — regardless of location or financial background — access to world-class JAMB preparation tools. We believe every student deserves a fair chance at passing JAMB and achieving their dreams.
          </p>
        </div>
      </div>

      {/* Features */}
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

      {/* Stats */}
      <div className="px-5 mb-6">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">By The Numbers</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "10,000+", label: "Questions", icon: "📝" },
            { value: "12", label: "Subjects", icon: "📚" },
            { value: "Free", label: "Forever", icon: "🆓" },
            { value: "🇳🇬", label: "Made in Nigeria", icon: "" },
          ].map((s) => (
            <div key={s.label} className="bg-white bg-opacity-5 rounded-2xl p-4 text-center border border-white border-opacity-5">
              <p className="text-white text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer */}
      <div className="px-5 mb-6">
        <div className="bg-white bg-opacity-5 rounded-3xl p-5 border border-white border-opacity-5 text-center">
          <div className="text-4xl mb-3">👨‍💻</div>
          <h2 className="text-white font-bold text-lg mb-1">Built by Adams x </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            A Nigerian developer passionate about using technology to improve education and give every student a fair chance at success.
          </p>
        </div>
      </div>

      {/* Links */}
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

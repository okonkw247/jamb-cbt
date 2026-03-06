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
          { title: "1. Information We Collect", content: "We collect information you provide when creating an account, including your name and email address. We also collect usage data such as exam scores, subjects practiced, and battle history to improve your experience." },
          { title: "2. How We Use Your Information", content: "We use your information to provide and improve our services, personalize your learning experience, show your progress on leaderboards, and send you important updates about the app." },
          { title: "3. Data Storage", content: "Your data is stored securely using Google Firebase. We use industry-standard encryption to protect your personal information. Exam history is stored locally on your device using localStorage and IndexedDB." },
          { title: "4. Third Party Services", content: "We use Google Firebase for authentication and database services. We may use Google AdSense to display advertisements. These third parties have their own privacy policies governing the use of your information." },
          { title: "5. Advertisements", content: "JAMB CBT Practice may display advertisements served by Google AdSense. These ads may use cookies to show you relevant advertisements. You can opt out of personalized ads through Google's ad settings." },
          { title: "6. Children's Privacy", content: "Our service is intended for students preparing for JAMB examinations. We do not knowingly collect personal information from children under 13 without parental consent." },
          { title: "7. Your Rights", content: "You have the right to access, update, or delete your personal information at any time through the Account Settings page. You may also contact us to request deletion of your account and all associated data." },
          { title: "8. Cookies", content: "We use cookies and similar tracking technologies to improve your experience on our platform. You can control cookie settings through your browser preferences." },
          { title: "9. Changes to This Policy", content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the date at the top." },
          { title: "10. Contact Us", content: "If you have any questions about this Privacy Policy, please contact us at support@jamb-cbt.com or through the feedback option in the app settings." },
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

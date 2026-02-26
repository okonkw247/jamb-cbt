import type { Metadata } from "next";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdateNotification from "@/components/UpdateNotification";

export const metadata: Metadata = {
  title: "JAMB CBT Practice - Prepare, Practice, Pass",
  description: "Free JAMB CBT practice app with real past questions for all subjects. Practice anytime, anywhere!",
  keywords: "JAMB, CBT, practice, past questions, Nigeria, UTME",
 
    openGraph: {
    title: "JAMB CBT Practice",
    description: "Free JAMB CBT practice with real past questions!",
    url: "https://jamb-cbt-chi.vercel.app",
    siteName: "JAMB CBT Practice",
    type: "website",
    images: [
      {
        url: "https://jamb-cbt-chi.vercel.app/og-image.png",
        width: 400,
        height: 400,
        alt: "JAMB CBT Practice Logo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "JAMB CBT Practice",
    description: "Free JAMB CBT practice with real past questions!",
  },

 icons: {
  icon: "/favicon.ico",
  shortcut: "/favicon.ico",
  apple: "/logo.png",

  },

};

export const viewport = {
  themeColor: "#1a5c2a",
};
 
const registerSW = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) { console.log('SW registered'); })
        .catch(function(err) { console.log('SW error:', err); });
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(function(reg) { console.log('FCM SW registered'); })
        .catch(function(err) { console.log('FCM SW error:', err); });
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <link rel="manifest" href="/manifest.json" />
      <body>
        {children}
       <InstallPrompt />
       <UpdateNotification />
       <script dangerouslySetInnerHTML={{ __html: registerSW }} />
      </body>
    </html>
  );
}




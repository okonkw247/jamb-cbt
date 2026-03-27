import type { Metadata } from "next";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdateNotification from "@/components/UpdateNotification";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FeedbackButton from "@/components/FeedbackButton";

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
    images: [{ url: "https://jamb-cbt-chi.vercel.app/og-image.png", width: 400, height: 400, alt: "JAMB CBT Practice Logo" }],
  },
  twitter: { card: "summary_large_image", title: "JAMB CBT Practice", description: "Free JAMB CBT practice with real past questions!" },
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/logo.png" },
};

export const viewport = { themeColor: "#1a5c2a" };

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch(e) {}
  })();
`;

const registerSW = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function(err) { console.log('SW error:', err); });
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(function(err) { console.log('FCM SW error:', err); });
    });
  }
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JAMB CBT" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/splash-iphone-x.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-iphone8.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-android.png" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6685979500673281"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <SpeedInsights />
      <body>
        {children}
        <FeedbackButton />
        <InstallPrompt />
        <UpdateNotification />
        <script dangerouslySetInnerHTML={{ __html: registerSW }} />
      </body>
    </html>
  );
}

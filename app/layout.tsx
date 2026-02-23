import type { Metadata } from "next";
import "./globals.css";


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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}




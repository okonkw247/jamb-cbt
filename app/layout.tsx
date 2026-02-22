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
  },
  twitter: {
    card: "summary_large_image",
    title: "JAMB CBT Practice",
    description: "Free JAMB CBT practice with real past questions!",
  },

    icons: {
  icon: "/logo.svg",
  apple: "/logo.svg",
},


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




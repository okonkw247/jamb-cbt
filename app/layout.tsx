import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {

  title: "JAMB CBT Practice - Prepare, Practice, Pass",
  description: "Free JAMB CBT practice app with real past questions for all subjects. Practice anytime, anywhere!",

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




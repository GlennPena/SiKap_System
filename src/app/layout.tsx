import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "SiKap System • Youth Skills Profiling & Matchmaking | San Luis, Pampanga",
  description: "Dynamic youth skills profiling, matchmaking, and decision-support platform for SK Officials, KK Youth Members, and TESDA Partners in San Luis, Pampanga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[#FAFAF8] text-[#1C2B20]">
        {children}
      </body>
    </html>
  );
}

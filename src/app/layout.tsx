import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "SiKap | San Luis",
  description: "Dynamic youth skills profiling, matchmaking, and decision-support platform for SK Officials, KK Youth Members, and TESDA Partners in San Luis, Pampanga.",
  icons: {
    icon: "/sikap-logo.png",
    shortcut: "/sikap-logo.png",
    apple: "/sikap-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/sikap-logo.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[#FAFAF8] text-[#1C2B20] overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}

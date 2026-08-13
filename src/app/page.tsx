"use client";

import App from "@/App";
import { SessionProvider } from "next-auth/react";

export default function Page() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}

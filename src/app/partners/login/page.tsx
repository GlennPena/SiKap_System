"use client";

import { SessionProvider } from "next-auth/react";
import { TESDAPartnerLogin } from "@/components/TESDAPartnerLogin";

export default function PartnerLoginPage() {
  return (
    <SessionProvider>
      <TESDAPartnerLogin />
    </SessionProvider>
  );
}


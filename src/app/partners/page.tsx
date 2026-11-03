"use client";

import { SessionProvider } from "next-auth/react";
import { TESDAPartnerLandingPage } from "@/components/TESDAPartnerLandingPage";

export default function PartnersPage() {
  return (
    <SessionProvider>
      <TESDAPartnerLandingPage />
    </SessionProvider>
  );
}


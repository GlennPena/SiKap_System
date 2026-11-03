"use client";

import { SessionProvider } from "next-auth/react";
import { TESDAPartnerRegister } from "@/components/TESDAPartnerRegister";

export default function PartnerRegisterPage() {
  return (
    <SessionProvider>
      <TESDAPartnerRegister />
    </SessionProvider>
  );
}


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartnerRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?action=register&portal=partner");
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-8 h-8 border-4 border-[#0A6B43] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}


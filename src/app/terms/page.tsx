"use client";

import { TermsPage } from "@/components/TermsPage";
import { useRouter } from "next/navigation";

export default function TermsRoute() {
  const router = useRouter();

  return (
    <TermsPage
      onBack={() => router.push("/")}
      onNavigate={(tab) => {
        if (tab === "terms") router.push("/terms");
        else if (tab === "privacy") router.push("/privacy");
        else router.push(`/?action=${tab}`);
      }}
    />
  );
}

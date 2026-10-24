"use client";

import { PrivacyPolicyPage } from "@/components/PrivacyPolicyPage";
import { useRouter } from "next/navigation";

export default function PrivacyRoute() {
  const router = useRouter();

  return (
    <PrivacyPolicyPage
      onBack={() => router.push("/")}
      onNavigate={(tab) => {
        if (tab === "privacy") router.push("/privacy");
        else if (tab === "terms") router.push("/terms");
        else router.push(`/?action=${tab}`);
      }}
    />
  );
}

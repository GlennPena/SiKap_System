"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { ShieldAlert, ArrowLeft, Building2 } from "lucide-react";
import App from "@/App";
import { SikapLogo } from "@/components/ReusableComponents";

function PartnerDashboardGuard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/partners/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-6">
          <SikapLogo
            size={52}
            logoSize={68}
            textSize={44}
            showText={true}
            showSubtext={true}
            disableHover={true}
          />
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <div className="w-2 h-2 rounded-full bg-[#0A6B43] animate-ping" />
            <span>Verifying TESDA Partner Access...</span>
          </div>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;

  // Strictly block KK Youth and any non-TESDA_PARTNER accounts from accessing the TESDA Partner Dashboard
  if (userRole !== "TESDA_PARTNER") {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBF9] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl max-w-md w-full p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              <Building2 className="w-3.5 h-3.5" />
              <span>Restricted Institutional Route</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              TESDA Partner Access Only
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Your current account (<strong>{session?.user?.email}</strong>) does not have TESDA Partner permissions. KK Youth members and non-partner accounts cannot access the TESDA Partner Dashboard.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Portal</span>
            </Link>
            <Link
              href="/partners/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm font-bold transition-all"
            >
              Partner Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <App logoutRedirectTo="/partners" />;
}

export default function PartnerDashboardPage() {
  return (
    <SessionProvider>
      <PartnerDashboardGuard />
    </SessionProvider>
  );
}


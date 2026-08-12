import { NextResponse } from "next/server";
import { INITIAL_REFERRALS } from "@/data";
import { ReferralPipelineItem } from "@/types";

let referralsStore: ReferralPipelineItem[] = [...INITIAL_REFERRALS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barangay = searchParams.get("barangay");

  let result = referralsStore;
  if (barangay && barangay !== "All") {
    const cleanB = barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    result = result.filter(r => r.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanB);
  }

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReferral: ReferralPipelineItem = {
      id: body.id || `ref-${Date.now().toString().slice(-4)}`,
      youthName: body.youthName,
      purok: body.purok,
      barangay: body.barangay,
      programTitle: body.programTitle,
      matchScore: Number(body.matchScore) || 85,
      referralDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Pending"
    };

    referralsStore = [newReferral, ...referralsStore];
    return NextResponse.json({ success: true, data: newReferral }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const index = referralsStore.findIndex(r => r.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Referral not found" }, { status: 404 });
    }

    referralsStore[index] = { ...referralsStore[index], status: body.status };
    return NextResponse.json({ success: true, data: referralsStore[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

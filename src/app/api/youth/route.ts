import { NextResponse } from "next/server";
import { encryptAES256, decryptAES256 } from "@/lib/crypto";
import { INITIAL_YOUTH_PROFILES } from "@/data";
import { YouthProfile } from "@/types";

// In-memory store initialized from initial data (syncs with DB when DB is connected)
let youthStore: YouthProfile[] = INITIAL_YOUTH_PROFILES.map(y => ({
  ...y,
  contactNumber: decryptAES256(encryptAES256(y.contactNumber)) // test AES roundtrip
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barangay = searchParams.get("barangay");

  let result = youthStore;
  if (barangay && barangay !== "All") {
    const cleanB = barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    result = result.filter(y => y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanB);
  }

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Encrypt sensitive PII before persistence simulation
    const encryptedContact = encryptAES256(body.contactNumber || "");
    const encryptedVerificationId = body.verificationIdNumber ? encryptAES256(body.verificationIdNumber) : undefined;
    
    const newProfile: YouthProfile = {
      id: body.id || `y-${Date.now().toString().slice(-4)}`,
      name: body.name,
      age: Number(body.age),
      purok: body.purok,
      barangay: body.barangay,
      educationalAttainment: body.educationalAttainment,
      currentStatus: body.currentStatus,
      skills: Array.isArray(body.skills) ? body.skills : [],
      interests: Array.isArray(body.interests) ? body.interests : [],
      sectorPreference: body.sectorPreference,
      livelihoodGoal: body.livelihoodGoal,
      contactNumber: decryptAES256(encryptedContact), // decrypted for client consumption
      registeredDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      matchScore: body.matchScore || 85,
      soloParent: Boolean(body.soloParent),
      pwd: Boolean(body.pwd),
      indigenous: Boolean(body.indigenous),
      hasReferred: false,
      approvalStatus: body.approvalStatus || "Approved",
      verificationIdType: body.verificationIdType,
      verificationIdNumber: encryptedVerificationId ? decryptAES256(encryptedVerificationId) : undefined,
      verificationIdImage: body.verificationIdImage
    };

    youthStore = [newProfile, ...youthStore];
    return NextResponse.json({ success: true, data: newProfile }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = youthStore.findIndex(y => y.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Youth profile not found" }, { status: 404 });
    }

    youthStore[index] = { ...youthStore[index], ...body };
    return NextResponse.json({ success: true, data: youthStore[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

  youthStore = youthStore.filter(y => y.id !== id);
  return NextResponse.json({ success: true, message: "Profile deleted" });
}

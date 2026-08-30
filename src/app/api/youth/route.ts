import { NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/encryption";
import { decryptAES256 } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function safeDecrypt(enc: string | null | undefined): string {
  if (!enc) return "";
  try {
    if (enc.includes(":")) {
      return decryptAES256(enc);
    }
    return decrypt(enc);
  } catch (err) {
    console.error("Decryption failed:", err);
    return enc;
  }
}

function mapToClientProfile(y: any) {
  return {
    id: y.id,
    name: y.name,
    email: y.user?.email || y.email || "",
    age: y.age,
    purok: y.purok,
    barangay: y.barangay.name,
    educationalAttainment: y.educationalAttainment,
    currentStatus: y.currentStatus,
    skills: y.skills,
    interests: y.interests,
    sectorPreference: y.sectorPreference,
    livelihoodGoal: y.livelihoodGoal,
    contactNumber: safeDecrypt(y.contactNumberEncrypted),
    registeredDate: y.registeredDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    matchScore: y.matchScore,
    soloParent: y.soloParent,
    pwd: y.pwd,
    indigenous: y.indigenous,
    hasReferred: y.hasReferred,
    approvalStatus: y.approvalStatus,
    verificationIdType: y.verificationIdType,
    verificationIdNumber: safeDecrypt(y.verificationIdNumberEnc),
    verificationIdImage: safeDecrypt(y.verificationIdImageEnc),
    savedCareerPlan: y.savedCareerPlan ? (typeof y.savedCareerPlan === "string" && (y.savedCareerPlan.startsWith("{") || y.savedCareerPlan.startsWith("[")) ? JSON.parse(y.savedCareerPlan) : y.savedCareerPlan) : null
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterBarangay = searchParams.get("barangay");
    const roleStr = (session.user as any).role;
    
    let whereClause: any = {};

    if (roleStr === "SK_OFFICIAL" || roleStr === "BARANGAY_CAPTAIN") {
      whereClause.barangayId = (session.user as any).barangayId;
    } else if (roleStr === "KK_YOUTH") {
      whereClause.OR = [
        { userId: (session.user as any).id },
        { user: { email: (session.user as any).email } },
        { name: (session.user as any).name }
      ];
    } else if (roleStr === "TESDA_PARTNER") {
      // Only see youth who have at least one active referral
      whereClause.referrals = { some: {} };
    }
    
    // Explicit filter overrides if allowed (Super Admin, or searching within own barangay)
    if (filterBarangay && filterBarangay !== "All") {
      if (roleStr === "SUPER_ADMIN" || roleStr === "TESDA_PARTNER") {
        whereClause.barangay = { name: filterBarangay };
      }
    }

    const youths = await db.youthProfile.findMany({
      where: whereClause,
      include: { barangay: true, user: true, referrals: true },
      orderBy: { registeredDate: "desc" }
    });

    const result = youths.map(mapToClientProfile);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Youth GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const roleStr = (session.user as any).role;
    if (roleStr !== "KK_YOUTH" && roleStr !== "SK_OFFICIAL" && roleStr !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    const encryptedContact = encrypt(body.contactNumber || "");
    const encryptedVerificationId = body.verificationIdNumber ? encrypt(body.verificationIdNumber) : undefined;
    const encryptedImage = body.verificationIdImage ? encrypt(body.verificationIdImage) : undefined;

    let barangayId = body.barangayId;
    if (!barangayId) {
       const brgyName = body.barangay || "San Sebastian";
       const cleanName = brgyName.replace(/^Barangay\s+/i, "");
       let brgy = await db.barangay.findFirst({
         where: {
           OR: [
             { name: brgyName },
             { name: cleanName },
             { name: `Barangay ${cleanName}` }
           ]
         }
       });
       if (!brgy) {
         brgy = await db.barangay.create({ data: { name: cleanName } });
       }
       barangayId = brgy.id;
    }
    
    const newProfile = await db.youthProfile.create({
      data: {
        userId: roleStr === "KK_YOUTH" ? (session.user as any).id : undefined,
        name: body.name,
        age: Number(body.age),
        purok: body.purok,
        barangayId: barangayId,
        educationalAttainment: body.educationalAttainment,
        currentStatus: body.currentStatus,
        skills: Array.isArray(body.skills) ? body.skills : [],
        interests: Array.isArray(body.interests) ? body.interests : [],
        sectorPreference: body.sectorPreference,
        livelihoodGoal: body.livelihoodGoal,
        contactNumberEncrypted: encryptedContact,
        matchScore: body.matchScore || 85,
        soloParent: Boolean(body.soloParent),
        pwd: Boolean(body.pwd),
        indigenous: Boolean(body.indigenous),
        hasReferred: false,
        approvalStatus: body.approvalStatus || "Pending",
        verificationIdType: body.verificationIdType,
        verificationIdNumberEnc: encryptedVerificationId,
        verificationIdImageEnc: encryptedImage
      },
      include: { barangay: true }
    });

    return NextResponse.json({ success: true, data: mapToClientProfile(newProfile) }, { status: 201 });
  } catch (error: any) {
    console.error("Youth POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updateData: any = { ...body };
    delete updateData.id;
    delete updateData.barangay; // Ignore relation string update

    if (body.contactNumber) {
       updateData.contactNumberEncrypted = encrypt(body.contactNumber);
       delete updateData.contactNumber;
    }
    if (body.verificationIdNumber) {
       updateData.verificationIdNumberEnc = encrypt(body.verificationIdNumber);
       delete updateData.verificationIdNumber;
    }

    let planStringToSave: string | null = null;
    if (body.savedCareerPlan !== undefined) {
       planStringToSave = typeof body.savedCareerPlan === "object" ? JSON.stringify(body.savedCareerPlan) : body.savedCareerPlan;
       delete updateData.savedCareerPlan;
    }

    if (planStringToSave !== null) {
      await db.$executeRawUnsafe(
        `UPDATE "YouthProfile" SET "savedCareerPlan" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
        planStringToSave,
        body.id
      );
    }

    let updated: any = null;
    if (Object.keys(updateData).length > 0) {
      updated = await db.youthProfile.update({
        where: { id: body.id },
        data: updateData,
        include: { barangay: true }
      });
    } else {
      updated = await db.youthProfile.findUnique({
        where: { id: body.id },
        include: { barangay: true }
      });
    }

    return NextResponse.json({ success: true, data: mapToClientProfile(updated) });
  } catch (error: any) {
    console.error("Youth PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "SK_OFFICIAL") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    await db.youthProfile.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Profile deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role, ApprovalStatus } from "@prisma/client";
import { encrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      name, 
      barangay, 
      age, 
      purok, 
      educationalAttainment, 
      currentStatus, 
      skills, 
      interests, 
      sectorPreference, 
      livelihoodGoal, 
      contactNumber, 
      soloParent, 
      pwd, 
      indigenous, 
      verificationIdType, 
      verificationIdNumber, 
      verificationIdImage 
    } = body;

    if (!email || !password || !name || !barangay) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email is already registered" }, { status: 400 });
    }

    // Ensure barangay exists
    const brgy = await db.barangay.upsert({
      where: { name: barangay },
      update: {},
      create: { name: barangay }
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const contactNumberEncrypted = encrypt(contactNumber);
    const verificationIdNumberEnc = verificationIdNumber ? encrypt(verificationIdNumber) : null;
    const verificationIdImageEnc = verificationIdImage ? encrypt(verificationIdImage) : null;

    // Use transaction to create both User and YouthProfile
    const result = await db.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.KK_YOUTH,
          barangayId: brgy.id,
          status: "Active"
        }
      });

      const newProfile = await prisma.youthProfile.create({
        data: {
          userId: newUser.id,
          name,
          age: Number(age),
          purok,
          barangayId: brgy.id,
          educationalAttainment,
          currentStatus,
          skills: Array.isArray(skills) ? skills : [skills],
          interests: Array.isArray(interests) ? interests : [interests],
          sectorPreference,
          livelihoodGoal,
          contactNumberEncrypted,
          matchScore: Math.floor(Math.random() * 20) + 75,
          soloParent: Boolean(soloParent),
          pwd: Boolean(pwd),
          indigenous: Boolean(indigenous),
          approvalStatus: ApprovalStatus.Pending,
          verificationIdType,
          verificationIdNumberEnc,
          verificationIdImageEnc
        }
      });

      return { newUser, newProfile };
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      data: {
        id: result.newProfile.id,
        name: result.newProfile.name,
        age: result.newProfile.age,
        purok: result.newProfile.purok,
        barangay: brgy.name,
        educationalAttainment: result.newProfile.educationalAttainment,
        currentStatus: result.newProfile.currentStatus,
        skills: result.newProfile.skills,
        interests: result.newProfile.interests,
        sectorPreference: result.newProfile.sectorPreference,
        livelihoodGoal: result.newProfile.livelihoodGoal,
        contactNumber: contactNumber,
        registeredDate: result.newProfile.registeredDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        matchScore: result.newProfile.matchScore,
        soloParent: result.newProfile.soloParent,
        pwd: result.newProfile.pwd,
        indigenous: result.newProfile.indigenous,
        hasReferred: result.newProfile.hasReferred,
        approvalStatus: result.newProfile.approvalStatus,
        verificationIdType: result.newProfile.verificationIdType,
        verificationIdNumber: verificationIdNumber || undefined,
        verificationIdImage: verificationIdImage || undefined
      }
    });

  } catch (error: any) {
    console.error("Error in youth registration:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role, ApprovalStatus } from "@prisma/client";
import { encrypt } from "@/lib/encryption";
import { calculateContentBasedMatchScore } from "@/lib/cbf-matcher";
import { normalizeSkills, normalizePreferences, normalizeExperiences, normalizeGoal } from "@/lib/cbf-normalization";

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
      skillsRaw,
      preferencesRaw,
      experiencesRaw,
      goalRaw,
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

    // Ensure barangay exists cleanly
    const brgyName = barangay || "San Sebastian";
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

    const passwordHash = await bcrypt.hash(password, 10);

    const contactNumberEncrypted = encrypt(contactNumber);
    const verificationIdNumberEnc = verificationIdNumber ? encrypt(verificationIdNumber) : null;
    const verificationIdImageEnc = verificationIdImage ? encrypt(verificationIdImage) : null;

    // Process raw inputs for CBF
    const finalSkillsRaw: string[] = Array.isArray(skillsRaw) && skillsRaw.length > 0 
      ? skillsRaw 
      : (Array.isArray(skills) ? skills : (skills ? [skills] : []));

    const finalPreferencesRaw: string[] = Array.isArray(preferencesRaw) && preferencesRaw.length > 0
      ? preferencesRaw
      : (Array.isArray(interests) && interests.length > 0 ? interests : [sectorPreference].filter(Boolean));

    const finalExperiencesRaw: string[] = Array.isArray(experiencesRaw) ? experiencesRaw : [];
    const finalGoalRaw: string = goalRaw || livelihoodGoal || "";

    // Backend normalization
    const normalizedSkills = normalizeSkills(finalSkillsRaw);
    const normalizedPreferences = normalizePreferences(finalPreferencesRaw);
    const normalizedExperiences = normalizeExperiences(finalExperiencesRaw);
    const normalizedGoal = normalizeGoal(finalGoalRaw);

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

      const activePrograms = await prisma.tESDAProgram.findMany({ where: { activeStatus: "Active" } });
      const tempYouth = {
        name,
        skills: finalSkillsRaw,
        interests: finalPreferencesRaw,
        sectorPreference: sectorPreference || (finalPreferencesRaw[0] || ""),
        livelihoodGoal: finalGoalRaw,
        skillsRaw: finalSkillsRaw,
        preferencesRaw: finalPreferencesRaw,
        experiencesRaw: finalExperiencesRaw,
        goalRaw: finalGoalRaw,
        skillsNormalized: normalizedSkills,
        preferencesNormalized: normalizedPreferences,
        experiencesNormalized: normalizedExperiences,
        goalNormalized: normalizedGoal,
        educationalAttainment: educationalAttainment || "",
        currentStatus: currentStatus || "Out-of-school"
      };

      const calculatedScore = activePrograms.length > 0
        ? Math.max(...activePrograms.map(p => calculateContentBasedMatchScore(tempYouth as any, p as any)))
        : 50;

      const newProfile = await prisma.youthProfile.create({
        data: {
          userId: newUser.id,
          name,
          age: Number(age),
          purok,
          barangayId: brgy.id,
          educationalAttainment,
          currentStatus: currentStatus || "Out-of-school",
          skills: finalSkillsRaw,
          interests: finalPreferencesRaw,
          sectorPreference: sectorPreference || (finalPreferencesRaw[0] || ""),
          livelihoodGoal: finalGoalRaw,
          skillsRaw: finalSkillsRaw,
          preferencesRaw: finalPreferencesRaw,
          experiencesRaw: finalExperiencesRaw,
          goalRaw: finalGoalRaw,
          skillsNormalized: normalizedSkills as any,
          preferencesNormalized: normalizedPreferences as any,
          experiencesNormalized: normalizedExperiences as any,
          goalNormalized: normalizedGoal as any,
          contactNumberEncrypted,
          matchScore: calculatedScore,
          soloParent: Boolean(soloParent),
          pwd: Boolean(pwd),
          indigenous: Boolean(indigenous),
          approvalStatus: body.approvalStatus === "Approved" ? ApprovalStatus.Approved : ApprovalStatus.Pending,
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
        email: result.newUser.email,
        age: result.newProfile.age,
        purok: result.newProfile.purok,
        barangay: brgy.name,
        educationalAttainment: result.newProfile.educationalAttainment,
        currentStatus: result.newProfile.currentStatus,
        skills: result.newProfile.skills,
        interests: result.newProfile.interests,
        sectorPreference: result.newProfile.sectorPreference,
        livelihoodGoal: result.newProfile.livelihoodGoal,
        skillsRaw: result.newProfile.skillsRaw,
        preferencesRaw: result.newProfile.preferencesRaw,
        experiencesRaw: result.newProfile.experiencesRaw,
        goalRaw: result.newProfile.goalRaw,
        skillsNormalized: result.newProfile.skillsNormalized,
        preferencesNormalized: result.newProfile.preferencesNormalized,
        experiencesNormalized: result.newProfile.experiencesNormalized,
        goalNormalized: result.newProfile.goalNormalized,
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

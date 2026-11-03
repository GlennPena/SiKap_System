import { NextResponse } from "next/server";
// actually next/server
import { db, sanitizeApiError } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "BARANGAY_CAPTAIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const users = await db.user.findMany({
      where: {
        role: { in: ["SK_OFFICIAL", "BARANGAY_CAPTAIN", "TESDA_PARTNER"] }
      },
      include: { barangay: true, councilor: true, officialAcc: true },
      orderBy: { createdAt: "desc" }
    });

    // Only include executive officials (SK Chairperson, Barangay Captain, TVET Partner Liaison / TESDA Representative).
    // Appointed councilors, secretaries, and treasurers are managed separately via /api/councilors.
    const formatted = users
      .filter(u => !u.councilor)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role === "SK_OFFICIAL"
          ? "SK Chairperson"
          : u.role === "BARANGAY_CAPTAIN"
          ? "Barangay Captain"
          : (u.officialAcc?.role || (u.email.includes("gpsat") ? "TESDA Representative" : "TVET Partner Liaison")),
        barangay: u.barangay?.name,
        status: u.status,
        dateCreated: u.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        institutionName: u.officialAcc?.institutionName || (u.role === "TESDA_PARTNER" && (u.email.includes("gpsat") || u.name.includes("GPSAT")) ? "Gonzalo Puyat School of Arts and Trades (GPSAT)" : undefined),
        cptrNumber: u.officialAcc?.cptrNumber || undefined,
        contactNumber: u.officialAcc?.contactNumber || u.contactNumber || undefined
      }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { name, email, tempPassword, role, barangay, institutionName, cptrNumber } = await req.json();

    if (!name || !email || !tempPassword || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    let mappedRole: Role = Role.SK_OFFICIAL;
    if (role === "Barangay Captain") mappedRole = Role.BARANGAY_CAPTAIN;
    if (role === "TESDA Representative" || role === "TVET Partner Liaison") mappedRole = Role.TESDA_PARTNER;

    let barangayId = undefined;
    
    if (barangay && mappedRole !== "TESDA_PARTNER") {
      const brgy = await db.barangay.upsert({
        where: { name: barangay },
        update: {},
        create: { name: barangay }
      });
      barangayId = brgy.id;
    }

    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: mappedRole,
        barangayId,
        status: "Active"
      },
      include: { barangay: true }
    });

    if (mappedRole === Role.TESDA_PARTNER) {
      await db.officialAccount.create({
        data: {
          userId: newUser.id,
          name,
          email,
          role: role === "TESDA Representative" ? "TESDA Representative" : "TVET Partner Liaison",
          status: "Active",
          institutionName: institutionName || (email.includes("gpsat") ? "Gonzalo Puyat School of Arts and Trades (GPSAT)" : undefined),
          cptrNumber: cptrNumber || undefined
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role,
        barangay: newUser.barangay?.name,
        status: newUser.status,
        dateCreated: newUser.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        institutionName: institutionName || undefined,
        cptrNumber: cptrNumber || undefined
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const isSuperAdmin = (session.user as any).role === "SUPER_ADMIN";
    const body = await req.json();

    // 1. Super Admin Administrative Actions on another user account
    if ((body.targetUserId || body.targetEmail || body.youthProfileId) && isSuperAdmin) {
      let targetUser = null;
      if (body.targetUserId) {
        targetUser = await db.user.findUnique({ where: { id: body.targetUserId } });
      }
      if (!targetUser && body.targetEmail) {
        targetUser = await db.user.findUnique({ where: { email: body.targetEmail.toLowerCase().trim() } });
      }
      if (!targetUser && body.youthProfileId) {
        const yp = await db.youthProfile.findUnique({
          where: { id: body.youthProfileId },
          include: { user: true }
        });
        if (yp?.user) {
          targetUser = yp.user;
        } else if (yp?.userId) {
          targetUser = await db.user.findUnique({ where: { id: yp.userId } });
        }
      }

      if (!targetUser) {
        return NextResponse.json({ success: false, message: "Target user account not found" }, { status: 404 });
      }

      let adminUpdateData: any = {};

      // Status toggle (Active vs Suspended)
      if (body.status !== undefined) {
        adminUpdateData.status = body.status;
      }

      // Password Reset to new temporary password
      if (body.newTempPassword) {
        adminUpdateData.passwordHash = await bcrypt.hash(body.newTempPassword, 10);
      }

      const updated = await db.user.update({
        where: { id: targetUser.id },
        data: adminUpdateData,
        include: { barangay: true }
      });

      // Also update officialAccount status if exists
      if (body.status !== undefined) {
        await db.officialAccount.updateMany({
          where: { userId: targetUser.id },
          data: { status: body.status }
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          status: updated.status,
          barangay: updated.barangay?.name
        },
        message: body.newTempPassword 
          ? `Password for ${updated.name} reset successfully!` 
          : `Account status for ${updated.name} set to ${updated.status}.`
      });
    }

    // 2. Standard User Self-Update
    const userId = currentUserId;
    const { name, email, currentPassword, newPassword, institutionName, centerName, contactNumber, phone, representativeName } = body;
    const resolvedInstitution = institutionName || centerName;
    const resolvedPhone = contactNumber || phone;
    const resolvedRepName = representativeName || name;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (resolvedPhone) updateData.contactNumber = resolvedPhone;

    // Password change validation
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "Current password is required to set a new password" }, { status: 400 });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ success: false, message: "Incorrect current password" }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: { barangay: true }
    });

    // Update Councilor record if applicable
    if (name || email || resolvedPhone) {
      await db.councilor.updateMany({
        where: { userId: userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email: email.toLowerCase() } : {}),
          ...(resolvedPhone ? { contactNumber: resolvedPhone } : {})
        }
      }).catch(() => {});
    }

    // Update or upsert OfficialAccount record
    const officialUpdateData: any = {};
    if (resolvedRepName) officialUpdateData.name = resolvedRepName;
    if (email) officialUpdateData.email = email.toLowerCase();
    if (resolvedInstitution) officialUpdateData.institutionName = resolvedInstitution;
    if (resolvedPhone) officialUpdateData.contactNumber = resolvedPhone;

    let refreshedOfficialAcc: any = null;
    if (Object.keys(officialUpdateData).length > 0) {
      const existingAcc = await db.officialAccount.findUnique({ where: { userId: userId } });
      if (existingAcc) {
        refreshedOfficialAcc = await db.officialAccount.update({
          where: { userId: userId },
          data: officialUpdateData
        });
      } else if (user.role === Role.TESDA_PARTNER || user.role === Role.BARANGAY_CAPTAIN || user.role === Role.SK_OFFICIAL) {
        refreshedOfficialAcc = await db.officialAccount.create({
          data: {
            userId: userId,
            name: resolvedRepName || user.name,
            email: (email || user.email).toLowerCase(),
            role: user.role === Role.TESDA_PARTNER ? "TVET Partner Liaison" : user.role === Role.BARANGAY_CAPTAIN ? "Barangay Captain" : "SK Chairperson",
            status: "Active",
            institutionName: resolvedInstitution || undefined,
            contactNumber: resolvedPhone || undefined
          }
        });
      }
    } else {
      refreshedOfficialAcc = await db.officialAccount.findUnique({ where: { userId: userId } });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        barangay: updatedUser.barangay?.name,
        contactNumber: updatedUser.contactNumber || refreshedOfficialAcc?.contactNumber,
        institutionName: refreshedOfficialAcc?.institutionName,
        representativeName: refreshedOfficialAcc?.name || updatedUser.name
      },
      message: newPassword ? "Profile and password updated successfully!" : "Profile updated successfully!"
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ success: false, message: sanitizeApiError(error, "Failed to update profile") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "Missing user ID" }, { status: 400 });

    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Official account deleted successfully from database" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ success: false, message: sanitizeApiError(error, "Failed to delete user") }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db, sanitizeApiError } from "@/lib/db";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, action, rejectionReason } = body;

    if (!id || (action !== "Approved" && action !== "Rejected")) {
      return NextResponse.json(
        { success: false, message: "Invalid review parameters. ID and valid action (Approved | Rejected) are required." },
        { status: 400 }
      );
    }

    const application = await db.providerApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Provider application not found." },
        { status: 404 }
      );
    }

    const reviewerName = (session.user as any)?.name || "SK President of San Luis";

    if (action === "Approved") {
      // 1. Check if user already exists
      let user = await db.user.findUnique({
        where: { email: application.email }
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email: application.email,
            name: application.institutionName,
            passwordHash: application.passwordHash,
            role: Role.TESDA_PARTNER,
            status: "Active"
          }
        });
      } else {
        // Reactivate or update role if existed
        user = await db.user.update({
          where: { id: user.id },
          data: {
            name: application.institutionName,
            passwordHash: application.passwordHash,
            role: Role.TESDA_PARTNER,
            status: "Active"
          }
        });
      }

      // 2. Create or update OfficialAccount for liaison officer
      const existingOfficial = await db.officialAccount.findUnique({
        where: { userId: user.id }
      });

      const assignedRole = application.providerType?.includes("Public")
        ? "TESDA Representative"
        : "TVET Partner Liaison";

      if (!existingOfficial) {
        await db.officialAccount.create({
          data: {
            userId: user.id,
            name: application.representativeName,
            email: application.email,
            role: assignedRole,
            status: "Active",
            institutionName: application.institutionName,
            cptrNumber: application.cptrNumber
          }
        });
      } else {
        await db.officialAccount.update({
          where: { userId: user.id },
          data: {
            name: application.representativeName,
            email: application.email,
            role: assignedRole,
            status: "Active",
            institutionName: application.institutionName,
            cptrNumber: application.cptrNumber
          }
        });
      }

      // 3. Mark application Approved
      const updatedApp = await db.providerApplication.update({
        where: { id },
        data: {
          status: "Approved",
          rejectionReason: null,
          reviewedBy: reviewerName,
          reviewedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully verified CPTR and approved ${application.institutionName}. Partner account is now active!`,
        data: updatedApp
      });
    } else {
      // Action === "Rejected"
      const reason = rejectionReason?.trim() || "CPTR certificate accreditation could not be validated.";

      const updatedApp = await db.providerApplication.update({
        where: { id },
        data: {
          status: "Rejected",
          rejectionReason: reason,
          reviewedBy: reviewerName,
          reviewedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Application for ${application.institutionName} marked as declined.`,
        data: updatedApp
      });
    }
  } catch (error: any) {
    console.error("Error in POST /api/provider-applications/review:", error);
    return NextResponse.json(
      { success: false, message: sanitizeApiError(error, "Failed to process application review.") },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { db, sanitizeApiError } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Public endpoint: Submit Training Provider Application with CPTR
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      institutionName,
      providerType,
      campusAddress,
      representativeName,
      representativePosition,
      email,
      contactNumber,
      password,
      cptrNumber,
      cptrDocument
    } = body;

    if (
      !institutionName?.trim() ||
      !providerType?.trim() ||
      !campusAddress?.trim() ||
      !representativeName?.trim() ||
      !representativePosition?.trim() ||
      !email?.trim() ||
      !contactNumber?.trim() ||
      !password ||
      !cptrNumber?.trim() ||
      !cptrDocument
    ) {
      return NextResponse.json(
        { success: false, message: "Please fill in all required institutional details and upload your CPTR certificate." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid official email address." },
        { status: 400 }
      );
    }

    // 2. Check if email already belongs to an existing User
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail }
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An active account with this email address already exists in the system. Please sign in or use a different email." },
        { status: 409 }
      );
    }

    // 3. Check if there is already a Pending application with this email
    const existingApp = await db.providerApplication.findUnique({
      where: { email: cleanEmail }
    });
    if (existingApp && existingApp.status === "Pending") {
      return NextResponse.json(
        { success: false, message: "An application with this email is already submitted and currently under review by the SK President of San Luis." },
        { status: 409 }
      );
    }

    // 4. Hash the password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create or update the ProviderApplication record
    const application = existingApp
      ? await db.providerApplication.update({
          where: { email: cleanEmail },
          data: {
            institutionName: institutionName.trim(),
            providerType: providerType.trim(),
            campusAddress: campusAddress.trim(),
            representativeName: representativeName.trim(),
            representativePosition: representativePosition.trim(),
            contactNumber: contactNumber.trim(),
            passwordHash,
            cptrNumber: cptrNumber.trim().toUpperCase(),
            cptrDocument,
            status: "Pending",
            rejectionReason: null,
            reviewedBy: null,
            reviewedAt: null
          }
        })
      : await db.providerApplication.create({
          data: {
            institutionName: institutionName.trim(),
            providerType: providerType.trim(),
            campusAddress: campusAddress.trim(),
            representativeName: representativeName.trim(),
            representativePosition: representativePosition.trim(),
            email: cleanEmail,
            contactNumber: contactNumber.trim(),
            passwordHash,
            cptrNumber: cptrNumber.trim().toUpperCase(),
            cptrDocument,
            status: "Pending"
          }
        });

    return NextResponse.json(
      {
        success: true,
        message: "Your training provider application has been submitted successfully! The SK President of San Luis will verify your CPTR accreditation.",
        data: {
          id: application.id,
          institutionName: application.institutionName,
          status: application.status
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/provider-applications:", error);
    return NextResponse.json(
      { success: false, message: sanitizeApiError(error, "Failed to submit training provider application.") },
      { status: 500 }
    );
  }
}

// Protected endpoint: Super Admin fetches list of provider applications
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Super Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const whereClause: any = {};
    if (statusFilter && statusFilter !== "All") {
      whereClause.status = statusFilter;
    }

    const applications = await db.providerApplication.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        institutionName: true,
        providerType: true,
        campusAddress: true,
        representativeName: true,
        representativePosition: true,
        email: true,
        contactNumber: true,
        cptrNumber: true,
        cptrDocument: true,
        status: true,
        rejectionReason: true,
        reviewedBy: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const formatted = applications.map(app => ({
      ...app,
      createdAt: app.createdAt.toISOString(),
      reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : undefined,
      updatedAt: app.updatedAt ? app.updatedAt.toISOString() : undefined
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Error in GET /api/provider-applications:", error);
    return NextResponse.json(
      { success: false, message: sanitizeApiError(error, "Failed to fetch provider applications.") },
      { status: 500 }
    );
  }
}


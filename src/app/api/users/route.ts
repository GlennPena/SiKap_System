import { NextResponse } from "next/server";
// actually next/server
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const users = await db.user.findMany({
      where: {
        role: { in: ["SK_OFFICIAL", "BARANGAY_CAPTAIN", "TESDA_PARTNER"] }
      },
      include: { barangay: true },
      orderBy: { createdAt: "desc" }
    });

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role === "SK_OFFICIAL" ? "SK Chairperson" : u.role === "BARANGAY_CAPTAIN" ? "Barangay Captain" : "TESDA Representative",
      barangay: u.barangay?.name,
      status: u.status,
      dateCreated: u.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
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

    const { name, email, tempPassword, role, barangay } = await req.json();

    if (!name || !email || !tempPassword || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    let mappedRole: Role = Role.SK_OFFICIAL;
    if (role === "Barangay Captain") mappedRole = Role.BARANGAY_CAPTAIN;
    if (role === "TESDA Representative") mappedRole = Role.TESDA_PARTNER;

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

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role,
        barangay: newUser.barangay?.name,
        status: newUser.status,
        dateCreated: newUser.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
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

    const userId = (session.user as any).id;
    const { name, email, currentPassword, newPassword } = await req.json();

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();

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

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        barangay: updatedUser.barangay?.name
      },
      message: newPassword ? "Profile and password updated successfully!" : "Profile updated successfully!"
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to update profile" }, { status: 500 });
  }
}

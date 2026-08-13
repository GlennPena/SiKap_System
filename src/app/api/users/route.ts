import { NextResponse } from "next/server";
// actually next/server
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapToCouncilor(c: any) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role || "SK Councilor",
    contactNumber: c.contactNumber || undefined,
    status: c.status || "Active",
    dateCreated: c.createdAt ? c.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today",
    barangay: c.barangay?.name || "San Sebastian"
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
    } else if (filterBarangay && (roleStr === "SUPER_ADMIN" || roleStr === "TESDA_PARTNER")) {
      whereClause.barangay = { name: filterBarangay };
    }

    const councilors = await db.councilor.findMany({
      where: whereClause,
      include: { barangay: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: councilors.map(mapToCouncilor) });
  } catch (error: any) {
    console.error("Councilors GET Error:", error);
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
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "SK_OFFICIAL") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, password, contactNumber, barangay } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email is already registered" }, { status: 400 });
    }

    // Determine barangay ID
    let barangayId = (session.user as any).barangayId;
    if (!barangayId && barangay) {
      const cleanBrgy = barangay.replace(/^Barangay\s+/i, "");
      const b = await db.barangay.findFirst({
        where: {
          OR: [
            { name: barangay },
            { name: cleanBrgy },
            { name: `Barangay ${cleanBrgy}` }
          ]
        }
      });
      if (b) barangayId = b.id;
    }

    if (!barangayId) {
      const defaultBrgy = await db.barangay.findFirst({ where: { name: { contains: "San Sebastian", mode: "insensitive" } } });
      if (defaultBrgy) barangayId = defaultBrgy.id;
    }

    // Council Quota Check: 7 SK Councilors, 2 Secretaries, 2 Treasurers (Max 11 per barangay)
    const targetRole = role || "SK Councilor";
    const existingInBrgy = await db.councilor.findMany({
      where: { barangayId }
    });

    if (existingInBrgy.length >= 11) {
      return NextResponse.json({
        success: false,
        message: "Council roster is at full capacity (Maximum of 11 members: 7 Councilors, 2 Secretaries, 2 Treasurers)."
      }, { status: 400 });
    }

    const councilorsCount = existingInBrgy.filter(c => c.role === "SK Councilor").length;
    const secretariesCount = existingInBrgy.filter(c => c.role === "Secretary").length;
    const treasurersCount = existingInBrgy.filter(c => c.role === "Treasurer").length;

    if (targetRole === "SK Councilor" && councilorsCount >= 7) {
      return NextResponse.json({
        success: false,
        message: "Quota reached: Maximum of 7 SK Councilors allowed per barangay."
      }, { status: 400 });
    }
    if (targetRole === "Secretary" && secretariesCount >= 2) {
      return NextResponse.json({
        success: false,
        message: "Quota reached: Maximum of 2 Secretaries allowed per barangay."
      }, { status: 400 });
    }
    if (targetRole === "Treasurer" && treasurersCount >= 2) {
      return NextResponse.json({
        success: false,
        message: "Quota reached: Maximum of 2 Treasurers allowed per barangay."
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record for auth login
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: Role.SK_OFFICIAL,
        barangayId: barangayId,
        status: "Active"
      }
    });

    // Create Councilor profile record
    const newCouncilor = await db.councilor.create({
      data: {
        userId: newUser.id,
        name,
        email,
        role: targetRole,
        contactNumber: contactNumber || null,
        status: "Active",
        barangayId: barangayId
      },
      include: { barangay: true }
    });

    return NextResponse.json({
      success: true,
      data: mapToCouncilor(newCouncilor),
      message: `Account created for ${targetRole} ${name}!`
    }, { status: 201 });

  } catch (error: any) {
    console.error("Councilors POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "SK_OFFICIAL") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, contactNumber, status } = body;

    if (!id) return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });

    const existingCouncilor = await db.councilor.findUnique({ where: { id } });
    if (!existingCouncilor) {
      return NextResponse.json({ success: false, message: "Councilor not found" }, { status: 404 });
    }

    // Role reassignment quota check if changing role
    if (role && role !== existingCouncilor.role) {
      const otherMembers = await db.councilor.findMany({
        where: { barangayId: existingCouncilor.barangayId, id: { not: id } }
      });
      const cCount = otherMembers.filter(c => c.role === "SK Councilor").length;
      const sCount = otherMembers.filter(c => c.role === "Secretary").length;
      const tCount = otherMembers.filter(c => c.role === "Treasurer").length;

      if (role === "SK Councilor" && cCount >= 7) {
        return NextResponse.json({ success: false, message: "Cannot reassign: Maximum 7 SK Councilors reached." }, { status: 400 });
      }
      if (role === "Secretary" && sCount >= 2) {
        return NextResponse.json({ success: false, message: "Cannot reassign: Maximum 2 Secretaries reached." }, { status: 400 });
      }
      if (role === "Treasurer" && tCount >= 2) {
        return NextResponse.json({ success: false, message: "Cannot reassign: Maximum 2 Treasurers reached." }, { status: 400 });
      }
    }

    const updated = await db.councilor.update({
      where: { id },
      data: {
        name,
        email,
        role,
        contactNumber,
        status
      },
      include: { barangay: true }
    });

    // If linked to User, update User name/email/status as well
    if (updated.userId) {
      await db.user.update({
        where: { id: updated.userId },
        data: {
          name,
          email,
          status
        }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: mapToCouncilor(updated) });
  } catch (error: any) {
    console.error("Councilors PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "SK_OFFICIAL") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const councilor = await db.councilor.findUnique({ where: { id } });
    if (councilor?.userId) {
      await db.user.delete({ where: { id: councilor.userId } }).catch(() => {});
    }
    await db.councilor.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Councilor account deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

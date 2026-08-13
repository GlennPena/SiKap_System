import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

function mapToAnnouncement(a: any) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category,
    audience: a.audience,
    datePosted: a.datePosted.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    barangay: a.barangay?.name
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

    if (roleStr === "SK_OFFICIAL" || roleStr === "BARANGAY_CAPTAIN" || roleStr === "KK_YOUTH") {
       whereClause.OR = [
         { barangayId: (session.user as any).barangayId },
         { barangayId: null } // System-wide announcements
       ];
    }
    
    if (filterBarangay && (roleStr === "SUPER_ADMIN" || roleStr === "TESDA_PARTNER")) {
       whereClause.OR = [
         { barangay: { name: filterBarangay } },
         { barangayId: null }
       ];
    }

    const announcements = await db.sKAnnouncement.findMany({
      where: whereClause,
      include: { barangay: true },
      orderBy: { datePosted: "desc" }
    });

    return NextResponse.json({ success: true, data: announcements.map(mapToAnnouncement) });
  } catch (error: any) {
    console.error("Announcements GET Error:", error);
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
    
    let barangayId = null;
    if (roleStr === "SK_OFFICIAL") {
       barangayId = (session.user as any).barangayId;
    } else if (body.barangay) {
       const b = await db.barangay.findUnique({ where: { name: body.barangay } });
       if (b) barangayId = b.id;
    }

    const newAnnouncement = await db.sKAnnouncement.create({
      data: {
        title: body.title,
        body: body.body,
        category: body.category || "Program Update",
        audience: body.audience || "All KK members",
        barangayId: barangayId
      },
      include: { barangay: true }
    });

    return NextResponse.json({ success: true, data: mapToAnnouncement(newAnnouncement) }, { status: 201 });
  } catch (error: any) {
    console.error("Announcements POST Error:", error);
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

    await db.sKAnnouncement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

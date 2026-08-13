import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const programs = await db.tESDAProgram.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error: any) {
    console.error("Programs GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    const newProgram = await db.tESDAProgram.create({
      data: {
        title: body.title,
        provider: body.provider || "TESDA Pampanga",
        type: body.type || "Training",
        location: body.location || "San Luis Training Center",
        duration: body.duration || "120 Hours",
        cost: body.cost || "Free",
        slotsTotal: Number(body.slotsTotal) || 25,
        slotsRemaining: Number(body.slotsTotal) || 25,
        youthMatched: 0,
        eligibility: body.eligibility || "Open to all San Luis OSY youth",
        contactPerson: body.contactPerson || "TESDA Registrar",
        contactNumber: body.contactNumber || "+63 917 000 1122",
        activeStatus: "Active",
        requiredDocuments: body.requiredDocuments || ["Birth Certificate", "2x2 Picture"],
        requiredSkills: body.requiredSkills || [],
        classScheduleDays: body.classScheduleDays,
        classScheduleTime: body.classScheduleTime,
        room: body.room,
        instructor: body.instructor,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      }
    });

    return NextResponse.json({ success: true, data: newProgram }, { status: 201 });
  } catch (error: any) {
    console.error("Programs POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updateData: any = { ...body };
    delete updateData.id;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const updated = await db.tESDAProgram.update({
      where: { id: body.id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Programs PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    await db.tESDAProgram.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Program deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

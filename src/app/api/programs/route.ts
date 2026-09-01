import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const programs = await db.tESDAProgram.findMany({
      where: {
        activeStatus: { not: "Closed" }
      },
      include: {
        category: true
      },
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
    
    // Backend Validation
    if (body.trainingHours <= 0) return NextResponse.json({ success: false, message: "Training hours must be greater than 0" }, { status: 400 });
    if (!body.trainingDays || body.trainingDays.length === 0) return NextResponse.json({ success: false, message: "At least one training day must be selected" }, { status: 400 });
    
    const startDateTime = body.startTime ? new Date(`1970-01-01T${body.startTime}:00Z`) : null;
    const endDateTime = body.endTime ? new Date(`1970-01-01T${body.endTime}:00Z`) : null;
    
    if (startDateTime && endDateTime && startDateTime >= endDateTime) return NextResponse.json({ success: false, message: "Start time must be before end time" }, { status: 400 });
    if (body.startDate && body.endDate && new Date(body.startDate) > new Date(body.endDate)) return NextResponse.json({ success: false, message: "Start date must be before or equal to end date" }, { status: 400 });

    const newProgram = await db.tESDAProgram.create({
      data: {
        title: body.title,
        provider: body.provider || "TESDA Pampanga",
        type: body.type || "Training",
        location: body.location || "San Luis Training Center",
        trainingHours: Number(body.trainingHours),
        cost: body.cost || "Free",
        slotsTotal: Number(body.slotsTotal) || 25,
        slotsRemaining: Number(body.slotsTotal) || 25,
        youthMatched: 0,
        eligibility: body.eligibility || "Open to all San Luis OSY youth",
        contactPerson: body.contactPerson || "TESDA Registrar",
        contactNumber: body.contactNumber || "+63 917 000 1122",
        activeStatus: "Active",
        categoryId: body.categoryId || undefined,
        requiredDocuments: body.requiredDocuments || ["Birth Certificate", "2x2 Picture"],
        requiredSkills: body.requiredSkills || [],
        trainingDays: body.trainingDays,
        startTime: startDateTime,
        endTime: endDateTime,
        room: body.room,
        instructor: body.instructor,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      },
      include: {
        category: true
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

    // Backend Validation
    if (body.trainingHours !== undefined && body.trainingHours <= 0) return NextResponse.json({ success: false, message: "Training hours must be greater than 0" }, { status: 400 });
    if (body.trainingDays !== undefined && (!body.trainingDays || body.trainingDays.length === 0)) return NextResponse.json({ success: false, message: "At least one training day must be selected" }, { status: 400 });
    
    const updateData: any = { ...body };
    delete updateData.id;
    
    if (updateData.startTime) {
      updateData.startTime = new Date(`1970-01-01T${updateData.startTime}:00Z`);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(`1970-01-01T${updateData.endTime}:00Z`);
    }

    if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
      return NextResponse.json({ success: false, message: "Start time must be before end time" }, { status: 400 });
    }
    
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    
    if (updateData.startDate && updateData.endDate && updateData.startDate > updateData.endDate) {
      return NextResponse.json({ success: false, message: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const updated = await db.tESDAProgram.update({
      where: { id: body.id },
      data: updateData,
      include: {
        category: true
      }
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

    const prog = await db.tESDAProgram.findUnique({ where: { id } });
    if (!prog) return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });

    // 1. Soft delete / archive program
    const updated = await db.tESDAProgram.update({
      where: { id },
      data: { activeStatus: "Closed" }
    });

    // 2. Archive all enrolled students/referrals in this program
    const archivedRefs = await db.referral.updateMany({
      where: {
        programId: id,
        status: "Enrolled"
      },
      data: { status: "Archived" }
    });

    return NextResponse.json({
      success: true,
      message: `Program "${prog.title}" and ${archivedRefs.count} enrolled student record(s) have been archived.`,
      data: updated,
      archivedStudentsCount: archivedRefs.count
    });
  } catch (error: any) {
    console.error("Programs DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

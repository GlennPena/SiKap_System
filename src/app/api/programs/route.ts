import { NextResponse } from "next/server";
import { INITIAL_TESDA_PROGRAMS } from "@/data";
import { TESDAProgram } from "@/types";

let programsStore: TESDAProgram[] = [...INITIAL_TESDA_PROGRAMS];

export async function GET() {
  return NextResponse.json({ success: true, data: programsStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProgram: TESDAProgram = {
      id: body.id || `p-${Date.now().toString().slice(-4)}`,
      title: body.title,
      provider: body.provider || "TESDA Pampanga / Provincial Training Center",
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
      classScheduleDays: body.classScheduleDays,
      classScheduleTime: body.classScheduleTime,
      room: body.room,
      instructor: body.instructor,
      startDate: body.startDate,
      endDate: body.endDate
    };

    programsStore = [newProgram, ...programsStore];
    return NextResponse.json({ success: true, data: newProgram }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = programsStore.findIndex(p => p.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    programsStore[index] = { ...programsStore[index], ...body };
    return NextResponse.json({ success: true, data: programsStore[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

  programsStore = programsStore.filter(p => p.id !== id);
  return NextResponse.json({ success: true, message: "Program deleted" });
}

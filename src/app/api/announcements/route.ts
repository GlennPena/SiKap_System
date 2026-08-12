import { NextResponse } from "next/server";
import { INITIAL_ANNOUNCEMENTS } from "@/data";
import { SKAnnouncement } from "@/types";

let announcementsStore: SKAnnouncement[] = [...INITIAL_ANNOUNCEMENTS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barangay = searchParams.get("barangay");

  let result = announcementsStore;
  if (barangay) {
    const cleanB = barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    result = result.filter(a => !a.barangay || a.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanB);
  }

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAnnouncement: SKAnnouncement = {
      id: body.id || `ann-${Date.now().toString().slice(-4)}`,
      title: body.title,
      body: body.body,
      category: body.category || "Program Update",
      audience: body.audience || "All KK members",
      datePosted: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      barangay: body.barangay
    };

    announcementsStore = [newAnnouncement, ...announcementsStore];
    return NextResponse.json({ success: true, data: newAnnouncement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

  announcementsStore = announcementsStore.filter(a => a.id !== id);
  return NextResponse.json({ success: true, message: "Announcement deleted" });
}

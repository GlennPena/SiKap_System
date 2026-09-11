import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    console.error("Error checking email existence:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}

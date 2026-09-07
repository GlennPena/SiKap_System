import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    let pref = await db.notificationPreference.findUnique({
      where: { userId }
    });

    if (!pref) {
      // Default preferences
      pref = {
        id: "default",
        userId,
        pushEnabled: true,
        emailEnabled: true,
        notifyOnApplicationStatus: true,
        notifyOnAnnouncements: true,
        notifyOnNewRegistrations: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Check if user has active push subscriptions
    const subCount = await db.pushSubscription.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...pref,
        hasActivePushSubscription: subCount > 0
      }
    });
  } catch (error: any) {
    console.error("[Preferences GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const updated = await db.notificationPreference.upsert({
      where: { userId },
      update: {
        pushEnabled: body.pushEnabled !== undefined ? Boolean(body.pushEnabled) : undefined,
        emailEnabled: body.emailEnabled !== undefined ? Boolean(body.emailEnabled) : undefined,
        notifyOnApplicationStatus: body.notifyOnApplicationStatus !== undefined ? Boolean(body.notifyOnApplicationStatus) : undefined,
        notifyOnAnnouncements: body.notifyOnAnnouncements !== undefined ? Boolean(body.notifyOnAnnouncements) : undefined,
        notifyOnNewRegistrations: body.notifyOnNewRegistrations !== undefined ? Boolean(body.notifyOnNewRegistrations) : undefined
      },
      create: {
        userId,
        pushEnabled: body.pushEnabled !== undefined ? Boolean(body.pushEnabled) : true,
        emailEnabled: body.emailEnabled !== undefined ? Boolean(body.emailEnabled) : true,
        notifyOnApplicationStatus: body.notifyOnApplicationStatus !== undefined ? Boolean(body.notifyOnApplicationStatus) : true,
        notifyOnAnnouncements: body.notifyOnAnnouncements !== undefined ? Boolean(body.notifyOnAnnouncements) : true,
        notifyOnNewRegistrations: body.notifyOnNewRegistrations !== undefined ? Boolean(body.notifyOnNewRegistrations) : true
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[Preferences PUT Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

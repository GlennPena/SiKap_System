import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ success: false, message: "Invalid push subscription object" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    // Upsert the subscription by endpoint
    const saved = await db.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent
      }
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("[Subscribe API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await db.pushSubscription.deleteMany({
        where: { endpoint, userId }
      });
    } else {
      // If no specific endpoint provided, remove all for this user
      await db.pushSubscription.deleteMany({
        where: { userId }
      });
    }

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (error: any) {
    console.error("[Unsubscribe API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/web-push";
import { sendEmailToUser } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userName = (session.user as any).name || "User";
    const body = await request.json().catch(() => ({}));
    const type = body.type || "all"; // "push" | "email" | "all"

    const results: any = {};

    if (type === "push" || type === "all") {
      const pushRes = await sendPushToUser(userId, {
        title: "🔔 SiKap Test Notification",
        body: `Hello ${userName}! Push notifications are successfully connected and working.`,
        url: "/",
        tag: `test-${Date.now()}`
      });
      results.push = pushRes;
    }

    if (type === "email" || type === "all") {
      const emailRes = await sendEmailToUser(userId, {
        subject: "🔔 SiKap System - Test Email Alert",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #0A6B43;">Test Notification Successful</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>This is a test notification from the SiKap System. Your email notifications are functioning properly!</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">SiKap · Municipality of San Luis, Pampanga</p>
          </div>
        `,
        text: `Hello ${userName}, this is a test notification from SiKap System.`
      });
      results.email = { sent: emailRes };
    }

    return NextResponse.json({
      success: true,
      message: "Test notification dispatched",
      results
    });
  } catch (error: any) {
    console.error("[Test Notification API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

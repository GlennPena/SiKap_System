import webpush from "web-push";
import { db } from "@/lib/db";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@sikap.gov.ph";

if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
  } catch (err) {
    console.error("Failed to initialize web-push VAPID details:", err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: any;
}

/**
 * Sends a Web Push notification to a single user's registered devices.
 * Automatically deletes stale / expired subscriptions (HTTP 404 or 410).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; delivered: number; failed: number }> {
  try {
    if (!publicVapidKey || !privateVapidKey) {
      console.warn("[WebPush] VAPID keys not configured, skipping push notification.");
      return { success: false, delivered: 0, failed: 0 };
    }

    // Check notification preference
    const pref = await db.notificationPreference.findUnique({
      where: { userId }
    });

    if (pref && !pref.pushEnabled) {
      return { success: true, delivered: 0, failed: 0 };
    }

    const subscriptions = await db.pushSubscription.findMany({
      where: { userId }
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, delivered: 0, failed: 0 };
    }

    const notificationData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/favicon.ico",
      badge: payload.badge || "/favicon.ico",
      tag: payload.tag || "sikap-notification",
      data: payload.data || {}
    });

    let delivered = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationData);
          delivered++;
        } catch (err: any) {
          failed++;
          // If status is 410 (Gone) or 404 (Not Found), remove stale subscription
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[WebPush] Removing expired push subscription: ${sub.id}`);
            await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error(`[WebPush] Error sending push notification to subscription ${sub.id}:`, err?.message || err);
          }
        }
      })
    );

    return { success: true, delivered, failed };
  } catch (error: any) {
    console.error("[WebPush] Error in sendPushToUser:", error);
    return { success: false, delivered: 0, failed: 0 };
  }
}

/**
 * Sends a Web Push notification to multiple users.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  await Promise.allSettled(uniqueIds.map((id) => sendPushToUser(id, payload)));
}

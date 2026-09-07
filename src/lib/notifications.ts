import { db } from "@/lib/db";
import { sendPushToUser, sendPushToUsers, PushNotificationPayload } from "./web-push";
import {
  sendEmail,
  sendEmailToUser,
  buildReferralStatusEmail,
  buildNewRegistrationEmail,
  buildAnnouncementEmail
} from "./email";

/**
 * Dispatches notification when a referral status updates (Enrolled / Declined / Pending).
 * - Sends Web Push alert to the youth member.
 * - Sends Email to the youth member.
 * - Sends Email notification to SK Officials of that youth's barangay.
 */
export async function notifyReferralStatusChanged(params: {
  referralId: string;
  youthProfileId: string;
  status: string;
  programTitle: string;
}) {
  try {
    const youthProfile = await db.youthProfile.findUnique({
      where: { id: params.youthProfileId },
      include: { user: true, barangay: true }
    });

    if (!youthProfile) return;

    let pushTitle = "Application Update";
    let pushBody = `Your application for "${params.programTitle}" has been updated to: ${params.status}.`;

    if (params.status === "Enrolled") {
      pushTitle = "🎉 Enrollment Approved!";
      pushBody = `You are officially accepted into "${params.programTitle}". Training sessions will begin soon.`;
    } else if (params.status === "Declined") {
      pushTitle = "Application Declined";
      pushBody = `Your application for "${params.programTitle}" was not accepted. Check dashboard for alternatives.`;
    } else if (params.status === "Pending") {
      pushTitle = "Requirements Submission Required";
      pushBody = `Your application for "${params.programTitle}" requires document submission at your SK/TESDA center.`;
    }

    // 1. Web Push to Youth
    if (youthProfile.userId) {
      await sendPushToUser(youthProfile.userId, {
        title: pushTitle,
        body: pushBody,
        url: "/",
        tag: `referral-${params.referralId}`
      });

      // 2. Email to Youth (if user has email)
      if (youthProfile.user?.email) {
        const emailContent = buildReferralStatusEmail({
          youthName: youthProfile.name,
          programTitle: params.programTitle,
          status: params.status
        });
        await sendEmailToUser(youthProfile.userId, emailContent);
      }
    }

    // 3. Email to SK Officials of this barangay
    if (youthProfile.barangayId) {
      const officials = await db.user.findMany({
        where: {
          barangayId: youthProfile.barangayId,
          role: { in: ["SK_OFFICIAL", "BARANGAY_CAPTAIN"] },
          status: "Active"
        },
        include: { notificationPreference: true }
      });

      for (const official of officials) {
        if (!official.email) continue;
        if (official.notificationPreference && !official.notificationPreference.emailEnabled) continue;

        await sendEmail({
          to: official.email,
          subject: `📋 Referral Update: ${youthProfile.name} - ${params.status}`,
          html: `<p>Referral for <strong>${youthProfile.name}</strong> (${youthProfile.barangay.name}) for program <strong>${params.programTitle}</strong> is now marked as <strong>${params.status}</strong>.</p>`
        });
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyReferralStatusChanged:", error?.message || error);
  }
}

/**
 * Dispatches notification when a new youth member self-registers.
 * - Sends email to SK Officials and Barangay Captain of the youth's barangay.
 * - Sends push notification to officials if subscribed.
 */
export async function notifyNewYouthRegistered(params: {
  youthName: string;
  barangayId: string;
  age: number;
  currentStatus: string;
}) {
  try {
    const barangay = await db.barangay.findUnique({
      where: { id: params.barangayId }
    });

    const barangayName = barangay?.name || "San Luis";

    // Find all SK Officials and Barangay Captain for this barangay
    const officials = await db.user.findMany({
      where: {
        barangayId: params.barangayId,
        role: { in: ["SK_OFFICIAL", "BARANGAY_CAPTAIN", "SUPER_ADMIN"] },
        status: "Active"
      },
      include: { notificationPreference: true }
    });

    const emailContent = buildNewRegistrationEmail({
      youthName: params.youthName,
      barangayName,
      age: params.age,
      currentStatus: params.currentStatus
    });

    const pushPayload: PushNotificationPayload = {
      title: "📋 New KK Youth Registered",
      body: `${params.youthName} has registered in Barangay ${barangayName}.`,
      url: "/",
      tag: "new-youth-registration"
    };

    for (const official of officials) {
      // Email alert
      const canEmail = official.email && (!official.notificationPreference || (official.notificationPreference.emailEnabled && official.notificationPreference.notifyOnNewRegistrations));
      if (canEmail) {
        await sendEmail({
          to: official.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      }

      // Web Push alert
      const canPush = !official.notificationPreference || (official.notificationPreference.pushEnabled && official.notificationPreference.notifyOnNewRegistrations);
      if (canPush) {
        await sendPushToUser(official.id, pushPayload);
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewYouthRegistered:", error?.message || error);
  }
}

/**
 * Dispatches notification when a new SK Announcement is published.
 * - Sends Web Push alert to all registered KK Youth in the barangay.
 * - Sends Email to youth if enabled.
 */
export async function notifyNewAnnouncement(params: {
  title: string;
  body: string;
  category: string;
  audience: string;
  barangayId?: string | null;
}) {
  try {
    let whereClause: any = {
      role: "KK_YOUTH",
      status: "Active"
    };

    if (params.barangayId) {
      whereClause.barangayId = params.barangayId;
    }

    const youthUsers = await db.user.findMany({
      where: whereClause,
      include: { notificationPreference: true }
    });

    const pushPayload: PushNotificationPayload = {
      title: `📢 Announcement: ${params.title}`,
      body: params.body.slice(0, 120) + (params.body.length > 120 ? "..." : ""),
      url: "/",
      tag: `announcement-${Date.now()}`
    };

    for (const youth of youthUsers) {
      const canPush = !youth.notificationPreference || (youth.notificationPreference.pushEnabled && youth.notificationPreference.notifyOnAnnouncements);
      if (canPush) {
        await sendPushToUser(youth.id, pushPayload);
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewAnnouncement:", error?.message || error);
  }
}

/**
 * Dispatches notification to TESDA Partners when a new course application / referral is submitted.
 */
export async function notifyNewApplicationReceived(params: {
  referralId: string;
  youthName: string;
  barangayName: string;
  programTitle: string;
}) {
  try {
    const tesdaUsers = await db.user.findMany({
      where: {
        role: "TESDA_PARTNER",
        status: "Active"
      },
      include: { notificationPreference: true }
    });

    const pushPayload: PushNotificationPayload = {
      title: "📋 New Course Applicant",
      body: `${params.youthName} (${params.barangayName}) applied for "${params.programTitle}".`,
      url: "/",
      tag: `new-app-${params.referralId}`
    };

    for (const partner of tesdaUsers) {
      const canPush = !partner.notificationPreference || (partner.notificationPreference.pushEnabled && partner.notificationPreference.notifyOnApplicationStatus);
      if (canPush) {
        await sendPushToUser(partner.id, pushPayload);
      }

      const canEmail = partner.email && (!partner.notificationPreference || (partner.notificationPreference.emailEnabled && partner.notificationPreference.notifyOnApplicationStatus));
      if (canEmail) {
        await sendEmail({
          to: partner.email,
          subject: `📋 New TESDA Applicant: ${params.youthName} - ${params.programTitle}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #0A6B43;">New Course Application Received</h2>
              <p>Hello TESDA Representative,</p>
              <p>A new youth member has applied for admission into one of your published technical-vocational courses:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="color: #6b7280; padding: 6px 0;">Applicant Name:</td><td style="font-weight: bold;">${params.youthName}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Barangay:</td><td style="font-weight: bold;">${params.barangayName}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0;">Applied Program:</td><td style="font-weight: bold; color: #0A6B43;">${params.programTitle}</td></tr>
              </table>
              <p>You can review their profile dossier, verify qualifications, and approve or decline enrollment directly in your TESDA portal.</p>
            </div>
          `
        });
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewApplicationReceived:", error?.message || error);
  }
}

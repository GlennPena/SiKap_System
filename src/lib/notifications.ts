import { db } from "@/lib/db";
import { sendPushToUser, sendPushToUsers, PushNotificationPayload } from "./web-push";
import {
  sendEmail,
  sendEmailToUser,
  buildReferralStatusEmail,
  buildNewRegistrationEmail,
  buildAnnouncementEmail,
  buildYouthApprovalStatusEmail,
  buildNewProviderApplicationAdminEmail,
  buildNewProgramPublishedEmail
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

    if (params.status === "Approved") {
      pushTitle = "Application Approved!";
      pushBody = `Your application for "${params.programTitle}" has been approved by TESDA. Please await final cohort enrollment confirmation.`;
    } else if (params.status === "Enrolled") {
      pushTitle = "Enrollment Confirmed!";
      pushBody = `You are officially enrolled in "${params.programTitle}". Training sessions will begin soon.`;
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
        include: {
          officialAcc: true,
          councilor: true,
          notificationPreference: true
        }
      });

      for (const official of officials) {
        const targetEmail = official.officialAcc?.email?.trim() || official.councilor?.email?.trim() || official.email?.trim();
        if (!targetEmail) continue;
        if (official.notificationPreference && !official.notificationPreference.emailEnabled) continue;

        await sendEmail({
          to: targetEmail,
          subject: `Referral Update: ${youthProfile.name} - ${params.status}`,
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
      include: {
        officialAcc: true,
        councilor: true,
        notificationPreference: true
      }
    });

    const emailContent = buildNewRegistrationEmail({
      youthName: params.youthName,
      barangayName,
      age: params.age,
      currentStatus: params.currentStatus
    });

    const pushPayload: PushNotificationPayload = {
      title: "New KK Youth Registered",
      body: `${params.youthName} has registered in Barangay ${barangayName}.`,
      url: "/",
      tag: "new-youth-registration"
    };

    for (const official of officials) {
      // Prioritize active profile email from OfficialAccount or Councilor
      const targetEmail = official.officialAcc?.email?.trim() || official.councilor?.email?.trim() || official.email?.trim();
      const canEmail = targetEmail && (!official.notificationPreference || (official.notificationPreference.emailEnabled && official.notificationPreference.notifyOnNewRegistrations));
      if (canEmail) {
        await sendEmail({
          to: targetEmail,
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
      title: `Announcement: ${params.title}`,
      body: params.body.slice(0, 120) + (params.body.length > 120 ? "..." : ""),
      url: "/",
      tag: `announcement-${Date.now()}`
    };

    const emailContent = buildAnnouncementEmail({
      title: params.title,
      body: params.body,
      category: params.category
    });

    for (const youth of youthUsers) {
      const canPush = !youth.notificationPreference || (youth.notificationPreference.pushEnabled && youth.notificationPreference.notifyOnAnnouncements);
      if (canPush) {
        await sendPushToUser(youth.id, pushPayload);
      }

      const canEmail = youth.email && (!youth.notificationPreference || (youth.notificationPreference.emailEnabled && youth.notificationPreference.notifyOnAnnouncements));
      if (canEmail) {
        await sendEmail({
          to: youth.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        }).catch((err) => console.error(`[Notification] Failed to email announcement to ${youth.email}:`, err));
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewAnnouncement:", error?.message || error);
  }
}

/**
 * Dispatches notification to the specific TESDA Partner / TVET Institution when a new course application / referral is submitted.
 */
export async function notifyNewApplicationReceived(params: {
  referralId: string;
  youthName: string;
  barangayName: string;
  programTitle: string;
  provider?: string | null;
  programId?: string | null;
}) {
  try {
    let targetProvider = params.provider?.trim();

    // If provider wasn't directly supplied, fetch from database via programId
    if (!targetProvider && params.programId) {
      const prog = await db.tESDAProgram.findUnique({
        where: { id: params.programId },
        select: { provider: true }
      });
      if (prog?.provider) {
        targetProvider = prog.provider.trim();
      }
    }

    const tesdaUsers = await db.user.findMany({
      where: {
        role: "TESDA_PARTNER",
        status: "Active"
      },
      include: {
        officialAcc: true,
        notificationPreference: true
      }
    });

    if (tesdaUsers.length === 0) {
      console.warn("[Notification] No active TESDA partners found to notify.");
      return;
    }

    // Filter to the specific partner institution matching the program provider
    let matchingPartners = tesdaUsers;
    if (targetProvider) {
      const cleanTarget = targetProvider.toLowerCase().replace(/[^a-z0-9]/g, "");
      const acronymMatch = targetProvider.match(/\(([^)]+)\)/);
      const acronym = acronymMatch ? acronymMatch[1].trim().toLowerCase() : "";

      const targeted = tesdaUsers.filter((u) => {
        const instRaw = u.officialAcc?.institutionName || "";
        const instClean = instRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nameClean = (u.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const officialNameClean = (u.officialAcc?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const emailClean = (u.officialAcc?.email || u.email || "").toLowerCase();

        // 1. Check acronym (e.g. "GPSAT" from "TESDA - Gonzalo Puyat School of Arts and Trades (GPSAT)")
        if (acronym && (instRaw.toLowerCase().includes(acronym) || emailClean.includes(acronym) || nameClean.includes(acronym))) {
          return true;
        }

        // 2. Substring matching between targetProvider and institutionName
        if (instClean && (cleanTarget.includes(instClean) || instClean.includes(cleanTarget))) {
          return true;
        }

        // 3. Match against user / representative name if applicable
        if (nameClean && cleanTarget.includes(nameClean)) {
          return true;
        }
        if (officialNameClean && cleanTarget.includes(officialNameClean)) {
          return true;
        }

        return false;
      });

      if (targeted.length > 0) {
        matchingPartners = targeted;
      } else {
        console.warn(`[Notification] No partner institution specifically matched provider "${targetProvider}". Falling back to active partners.`);
      }
    }

    const pushPayload: PushNotificationPayload = {
      title: "New Program Applicant",
      body: `${params.youthName} (${params.barangayName}) applied for "${params.programTitle}".`,
      url: "/",
      tag: `new-app-${params.referralId}`
    };

    for (const partner of matchingPartners) {
      // Prioritize updated profile email from OfficialAccount, fallback to User.email
      const recipientEmail = partner.officialAcc?.email?.trim() || partner.email?.trim();
      const repName = partner.officialAcc?.name || partner.name || "TESDA Representative";
      const institutionDisplay = partner.officialAcc?.institutionName || targetProvider || "Training Institution";

      const canPush = !partner.notificationPreference || (partner.notificationPreference.pushEnabled && partner.notificationPreference.notifyOnApplicationStatus);
      if (canPush) {
        await sendPushToUser(partner.id, pushPayload);
      }

      const canEmail = recipientEmail && (!partner.notificationPreference || (partner.notificationPreference.emailEnabled && partner.notificationPreference.notifyOnApplicationStatus));
      if (canEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: `New TESDA Applicant: ${params.youthName} - ${params.programTitle}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111827;">
              <h2 style="color: #0A6B43; margin-top: 0;">New Program Application Received</h2>
              <p>Hello <strong>${repName}</strong>,</p>
              <p>A new youth member has applied for admission into one of your technical-vocational programs at <strong>${institutionDisplay}</strong>:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr><td style="color: #6b7280; padding: 6px 0; width: 140px;">Applicant Name:</td><td style="font-weight: bold; color: #111827;">${params.youthName}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0; width: 140px;">Barangay:</td><td style="font-weight: bold; color: #111827;">${params.barangayName}</td></tr>
                <tr><td style="color: #6b7280; padding: 6px 0; width: 140px;">Applied Program:</td><td style="font-weight: bold; color: #0A6B43;">${params.programTitle}</td></tr>
                ${targetProvider ? `<tr><td style="color: #6b7280; padding: 6px 0; width: 140px;">Training Center:</td><td style="font-weight: bold; color: #374151;">${targetProvider}</td></tr>` : ""}
              </table>
              <p>You can review their qualification dossier, verify documents, and approve or decline enrollment directly in your SiKap TVET Portal.</p>
            </div>
          `
        });
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewApplicationReceived:", error?.message || error);
  }
}


/**
 * Dispatches notification when a youth member's registration is Approved or Rejected by SK.
 * - Sends Web Push alert to the youth member.
 * - Sends Email notification to the youth member.
 */
export async function notifyYouthApprovalStatusChanged(params: {
  youthProfileId: string;
  status: "Approved" | "Rejected";
  officialName?: string;
  rejectionReason?: string;
}) {
  try {
    const youthProfile = await db.youthProfile.findUnique({
      where: { id: params.youthProfileId },
      include: {
        user: { include: { notificationPreference: true } },
        barangay: true
      }
    });

    if (!youthProfile || !youthProfile.userId) return;

    const isApproved = params.status === "Approved";
    const brgyName = youthProfile.barangay?.name || "San Luis";

    const pushPayload: PushNotificationPayload = {
      title: isApproved ? "KK Membership Approved!" : "Registration Verification Notice",
      body: isApproved
        ? `Mabuhay! Your Katipunan ng Kabataan account has been verified and approved by Barangay ${brgyName} SK.`
        : `Your Katipunan ng Kabataan registration for Barangay ${brgyName} could not be verified. Please contact SK Officials.`,
      url: "/",
      tag: `youth-approval-${params.youthProfileId}-${params.status}`
    };

    // 1. Send Web Push if enabled
    const userPref = youthProfile.user?.notificationPreference;
    const canPush = !userPref || (userPref.pushEnabled && userPref.notifyOnNewRegistrations);
    if (canPush) {
      await sendPushToUser(youthProfile.userId, pushPayload);
    }

    // 2. Send Email if user has an email
    const recipientEmail = youthProfile.user?.email || (youthProfile as any).email;
    const canEmail = recipientEmail && (!userPref || (userPref.emailEnabled && userPref.notifyOnNewRegistrations));
    if (canEmail) {
      const emailContent = buildYouthApprovalStatusEmail({
        youthName: youthProfile.name,
        status: params.status,
        barangayName: brgyName,
        officialName: params.officialName,
        rejectionReason: params.rejectionReason
      });

      await sendEmail({
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyYouthApprovalStatusChanged:", error?.message || error);
  }
}


/**
 * Dispatches notification to Super Admin when a new TVET Provider registers with CPTR accreditation.
 */
export async function notifySuperAdminNewProviderApplication(params: {
  institutionName: string;
  representativeName: string;
  providerType: string;
  cptrNumber: string;
  email: string;
  contactNumber?: string;
}) {
  try {
    const superAdmins = await db.user.findMany({
      where: { role: "SUPER_ADMIN", status: "Active" },
      include: { notificationPreference: true }
    });

    const pushPayload: PushNotificationPayload = {
      title: "New TVET Partner Accreditation",
      body: `${params.institutionName} (${params.cptrNumber}) submitted CPTR verification.`,
      url: "/",
      tag: `new-provider-app-${Date.now()}`
    };

    const emailContent = buildNewProviderApplicationAdminEmail(params);

    for (const admin of superAdmins) {
      const canPush = !admin.notificationPreference || admin.notificationPreference.pushEnabled;
      if (canPush) {
        await sendPushToUser(admin.id, pushPayload);
      }

      const canEmail = admin.email && (!admin.notificationPreference || admin.notificationPreference.emailEnabled);
      if (canEmail) {
        await sendEmail({
          to: admin.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifySuperAdminNewProviderApplication:", error?.message || error);
  }
}

/**
 * Dispatches notification to KK Youth members when a new TESDA training program is published.
 */
export async function notifyNewProgramPublished(params: {
  programId: string;
  title: string;
  provider: string;
  location: string;
  trainingHours: number;
}) {
  try {
    const youthUsers = await db.user.findMany({
      where: { role: "KK_YOUTH", status: "Active" },
      include: { notificationPreference: true }
    });

    const pushPayload: PushNotificationPayload = {
      title: "New TESDA Course Available",
      body: `"${params.title}" by ${params.provider} is now open for enrollment!`,
      url: "/",
      tag: `new-program-${params.programId}`
    };

    for (const youth of youthUsers) {
      const canPush = !youth.notificationPreference || (youth.notificationPreference.pushEnabled && youth.notificationPreference.notifyOnAnnouncements);
      if (canPush) {
        await sendPushToUser(youth.id, pushPayload);
      }

      const canEmail = youth.email && (!youth.notificationPreference || (youth.notificationPreference.emailEnabled && youth.notificationPreference.notifyOnAnnouncements));
      if (canEmail) {
        const emailContent = buildNewProgramPublishedEmail({
          youthName: youth.name,
          title: params.title,
          provider: params.provider,
          location: params.location,
          trainingHours: params.trainingHours
        });
        await sendEmail({
          to: youth.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        }).catch((err) => console.error(`[Notification] Failed to email new program to ${youth.email}:`, err));
      }
    }
  } catch (error: any) {
    console.error("[Notification] Error in notifyNewProgramPublished:", error?.message || error);
  }
}

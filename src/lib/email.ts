import nodemailer from "nodemailer";
import { db } from "@/lib/db";

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const emailFrom = process.env.EMAIL_FROM || "SiKap System <no-reply@sikap.gov.ph>";

// Create reusable transporter if SMTP credentials are provided
let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email via SMTP.
 * If SMTP is not configured, safely logs the email to console for preview/debugging.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text
}: EmailOptions): Promise<boolean> {
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  if (!transporter) {
    console.log("\n=======================================================");
    console.log("📨 [EMAIL PREVIEW - SMTP NOT CONFIGURED]");
    console.log(`To: ${recipients}`);
    console.log(`From: ${emailFrom}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------------------------------------------");
    console.log(text || html.replace(/<[^>]+>/g, " ").slice(0, 300) + "...");
    console.log("=======================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: recipients,
      subject,
      text: text || html.replace(/<[^>]+>/g, " "),
      html
    });
    return true;
  } catch (error: any) {
    console.error(`[Email] Failed to send email to ${recipients}:`, error?.message || error);
    return false;
  }
}

/**
 * Sends an email to a user if their notification preferences allow it.
 */
export async function sendEmailToUser(
  userId: string,
  options: { subject: string; html: string; text?: string }
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { notificationPreference: true }
  });

  if (!user || !user.email) return false;
  if (user.notificationPreference && !user.notificationPreference.emailEnabled) {
    return false;
  }

  return sendEmail({
    to: user.email,
    subject: options.subject,
    html: options.html,
    text: options.text
  });
}

/**
 * Base email layout wrapper with SiKap green branding.
 */
function wrapEmailTemplate(title: string, bodyContent: string, actionButton?: { label: string; url: string }): string {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3001";
  const buttonHtml = actionButton ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${actionButton.url}" style="background-color: #0A6B43; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
        ${actionButton.label}
      </a>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A6B43; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">SiKap</h1>
              <p style="color: #A7F3D0; margin: 4px 0 0 0; font-size: 12px;">Sangguniang Kabataan Career & Livelihood Portal · San Luis, Pampanga</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #111827; margin-top: 0; font-size: 18px; font-weight: 700;">${title}</h2>
              <div style="font-size: 14px; line-height: 1.6; color: #374151;">
                ${bodyContent}
              </div>
              ${buttonHtml}
              <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                You are receiving this official update because you are registered with SiKap System. You can adjust your email alerts in your portal notification settings.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
              Municipality of San Luis, Pampanga · Katipunan ng Kabataan & TESDA Partnership
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Template for Youth Application Status Updates (Enrolled, Declined, Pending Requirements)
 */
export function buildReferralStatusEmail(params: {
  youthName: string;
  programTitle: string;
  status: string;
}): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3001";
  let statusBadge = "";
  let message = "";
  let subject = "";

  if (params.status === "Enrolled") {
    subject = `🎉 Application Approved: ${params.programTitle}`;
    statusBadge = `<span style="background-color: #DCFCE7; color: #15803D; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">Accepted / Enrolled</span>`;
    message = `
      <p>Congratulations, <strong>${params.youthName}</strong>!</p>
      <p>Your application for <strong>${params.programTitle}</strong> has been officially approved. Training slot has been reserved for you.</p>
      <p>Please check your portal pathway for training schedules, venue details, and requirements.</p>
    `;
  } else if (params.status === "Declined") {
    subject = `Application Update: ${params.programTitle}`;
    statusBadge = `<span style="background-color: #FEE2E2; color: #B91C1C; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">Declined</span>`;
    message = `
      <p>Hello <strong>${params.youthName}</strong>,</p>
      <p>We would like to inform you that your application for <strong>${params.programTitle}</strong> was not approved at this time (e.g. slots filled or prerequisites not met).</p>
      <p>You may explore other matched programs on your SiKap dashboard.</p>
    `;
  } else {
    subject = `Action Required: Application for ${params.programTitle}`;
    statusBadge = `<span style="background-color: #FEF3C7; color: #B45309; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">Pending Requirements</span>`;
    message = `
      <p>Hello <strong>${params.youthName}</strong>,</p>
      <p>Your application for <strong>${params.programTitle}</strong> is currently pending physical requirements submission. Please submit necessary credentials to your SK official or TESDA center.</p>
    `;
  }

  const html = wrapEmailTemplate(
    subject,
    `
      <div style="margin-bottom: 16px;">
        Status: ${statusBadge}
      </div>
      ${message}
    `,
    { label: "View in SiKap Portal", url: `${appUrl}/` }
  );

  return {
    subject,
    html,
    text: `Application Update for ${params.youthName} - ${params.programTitle}: ${params.status}. View details at ${appUrl}/`
  };
}

/**
 * Template for New Youth Self-Registration (Sent to SK Officials & Barangay Captain)
 */
export function buildNewRegistrationEmail(params: {
  youthName: string;
  barangayName: string;
  age: number;
  currentStatus: string;
}): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3001";
  const subject = `📋 New KK Youth Registered: ${params.youthName} (${params.barangayName})`;

  const html = wrapEmailTemplate(
    "New KK Youth Self-Registration",
    `
      <p>A new youth resident has registered in the SiKap System for <strong>${params.barangayName}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 0; color: #6b7280;">Full Name:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #111827;">${params.youthName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 0; color: #6b7280;">Barangay:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #111827;">${params.barangayName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 0; color: #6b7280;">Age:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #111827;">${params.age} years old</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 0; color: #6b7280;">Employment/Youth Status:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #111827;">${params.currentStatus}</td>
        </tr>
      </table>
      <p>Please review their profile and approve their pending verification if applicable.</p>
    `,
    { label: "Review Registration in Portal", url: `${appUrl}/` }
  );

  return {
    subject,
    html,
    text: `New KK Youth Registered: ${params.youthName} in ${params.barangayName}. Review in SiKap Portal: ${appUrl}/`
  };
}

/**
 * Template for New Announcements (Sent to SK Officials / Youth)
 */
export function buildAnnouncementEmail(params: {
  title: string;
  body: string;
  category: string;
  barangayName?: string;
}): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3001";
  const subject = `📢 Announcement: ${params.title}`;

  const html = wrapEmailTemplate(
    params.title,
    `
      <div style="margin-bottom: 12px;">
        <span style="background-color: #E0E7FF; color: #4338CA; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
          ${params.category}
        </span>
        ${params.barangayName ? `<span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${params.barangayName}</span>` : ""}
      </div>
      <p style="white-space: pre-line; line-height: 1.6;">${params.body}</p>
    `,
    { label: "Open SiKap Portal", url: `${appUrl}/` }
  );

  return {
    subject,
    html,
    text: `Announcement: ${params.title}\n\n${params.body}\n\nView at ${appUrl}/`
  };
}

/**
 * Template for Password Reset / Recovery Verification Code
 */
export function buildPasswordResetEmail(params: {
  name: string;
  resetCode: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3001";
  const subject = `🔐 Password Recovery Verification Code: ${params.resetCode}`;

  const html = wrapEmailTemplate(
    "Password Recovery Request",
    `
      <p>Hello <strong>${params.name}</strong>,</p>
      <p>We received a request to recover the password for your SiKap System account.</p>
      
      <div style="margin: 24px 0; padding: 20px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 1.5px;">Your 6-Digit Verification Code</p>
        <div style="font-family: monospace, Consolas, Monaco, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0A6B43; margin: 8px 0;">
          ${params.resetCode}
        </div>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #15803D; font-weight: 500;">This security code expires in ${params.expiresInMinutes} minutes.</p>
      </div>

      <p style="font-size: 13px; color: #4B5563; line-height: 1.6;">
        Enter this code into the password recovery prompt to establish a new password for your account. If you did not initiate this request, you can safely disregard this email—your account remains protected.
      </p>
    `,
    { label: "Return to SiKap Login", url: `${appUrl}/` }
  );

  return {
    subject,
    html,
    text: `Your SiKap Password Recovery Verification Code is: ${params.resetCode}. This code is valid for ${params.expiresInMinutes} minutes.`
  };
}

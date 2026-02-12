/**
 * Platform Notification Service
 * Centralized notification sending for all platform events
 * Handles: email notifications + super admin alerts + in-app notifications
 */
import { sendPlatformEmail } from "@/lib/email-sender";
import {
  welcomeEmail,
  newNgoRegistrationEmail,
  verificationStatusEmail,
  donationConfirmationEmail,
  invoiceEmail,
} from "@/lib/notification-emails";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

interface NotifyConfig {
  notifyOnRegistration?: boolean;
  notifyOnVerification?: boolean;
  notifyOnSubscription?: boolean;
  notifyOnDonation?: boolean;
  notifyOnInvoice?: boolean;
  notifyWelcomeEmail?: boolean;
  smtpFromEmail?: string | null;
}

// Cache for platform notification settings
let settingsCache: NotifyConfig | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60000;

async function getNotifySettings(): Promise<NotifyConfig> {
  if (settingsCache && Date.now() - settingsCacheTime < CACHE_TTL) {
    return settingsCache;
  }
  const { default: prisma } = await import("@/lib/db");
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "platform" },
    select: {
      notifyOnRegistration: true,
      notifyOnVerification: true,
      notifyOnSubscription: true,
      notifyOnDonation: true,
      notifyOnInvoice: true,
      notifyWelcomeEmail: true,
      smtpFromEmail: true,
    },
  });
  settingsCache = settings || {};
  settingsCacheTime = Date.now();
  return settingsCache;
}

/**
 * Get all super admin emails for alerts
 */
async function getSuperAdminEmails(): Promise<string[]> {
  const { default: prisma } = await import("@/lib/db");
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

/**
 * Send alert email to all super admins
 */
async function alertSuperAdmins(subject: string, html: string) {
  const emails = await getSuperAdminEmails();
  if (emails.length === 0) return;

  for (const email of emails) {
    try {
      await sendPlatformEmail({ to: email, subject, html });
    } catch (err) {
      console.error(`Failed to send super admin alert to ${email}:`, err);
    }
  }
}

// ─── Welcome Email (New User) ───────────────────────────────────

export async function notifyWelcomeUser(params: {
  userName: string;
  userEmail: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyWelcomeEmail) return;

  try {
    const template = welcomeEmail({
      userName: params.userName,
      userEmail: params.userEmail,
      loginUrl: `${APP_URL}/login`,
    });

    await sendPlatformEmail({
      to: params.userEmail,
      subject: template.subject,
      html: template.html,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

// ─── New NGO Registration (Admin Alert) ─────────────────────────

export async function notifyNewNgoRegistration(params: {
  ngoName: string;
  ngoId: string;
  adminEmail: string;
  registeredBy: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnRegistration) return;

  try {
    const template = newNgoRegistrationEmail({
      ngoName: params.ngoName,
      adminEmail: params.adminEmail,
      registeredBy: params.registeredBy,
      adminUrl: `${APP_URL}/admin/ngos/${params.ngoId}`,
    });

    await alertSuperAdmins(template.subject, template.html);
  } catch (err) {
    console.error("Failed to send NGO registration alert:", err);
  }
}

// ─── Verification Status Change ─────────────────────────────────

export async function notifyVerificationChange(params: {
  ngoName: string;
  ngoId: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnVerification) return;

  try {
    // Get NGO admin emails
    const { default: prisma } = await import("@/lib/db");
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = verificationStatusEmail({
      ngoName: params.ngoName,
      status: params.status,
      reason: params.reason,
      dashboardUrl: `${APP_URL}/dashboard`,
    });

    // Send to NGO admins
    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admins
    await alertSuperAdmins(
      `[Admin] Verificare ${params.status}: ${params.ngoName}`,
      template.html
    );
  } catch (err) {
    console.error("Failed to send verification notification:", err);
  }
}

// ─── Donation Received ──────────────────────────────────────────

export async function notifyDonationReceived(params: {
  donorName: string;
  donorEmail?: string;
  ngoName: string;
  ngoId: string;
  amount: number;
  currency: string;
  isRecurring?: boolean;
  paymentMethod?: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnDonation) return;

  try {
    // Send confirmation to donor (if email available)
    if (params.donorEmail) {
      const donorTemplate = donationConfirmationEmail({
        donorName: params.donorName,
        ngoName: params.ngoName,
        amount: params.amount,
        currency: params.currency,
        isRecurring: params.isRecurring,
      });

      await sendPlatformEmail({
        to: params.donorEmail,
        subject: donorTemplate.subject,
        html: donorTemplate.html,
      });
    }

    // Notify NGO admins
    const { default: prisma } = await import("@/lib/db");
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const ngoSubject = `Donatie noua: ${params.amount} ${params.currency} de la ${params.donorName}`;
    const ngoHtml = buildSimpleAlert({
      title: "Donatie Noua Primita!",
      gradient: "#059669 0%, #10b981 100%",
      body: `
        <p><strong>${params.donorName}</strong> a donat <strong>${params.amount} ${params.currency}</strong> catre <strong>${params.ngoName}</strong>.</p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#059669;">${params.amount} ${params.currency}</p>
          <p style="margin:4px 0 0;color:#065f46;font-size:14px;">
            ${params.paymentMethod ? `via ${params.paymentMethod}` : ""}
            ${params.isRecurring ? " (recurenta)" : ""}
          </p>
        </div>
      `,
      ctaText: "Vezi Donatiile",
      ctaUrl: `${APP_URL}/dashboard/donations`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({ to: user.email, subject: ngoSubject, html: ngoHtml });
    }

    // Alert super admins for large donations (over 500 RON)
    if (params.amount >= 500) {
      await alertSuperAdmins(
        `[Alert] Donatie mare: ${params.amount} ${params.currency} - ${params.ngoName}`,
        ngoHtml
      );
    }
  } catch (err) {
    console.error("Failed to send donation notification:", err);
  }
}

// ─── Volunteer Request ──────────────────────────────────────────

export async function notifyVolunteerRequest(params: {
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone?: string;
  volunteerMessage?: string;
  ngoName: string;
  ngoId: string;
}) {
  try {
    // Send confirmation to volunteer
    const volunteerHtml = buildSimpleAlert({
      title: "Multumim pentru interesul tau!",
      gradient: "#6366f1 0%, #8b5cf6 100%",
      body: `
        <p>Salut, <strong>${params.volunteerName}</strong>!</p>
        <p>Am primit cererea ta de voluntariat la <strong>${params.ngoName}</strong>.</p>
        <p>Echipa noastra te va contacta in curand pentru urmatorii pasi.</p>
      `,
    });

    await sendPlatformEmail({
      to: params.volunteerEmail,
      subject: `Cerere voluntariat primita - ${params.ngoName}`,
      html: volunteerHtml,
    });

    // Notify NGO admins
    const { default: prisma } = await import("@/lib/db");
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const ngoHtml = buildSimpleAlert({
      title: "Voluntar Nou!",
      gradient: "#f59e0b 0%, #f97316 100%",
      body: `
        <p>O noua cerere de voluntariat a fost primita:</p>
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;width:100px;">Nume:</td><td style="font-weight:600;">${params.volunteerName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Email:</td><td>${params.volunteerEmail}</td></tr>
            ${params.volunteerPhone ? `<tr><td style="padding:6px 0;color:#6b7280;">Telefon:</td><td>${params.volunteerPhone}</td></tr>` : ""}
            ${params.volunteerMessage ? `<tr><td style="padding:6px 0;color:#6b7280;">Mesaj:</td><td>${params.volunteerMessage}</td></tr>` : ""}
          </table>
        </div>
      `,
      ctaText: "Vezi in Dashboard",
      ctaUrl: `${APP_URL}/dashboard`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: `Voluntar nou: ${params.volunteerName} - ${params.ngoName}`,
        html: ngoHtml,
      });
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SYSTEM",
        title: "Voluntar nou inscris!",
        message: `${params.volunteerName} (${params.volunteerEmail}) s-a inscris ca voluntar.`,
        actionUrl: "/dashboard",
        metadata: {
          volunteerName: params.volunteerName,
          volunteerEmail: params.volunteerEmail,
        } as any,
      },
    });
  } catch (err) {
    console.error("Failed to send volunteer notification:", err);
  }
}

// ─── Super Admin Alert (generic) ────────────────────────────────

export async function notifySuperAdmin(params: {
  subject: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  gradient?: string;
}) {
  try {
    const html = buildSimpleAlert({
      title: params.title,
      gradient: params.gradient || "#6366f1 0%, #8b5cf6 100%",
      body: params.body,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
    });

    await alertSuperAdmins(`[Binevo Admin] ${params.subject}`, html);
  } catch (err) {
    console.error("Failed to send super admin alert:", err);
  }
}

// ─── Subscription Change Alert to Super Admin ───────────────────

export async function notifySubscriptionChange(params: {
  ngoName: string;
  event: "assigned" | "expired" | "renewed" | "cancelled";
  plan: string;
  previousPlan?: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnSubscription) return;

  const labels: Record<string, string> = {
    assigned: "Abonament Atribuit",
    expired: "Abonament Expirat",
    renewed: "Abonament Reinnoit",
    cancelled: "Abonament Anulat",
  };

  const gradients: Record<string, string> = {
    assigned: "#3b82f6 0%, #6366f1 100%",
    expired: "#dc2626 0%, #ef4444 100%",
    renewed: "#059669 0%, #10b981 100%",
    cancelled: "#dc2626 0%, #ef4444 100%",
  };

  try {
    await notifySuperAdmin({
      subject: `${labels[params.event]}: ${params.ngoName} - ${params.plan}`,
      title: labels[params.event],
      body: `
        <p>ONG: <strong>${params.ngoName}</strong></p>
        <p>Plan: <strong>${params.plan}</strong></p>
        ${params.previousPlan ? `<p>Plan anterior: ${params.previousPlan}</p>` : ""}
        <p>Data: ${new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      `,
      gradient: gradients[params.event],
      ctaText: "Vezi Abonamente",
      ctaUrl: `${APP_URL}/admin/subscriptions`,
    });
  } catch (err) {
    console.error("Failed to send subscription alert:", err);
  }
}

// ─── Helper: Build simple alert email ───────────────────────────

function buildSimpleAlert(params: {
  title: string;
  gradient: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:linear-gradient(135deg,${params.gradient});padding:28px 24px;text-align:center;color:white;">
      <h1 style="margin:0;font-size:22px;">${params.title}</h1>
    </div>
    <div style="padding:28px 24px;color:#374151;line-height:1.6;">
      ${params.body}
      ${params.ctaText && params.ctaUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${params.ctaUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,${params.gradient});color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${params.ctaText}</a>
        </div>
      ` : ""}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
      <p>Binevo - Platforma pentru ONG-uri din Romania</p>
    </div>
  </div>
</body>
</html>`;
}

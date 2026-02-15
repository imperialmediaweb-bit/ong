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
import {
  subscriptionAssignedEmail,
  subscriptionExpiringEmail,
  subscriptionExpiredEmail,
  subscriptionRenewedEmail,
  paymentReminderEmail,
  paymentFailedEmail,
  creditPurchaseEmail,
} from "@/lib/subscription-emails";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";

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

// ─── Invoice Created ─────────────────────────────────────────────

export async function notifyInvoiceCreated(params: {
  ngoName: string;
  ngoId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  plan: string;
  period: string;
  dueDate?: Date;
  invoiceUrl?: string;
  invoiceId?: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnInvoice) return;

  try {
    const { default: prisma } = await import("@/lib/db");

    // Send to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    // Load full invoice for branded email template
    let template: { subject: string; html: string };
    if (params.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: params.invoiceId } });
      if (invoice) {
        template = invoiceEmail({
          invoiceNumber: invoice.invoiceNumber,
          invoiceSeries: invoice.invoiceSeries || undefined,
          sellerName: invoice.sellerName,
          sellerCui: invoice.sellerCui || undefined,
          sellerRegCom: invoice.sellerRegCom || undefined,
          sellerAddress: invoice.sellerAddress || undefined,
          sellerCity: invoice.sellerCity || undefined,
          sellerCounty: invoice.sellerCounty || undefined,
          sellerEmail: invoice.sellerEmail || undefined,
          sellerIban: invoice.sellerIban || undefined,
          sellerBankName: invoice.sellerBankName || undefined,
          sellerVatPayer: invoice.sellerVatPayer,
          buyerName: invoice.buyerName,
          buyerCui: invoice.buyerCui || undefined,
          buyerRegCom: invoice.buyerRegCom || undefined,
          buyerAddress: invoice.buyerAddress || undefined,
          buyerCity: invoice.buyerCity || undefined,
          buyerCounty: invoice.buyerCounty || undefined,
          buyerEmail: invoice.buyerEmail || undefined,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          status: invoice.status,
          items: (invoice.items as any[]) || [],
          subtotal: invoice.subtotal,
          vatAmount: invoice.vatAmount,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          notes: invoice.notes || undefined,
          paymentUrl: params.invoiceUrl,
        });
      } else {
        template = invoiceEmail({
          invoiceNumber: params.invoiceNumber,
          sellerName: "Binevo SRL",
          buyerName: params.ngoName,
          issueDate: new Date(),
          dueDate: params.dueDate,
          paidAt: null,
          status: "ISSUED",
          items: [{ description: `${params.plan} - ${params.period}`, quantity: 1, unitPrice: params.amount }],
          subtotal: params.amount,
          vatAmount: 0,
          totalAmount: params.amount,
          currency: params.currency,
          paymentUrl: params.invoiceUrl,
        });
      }
    } else {
      template = invoiceEmail({
        invoiceNumber: params.invoiceNumber,
        sellerName: "Binevo SRL",
        buyerName: params.ngoName,
        issueDate: new Date(),
        dueDate: params.dueDate,
        paidAt: null,
        status: "ISSUED",
        items: [{ description: `${params.plan} - ${params.period}`, quantity: 1, unitPrice: params.amount }],
        subtotal: params.amount,
        vatAmount: 0,
        totalAmount: params.amount,
        currency: params.currency,
        paymentUrl: params.invoiceUrl,
      });
    }

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SYSTEM",
        title: `Factura ${params.invoiceNumber} generata`,
        message: `Factura de ${params.amount} ${params.currency} pentru planul ${params.plan} (${params.period}) a fost emisa.`,
        actionUrl: "/dashboard/billing",
        metadata: {
          invoiceNumber: params.invoiceNumber,
          amount: params.amount,
          plan: params.plan,
        } as any,
      },
    });

    // Alert super admin
    await alertSuperAdmins(
      `[Factura] ${params.invoiceNumber} - ${params.ngoName} - ${params.amount} ${params.currency}`,
      buildSimpleAlert({
        title: "Factura Noua Emisa",
        gradient: "#6366f1 0%, #8b5cf6 100%",
        body: `
          <p>Factura <strong>${params.invoiceNumber}</strong> a fost generata pentru <strong>${params.ngoName}</strong>.</p>
          <div style="background:#f0f0ff;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#6366f1;">${params.amount} ${params.currency}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Plan ${params.plan} - ${params.period}</p>
          </div>
        `,
        ctaText: "Vezi Facturi",
        ctaUrl: `${APP_URL}/admin/invoices`,
      })
    );
  } catch (err) {
    console.error("Failed to send invoice notification:", err);
  }
}

// ─── Invoice Paid ────────────────────────────────────────────────

export async function notifyInvoicePaid(params: {
  ngoName: string;
  ngoId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
}) {
  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification for NGO
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SYSTEM",
        title: `Plata confirmata - ${params.invoiceNumber}`,
        message: `Plata de ${params.amount} ${params.currency} pentru factura ${params.invoiceNumber} a fost confirmata cu succes.`,
        actionUrl: "/dashboard/billing",
        metadata: {
          invoiceNumber: params.invoiceNumber,
          amount: params.amount,
          paymentMethod: params.paymentMethod,
        } as any,
      },
    });

    // Notify NGO admins via email
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const html = buildSimpleAlert({
      title: "Plata Confirmata!",
      gradient: "#059669 0%, #10b981 100%",
      body: `
        <p>Plata pentru factura <strong>${params.invoiceNumber}</strong> a fost procesata cu succes.</p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#059669;">${params.amount} ${params.currency}</p>
          <p style="margin:4px 0 0;color:#065f46;font-size:14px;">Achitata${params.paymentMethod ? ` via ${params.paymentMethod}` : ""}</p>
        </div>
      `,
      ctaText: "Vezi Facturi",
      ctaUrl: `${APP_URL}/dashboard/billing`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: `Plata confirmata - Factura ${params.invoiceNumber}`,
        html,
      });
    }

    // Alert super admin
    await alertSuperAdmins(
      `[Plata] ${params.invoiceNumber} - ${params.ngoName} - ${params.amount} ${params.currency}`,
      html
    );
  } catch (err) {
    console.error("Failed to send invoice paid notification:", err);
  }
}

// ─── Payment Failed ──────────────────────────────────────────────

export async function notifyPaymentFailed(params: {
  ngoName: string;
  ngoId: string;
  plan: string;
  reason?: string;
}) {
  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "PAYMENT_FAILED",
        title: "Plata esuata",
        message: `Plata pentru abonamentul ${params.plan} a esuat. Va rugam sa actualizati metoda de plata.`,
        actionUrl: "/dashboard/settings",
      },
    });

    // Send email to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = paymentFailedEmail({
      ngoName: params.ngoName,
      plan: params.plan,
      dashboardUrl: `${APP_URL}/dashboard/settings`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admin
    await alertSuperAdmins(
      `[Plata Esuata] ${params.ngoName} - Plan ${params.plan}`,
      buildSimpleAlert({
        title: "Plata Esuata",
        gradient: "#dc2626 0%, #ef4444 100%",
        body: `
          <p>Plata recurenta a esuat pentru <strong>${params.ngoName}</strong>.</p>
          <p>Plan: <strong>${params.plan}</strong></p>
          ${params.reason ? `<p>Motiv: ${params.reason}</p>` : ""}
        `,
        ctaText: "Vezi Abonamente",
        ctaUrl: `${APP_URL}/admin/subscriptions`,
      })
    );
  } catch (err) {
    console.error("Failed to send payment failed notification:", err);
  }
}

// ─── Credit Purchase ─────────────────────────────────────────────

export async function notifyCreditPurchase(params: {
  ngoName: string;
  ngoId: string;
  packageName: string;
  emailCredits: number;
  smsCredits: number;
  totalAmount: number;
  currency: string;
  invoiceNumber: string;
  paymentUrl?: string;
}) {
  try {
    const { default: prisma } = await import("@/lib/db");

    // Build credit description
    const parts: string[] = [];
    if (params.emailCredits > 0) parts.push(`${params.emailCredits.toLocaleString("ro-RO")} email`);
    if (params.smsCredits > 0) parts.push(`${params.smsCredits.toLocaleString("ro-RO")} SMS`);
    const creditsDesc = parts.join(" + ");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SYSTEM",
        title: `Credite achizitionate: ${params.packageName}`,
        message: `${creditsDesc} credite au fost adaugate in contul dumneavoastra.`,
        actionUrl: "/dashboard/campaigns",
        metadata: {
          packageName: params.packageName,
          emailCredits: params.emailCredits,
          smsCredits: params.smsCredits,
        } as any,
      },
    });

    // Send email to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = creditPurchaseEmail({
      ngoName: params.ngoName,
      packageName: params.packageName,
      emailCredits: params.emailCredits,
      smsCredits: params.smsCredits,
      totalAmount: params.totalAmount,
      currency: params.currency,
      invoiceNumber: params.invoiceNumber,
      paymentUrl: params.paymentUrl || `${APP_URL}/dashboard/billing`,
      dashboardUrl: `${APP_URL}/dashboard/campaigns`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admin
    await alertSuperAdmins(
      `[Credite] ${params.packageName} - ${params.ngoName} - ${params.totalAmount} ${params.currency}`,
      buildSimpleAlert({
        title: "Achizitie Credite",
        gradient: "#059669 0%, #10b981 100%",
        body: `
          <p><strong>${params.ngoName}</strong> a achizitionat pachetul <strong>${params.packageName}</strong>.</p>
          <div style="background:#ecfdf5;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#059669;">${creditsDesc}</p>
            <p style="margin:4px 0 0;color:#065f46;font-size:14px;">${params.totalAmount} ${params.currency}</p>
          </div>
        `,
        ctaText: "Vezi Tranzactii",
        ctaUrl: `${APP_URL}/admin/invoices`,
      })
    );
  } catch (err) {
    console.error("Failed to send credit purchase notification:", err);
  }
}

// ─── Campaign Completed ──────────────────────────────────────────

export async function notifyCampaignCompleted(params: {
  ngoName: string;
  ngoId: string;
  campaignName: string;
  campaignId: string;
  channel: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed?: number;
}) {
  try {
    const { default: prisma } = await import("@/lib/db");

    const successRate = params.totalSent > 0
      ? Math.round((params.totalDelivered / params.totalSent) * 100)
      : 0;

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "CAMPAIGN_COMPLETED",
        title: `Campanie finalizata: ${params.campaignName}`,
        message: `${params.totalSent} mesaje trimise (${successRate}% livrate) prin ${params.channel}.`,
        actionUrl: `/dashboard/campaigns/${params.campaignId}`,
        metadata: {
          campaignId: params.campaignId,
          channel: params.channel,
          totalSent: params.totalSent,
          totalDelivered: params.totalDelivered,
        } as any,
      },
    });

    // Send email to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const channelLabel = params.channel === "BOTH" ? "Email + SMS" : params.channel;
    const html = buildSimpleAlert({
      title: "Campanie Finalizata!",
      gradient: "#6366f1 0%, #8b5cf6 100%",
      body: `
        <p>Campania <strong>${params.campaignName}</strong> a fost trimisa cu succes.</p>
        <div style="background:#f0f0ff;border-radius:8px;padding:20px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6b7280;">Canal:</td><td style="text-align:right;font-weight:600;">${channelLabel}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Trimise:</td><td style="text-align:right;font-weight:600;">${params.totalSent}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Livrate:</td><td style="text-align:right;font-weight:600;color:#059669;">${params.totalDelivered}</td></tr>
            ${params.totalFailed ? `<tr><td style="padding:6px 0;color:#6b7280;">Esuate:</td><td style="text-align:right;font-weight:600;color:#dc2626;">${params.totalFailed}</td></tr>` : ""}
            <tr style="border-top:1px solid #e5e7eb;"><td style="padding:8px 0;color:#6b7280;">Rata livrare:</td><td style="text-align:right;font-weight:700;font-size:18px;color:#6366f1;">${successRate}%</td></tr>
          </table>
        </div>
      `,
      ctaText: "Vezi Raport Campanie",
      ctaUrl: `${APP_URL}/dashboard/campaigns/${params.campaignId}`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: `Campanie finalizata: ${params.campaignName} - ${params.totalSent} mesaje trimise`,
        html,
      });
    }
  } catch (err) {
    console.error("Failed to send campaign completed notification:", err);
  }
}

// ─── Subscription Expiring (to NGO) ─────────────────────────────

export async function notifySubscriptionExpiring(params: {
  ngoName: string;
  ngoId: string;
  plan: string;
  expiresAt: Date;
  daysLeft: number;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnSubscription) return;

  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SUBSCRIPTION_EXPIRING",
        title: `Abonamentul expira in ${params.daysLeft} zile`,
        message: `Planul ${params.plan} expira pe ${new Date(params.expiresAt).toLocaleDateString("ro-RO")}. Reinnoiti pentru a pastra functiile avansate.`,
        actionUrl: "/dashboard/settings",
      },
    });

    // Send email to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = subscriptionExpiringEmail({
      ngoName: params.ngoName,
      plan: params.plan,
      expiresAt: params.expiresAt,
      daysLeft: params.daysLeft,
      dashboardUrl: `${APP_URL}/dashboard/settings`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admin too
    await notifySubscriptionChange({
      ngoName: params.ngoName,
      event: "expired",
      plan: params.plan,
    });
  } catch (err) {
    console.error("Failed to send subscription expiring notification:", err);
  }
}

// ─── Subscription Expired (to NGO) ──────────────────────────────

export async function notifySubscriptionExpired(params: {
  ngoName: string;
  ngoId: string;
  previousPlan: string;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnSubscription) return;

  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SUBSCRIPTION_EXPIRED",
        title: "Abonament expirat",
        message: `Planul ${params.previousPlan} a expirat. Contul a fost trecut pe planul BASIC.`,
        actionUrl: "/dashboard/settings",
      },
    });

    // Send to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const { subscriptionExpiredEmail: expiredEmail } = await import("@/lib/subscription-emails");
    const template = expiredEmail({
      ngoName: params.ngoName,
      previousPlan: params.previousPlan,
      dashboardUrl: `${APP_URL}/dashboard/settings`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admin
    await notifySubscriptionChange({
      ngoName: params.ngoName,
      event: "expired",
      plan: "BASIC",
      previousPlan: params.previousPlan,
    });
  } catch (err) {
    console.error("Failed to send subscription expired notification:", err);
  }
}

// ─── Subscription Renewed (to NGO) ──────────────────────────────

export async function notifySubscriptionRenewed(params: {
  ngoName: string;
  ngoId: string;
  plan: string;
  nextExpiresAt?: Date | null;
}) {
  const settings = await getNotifySettings();
  if (!settings.notifyOnSubscription) return;

  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SUBSCRIPTION_RENEWED",
        title: "Abonament reinnoit!",
        message: `Planul ${params.plan} a fost reinnoit cu succes${params.nextExpiresAt ? ` pana la ${new Date(params.nextExpiresAt).toLocaleDateString("ro-RO")}` : ""}.`,
        actionUrl: "/dashboard/settings",
      },
    });

    // Send email to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = subscriptionRenewedEmail({
      ngoName: params.ngoName,
      plan: params.plan,
      nextExpiresAt: params.nextExpiresAt,
      dashboardUrl: `${APP_URL}/dashboard`,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Alert super admin
    await notifySubscriptionChange({
      ngoName: params.ngoName,
      event: "renewed",
      plan: params.plan,
    });
  } catch (err) {
    console.error("Failed to send subscription renewed notification:", err);
  }
}

// ─── Payment Reminder ────────────────────────────────────────────

export async function notifyPaymentReminder(params: {
  ngoName: string;
  ngoId: string;
  plan: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paymentUrl: string;
}) {
  try {
    const { default: prisma } = await import("@/lib/db");

    // In-app notification
    await prisma.notification.create({
      data: {
        ngoId: params.ngoId,
        type: "SYSTEM",
        title: `Factura scadenta: ${params.amount} ${params.currency}`,
        message: `Factura pentru planul ${params.plan} este scadenta pe ${new Date(params.dueDate).toLocaleDateString("ro-RO")}.`,
        actionUrl: "/dashboard/billing",
      },
    });

    // Send to NGO admins
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId: params.ngoId, role: "NGO_ADMIN", isActive: true },
      select: { email: true },
    });

    const template = paymentReminderEmail({
      ngoName: params.ngoName,
      plan: params.plan,
      amount: params.amount,
      currency: params.currency,
      dueDate: params.dueDate,
      paymentUrl: params.paymentUrl,
    });

    for (const user of ngoUsers) {
      await sendPlatformEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    }
  } catch (err) {
    console.error("Failed to send payment reminder notification:", err);
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

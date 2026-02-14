/**
 * Subscription Manager
 * Handles subscription lifecycle: assignment, expiration checks,
 * auto-downgrade, and email notifications
 */

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  subscriptionAssignedEmail,
  subscriptionExpiringEmail,
  subscriptionExpiredEmail,
  subscriptionRenewedEmail,
  paymentFailedEmail,
} from "@/lib/subscription-emails";
import {
  notifySubscriptionChange,
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
} from "@/lib/platform-notifications";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

// ─── Assign Subscription ─────────────────────────────────────────

export async function assignSubscription(params: {
  ngoId: string;
  plan: "BASIC" | "PRO" | "ELITE";
  durationMonths?: number | null; // null = no expiration
  assignedById: string;
  assignedByEmail: string;
  notes?: string;
  sendNotification?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const ngo = await prisma.ngo.findUnique({
    where: { id: params.ngoId },
    include: {
      users: {
        where: { role: "NGO_ADMIN" },
        select: { email: true, name: true },
      },
    },
  });

  if (!ngo) {
    return { success: false, message: "ONG-ul nu a fost gasit" };
  }

  const previousPlan = ngo.subscriptionPlan;
  const now = new Date();
  const expiresAt = params.durationMonths
    ? new Date(now.getTime() + params.durationMonths * 30 * 24 * 60 * 60 * 1000)
    : null;

  // Update NGO subscription
  await prisma.ngo.update({
    where: { id: params.ngoId },
    data: {
      subscriptionPlan: params.plan,
      subscriptionStatus: "active",
      subscriptionStartAt: now,
      subscriptionExpiresAt: expiresAt,
      subscriptionAssignedBy: params.assignedById,
      subscriptionNotes: params.notes || null,
      lastExpirationNotice: null, // reset
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      ngoId: params.ngoId,
      userId: params.assignedById,
      action: "SUBSCRIPTION_ASSIGNED",
      entityType: "Ngo",
      entityId: params.ngoId,
      details: {
        previousPlan,
        newPlan: params.plan,
        durationMonths: params.durationMonths || "nelimitat",
        expiresAt: expiresAt?.toISOString() || "niciodata",
        assignedBy: params.assignedByEmail,
        notes: params.notes,
      } as any,
    },
  });

  // Create notification
  const notificationType = previousPlan === params.plan
    ? "SUBSCRIPTION_RENEWED"
    : previousPlan < params.plan
    ? "SUBSCRIPTION_UPGRADED"
    : "SUBSCRIPTION_DOWNGRADED";

  await prisma.notification.create({
    data: {
      ngoId: params.ngoId,
      type: notificationType as any,
      title: `Abonament ${params.plan} activat`,
      message: expiresAt
        ? `Planul ${params.plan} a fost activat pana la ${expiresAt.toLocaleDateString("ro-RO")}.`
        : `Planul ${params.plan} a fost activat fara limita de timp.`,
      actionUrl: "/dashboard/settings",
      metadata: {
        previousPlan,
        newPlan: params.plan,
        expiresAt: expiresAt?.toISOString(),
      } as any,
    },
  });

  // Send email notification
  if (params.sendNotification !== false && ngo.users.length > 0) {
    for (const admin of ngo.users) {
      const emailData = subscriptionAssignedEmail({
        ngoName: ngo.name,
        plan: params.plan,
        expiresAt,
        assignedBy: params.assignedByEmail,
        dashboardUrl: `${APP_URL}/dashboard`,
      });

      await sendEmail({
        to: admin.email,
        subject: emailData.subject,
        html: emailData.html,
        from: "noreply@binevo.ro",
        fromName: "Binevo",
      }).catch((err) => {
        console.error(`Email notification failed for ${admin.email}:`, err);
      });
    }
  }

  // Alert super admin
  notifySubscriptionChange({
    ngoName: ngo.name,
    event: "assigned",
    plan: params.plan,
    previousPlan,
  }).catch(() => {});

  return {
    success: true,
    message: `Planul ${params.plan} a fost atribuit cu succes${
      expiresAt ? ` pana la ${expiresAt.toLocaleDateString("ro-RO")}` : " fara limita"
    }.`,
  };
}

// ─── Check Expiring Subscriptions ─────────────────────────────────
// Flow (non-recurring):
// 1. 3 days before expiry → first warning email + in-app (include payment link)
// 2. Expired + 5 days → second warning with cancel/downgrade option
// 3. Expired + 5 days no action → downgrade to BASIC (free)
// Flow (recurring):
// Stripe webhook handles renewal automatically

export async function checkExpiringSubscriptions(): Promise<{
  expiring: number;
  expired: number;
  warned: number;
  renewed: number;
  suspended: number;
  errors: string[];
}> {
  const results = {
    expiring: 0,
    expired: 0,
    warned: 0,
    renewed: 0,
    suspended: 0,
    errors: [] as string[],
  };

  const now = new Date();

  // 1. Find subscriptions expiring in next 3 days (send warning)
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const expiringNgos = await prisma.ngo.findMany({
    where: {
      subscriptionExpiresAt: {
        gt: now,
        lte: threeDaysFromNow,
      },
      subscriptionPlan: { not: "BASIC" },
      subscriptionStatus: "active",
      // Don't send if we already sent a notice in last 2 days
      OR: [
        { lastExpirationNotice: null },
        { lastExpirationNotice: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  for (const ngo of expiringNgos) {
    try {
      // Skip if auto-renew - Stripe handles it
      if (ngo.autoRenew && ngo.stripeSubscriptionId) {
        results.renewed++;
        continue;
      }

      const daysLeft = Math.ceil(
        (ngo.subscriptionExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Update last notice date
      await prisma.ngo.update({
        where: { id: ngo.id },
        data: { lastExpirationNotice: now },
      });

      // Send warning via notification provider (email + in-app + super admin)
      await notifySubscriptionExpiring({
        ngoName: ngo.name,
        ngoId: ngo.id,
        plan: ngo.subscriptionPlan,
        expiresAt: ngo.subscriptionExpiresAt!,
        daysLeft,
      });

      results.expiring++;
    } catch (err: any) {
      results.errors.push(`Error processing expiring ngo ${ngo.id}: ${err.message}`);
    }
  }

  // 2. Find expired subscriptions (0-5 days past expiry) → send second warning with cancel option
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const recentlyExpiredNgos = await prisma.ngo.findMany({
    where: {
      subscriptionExpiresAt: {
        lt: now,
        gte: fiveDaysAgo,
      },
      subscriptionPlan: { not: "BASIC" },
      subscriptionStatus: "active",
    },
    include: {
      users: {
        where: { role: "NGO_ADMIN" },
        select: { email: true, name: true },
      },
    },
  });

  for (const ngo of recentlyExpiredNgos) {
    try {
      // Skip if auto-renew
      if (ngo.autoRenew && ngo.stripeSubscriptionId) {
        results.renewed++;
        continue;
      }

      const daysPastExpiry = Math.floor(
        (now.getTime() - ngo.subscriptionExpiresAt!.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send second warning with cancel/downgrade option (only once, around day 3-5)
      if (daysPastExpiry >= 3) {
        const alreadyWarned = ngo.lastExpirationNotice &&
          (now.getTime() - ngo.lastExpirationNotice.getTime()) < 2 * 24 * 60 * 60 * 1000;

        if (!alreadyWarned) {
          await prisma.ngo.update({
            where: { id: ngo.id },
            data: { lastExpirationNotice: now },
          });

          // In-app notification with cancel option
          await prisma.notification.create({
            data: {
              ngoId: ngo.id,
              type: "SUBSCRIPTION_EXPIRED",
              title: `Ultima avertizare: abonamentul ${ngo.subscriptionPlan} a expirat`,
              message: `Planul ${ngo.subscriptionPlan} a expirat acum ${daysPastExpiry} zile. Reinnoiti sau contul va fi trecut pe BASIC (gratuit) in 2 zile.`,
              actionUrl: "/dashboard/settings",
            },
          });

          // Send second warning email with cancel/downgrade option
          const { sendPlatformEmail } = await import("@/lib/email-sender");
          const cancelUrl = `${APP_URL}/dashboard/settings`;
          const renewUrl = `${APP_URL}/dashboard/settings`;

          const warningHtml = `
            <!DOCTYPE html>
            <html><head><meta charset="utf-8"></head>
            <body style="margin:0;padding:20px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:28px 24px;text-align:center;color:white;">
                  <h1 style="margin:0;font-size:22px;">Ultima Avertizare - Abonament Expirat</h1>
                </div>
                <div style="padding:28px 24px;color:#374151;line-height:1.6;">
                  <p>Buna ziua,</p>
                  <p>Abonamentul <strong>${ngo.subscriptionPlan}</strong> pentru <strong>${ngo.name}</strong> a expirat acum <strong>${daysPastExpiry} zile</strong>.</p>
                  <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
                    <p style="margin:0;color:#991b1b;font-weight:600;">Daca nu reinnoiti in 2 zile:</p>
                    <ul style="color:#991b1b;font-size:14px;margin:8px 0 0;padding-left:20px;">
                      <li>Contul va fi retrogradat la planul BASIC (gratuit)</li>
                      <li>Campanii email/SMS, automatizari si AI vor fi dezactivate</li>
                      <li>Datele dumneavoastra raman in siguranta</li>
                    </ul>
                  </div>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${renewUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reinnoieste Abonamentul</a>
                  </div>
                  <div style="text-align:center;margin:16px 0;padding-top:16px;border-top:1px solid #e5e7eb;">
                    <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Nu mai doriti acest abonament?</p>
                    <a href="${cancelUrl}" style="display:inline-block;padding:10px 24px;background:#f3f4f6;color:#4b5563;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #d1d5db;">Treci la planul BASIC (gratuit)</a>
                  </div>
                </div>
                <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                  Binevo - Platforma pentru ONG-uri din Romania
                </div>
              </div>
            </body></html>`;

          for (const admin of ngo.users) {
            await sendPlatformEmail({
              to: admin.email,
              subject: `ULTIMA AVERTIZARE: Abonamentul ${ngo.subscriptionPlan} a expirat - ${ngo.name}`,
              html: warningHtml,
            }).catch(console.error);
          }

          results.warned++;
        }
      }

      results.expired++;
    } catch (err: any) {
      results.errors.push(`Error processing expired ngo ${ngo.id}: ${err.message}`);
    }
  }

  // 3. Find subscriptions expired > 5 days → downgrade to BASIC (free)
  const expiredLongNgos = await prisma.ngo.findMany({
    where: {
      subscriptionExpiresAt: { lt: fiveDaysAgo },
      subscriptionPlan: { not: "BASIC" },
      subscriptionStatus: "active",
    },
  });

  for (const ngo of expiredLongNgos) {
    try {
      // Skip if auto-renew
      if (ngo.autoRenew && ngo.stripeSubscriptionId) {
        results.renewed++;
        continue;
      }

      const previousPlan = ngo.subscriptionPlan;

      // Downgrade to BASIC (free)
      await prisma.ngo.update({
        where: { id: ngo.id },
        data: {
          subscriptionPlan: "BASIC",
          subscriptionStatus: "expired",
          subscriptionExpiresAt: null,
          lastExpirationNotice: null,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          ngoId: ngo.id,
          action: "SUBSCRIPTION_EXPIRED",
          entityType: "Ngo",
          entityId: ngo.id,
          details: {
            previousPlan,
            reason: "Abonament expirat + 5 zile gratie - retrogradare automata la BASIC (gratuit)",
          } as any,
        },
      });

      // Send expired notification via provider (email + in-app + super admin)
      await notifySubscriptionExpired({
        ngoName: ngo.name,
        ngoId: ngo.id,
        previousPlan,
      });

      results.suspended++;
    } catch (err: any) {
      results.errors.push(`Error processing long-expired ngo ${ngo.id}: ${err.message}`);
    }
  }

  return results;
}

// ─── Renew Subscription ──────────────────────────────────────────

export async function renewSubscription(params: {
  ngoId: string;
  durationMonths: number;
  renewedById?: string;
}): Promise<{ success: boolean; message: string }> {
  const ngo = await prisma.ngo.findUnique({
    where: { id: params.ngoId },
    include: {
      users: {
        where: { role: "NGO_ADMIN" },
        select: { email: true },
      },
    },
  });

  if (!ngo) {
    return { success: false, message: "ONG-ul nu a fost gasit" };
  }

  const now = new Date();
  // If subscription hasn't expired yet, extend from current end date
  const startFrom = ngo.subscriptionExpiresAt && ngo.subscriptionExpiresAt > now
    ? ngo.subscriptionExpiresAt
    : now;

  const newExpiresAt = new Date(startFrom.getTime() + params.durationMonths * 30 * 24 * 60 * 60 * 1000);

  await prisma.ngo.update({
    where: { id: params.ngoId },
    data: {
      subscriptionStatus: "active",
      subscriptionExpiresAt: newExpiresAt,
      lastExpirationNotice: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      ngoId: params.ngoId,
      userId: params.renewedById,
      action: "SUBSCRIPTION_RENEWED",
      entityType: "Ngo",
      entityId: params.ngoId,
      details: {
        plan: ngo.subscriptionPlan,
        durationMonths: params.durationMonths,
        newExpiresAt: newExpiresAt.toISOString(),
      } as any,
    },
  });

  await prisma.notification.create({
    data: {
      ngoId: params.ngoId,
      type: "SUBSCRIPTION_RENEWED",
      title: "Abonament reinnoit",
      message: `Planul ${ngo.subscriptionPlan} a fost reinnoit pana la ${newExpiresAt.toLocaleDateString("ro-RO")}.`,
      actionUrl: "/dashboard/settings",
    },
  });

  // Send renewal email
  for (const admin of ngo.users) {
    const emailData = subscriptionRenewedEmail({
      ngoName: ngo.name,
      plan: ngo.subscriptionPlan,
      nextExpiresAt: newExpiresAt,
      dashboardUrl: `${APP_URL}/dashboard`,
    });

    await sendEmail({
      to: admin.email,
      subject: emailData.subject,
      html: emailData.html,
      from: "noreply@binevo.ro",
      fromName: "Binevo",
    }).catch(console.error);
  }

  // Alert super admin
  notifySubscriptionChange({
    ngoName: ngo.name,
    event: "renewed",
    plan: ngo.subscriptionPlan,
  }).catch(() => {});

  return {
    success: true,
    message: `Abonamentul a fost reinnoit pana la ${newExpiresAt.toLocaleDateString("ro-RO")}`,
  };
}

// ─── Get Subscription Summary ────────────────────────────────────

export async function getSubscriptionSummary(): Promise<{
  total: number;
  byPlan: Record<string, number>;
  active: number;
  expiring: number;
  expired: number;
  revenue: { monthly: number; annual: number };
}> {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [allNgos, expiringCount, expiredCount] = await Promise.all([
    prisma.ngo.groupBy({
      by: ["subscriptionPlan"],
      _count: { id: true },
    }),
    prisma.ngo.count({
      where: {
        subscriptionExpiresAt: { gt: now, lte: sevenDays },
        subscriptionPlan: { not: "BASIC" },
        subscriptionStatus: "active",
      },
    }),
    prisma.ngo.count({
      where: {
        subscriptionStatus: "expired",
      },
    }),
  ]);

  const byPlan: Record<string, number> = { BASIC: 0, PRO: 0, ELITE: 0 };
  let total = 0;
  allNgos.forEach((g) => {
    byPlan[g.subscriptionPlan] = g._count.id;
    total += g._count.id;
  });

  const prices = { BASIC: 0, PRO: 149, ELITE: 349 };
  const monthlyRevenue = Object.entries(byPlan).reduce(
    (sum, [plan, count]) => sum + (prices[plan as keyof typeof prices] || 0) * count,
    0
  );

  return {
    total,
    byPlan,
    active: total - expiredCount,
    expiring: expiringCount,
    expired: expiredCount,
    revenue: {
      monthly: monthlyRevenue,
      annual: monthlyRevenue * 12,
    },
  };
}

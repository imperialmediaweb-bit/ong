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
import { notifySubscriptionChange } from "@/lib/platform-notifications";

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

export async function checkExpiringSubscriptions(): Promise<{
  expiring: number;
  expired: number;
  renewed: number;
  errors: string[];
}> {
  const results = {
    expiring: 0,
    expired: 0,
    renewed: 0,
    errors: [] as string[],
  };

  const now = new Date();

  // 1. Find subscriptions expiring in next 7 days (send warning)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringNgos = await prisma.ngo.findMany({
    where: {
      subscriptionExpiresAt: {
        gt: now,
        lte: sevenDaysFromNow,
      },
      subscriptionPlan: { not: "BASIC" },
      subscriptionStatus: "active",
      // Don't send if we already sent a notice in last 2 days
      OR: [
        { lastExpirationNotice: null },
        { lastExpirationNotice: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) } },
      ],
    },
    include: {
      users: {
        where: { role: "NGO_ADMIN" },
        select: { email: true, name: true },
      },
    },
  });

  for (const ngo of expiringNgos) {
    try {
      const daysLeft = Math.ceil(
        (ngo.subscriptionExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Update last notice date
      await prisma.ngo.update({
        where: { id: ngo.id },
        data: { lastExpirationNotice: now },
      });

      // Create in-app notification
      await prisma.notification.create({
        data: {
          ngoId: ngo.id,
          type: "SUBSCRIPTION_EXPIRING",
          title: `Abonamentul expira in ${daysLeft} zile`,
          message: `Planul ${ngo.subscriptionPlan} expira pe ${ngo.subscriptionExpiresAt!.toLocaleDateString("ro-RO")}. Reinnoiti pentru a pastra accesul la functiile avansate.`,
          actionUrl: "/dashboard/settings",
        },
      });

      // Send email to all NGO admins
      for (const admin of ngo.users) {
        const emailData = subscriptionExpiringEmail({
          ngoName: ngo.name,
          plan: ngo.subscriptionPlan,
          expiresAt: ngo.subscriptionExpiresAt!,
          daysLeft,
          dashboardUrl: `${APP_URL}/dashboard/settings`,
        });

        await sendEmail({
          to: admin.email,
          subject: emailData.subject,
          html: emailData.html,
          from: "noreply@binevo.ro",
          fromName: "Binevo",
        }).catch((err) => {
          results.errors.push(`Email failed for ${admin.email}: ${err}`);
        });
      }

      results.expiring++;
    } catch (err: any) {
      results.errors.push(`Error processing expiring ngo ${ngo.id}: ${err.message}`);
    }
  }

  // 2. Find expired subscriptions - downgrade to BASIC
  const expiredNgos = await prisma.ngo.findMany({
    where: {
      subscriptionExpiresAt: { lt: now },
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

  for (const ngo of expiredNgos) {
    try {
      const previousPlan = ngo.subscriptionPlan;

      // Check if auto-renew is enabled
      if (ngo.autoRenew && ngo.stripeSubscriptionId) {
        // Auto-renew via Stripe - skip downgrade
        // The Stripe webhook will handle renewal
        results.renewed++;
        continue;
      }

      // Downgrade to BASIC
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
            reason: "Abonament expirat - retrogradare automata la BASIC",
          } as any,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          ngoId: ngo.id,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Abonament expirat",
          message: `Planul ${previousPlan} a expirat. Contul a fost trecut pe planul BASIC.`,
          actionUrl: "/dashboard/settings",
        },
      });

      // Send email
      for (const admin of ngo.users) {
        const emailData = subscriptionExpiredEmail({
          ngoName: ngo.name,
          previousPlan,
          dashboardUrl: `${APP_URL}/dashboard/settings`,
        });

        await sendEmail({
          to: admin.email,
          subject: emailData.subject,
          html: emailData.html,
          from: "noreply@binevo.ro",
          fromName: "Binevo",
        }).catch((err) => {
          results.errors.push(`Email failed for ${admin.email}: ${err}`);
        });
      }

      // Alert super admin about expired subscription
      notifySubscriptionChange({
        ngoName: ngo.name,
        event: "expired",
        plan: "BASIC",
        previousPlan,
      }).catch(() => {});

      results.expired++;
    } catch (err: any) {
      results.errors.push(`Error processing expired ngo ${ngo.id}: ${err.message}`);
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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSubscriptionSummary } from "@/lib/subscription-manager";

export const dynamic = "force-dynamic";

// GET - Get all subscriptions with details
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, active, expiring, expired
    const plan = searchParams.get("plan") || "";

    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {};

    if (filter === "active") {
      where.subscriptionStatus = "active";
      where.subscriptionPlan = { not: "BASIC" };
    } else if (filter === "expiring") {
      where.subscriptionExpiresAt = { gt: now, lte: sevenDays };
      where.subscriptionPlan = { not: "BASIC" };
    } else if (filter === "expired") {
      where.subscriptionStatus = "expired";
    }

    if (plan && ["BASIC", "PRO", "ELITE"].includes(plan)) {
      where.subscriptionPlan = plan;
    }

    const [ngos, summary] = await Promise.all([
      prisma.ngo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionStartAt: true,
          subscriptionExpiresAt: true,
          subscriptionAssignedBy: true,
          subscriptionNotes: true,
          autoRenew: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          currentPeriodEnd: true,
          isActive: true,
          category: true,
          createdAt: true,
          verification: {
            select: { status: true },
          },
          _count: {
            select: { donors: true, donations: true, campaigns: true, users: true },
          },
          users: {
            where: { role: "NGO_ADMIN" },
            select: { email: true, name: true },
            take: 1,
          },
        },
      }),
      getSubscriptionSummary(),
    ]);

    return NextResponse.json({ ngos, summary });
  } catch (error: any) {
    console.error("Eroare la listarea abonamentelor:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea abonamentelor" },
      { status: 500 }
    );
  }
}

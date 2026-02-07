import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalNgos,
      activeNgos,
      pendingVerification,
      totalUsers,
      activeUsers,
      totalDonors,
      donationsAggregate,
      totalCampaignsSent,
      recentNgos,
      recentUsers,
      basicPlan,
      proPlan,
      elitePlan,
    ] = await Promise.all([
      prisma.ngo.count(),
      prisma.ngo.count({ where: { isActive: true } }),
      prisma.ngoVerification.count({ where: { status: "PENDING" } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.donor.count(),
      prisma.donation.aggregate({ _sum: { amount: true } }),
      prisma.campaign.count({ where: { status: "SENT" } }),
      prisma.ngo.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.ngo.count({ where: { subscriptionPlan: "BASIC" } }),
      prisma.ngo.count({ where: { subscriptionPlan: "PRO" } }),
      prisma.ngo.count({ where: { subscriptionPlan: "ELITE" } }),
    ]);

    return NextResponse.json({
      totalNgos,
      activeNgos,
      inactiveNgos: totalNgos - activeNgos,
      pendingVerification,
      totalUsers,
      activeUsers,
      totalDonors,
      totalDonationsAmount: donationsAggregate._sum.amount || 0,
      totalCampaignsSent,
      recentRegistrations: {
        ngos: recentNgos,
        users: recentUsers,
      },
      ngosByPlan: {
        BASIC: basicPlan,
        PRO: proPlan,
        ELITE: elitePlan,
      },
    });
  } catch (error: any) {
    console.error("Eroare la statistici admin:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea statisticilor" },
      { status: 500 }
    );
  }
}

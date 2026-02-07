import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasFeature, hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, "analytics:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "analytics")) {
      return NextResponse.json({ error: "Analytics are not available on your plan" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Calculate the date range
    let startDate: Date;
    let endDate = dateTo ? new Date(dateTo) : new Date();

    if (dateFrom) {
      startDate = new Date(dateFrom);
    } else {
      startDate = new Date();
      switch (period) {
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
    }

    // Run all queries in parallel
    const [
      totalDonors,
      activeDonors,
      newDonorsInPeriod,
      totalDonationsInPeriod,
      donationSumInPeriod,
      totalCampaigns,
      campaignsSentInPeriod,
      campaignStats,
      topDonors,
      donationsByMonth,
      donorsByChannel,
      recentDonations,
    ] = await Promise.all([
      // Total donors
      prisma.donor.count({
        where: { ngoId, isAnonymized: false },
      }),

      // Active donors
      prisma.donor.count({
        where: { ngoId, status: "ACTIVE", isAnonymized: false },
      }),

      // New donors in the period
      prisma.donor.count({
        where: {
          ngoId,
          isAnonymized: false,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Total donations in the period
      prisma.donation.count({
        where: {
          ngoId,
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Sum of donations in period
      prisma.donation.aggregate({
        where: {
          ngoId,
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Total campaigns
      prisma.campaign.count({ where: { ngoId } }),

      // Campaigns sent in period
      prisma.campaign.count({
        where: {
          ngoId,
          status: "SENT",
          sentAt: { gte: startDate, lte: endDate },
        },
      }),

      // Aggregate campaign stats for sent campaigns in period
      prisma.campaign.aggregate({
        where: {
          ngoId,
          status: "SENT",
          sentAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          totalSent: true,
          totalDelivered: true,
          totalOpened: true,
          totalClicked: true,
          totalBounced: true,
          totalUnsubscribed: true,
        },
      }),

      // Top donors by total donated
      prisma.donor.findMany({
        where: { ngoId, isAnonymized: false, totalDonated: { gt: 0 } },
        orderBy: { totalDonated: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          totalDonated: true,
          donationCount: true,
          lastDonationAt: true,
        },
      }),

      // Donations grouped by month (last 12 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count,
          COALESCE(SUM(amount), 0) as total
        FROM "Donation"
        WHERE "ngoId" = ${ngoId}
          AND status = 'COMPLETED'
          AND "createdAt" >= ${new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,

      // Donors by preferred channel
      prisma.donor.groupBy({
        by: ["preferredChannel"],
        where: { ngoId, isAnonymized: false },
        _count: true,
      }),

      // Recent donations
      prisma.donation.findMany({
        where: { ngoId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          donor: { select: { id: true, name: true, email: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
    ]);

    const campaignStatsSum = campaignStats._sum;

    return NextResponse.json({
      data: {
        overview: {
          totalDonors,
          activeDonors,
          newDonorsInPeriod,
          totalDonationsInPeriod,
          donationSumInPeriod: donationSumInPeriod._sum.amount || 0,
          totalCampaigns,
          campaignsSentInPeriod,
        },
        campaignPerformance: {
          totalSent: campaignStatsSum.totalSent || 0,
          totalDelivered: campaignStatsSum.totalDelivered || 0,
          totalOpened: campaignStatsSum.totalOpened || 0,
          totalClicked: campaignStatsSum.totalClicked || 0,
          totalBounced: campaignStatsSum.totalBounced || 0,
          totalUnsubscribed: campaignStatsSum.totalUnsubscribed || 0,
          openRate: campaignStatsSum.totalSent
            ? ((campaignStatsSum.totalOpened || 0) / campaignStatsSum.totalSent * 100).toFixed(1)
            : "0.0",
          clickRate: campaignStatsSum.totalSent
            ? ((campaignStatsSum.totalClicked || 0) / campaignStatsSum.totalSent * 100).toFixed(1)
            : "0.0",
        },
        topDonors,
        donationsByMonth,
        donorsByChannel: donorsByChannel.map((d) => ({
          channel: d.preferredChannel,
          count: d._count,
        })),
        recentDonations,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

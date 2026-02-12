import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Get recent platform activity for super admin
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type"); // filter by action type

    // Get recent audit logs as activity feed
    const where: any = {};
    if (type) {
      where.action = type;
    }

    const [activities, counts] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
        include: {
          user: { select: { name: true, email: true } },
          ngo: { select: { name: true, slug: true } },
        },
      }),
      // Get summary counts
      Promise.all([
        prisma.auditLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.donation.count({
          where: {
            status: "COMPLETED",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.donation.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          _sum: { amount: true },
        }),
        prisma.ngo.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.ngoVerification.count({
          where: { status: "PENDING" },
        }),
      ]),
    ]);

    const [actionsToday, newUsersToday, donationsToday, donationSum, newNgosWeek, pendingVerifications] = counts;

    return NextResponse.json({
      activities,
      summary: {
        actionsToday,
        newUsersToday,
        donationsToday,
        donationAmountToday: donationSum._sum.amount || 0,
        newNgosWeek,
        pendingVerifications,
      },
    });
  } catch (error: any) {
    console.error("Error loading admin notifications:", error);
    return NextResponse.json({ error: "Eroare la incarcarea activitatii" }, { status: 500 });
  }
}

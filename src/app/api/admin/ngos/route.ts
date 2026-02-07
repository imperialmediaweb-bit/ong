import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "";
    const isActive = searchParams.get("isActive");
    const verificationStatus = searchParams.get("verificationStatus") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan && ["BASIC", "PRO", "ELITE"].includes(plan)) {
      where.subscriptionPlan = plan;
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    if (
      verificationStatus &&
      ["PENDING", "IN_REVIEW", "AI_CHECKED", "APPROVED", "REJECTED", "SUSPENDED"].includes(
        verificationStatus
      )
    ) {
      where.verification = { status: verificationStatus };
    }

    const [ngos, total] = await Promise.all([
      prisma.ngo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              users: true,
              donors: true,
              donations: true,
              campaigns: true,
            },
          },
          verification: {
            select: {
              status: true,
              aiScore: true,
              reviewedAt: true,
            },
          },
          donations: {
            select: { amount: true },
          },
        },
      }),
      prisma.ngo.count({ where }),
    ]);

    const ngosWithStats = ngos.map((ngo) => {
      const donationTotal = ngo.donations.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      const { donations, ...ngoData } = ngo;
      return {
        ...ngoData,
        donationTotal,
      };
    });

    return NextResponse.json({
      ngos: ngosWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Eroare la listarea ONG-urilor:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea listei de ONG-uri" },
      { status: 500 }
    );
  }
}

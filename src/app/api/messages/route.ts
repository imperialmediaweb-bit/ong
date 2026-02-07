import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

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
    if (!hasPermission(role, "campaigns:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const campaignId = searchParams.get("campaignId") || "";
    const status = searchParams.get("status") || "";
    const channel = searchParams.get("channel") || "";

    const where: any = {
      campaign: { ngoId },
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (status) {
      where.status = status;
    }

    if (channel) {
      where.channel = channel;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          campaign: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { recipients: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    return NextResponse.json({
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

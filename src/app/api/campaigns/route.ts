import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { campaignSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
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
    if (!hasPermission(role, "campaigns:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const channel = searchParams.get("channel") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = { ngoId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (channel) {
      where.channel = channel;
    }

    const allowedSortFields = ["createdAt", "name", "status", "sentAt", "totalSent", "totalOpened"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Campaigns GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    if (!hasPermission(role, "campaigns:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;

    const body = await request.json();
    const parsed = campaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check plan features for channel
    if ((data.channel === "EMAIL" || data.channel === "BOTH") && !hasFeature(plan, "campaigns_email")) {
      return NextResponse.json(
        { error: "Email campaigns are not available on your plan" },
        { status: 403 }
      );
    }

    if ((data.channel === "SMS" || data.channel === "BOTH") && !hasFeature(plan, "campaigns_sms")) {
      return NextResponse.json(
        { error: "SMS campaigns are not available on your plan" },
        { status: 403 }
      );
    }

    if (data.isAbTest && !hasFeature(plan, "ab_testing")) {
      return NextResponse.json(
        { error: "A/B testing is not available on your plan" },
        { status: 403 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        ngoId,
        name: data.name,
        type: data.type,
        channel: data.channel,
        subject: data.subject || null,
        emailBody: data.emailBody || null,
        previewText: data.previewText || null,
        smsBody: data.smsBody || null,
        segmentQuery: data.segmentQuery || undefined,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        goalAmount: data.goalAmount || null,
        isAbTest: data.isAbTest,
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "CAMPAIGN_CREATED",
      entityType: "Campaign",
      entityId: campaign.id,
      details: { name: data.name, type: data.type, channel: data.channel },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error("Campaigns POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

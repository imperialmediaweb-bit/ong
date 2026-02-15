import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { campaignSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, hasFeature, fetchEffectivePlan } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "campaigns_email", role)) {
      return NextResponse.json({ error: "Campaniile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            _count: {
              select: { recipients: true },
            },
          },
        },
        _count: {
          select: { donations: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error("Campaign GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "campaigns_email", role)) {
      return NextResponse.json({ error: "Campaniile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const existing = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Cannot edit campaigns that are already sent or sending
    if (existing.status === "SENT" || existing.status === "SENDING") {
      return NextResponse.json(
        { error: "Cannot edit a campaign that has already been sent" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = campaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
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
      action: "CAMPAIGN_UPDATED",
      entityType: "Campaign",
      entityId: campaign.id,
      details: { name: data.name },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error("Campaign PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "campaigns_email", role)) {
      return NextResponse.json({ error: "Campaniile nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const existing = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status === "SENDING") {
      return NextResponse.json(
        { error: "Cannot delete a campaign that is currently sending" },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({ where: { id: params.id } });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "CAMPAIGN_DELETED",
      entityType: "Campaign",
      entityId: params.id,
      details: { name: existing.name },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Campaign DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

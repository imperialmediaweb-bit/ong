import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
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

    // Verify campaign belongs to NGO
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updates = await prisma.campaignUpdate.findMany({
      where: { campaignId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: updates });
  } catch (error) {
    console.error("Campaign updates GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    // Verify campaign belongs to NGO
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, imageUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Titlul si continutul sunt obligatorii" },
        { status: 400 }
      );
    }

    const update = await prisma.campaignUpdate.create({
      data: {
        campaignId: params.id,
        title,
        content,
        imageUrl: imageUrl || null,
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "CAMPAIGN_UPDATE_CREATED",
      entityType: "CampaignUpdate",
      entityId: update.id,
      details: { campaignId: params.id, title },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: update }, { status: 201 });
  } catch (error) {
    console.error("Campaign update POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

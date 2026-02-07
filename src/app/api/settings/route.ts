import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        subscriptionPlan: true,
        senderEmail: true,
        senderName: true,
        smsSenderId: true,
        // Don't return API keys directly
        sendgridApiKey: true,
        twilioAccountSid: true,
        twilioPhoneNumber: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    // Mask sensitive fields
    const masked = {
      ...ngo,
      sendgridApiKey: ngo.sendgridApiKey ? "••••••" + ngo.sendgridApiKey.slice(-4) : null,
      twilioAccountSid: ngo.twilioAccountSid ? "••••••" + ngo.twilioAccountSid.slice(-4) : null,
      twilioAuthToken: ngo.twilioAccountSid ? "••••••••" : null,
    };

    // Get team members
    const users = await prisma.user.findMany({
      where: { ngoId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: { ngo: masked, users } });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;
    if (!ngoId || !hasPermission(role, "settings:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, description, logoUrl, websiteUrl,
      senderEmail, senderName, smsSenderId,
      sendgridApiKey, twilioAccountSid, twilioAuthToken, twilioPhoneNumber,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (senderEmail !== undefined) updateData.senderEmail = senderEmail;
    if (senderName !== undefined) updateData.senderName = senderName;
    if (smsSenderId !== undefined) updateData.smsSenderId = smsSenderId;

    // Only update API keys if new values provided (not masked)
    if (sendgridApiKey && !sendgridApiKey.startsWith("••")) {
      updateData.sendgridApiKey = sendgridApiKey;
    }
    if (twilioAccountSid && !twilioAccountSid.startsWith("••")) {
      updateData.twilioAccountSid = twilioAccountSid;
    }
    if (twilioAuthToken && !twilioAuthToken.startsWith("••")) {
      updateData.twilioAuthToken = twilioAuthToken;
    }
    if (twilioPhoneNumber !== undefined) {
      updateData.twilioPhoneNumber = twilioPhoneNumber;
    }

    const ngo = await prisma.ngo.update({
      where: { id: ngoId },
      data: updateData,
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "SETTINGS_UPDATED",
      entityType: "Ngo",
      entityId: ngoId,
      details: { fields: Object.keys(updateData) },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ data: ngo });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

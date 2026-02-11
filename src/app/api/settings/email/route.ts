import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

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
        sendgridApiKey: true,
        senderEmail: true,
        senderName: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json({
      sendgridApiKey: ngo.sendgridApiKey ? "••••••" + ngo.sendgridApiKey.slice(-4) : "",
      senderEmail: ngo.senderEmail || "",
      senderName: ngo.senderName || "",
    });
  } catch (error) {
    console.error("Settings email GET error:", error);
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
    const { sendgridApiKey, senderEmail, senderName } = body;

    const updateData: any = {};
    if (senderEmail !== undefined) updateData.senderEmail = senderEmail;
    if (senderName !== undefined) updateData.senderName = senderName;
    if (sendgridApiKey && !sendgridApiKey.startsWith("••")) {
      updateData.sendgridApiKey = sendgridApiKey;
    }

    await prisma.ngo.update({
      where: { id: ngoId },
      data: updateData,
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "SETTINGS_UPDATED",
      entityType: "Ngo",
      entityId: ngoId,
      details: { fields: Object.keys(updateData), section: "email" },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings email PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

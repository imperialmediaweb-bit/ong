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
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioPhoneNumber: true,
        smsSenderId: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json({
      twilioSid: ngo.twilioAccountSid ? "••••••" + ngo.twilioAccountSid.slice(-4) : "",
      twilioAuthToken: ngo.twilioAuthToken ? "••••••••" : "",
      twilioPhoneNumber: ngo.twilioPhoneNumber || "",
      smsSenderId: ngo.smsSenderId || "",
    });
  } catch (error) {
    console.error("Settings SMS GET error:", error);
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
    const { twilioSid, twilioAuthToken, twilioPhoneNumber, smsSenderId } = body;

    const updateData: any = {};
    if (twilioPhoneNumber !== undefined) updateData.twilioPhoneNumber = twilioPhoneNumber;
    if (smsSenderId !== undefined) updateData.smsSenderId = smsSenderId;
    if (twilioSid && !twilioSid.startsWith("••")) {
      updateData.twilioAccountSid = twilioSid;
    }
    if (twilioAuthToken && !twilioAuthToken.startsWith("••")) {
      updateData.twilioAuthToken = twilioAuthToken;
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
      details: { fields: Object.keys(updateData), section: "sms" },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings SMS PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

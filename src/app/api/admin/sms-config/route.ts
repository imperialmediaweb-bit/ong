import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        twilioSid: true,
        twilioToken: true,
        twilioPhone: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        smsProvider: process.env.SMS_PROVIDER || "twilio",
        twilioSid: "",
        twilioToken: "",
        twilioPhone: "",
        _hasTwilioToken: false,
        _hasTwilioSid: false,
      });
    }

    return NextResponse.json({
      smsProvider: process.env.SMS_PROVIDER || "twilio",
      twilioSid: settings.twilioSid ? maskKey(settings.twilioSid) : "",
      twilioToken: settings.twilioToken ? "••••••••" : "",
      twilioPhone: settings.twilioPhone || "",
      _hasTwilioSid: !!settings.twilioSid,
      _hasTwilioToken: !!settings.twilioToken,
    });
  } catch (error: any) {
    console.error("Error loading SMS config:", error);
    return NextResponse.json({ error: "Eroare la incarcarea configuratiei SMS" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data: any = {};

    if (body.twilioSid && !body.twilioSid.includes("••")) {
      data.twilioSid = body.twilioSid;
    }
    if (body.twilioToken && body.twilioToken !== "••••••••") {
      data.twilioToken = body.twilioToken;
    }
    if (body.twilioPhone !== undefined) {
      data.twilioPhone = body.twilioPhone;
    }

    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", ...data },
      update: data,
    });

    return NextResponse.json({
      success: true,
      message: "Configuratia SMS a fost salvata cu succes",
    });
  } catch (error: any) {
    console.error("Error saving SMS config:", error);
    return NextResponse.json({ error: "Eroare la salvarea configuratiei SMS" }, { status: 500 });
  }
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { testEmailConfig } from "@/lib/email-sender";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const testEmail = body.testEmail;

    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json({ error: "Adresa email de test invalida" }, { status: 400 });
    }

    // Get current settings from DB (with real values, not masked)
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });

    // Build config from body (for testing before saving) or from DB
    const config = {
      provider: (body.emailProvider || settings?.emailProvider || "smtp") as "smtp" | "sendgrid" | "mailgun",
      smtpHost: body.smtpHost || settings?.smtpHost,
      smtpPort: parseInt(body.smtpPort) || settings?.smtpPort || 587,
      smtpUser: body.smtpUser || settings?.smtpUser,
      smtpPassword: body.smtpPassword === "••••••••" ? settings?.smtpPassword : (body.smtpPassword || settings?.smtpPassword),
      smtpEncryption: body.smtpEncryption || settings?.smtpEncryption || "tls",
      smtpFromEmail: body.smtpFromEmail || settings?.smtpFromEmail,
      smtpFromName: body.smtpFromName || settings?.smtpFromName || "Binevo",
      smtpReplyTo: body.smtpReplyTo || settings?.smtpReplyTo,
      sendgridApiKey: body.sendgridApiKey?.includes("••••") ? settings?.sendgridApiKey : (body.sendgridApiKey || settings?.sendgridApiKey),
      mailgunApiKey: body.mailgunApiKey?.includes("••••") ? settings?.mailgunApiKey : (body.mailgunApiKey || settings?.mailgunApiKey),
      mailgunDomain: body.mailgunDomain || settings?.mailgunDomain,
      mailgunRegion: body.mailgunRegion || settings?.mailgunRegion || "eu",
    };

    const result = await testEmailConfig(config, testEmail);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error testing email config:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Eroare la testarea configuratiei email",
    }, { status: 500 });
  }
}

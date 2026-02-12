import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { invalidateEmailConfigCache } from "@/lib/email-sender";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        emailProvider: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpEncryption: true,
        smtpFromEmail: true,
        smtpFromName: true,
        smtpReplyTo: true,
        sendgridApiKey: true,
        mailgunApiKey: true,
        mailgunDomain: true,
        mailgunRegion: true,
        notifyOnRegistration: true,
        notifyOnVerification: true,
        notifyOnSubscription: true,
        notifyOnDonation: true,
        notifyOnInvoice: true,
        notifyWelcomeEmail: true,
        invoicePrefix: true,
        invoiceNextNumber: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        emailProvider: "smtp",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        smtpEncryption: "tls",
        smtpFromEmail: "",
        smtpFromName: "Binevo",
        smtpReplyTo: "",
        sendgridApiKey: "",
        mailgunApiKey: "",
        mailgunDomain: "",
        mailgunRegion: "eu",
        notifyOnRegistration: true,
        notifyOnVerification: true,
        notifyOnSubscription: true,
        notifyOnDonation: true,
        notifyOnInvoice: true,
        notifyWelcomeEmail: true,
        invoicePrefix: "BNV",
        invoiceNextNumber: 1,
      });
    }

    // Mask sensitive fields for display
    return NextResponse.json({
      ...settings,
      smtpPassword: settings.smtpPassword ? "••••••••" : "",
      sendgridApiKey: settings.sendgridApiKey ? maskKey(settings.sendgridApiKey) : "",
      mailgunApiKey: settings.mailgunApiKey ? maskKey(settings.mailgunApiKey) : "",
      // Send raw values in separate fields for form detection
      _hasSmtpPassword: !!settings.smtpPassword,
      _hasSendgridKey: !!settings.sendgridApiKey,
      _hasMailgunKey: !!settings.mailgunApiKey,
    });
  } catch (error: any) {
    console.error("Error loading email config:", error);
    return NextResponse.json({ error: "Eroare la incarcarea configuratiei email" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "emailProvider",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPassword",
      "smtpEncryption",
      "smtpFromEmail",
      "smtpFromName",
      "smtpReplyTo",
      "sendgridApiKey",
      "mailgunApiKey",
      "mailgunDomain",
      "mailgunRegion",
      "notifyOnRegistration",
      "notifyOnVerification",
      "notifyOnSubscription",
      "notifyOnDonation",
      "notifyOnInvoice",
      "notifyWelcomeEmail",
      "invoicePrefix",
      "invoiceNextNumber",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Don't overwrite password/key fields with masked values
        if (field === "smtpPassword" && body[field] === "••••••••") continue;
        if (field === "sendgridApiKey" && body[field]?.includes("••••")) continue;
        if (field === "mailgunApiKey" && body[field]?.includes("••••")) continue;

        if (field === "smtpPort") {
          data[field] = parseInt(body[field]) || 587;
        } else if (field === "invoiceNextNumber") {
          data[field] = parseInt(body[field]) || 1;
        } else if (typeof body[field] === "boolean") {
          data[field] = body[field];
        } else {
          data[field] = body[field];
        }
      }
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", ...data },
      update: data,
    });

    // Invalidate email config cache
    invalidateEmailConfigCache();

    return NextResponse.json({
      success: true,
      message: "Configuratia email a fost salvata cu succes",
    });
  } catch (error: any) {
    console.error("Error saving email config:", error);
    return NextResponse.json({ error: "Eroare la salvarea configuratiei email" }, { status: 500 });
  }
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
}

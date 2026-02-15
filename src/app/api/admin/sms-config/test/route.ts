import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendSms, formatPhoneNumber } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const testPhone = body.testPhone;

    if (!testPhone || testPhone.length < 8) {
      return NextResponse.json({ error: "Numar de telefon invalid" }, { status: 400 });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });

    const config = {
      accountSid: body.twilioSid?.includes("••") ? settings?.twilioSid : (body.twilioSid || settings?.twilioSid),
      authToken: body.twilioToken === "••••••••" ? settings?.twilioToken : (body.twilioToken || settings?.twilioToken),
      phoneNumber: body.twilioPhone || settings?.twilioPhone,
      telnyxApiKey: body.telnyxApiKey?.includes("••") ? settings?.telnyxApiKey : (body.telnyxApiKey || settings?.telnyxApiKey),
      telnyxPhone: body.telnyxPhone || settings?.telnyxPhone,
    };

    const formattedPhone = formatPhoneNumber(testPhone);

    const result = await sendSms(
      {
        to: formattedPhone,
        body: "Test SMS de la platforma Binevo. Daca primesti acest mesaj, configuratia SMS functioneaza corect!",
        from: config.phoneNumber || config.telnyxPhone || undefined,
      },
      {
        accountSid: config.accountSid || undefined,
        authToken: config.authToken || undefined,
        phoneNumber: config.phoneNumber || undefined,
        telnyxApiKey: config.telnyxApiKey || undefined,
        telnyxPhoneNumber: config.telnyxPhone || undefined,
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: process.env.SMS_PROVIDER || "twilio",
        sid: result.sid,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Eroare la trimiterea SMS-ului de test",
      });
    }
  } catch (error: any) {
    console.error("Error testing SMS config:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Eroare la testarea configuratiei SMS",
    }, { status: 500 });
  }
}

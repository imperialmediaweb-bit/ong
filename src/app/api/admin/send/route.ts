import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { sendPlatformEmail } from "@/lib/email-sender";
import { sendSms, formatPhoneNumber } from "@/lib/sms";
import { createAuditLog } from "@/lib/audit";

// POST - Send individual email or SMS from admin panel
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { channel, to, subject, htmlBody, smsBody, fromName } = body;

    if (!channel || !to) {
      return NextResponse.json({ error: "Canalul si destinatarul sunt obligatorii" }, { status: 400 });
    }

    const results: { channel: string; success: boolean; error?: string }[] = [];

    if (channel === "email" || channel === "both") {
      if (!subject || !htmlBody) {
        return NextResponse.json({ error: "Subject si continut HTML sunt obligatorii pentru email" }, { status: 400 });
      }

      try {
        await sendPlatformEmail({
          to,
          subject,
          html: htmlBody,
          fromName: fromName || undefined,
        });
        results.push({ channel: "email", success: true });
      } catch (err: any) {
        results.push({ channel: "email", success: false, error: err.message });
      }
    }

    if (channel === "sms" || channel === "both") {
      if (!smsBody) {
        return NextResponse.json({ error: "Continutul SMS este obligatoriu" }, { status: 400 });
      }

      const formattedPhone = formatPhoneNumber(to);
      const smsResult = await sendSms({
        to: formattedPhone,
        body: smsBody,
      });
      results.push({
        channel: "sms",
        success: smsResult.success,
        error: smsResult.error,
      });
    }

    await createAuditLog({
      userId: (session.user as any).id,
      action: "ADMIN_SEND_MESSAGE",
      entityType: "Message",
      details: {
        channel,
        to,
        subject: channel !== "sms" ? subject : undefined,
        results,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    const allSucceeded = results.every((r) => r.success);
    const anySucceeded = results.some((r) => r.success);

    return NextResponse.json({
      success: anySucceeded,
      results,
      message: allSucceeded
        ? "Mesaj trimis cu succes!"
        : anySucceeded
        ? "Mesaj trimis partial - vezi detalii"
        : "Eroare la trimiterea mesajului",
    });
  } catch (error: any) {
    console.error("Error sending admin message:", error);
    return NextResponse.json({ error: "Eroare la trimiterea mesajului" }, { status: 500 });
  }
}

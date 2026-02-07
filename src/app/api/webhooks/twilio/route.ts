import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Twilio SMS Status Callback Webhook
// Receives delivery status updates for SMS messages
// See: https://www.twilio.com/docs/sms/tutorials/how-to-confirm-delivery

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messageSid = formData.get("MessageSid") as string | null;
    const messageStatus = formData.get("MessageStatus") as string | null;
    const to = formData.get("To") as string | null;
    const from = formData.get("From") as string | null;
    const body = formData.get("Body") as string | null;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    // Handle incoming SMS (e.g., STOP for opt-out)
    if (body) {
      const normalizedBody = body.trim().toUpperCase();

      if (normalizedBody === "STOP" || normalizedBody === "UNSUBSCRIBE" || normalizedBody === "CANCEL") {
        // Opt-out the sender
        if (from) {
          const cleanPhone = from.replace(/\D/g, "");

          // Find donors with this phone number and update consent
          const donors = await prisma.donor.findMany({
            where: {
              OR: [
                { phone: from },
                { phone: cleanPhone },
                { phone: { endsWith: cleanPhone.slice(-10) } },
              ],
            },
          });

          for (const donor of donors) {
            await prisma.donor.update({
              where: { id: donor.id },
              data: { smsConsent: false, status: "UNSUBSCRIBED" },
            });

            // Record the consent change
            await prisma.consentRecord.create({
              data: {
                donorId: donor.id,
                type: "SMS_MARKETING",
                granted: false,
                source: "sms_reply_stop",
              },
            });
          }

          // Add to the SMS opt-out list
          // Find the NGO from the first matching donor
          const ngoId = donors[0]?.ngoId || null;
          await prisma.smsOptOut.upsert({
            where: {
              phoneNumber_ngoId: {
                phoneNumber: from,
                ngoId: ngoId || "",
              },
            },
            create: {
              phoneNumber: from,
              ngoId: ngoId,
            },
            update: {},
          });
        }

        // Return TwiML empty response
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          {
            status: 200,
            headers: { "Content-Type": "text/xml" },
          }
        );
      }
    }

    // Handle status callbacks for outbound messages
    if (messageSid && messageStatus) {
      // Find the message recipient by phone number
      const recipient = to
        ? await prisma.messageRecipient.findFirst({
            where: {
              channel: "SMS",
              OR: [
                { address: to },
                { address: to.replace(/^\+/, "") },
              ],
            },
            orderBy: { createdAt: "desc" },
            include: { message: true },
          })
        : null;

      if (recipient) {
        const now = new Date();

        switch (messageStatus) {
          case "delivered":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: { status: "DELIVERED", deliveredAt: now },
            });
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalDelivered: { increment: 1 } },
              });
            }
            break;

          case "failed":
          case "undelivered":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "FAILED",
                errorMsg: errorMessage || errorCode || `SMS ${messageStatus}`,
              },
            });
            break;

          case "sent":
            // Already tracked as SENT when we sent it
            break;
        }
      }
    }

    // Return empty TwiML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  }
}

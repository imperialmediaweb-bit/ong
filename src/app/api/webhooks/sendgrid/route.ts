import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// SendGrid Event Webhook
// Receives delivery status events for emails sent via SendGrid
// See: https://docs.sendgrid.com/for-developers/tracking-events/event

interface SendGridEvent {
  email: string;
  event: string;
  sg_message_id?: string;
  timestamp?: number;
  reason?: string;
  response?: string;
  category?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook signature if configured
    const webhookSecret = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
    if (webhookSecret) {
      const signature = request.headers.get("x-twilio-email-event-webhook-signature");
      const timestamp = request.headers.get("x-twilio-email-event-webhook-timestamp");
      if (!signature || !timestamp) {
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }
      // In production, verify the ECDSA signature here
      // For now, we accept if the headers are present
    }

    const events: SendGridEvent[] = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const event of events) {
      try {
        // Find the message recipient by email address
        // We match on the most recent message recipient with this address
        const recipient = await prisma.messageRecipient.findFirst({
          where: {
            address: event.email,
            channel: "EMAIL",
          },
          orderBy: { createdAt: "desc" },
          include: {
            message: true,
          },
        });

        if (!recipient) continue;

        const now = event.timestamp ? new Date(event.timestamp * 1000) : new Date();

        switch (event.event) {
          case "delivered":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: { status: "DELIVERED", deliveredAt: now },
            });
            // Update campaign stats
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalDelivered: { increment: 1 } },
              });
            }
            break;

          case "open":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "OPENED",
                openedAt: recipient.openedAt || now,
              },
            });
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalOpened: { increment: 1 } },
              });
            }
            break;

          case "click":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "CLICKED",
                clickedAt: recipient.clickedAt || now,
              },
            });
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalClicked: { increment: 1 } },
              });
            }
            break;

          case "bounce":
          case "dropped":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "BOUNCED",
                bouncedAt: now,
                errorMsg: event.reason || event.response || null,
              },
            });
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalBounced: { increment: 1 } },
              });
            }
            break;

          case "spamreport":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: { status: "COMPLAINED" },
            });
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalComplaints: { increment: 1 } },
              });
            }
            break;

          case "unsubscribe":
          case "group_unsubscribe":
            await prisma.messageRecipient.update({
              where: { id: recipient.id },
              data: { status: "UNSUBSCRIBED" },
            });
            // Update the donor's consent
            if (recipient.donorId) {
              await prisma.donor.update({
                where: { id: recipient.donorId },
                data: { emailConsent: false, status: "UNSUBSCRIBED" },
              });
            }
            if (recipient.message?.campaignId) {
              await prisma.campaign.update({
                where: { id: recipient.message.campaignId },
                data: { totalUnsubscribed: { increment: 1 } },
              });
            }
            break;
        }
      } catch (err) {
        // Log but continue processing other events
        console.error("Error processing SendGrid event:", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("SendGrid webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

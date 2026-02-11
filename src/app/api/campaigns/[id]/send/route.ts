import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { sendEmail, generateUnsubscribeUrl } from "@/lib/email";
import { sendSms, formatPhoneNumber } from "@/lib/sms";
import { hasFeature, hasPermission } from "@/lib/permissions";
import { decrypt } from "@/lib/encryption";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, "campaigns:send")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Cannot send a campaign with status: ${campaign.status}` },
        { status: 400 }
      );
    }

    // Check plan features for channel
    if ((campaign.channel === "EMAIL" || campaign.channel === "BOTH") && !hasFeature(plan, "campaigns_email")) {
      return NextResponse.json({ error: "Email campaigns not available on your plan" }, { status: 403 });
    }

    if ((campaign.channel === "SMS" || campaign.channel === "BOTH") && !hasFeature(plan, "campaigns_sms")) {
      return NextResponse.json({ error: "SMS campaigns not available on your plan" }, { status: 403 });
    }

    // Fetch the NGO for provider credentials
    const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    // Build donor query from segmentQuery
    const donorWhere: any = {
      ngoId,
      isAnonymized: false,
      status: "ACTIVE",
    };

    if (campaign.channel === "EMAIL" || campaign.channel === "BOTH") {
      donorWhere.email = { not: null };
      donorWhere.emailConsent = true;
    }

    if (campaign.channel === "SMS") {
      donorWhere.phone = { not: null };
      donorWhere.smsConsent = true;
    }

    // Apply segment query if present
    if (campaign.segmentQuery && typeof campaign.segmentQuery === "object") {
      const sq = campaign.segmentQuery as any;
      if (sq.tags && sq.tags.length > 0) {
        donorWhere.tags = { some: { tagId: { in: sq.tags } } };
      }
      if (sq.minDonation) {
        donorWhere.totalDonated = { ...donorWhere.totalDonated, gte: sq.minDonation };
      }
      if (sq.maxDonation) {
        donorWhere.totalDonated = { ...donorWhere.totalDonated, lte: sq.maxDonation };
      }
      if (sq.status) {
        donorWhere.status = sq.status;
      }
    }

    const donors = await prisma.donor.findMany({
      where: donorWhere,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        preferredChannel: true,
      },
    });

    if (donors.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients found for this campaign" },
        { status: 400 }
      );
    }

    // Check credit balance
    const emailRecipients = (campaign.channel === "EMAIL" || campaign.channel === "BOTH") ? donors.filter(d => d.email).length : 0;
    const smsRecipients = (campaign.channel === "SMS" || campaign.channel === "BOTH") ? donors.filter(d => d.phone).length : 0;

    if (emailRecipients > 0 && ngo.emailCredits < emailRecipients) {
      return NextResponse.json(
        { error: `Credite email insuficiente. Necesare: ${emailRecipients}, disponibile: ${ngo.emailCredits}. Achizitioneaza mai multe credite.` },
        { status: 400 }
      );
    }

    if (smsRecipients > 0 && ngo.smsCredits < smsRecipients) {
      return NextResponse.json(
        { error: `Credite SMS insuficiente. Necesare: ${smsRecipients}, disponibile: ${ngo.smsCredits}. Achizitioneaza mai multe credite.` },
        { status: 400 }
      );
    }

    // Mark campaign as sending
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: "SENDING",
        sentAt: new Date(),
        recipientCount: donors.length,
      },
    });

    // Create a message record
    const message = await prisma.message.create({
      data: {
        campaignId: campaign.id,
        channel: campaign.channel,
        subject: campaign.subject,
        body: campaign.channel === "SMS" ? (campaign.smsBody || "") : (campaign.emailBody || ""),
        status: "SENDING",
      },
    });

    // Process sending in the background
    let totalSent = 0;
    let totalFailed = 0;

    for (const donor of donors) {
      try {
        const shouldSendEmail = (campaign.channel === "EMAIL" || campaign.channel === "BOTH") && donor.email;
        const shouldSendSms = (campaign.channel === "SMS" || campaign.channel === "BOTH") && donor.phone;

        if (shouldSendEmail && donor.email) {
          const unsubscribeUrl = generateUnsubscribeUrl(donor.id, ngo.slug);
          const personalizedBody = (campaign.emailBody || "")
            .replace(/\{\{name\}\}/g, donor.name || "Supporter")
            .replace(/\{\{donor_name\}\}/g, donor.name || "Supporter");

          const emailResult = await sendEmail(
            {
              to: donor.email,
              subject: campaign.subject || "Message from " + ngo.name,
              html: personalizedBody,
              from: ngo.senderEmail || undefined,
              fromName: ngo.senderName || ngo.name,
              unsubscribeUrl,
            },
            ngo.sendgridApiKey ? decrypt(ngo.sendgridApiKey) : undefined
          );

          await prisma.messageRecipient.create({
            data: {
              messageId: message.id,
              donorId: donor.id,
              channel: "EMAIL",
              address: donor.email,
              status: emailResult.success ? "SENT" : "FAILED",
              errorMsg: emailResult.error || null,
            },
          });

          if (emailResult.success) totalSent++;
          else totalFailed++;
        }

        if (shouldSendSms && donor.phone) {
          const personalizedSms = (campaign.smsBody || "")
            .replace(/\{\{name\}\}/g, donor.name || "Supporter")
            .replace(/\{\{donor_name\}\}/g, donor.name || "Supporter");

          const smsResult = await sendSms(
            {
              to: formatPhoneNumber(donor.phone),
              body: personalizedSms,
            },
            {
              accountSid: ngo.twilioAccountSid ? decrypt(ngo.twilioAccountSid) : undefined,
              authToken: ngo.twilioAuthToken ? decrypt(ngo.twilioAuthToken) : undefined,
              phoneNumber: ngo.twilioPhoneNumber || undefined,
            }
          );

          await prisma.messageRecipient.create({
            data: {
              messageId: message.id,
              donorId: donor.id,
              channel: "SMS",
              address: donor.phone,
              status: smsResult.success ? "SENT" : "FAILED",
              errorMsg: smsResult.error || null,
            },
          });

          if (smsResult.success) totalSent++;
          else totalFailed++;
        }
      } catch (err: any) {
        console.error(`Error sending to donor ${donor.id}:`, err.message);
        totalFailed++;
      }
    }

    // Deduct credits based on actual sends
    const emailsSent = (campaign.channel === "EMAIL" || campaign.channel === "BOTH") ? totalSent : 0;
    const smsSent = (campaign.channel === "SMS" || campaign.channel === "BOTH") ? totalSent : 0;

    const creditUpdates: any = {};
    if (emailsSent > 0) creditUpdates.emailCredits = { decrement: emailsSent };
    if (smsSent > 0) creditUpdates.smsCredits = { decrement: smsSent };

    if (Object.keys(creditUpdates).length > 0) {
      const updatedNgo = await prisma.ngo.update({
        where: { id: ngoId },
        data: creditUpdates,
      });

      // Log credit transactions
      if (emailsSent > 0) {
        await prisma.creditTransaction.create({
          data: {
            ngoId,
            type: "USAGE",
            channel: "EMAIL",
            amount: -emailsSent,
            balance: updatedNgo.emailCredits,
            description: `Campanie: ${campaign.name} (${emailsSent} emailuri trimise)`,
            campaignId: campaign.id,
          },
        });
      }
      if (smsSent > 0) {
        await prisma.creditTransaction.create({
          data: {
            ngoId,
            type: "USAGE",
            channel: "SMS",
            amount: -smsSent,
            balance: updatedNgo.smsCredits,
            description: `Campanie: ${campaign.name} (${smsSent} SMS-uri trimise)`,
            campaignId: campaign.id,
          },
        });
      }
    }

    // Update campaign stats
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        completedAt: new Date(),
        totalSent,
      },
    });

    // Update message status
    await prisma.message.update({
      where: { id: message.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "CAMPAIGN_SENT",
      entityType: "Campaign",
      entityId: campaign.id,
      details: {
        name: campaign.name,
        recipientCount: donors.length,
        totalSent,
        totalFailed,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({
      message: "Campaign sent successfully",
      stats: {
        recipientCount: donors.length,
        totalSent,
        totalFailed,
      },
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

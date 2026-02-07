import prisma from "./db";
import { sendEmail, generateUnsubscribeUrl } from "./email";
import { sendSms, formatPhoneNumber } from "./sms";
import { createAuditLog } from "./audit";
import { fireAutomationTrigger } from "./automation-engine";

interface SendCampaignResult {
  totalSent: number;
  totalFailed: number;
  errors: string[];
}

export async function sendCampaign(campaignId: string): Promise<SendCampaignResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { ngo: true },
  });

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    throw new Error("Campaign cannot be sent in current status");
  }

  // Update status to sending
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", sentAt: new Date() },
  });

  // Get eligible recipients based on segment query
  const whereClause: any = {
    ngoId: campaign.ngoId,
    status: "ACTIVE",
    isAnonymized: false,
  };

  // Apply channel consent filters
  if (campaign.channel === "EMAIL" || campaign.channel === "BOTH") {
    whereClause.emailConsent = true;
    whereClause.email = { not: null };
  }
  if (campaign.channel === "SMS" || campaign.channel === "BOTH") {
    whereClause.smsConsent = true;
    whereClause.phone = { not: null };
  }

  // Apply segment filters
  const segmentQuery = campaign.segmentQuery as any;
  if (segmentQuery) {
    if (segmentQuery.tags?.length) {
      whereClause.tags = { some: { tagId: { in: segmentQuery.tags } } };
    }
    if (segmentQuery.minAmount) {
      whereClause.totalDonated = { gte: segmentQuery.minAmount };
    }
    if (segmentQuery.maxAmount) {
      whereClause.totalDonated = { ...whereClause.totalDonated, lte: segmentQuery.maxAmount };
    }
    if (segmentQuery.donatedAfter) {
      whereClause.lastDonationAt = { gte: new Date(segmentQuery.donatedAfter) };
    }
    if (segmentQuery.donatedBefore) {
      whereClause.lastDonationAt = { ...whereClause.lastDonationAt, lte: new Date(segmentQuery.donatedBefore) };
    }
  }

  const donors = await prisma.donor.findMany({ where: whereClause });

  // Create message record
  const message = await prisma.message.create({
    data: {
      campaignId,
      channel: campaign.channel,
      subject: campaign.subject,
      body: campaign.channel === "SMS" ? (campaign.smsBody || "") : (campaign.emailBody || ""),
      status: "SENDING",
    },
  });

  let totalSent = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  // Send to each donor
  for (const donor of donors) {
    try {
      // Send email
      if ((campaign.channel === "EMAIL" || campaign.channel === "BOTH") && donor.email && donor.emailConsent) {
        const unsubUrl = generateUnsubscribeUrl(donor.id, campaign.ngo.slug);
        const result = await sendEmail(
          {
            to: donor.email,
            subject: campaign.subject || "",
            html: campaign.emailBody || "",
            from: campaign.ngo.senderEmail || undefined,
            fromName: campaign.ngo.senderName || campaign.ngo.name,
            unsubscribeUrl: unsubUrl,
          },
          campaign.ngo.sendgridApiKey || undefined
        );

        await prisma.messageRecipient.create({
          data: {
            messageId: message.id,
            donorId: donor.id,
            channel: "EMAIL",
            address: donor.email,
            status: result.success ? "SENT" : "FAILED",
            errorMsg: result.error || undefined,
          },
        });

        if (result.success) totalSent++;
        else {
          totalFailed++;
          errors.push(`Email to ${donor.email}: ${result.error}`);
        }
      }

      // Send SMS
      if ((campaign.channel === "SMS" || campaign.channel === "BOTH") && donor.phone && donor.smsConsent) {
        const result = await sendSms(
          {
            to: formatPhoneNumber(donor.phone),
            body: campaign.smsBody || "",
            senderId: campaign.ngo.smsSenderId || undefined,
          },
          {
            accountSid: campaign.ngo.twilioAccountSid || undefined,
            authToken: campaign.ngo.twilioAuthToken || undefined,
            phoneNumber: campaign.ngo.twilioPhoneNumber || undefined,
          }
        );

        await prisma.messageRecipient.create({
          data: {
            messageId: message.id,
            donorId: donor.id,
            channel: "SMS",
            address: donor.phone,
            status: result.success ? "SENT" : "FAILED",
            errorMsg: result.error || undefined,
          },
        });

        if (result.success) totalSent++;
        else {
          totalFailed++;
          errors.push(`SMS to ${donor.phone}: ${result.error}`);
        }
      }
    } catch (error: any) {
      totalFailed++;
      errors.push(`Donor ${donor.id}: ${error.message}`);
    }
  }

  // Update campaign and message stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      completedAt: new Date(),
      totalSent,
      recipientCount: donors.length,
    },
  });

  await prisma.message.update({
    where: { id: message.id },
    data: {
      status: totalFailed === donors.length ? "FAILED" : "SENT",
      sentAt: new Date(),
    },
  });

  await createAuditLog({
    ngoId: campaign.ngoId,
    action: "CAMPAIGN_SENT",
    entityType: "Campaign",
    entityId: campaignId,
    details: { name: campaign.name, totalSent, totalFailed, recipientCount: donors.length },
  });

  return { totalSent, totalFailed, errors };
}

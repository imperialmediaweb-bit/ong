import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { donationFormSchema } from "@/lib/validations";
import { encrypt } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";

// Public endpoint - no session required
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Find the NGO by slug
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug },
      include: {
        miniSiteConfig: true,
      },
    });

    if (!ngo || !ngo.isActive) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (ngo.miniSiteConfig && !ngo.miniSiteConfig.showDonation) {
      return NextResponse.json({ error: "Donations are not enabled for this organization" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = donationFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      amount,
      email,
      phone,
      name,
      emailConsent,
      smsConsent,
      privacyConsent,
      isRecurring,
    } = parsed.data;

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Find or create the donor
    let donor = null;

    if (email) {
      donor = await prisma.donor.findFirst({
        where: { ngoId: ngo.id, email },
      });
    }

    const emailEncrypted = email ? encrypt(email) : null;
    const phoneEncrypted = phone ? encrypt(phone) : null;

    if (donor) {
      // Update existing donor
      donor = await prisma.donor.update({
        where: { id: donor.id },
        data: {
          name: name || donor.name,
          phone: phone || donor.phone,
          phoneEncrypted: phoneEncrypted || donor.phoneEncrypted,
          emailConsent: emailConsent || donor.emailConsent,
          smsConsent: smsConsent || donor.smsConsent,
          privacyConsent: true,
        },
      });
    } else {
      // Create new donor
      donor = await prisma.donor.create({
        data: {
          ngoId: ngo.id,
          email: email || null,
          emailEncrypted,
          phone: phone || null,
          phoneEncrypted,
          name: name || null,
          emailConsent,
          smsConsent,
          privacyConsent: true,
          preferredChannel: phone && smsConsent ? (emailConsent ? "BOTH" : "SMS") : "EMAIL",
        },
      });
    }

    // Create the donation record
    const donation = await prisma.donation.create({
      data: {
        ngoId: ngo.id,
        donorId: donor.id,
        amount,
        isRecurring,
        status: "COMPLETED",
        source: "minisite",
        metadata: {
          slug: params.slug,
          userAgent,
          ipAddress,
        },
      },
    });

    // Update donor stats
    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        totalDonated: { increment: amount },
        donationCount: { increment: 1 },
        lastDonationAt: new Date(),
      },
    });

    // Store consent records
    const consentRecords = [];

    if (privacyConsent) {
      // Get the active privacy consent text
      const privacyText = await prisma.consentText.findFirst({
        where: { ngoId: ngo.id, type: "PRIVACY_POLICY", isActive: true },
      });

      consentRecords.push({
        donorId: donor.id,
        type: "PRIVACY_POLICY" as const,
        granted: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        source: "donation_form",
        consentText: privacyText?.text || null,
      });
    }

    if (emailConsent) {
      const emailConsentText = await prisma.consentText.findFirst({
        where: { ngoId: ngo.id, type: "EMAIL_MARKETING", isActive: true },
      });

      consentRecords.push({
        donorId: donor.id,
        type: "EMAIL_MARKETING" as const,
        granted: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        source: "donation_form",
        consentText: emailConsentText?.text || null,
      });
    }

    if (smsConsent) {
      const smsConsentText = await prisma.consentText.findFirst({
        where: { ngoId: ngo.id, type: "SMS_MARKETING", isActive: true },
      });

      consentRecords.push({
        donorId: donor.id,
        type: "SMS_MARKETING" as const,
        granted: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        source: "donation_form",
        consentText: smsConsentText?.text || null,
      });
    }

    if (consentRecords.length > 0) {
      await prisma.consentRecord.createMany({
        data: consentRecords,
      });
    }

    await createAuditLog({
      ngoId: ngo.id,
      action: "DONATION_RECEIVED",
      entityType: "Donation",
      entityId: donation.id,
      details: {
        amount,
        source: "minisite",
        isRecurring,
        donorId: donor.id,
      },
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json(
      {
        message: "Donation received successfully",
        donation: {
          id: donation.id,
          amount: donation.amount,
          currency: donation.currency,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Donate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

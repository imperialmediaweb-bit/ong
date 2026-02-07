import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { newsletterSchema } from "@/lib/validations";
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

    if (ngo.miniSiteConfig && !ngo.miniSiteConfig.showNewsletter) {
      return NextResponse.json({ error: "Newsletter subscription is not enabled for this organization" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, emailConsent, privacyConsent } = parsed.data;

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Check if donor already exists
    let donor = await prisma.donor.findFirst({
      where: { ngoId: ngo.id, email },
    });

    const emailEncrypted = encrypt(email);

    if (donor) {
      // Update existing donor with consent
      donor = await prisma.donor.update({
        where: { id: donor.id },
        data: {
          name: name || donor.name,
          emailConsent: true,
          privacyConsent: true,
          // Re-activate if was unsubscribed
          status: donor.status === "UNSUBSCRIBED" ? "ACTIVE" : donor.status,
        },
      });
    } else {
      // Create new donor
      donor = await prisma.donor.create({
        data: {
          ngoId: ngo.id,
          email,
          emailEncrypted,
          name: name || null,
          emailConsent: true,
          privacyConsent: true,
          preferredChannel: "EMAIL",
        },
      });
    }

    // Store consent records
    const consentRecords = [];

    // Get active consent texts
    const [privacyText, emailConsentText] = await Promise.all([
      prisma.consentText.findFirst({
        where: { ngoId: ngo.id, type: "PRIVACY_POLICY", isActive: true },
      }),
      prisma.consentText.findFirst({
        where: { ngoId: ngo.id, type: "EMAIL_MARKETING", isActive: true },
      }),
    ]);

    if (privacyConsent) {
      consentRecords.push({
        donorId: donor.id,
        type: "PRIVACY_POLICY" as const,
        granted: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        source: "newsletter",
        consentText: privacyText?.text || null,
      });
    }

    if (emailConsent) {
      consentRecords.push({
        donorId: donor.id,
        type: "EMAIL_MARKETING" as const,
        granted: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        source: "newsletter",
        consentText: emailConsentText?.text || null,
      });
    }

    if (consentRecords.length > 0) {
      await prisma.consentRecord.createMany({
        data: consentRecords,
      });
    }

    // Find or create the "Newsletter" tag for auto-tagging
    let newsletterTag = await prisma.donorTag.findFirst({
      where: { ngoId: ngo.id, name: "Newsletter" },
    });

    if (!newsletterTag) {
      newsletterTag = await prisma.donorTag.create({
        data: {
          ngoId: ngo.id,
          name: "Newsletter",
          color: "#10b981",
        },
      });
    }

    // Assign the tag if not already assigned
    await prisma.donorTagAssignment.upsert({
      where: {
        donorId_tagId: {
          donorId: donor.id,
          tagId: newsletterTag.id,
        },
      },
      create: {
        donorId: donor.id,
        tagId: newsletterTag.id,
      },
      update: {},
    });

    await createAuditLog({
      ngoId: ngo.id,
      action: "NEWSLETTER_SUBSCRIPTION",
      entityType: "Donor",
      entityId: donor.id,
      details: {
        source: "minisite",
        email: "***",
      },
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json(
      { message: "Successfully subscribed to the newsletter" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

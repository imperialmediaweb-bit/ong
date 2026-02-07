import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";
import { z } from "zod";

const exportSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
});

export async function POST(request: NextRequest) {
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
    if (!hasPermission(role, "gdpr:export")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "gdpr_tools")) {
      return NextResponse.json({ error: "GDPR tools are not available on your plan" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = exportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { donorId } = parsed.data;

    // Verify donor belongs to this NGO
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, ngoId },
      include: {
        donations: {
          orderBy: { createdAt: "desc" },
        },
        consents: {
          orderBy: { createdAt: "desc" },
        },
        tags: {
          include: { tag: true },
        },
        messageRecipients: {
          orderBy: { createdAt: "desc" },
          include: {
            message: {
              select: {
                id: true,
                subject: true,
                channel: true,
                sentAt: true,
                campaign: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    // Build the GDPR data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: "GDPR_DATA_EXPORT",
      donor: {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        preferredChannel: donor.preferredChannel,
        status: donor.status,
        isAnonymized: donor.isAnonymized,
        notes: donor.notes,
        createdAt: donor.createdAt.toISOString(),
        updatedAt: donor.updatedAt.toISOString(),
      },
      consent: {
        emailConsent: donor.emailConsent,
        smsConsent: donor.smsConsent,
        privacyConsent: donor.privacyConsent,
        consentHistory: donor.consents.map((c) => ({
          type: c.type,
          granted: c.granted,
          source: c.source,
          ipAddress: c.ipAddress,
          userAgent: c.userAgent,
          consentText: c.consentText,
          date: c.createdAt.toISOString(),
        })),
      },
      donations: {
        totalDonated: donor.totalDonated,
        donationCount: donor.donationCount,
        lastDonationAt: donor.lastDonationAt?.toISOString() || null,
        history: donor.donations.map((d) => ({
          id: d.id,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          isRecurring: d.isRecurring,
          source: d.source,
          date: d.createdAt.toISOString(),
        })),
      },
      tags: donor.tags.map((t) => ({
        name: t.tag.name,
        assignedAt: t.createdAt.toISOString(),
      })),
      communications: donor.messageRecipients.map((mr) => ({
        channel: mr.channel,
        address: mr.address,
        status: mr.status,
        campaignName: mr.message.campaign?.name || null,
        subject: mr.message.subject,
        sentAt: mr.message.sentAt?.toISOString() || null,
        deliveredAt: mr.deliveredAt?.toISOString() || null,
        openedAt: mr.openedAt?.toISOString() || null,
        clickedAt: mr.clickedAt?.toISOString() || null,
      })),
    };

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "GDPR_DATA_EXPORTED",
      entityType: "Donor",
      entityId: donorId,
      details: { donorEmail: donor.email ? "***" : null },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="gdpr-export-${donorId}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("GDPR export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

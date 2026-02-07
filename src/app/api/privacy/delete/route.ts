import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";
import { z } from "zod";

const deleteSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
  reason: z.string().optional(),
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
    if (!hasPermission(role, "gdpr:delete")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "gdpr_tools")) {
      return NextResponse.json({ error: "GDPR tools are not available on your plan" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { donorId, reason } = parsed.data;

    // Verify donor belongs to this NGO
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, ngoId },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    if (donor.isAnonymized) {
      return NextResponse.json(
        { error: "Donor data has already been anonymized" },
        { status: 400 }
      );
    }

    // Anonymize the donor data (GDPR right to erasure)
    await prisma.$transaction(async (tx) => {
      // Anonymize donor PII
      await tx.donor.update({
        where: { id: donorId },
        data: {
          email: null,
          emailEncrypted: null,
          phone: null,
          phoneEncrypted: null,
          name: null,
          notes: null,
          isAnonymized: true,
          status: "DELETED",
          emailConsent: false,
          smsConsent: false,
        },
      });

      // Remove tag assignments
      await tx.donorTagAssignment.deleteMany({
        where: { donorId },
      });

      // Anonymize message recipient addresses
      await tx.messageRecipient.updateMany({
        where: { donorId },
        data: { address: "[anonymized]" },
      });

      // Delete consent records (they contain IP addresses and user agents)
      await tx.consentRecord.deleteMany({
        where: { donorId },
      });
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "GDPR_DATA_DELETED",
      entityType: "Donor",
      entityId: donorId,
      details: {
        reason: reason || "GDPR right to erasure request",
        anonymizedAt: new Date().toISOString(),
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({
      message: "Donor data has been anonymized in compliance with GDPR",
      donorId,
      anonymizedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GDPR delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

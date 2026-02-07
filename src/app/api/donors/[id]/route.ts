import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { donorSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";
import { hasFeature, hasPermission } from "@/lib/permissions";

export async function GET(
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
    if (!hasPermission(role, "donors:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const donor = await prisma.donor.findFirst({
      where: { id: params.id, ngoId },
      include: {
        tags: { include: { tag: true } },
        donations: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        consents: {
          orderBy: { createdAt: "desc" },
        },
        messageRecipients: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            message: {
              include: { campaign: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    return NextResponse.json({ data: donor });
  } catch (error) {
    console.error("Donor GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    if (!hasPermission(role, "donors:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "donors_manage")) {
      return NextResponse.json({ error: "Feature not available on your plan" }, { status: 403 });
    }

    // Verify donor belongs to this NGO
    const existing = await prisma.donor.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = donorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, phone, name, preferredChannel, notes, tags } = parsed.data;

    // Check for duplicate email if email changed
    if (email && email !== existing.email) {
      const duplicate = await prisma.donor.findFirst({
        where: { ngoId, email, id: { not: params.id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A donor with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Encrypt PII
    const emailEncrypted = email ? encrypt(email) : null;
    const phoneEncrypted = phone ? encrypt(phone) : null;

    // Update donor and tags in a transaction
    const donor = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (tags !== undefined) {
        // Remove existing tag assignments
        await tx.donorTagAssignment.deleteMany({
          where: { donorId: params.id },
        });

        // Create new tag assignments
        if (tags && tags.length > 0) {
          await tx.donorTagAssignment.createMany({
            data: tags.map((tagId) => ({
              donorId: params.id,
              tagId,
            })),
          });
        }
      }

      return tx.donor.update({
        where: { id: params.id },
        data: {
          email: email || null,
          emailEncrypted,
          phone: phone || null,
          phoneEncrypted,
          name: name || null,
          preferredChannel,
          notes: notes || null,
        },
        include: {
          tags: { include: { tag: true } },
        },
      });
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "DONOR_UPDATED",
      entityType: "Donor",
      entityId: donor.id,
      details: { name, email: email ? "***" : null },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: donor });
  } catch (error) {
    console.error("Donor PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    if (!hasPermission(role, "donors:delete")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify donor belongs to this NGO
    const existing = await prisma.donor.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    await prisma.donor.delete({ where: { id: params.id } });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "DONOR_DELETED",
      entityType: "Donor",
      entityId: params.id,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ message: "Donor deleted successfully" });
  } catch (error) {
    console.error("Donor DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

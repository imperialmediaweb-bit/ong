import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

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
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "sponsor_crm", role)) {
      return NextResponse.json({ error: "CRM Sponsori nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    // Verify company belongs to this NGO
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const interactions = await prisma.sponsorInteraction.findMany({
      where: { companyId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        contact: {
          select: { fullName: true, role: true },
        },
      },
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Sponsor interactions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "sponsor_crm", role)) {
      return NextResponse.json({ error: "CRM Sponsori nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Verify company belongs to this NGO
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, subject, body: interactionBody, contactId } = body;

    if (!type) {
      return NextResponse.json({ error: "Interaction type is required" }, { status: 400 });
    }

    const validTypes = ["NOTE", "EMAIL_SENT", "EMAIL_RECEIVED", "CALL", "MEETING", "AI_MATCH", "STATUS_CHANGE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid interaction type" }, { status: 400 });
    }

    // If contactId is provided, verify it belongs to this company
    if (contactId) {
      const contact = await prisma.sponsorContact.findFirst({
        where: { id: contactId, companyId: params.id },
      });
      if (!contact) {
        return NextResponse.json({ error: "Contact not found for this company" }, { status: 404 });
      }
    }

    const interaction = await prisma.sponsorInteraction.create({
      data: {
        companyId: params.id,
        contactId: contactId || null,
        type,
        subject: subject || null,
        body: interactionBody || null,
        createdBy: userId,
      },
      include: {
        contact: {
          select: { fullName: true, role: true },
        },
      },
    });

    // Update company's lastContactedAt for outbound interaction types
    const contactTypes = ["NOTE", "EMAIL_SENT", "CALL", "MEETING"];
    if (contactTypes.includes(type)) {
      await prisma.sponsorCompany.update({
        where: { id: params.id },
        data: { lastContactedAt: new Date() },
      });
    }

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_INTERACTION_CREATED",
      entityType: "SponsorInteraction",
      entityId: interaction.id,
      details: { type, companyId: params.id, contactId: contactId || null },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error("Sponsor interactions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

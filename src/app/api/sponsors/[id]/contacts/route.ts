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

    const contacts = await prisma.sponsorContact.findMany({
      where: { companyId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Sponsor contacts GET error:", error);
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
    const { fullName, role: contactRole, email, phone, linkedinUrl, notes } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json({ error: "Contact full name is required" }, { status: 400 });
    }

    const contact = await prisma.sponsorContact.create({
      data: {
        companyId: params.id,
        fullName: fullName.trim(),
        role: contactRole || null,
        email: email || null,
        phone: phone || null,
        linkedinUrl: linkedinUrl || null,
        notes: notes || null,
      },
    });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_CONTACT_CREATED",
      entityType: "SponsorContact",
      entityId: contact.id,
      details: { fullName: contact.fullName, companyId: params.id },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Sponsor contacts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

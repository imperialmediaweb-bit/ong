import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
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

    const userId = (session.user as any).id;

    // Verify company belongs to this NGO
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify contact belongs to this company
    const existing = await prisma.sponsorContact.findFirst({
      where: { id: params.contactId, companyId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, role, email, phone, linkedinUrl, status, notes, dncFlag } = body;

    // Build update data, only including provided fields
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role !== undefined) updateData.role = role || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;
    if (dncFlag !== undefined) updateData.dncFlag = dncFlag;

    // If dncFlag changed to true, auto-set status to DO_NOT_CONTACT
    if (dncFlag === true && !existing.dncFlag) {
      updateData.status = "DO_NOT_CONTACT";
    }

    const contact = await prisma.sponsorContact.update({
      where: { id: params.contactId },
      data: updateData,
    });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_CONTACT_UPDATED",
      entityType: "SponsorContact",
      entityId: contact.id,
      details: { updatedFields: Object.keys(updateData), companyId: params.id },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Sponsor contact PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
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

    const userId = (session.user as any).id;

    // Verify company belongs to this NGO
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify contact belongs to this company
    const existing = await prisma.sponsorContact.findFirst({
      where: { id: params.contactId, companyId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.sponsorContact.delete({ where: { id: params.contactId } });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_CONTACT_DELETED",
      entityType: "SponsorContact",
      entityId: params.contactId,
      details: { fullName: existing.fullName, companyId: params.id },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Sponsor contact DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

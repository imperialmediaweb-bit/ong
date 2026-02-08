import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

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

    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
      include: {
        contacts: {
          orderBy: { createdAt: "desc" },
        },
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            contact: {
              select: { fullName: true, role: true },
            },
          },
        },
        aiMatches: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Sponsor GET error:", error);
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

    const userId = (session.user as any).id;

    // Verify company belongs to this NGO
    const existing = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, domain, website, industry, city, country, status, tags, notes, lastContactedAt, nextFollowupAt } = body;

    // Build update data, only including provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain || null;
    if (website !== undefined) updateData.website = website || null;
    if (industry !== undefined) updateData.industry = industry || null;
    if (city !== undefined) updateData.city = city || null;
    if (country !== undefined) updateData.country = country;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes || null;
    if (lastContactedAt !== undefined) updateData.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
    if (nextFollowupAt !== undefined) updateData.nextFollowupAt = nextFollowupAt ? new Date(nextFollowupAt) : null;

    const company = await prisma.sponsorCompany.update({
      where: { id: params.id },
      data: updateData,
    });

    // If status changed, auto-create a STATUS_CHANGE interaction
    if (status !== undefined && status !== existing.status) {
      await prisma.sponsorInteraction.create({
        data: {
          companyId: params.id,
          type: "STATUS_CHANGE",
          subject: `Status changed from ${existing.status} to ${status}`,
          createdBy: userId,
        },
      });
    }

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_COMPANY_UPDATED",
      entityType: "SponsorCompany",
      entityId: company.id,
      details: { updatedFields: Object.keys(updateData) },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(company);
  } catch (error: any) {
    console.error("Sponsor PUT error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A company with this name and city already exists" },
        { status: 409 }
      );
    }

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

    const userId = (session.user as any).id;

    // Verify company belongs to this NGO
    const existing = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await prisma.sponsorCompany.delete({ where: { id: params.id } });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_COMPANY_DELETED",
      entityType: "SponsorCompany",
      entityId: params.id,
      details: { name: existing.name },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Sponsor DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

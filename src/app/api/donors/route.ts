import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { donorSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { encrypt } from "@/lib/encryption";
import { hasFeature, hasPermission, isOverDonorLimit, getDonorLimit, getEffectivePlan, fetchEffectivePlan } from "@/lib/permissions";

export async function GET(request: NextRequest) {
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

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "donors_view")) {
      return NextResponse.json({ error: "Feature not available on your plan" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const tags = searchParams.get("tags") || "";
    const channel = searchParams.get("channel") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const minDonation = searchParams.get("minDonation") || "";
    const maxDonation = searchParams.get("maxDonation") || "";
    const donorType = searchParams.get("donorType") || "";

    // Build the where clause
    const where: any = {
      ngoId,
      isAnonymized: false,
    };

    if (donorType) {
      where.donorType = donorType;
    }

    if (search) {
      const searchConditions: any[] = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
      if (donorType === "COMPANY") {
        searchConditions.push(
          { companyName: { contains: search, mode: "insensitive" } },
          { companyCui: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
        );
      }
      where.OR = searchConditions;
    }

    if (status) {
      where.status = status;
    }

    if (channel) {
      where.preferredChannel = channel;
    }

    if (tags) {
      const tagIds = tags.split(",").filter(Boolean);
      if (tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: { in: tagIds },
          },
        };
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (minDonation || maxDonation) {
      where.totalDonated = {};
      if (minDonation) where.totalDonated.gte = parseFloat(minDonation);
      if (maxDonation) where.totalDonated.lte = parseFloat(maxDonation);
    }

    // Validate sort field
    const allowedSortFields = ["createdAt", "name", "email", "totalDonated", "lastDonationAt", "donationCount", "status"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const skip = (page - 1) * limit;

    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.donor.count({ where }),
    ]);

    return NextResponse.json({
      data: donors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Donors GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    if (!hasPermission(role, "donors:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const effectivePlan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(effectivePlan, "donors_manage")) {
      return NextResponse.json({ error: "Feature not available on your plan" }, { status: 403 });
    }

    // Check donor limit for current plan
    const currentDonorCount = await prisma.donor.count({ where: { ngoId, isAnonymized: false } });
    const donorLimit = getDonorLimit(effectivePlan);

    if (isOverDonorLimit(effectivePlan, currentDonorCount)) {
      return NextResponse.json(
        {
          error: `Ai atins limita de ${donorLimit} donatori pentru planul ${effectivePlan}. Fa upgrade pentru a adauga mai multi donatori.`,
          code: "DONOR_LIMIT_REACHED",
          limit: donorLimit,
          current: currentDonorCount,
          plan: effectivePlan,
        },
        { status: 403 }
      );
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

    // Accept extra company fields from raw body
    const donorType = body.donorType || "INDIVIDUAL";
    const companyName = body.companyName || null;
    const companyCui = body.companyCui || null;
    const companyAddress = body.companyAddress || null;
    const contactPerson = body.contactPerson || null;

    // Check for duplicate email within the same NGO
    if (email) {
      const existing = await prisma.donor.findUnique({
        where: { ngoId_email: { ngoId, email } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A donor with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Encrypt PII
    const emailEncrypted = email ? encrypt(email) : null;
    const phoneEncrypted = phone ? encrypt(phone) : null;

    const donor = await prisma.donor.create({
      data: {
        ngoId,
        email: email || null,
        emailEncrypted,
        phone: phone || null,
        phoneEncrypted,
        name: name || null,
        preferredChannel,
        notes: notes || null,
        donorType,
        companyName,
        companyCui,
        companyAddress,
        contactPerson,
        tags: tags && tags.length > 0
          ? {
              create: tags.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "DONOR_CREATED",
      entityType: "Donor",
      entityId: donor.id,
      details: { name, email: email ? "***" : null },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: donor }, { status: 201 });
  } catch (error) {
    console.error("Donors POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

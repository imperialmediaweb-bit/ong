import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: any = { ngoId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Validate sort field
    const allowedSortFields = ["name", "status", "lastContactedAt", "nextFollowupAt", "createdAt"];
    const orderByField = allowedSortFields.includes(sort) ? sort : "createdAt";

    const [companies, total] = await Promise.all([
      prisma.sponsorCompany.findMany({
        where,
        include: {
          _count: {
            select: {
              contacts: true,
              interactions: true,
            },
          },
          aiMatches: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              score: true,
            },
          },
        },
        orderBy: { [orderByField]: order },
      }),
      prisma.sponsorCompany.count({ where }),
    ]);

    // Transform to include latest AI match score at top level
    const companiesWithScore = companies.map((company) => ({
      ...company,
      latestAiScore: company.aiMatches[0]?.score ?? null,
      aiMatches: undefined,
    }));

    return NextResponse.json({ companies: companiesWithScore, total });
  } catch (error) {
    console.error("Sponsors GET error:", error);
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

    const userId = (session.user as any).id;
    const body = await request.json();

    const { name, domain, website, industry, city, country, status, tags, notes } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.sponsorCompany.create({
      data: {
        ngoId,
        name: name.trim(),
        domain: domain || null,
        website: website || null,
        industry: industry || null,
        city: city || null,
        country: country || "Romania",
        status: status || "NEW",
        tags: tags || [],
        notes: notes || null,
        createdBy: userId,
      },
    });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_COMPANY_CREATED",
      entityType: "SponsorCompany",
      entityId: company.id,
      details: { name: company.name, industry: company.industry },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error("Sponsors POST error:", error);

    // Handle unique constraint violation (ngoId + name + city)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A company with this name and city already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

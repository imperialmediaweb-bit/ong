import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

// GET /api/prospects — List LinkedIn prospects for current NGO
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
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { ngoId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { headline: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [prospects, total] = await Promise.all([
      prisma.linkedInProspect.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.linkedInProspect.count({ where }),
    ]);

    // Stats
    const stats = await prisma.linkedInProspect.groupBy({
      by: ["status"],
      where: { ngoId },
      _count: true,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const importedToday = await prisma.linkedInProspect.count({
      where: { ngoId, createdAt: { gte: todayStart } },
    });

    const avgScore = await prisma.linkedInProspect.aggregate({
      where: { ngoId, aiMatchScore: { not: null } },
      _avg: { aiMatchScore: true },
    });

    return NextResponse.json({
      prospects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        total,
        importedToday,
        dailyRemaining: Math.max(0, 150 - importedToday),
        avgMatchScore: Math.round(avgScore._avg.aiMatchScore || 0),
      },
    });
  } catch (err) {
    console.error("Prospects list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/prospects — Update prospect status/notes/tags
export async function PATCH(request: NextRequest) {
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
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, notes, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "Prospect ID required" }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (tags !== undefined) data.tags = tags;

    const prospect = await prisma.linkedInProspect.updateMany({
      where: { id, ngoId },
      data,
    });

    if (prospect.count === 0) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Prospect update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/prospects — Delete a prospect
export async function DELETE(request: NextRequest) {
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
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Prospect ID required" }, { status: 400 });
    }

    await prisma.linkedInProspect.deleteMany({
      where: { id, ngoId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Prospect delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

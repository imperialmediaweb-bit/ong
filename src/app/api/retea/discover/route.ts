import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/retea/discover - List NGOs/users to connect with
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";

    // Get all existing connections for the current user
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
        status: {
          in: ["PENDING", "ACCEPTED"],
        },
      },
      select: {
        requesterId: true,
        receiverId: true,
        status: true,
      },
    });

    // Build a map of connected/pending user IDs
    const connectionStatusMap = new Map<string, string>();
    for (const conn of existingConnections) {
      const otherUserId = conn.requesterId === userId ? conn.receiverId : conn.requesterId;
      connectionStatusMap.set(otherUserId, conn.status);
    }

    // Build where clause for NGOs
    const ngoWhere: any = {
      isActive: true,
    };

    if (query) {
      ngoWhere.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      ngoWhere.category = category;
    }

    // Get NGOs with their admin users
    const ngos = await prisma.ngo.findMany({
      where: ngoWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        category: true,
        logoUrl: true,
        coverImageUrl: true,
        websiteUrl: true,
        rating: true,
        ratingCount: true,
        totalRaised: true,
        isFeatured: true,
        users: {
          where: {
            role: { in: ["NGO_ADMIN", "STAFF"] },
            isActive: true,
            id: { not: userId },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          take: 3,
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { rating: "desc" },
        { name: "asc" },
      ],
      take: 50,
    });

    // Enrich with connection status
    const results = ngos
      .filter((ngo) => ngo.users.length > 0)
      .map((ngo) => {
        const primaryUser = ngo.users[0];
        const status = connectionStatusMap.get(primaryUser.id) || null;

        return {
          ngo: {
            id: ngo.id,
            name: ngo.name,
            slug: ngo.slug,
            description: ngo.shortDescription || ngo.description,
            category: ngo.category,
            logoUrl: ngo.logoUrl,
            coverImageUrl: ngo.coverImageUrl,
            websiteUrl: ngo.websiteUrl,
            rating: ngo.rating,
            ratingCount: ngo.ratingCount,
            totalRaised: ngo.totalRaised,
            isFeatured: ngo.isFeatured,
          },
          user: {
            id: primaryUser.id,
            name: primaryUser.name,
            email: primaryUser.email,
            role: primaryUser.role,
          },
          connectionStatus: status,
          memberCount: ngo.users.length,
        };
      });

    // Get distinct categories for filter
    const categories = await prisma.ngo.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      results,
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error: any) {
    console.error("[RETEA] Error discovering NGOs:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

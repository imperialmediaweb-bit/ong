import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      select: { id: true },
    });

    if (!ngo) {
      return NextResponse.json({ mentions: [] });
    }

    const mentions = await prisma.mention.findMany({
      where: {
        ngoId: ngo.id,
        status: "CONFIRMED",
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        url: true,
        snippet: true,
        publishedAt: true,
        sourceType: true,
        sentiment: true,
        entities: true,
      },
    });

    return NextResponse.json({ mentions });
  } catch {
    return NextResponse.json({ mentions: [] });
  }
}

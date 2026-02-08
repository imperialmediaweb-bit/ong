import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const ngo = await prisma.ngo.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      websiteUrl: true,
      category: true,
      shortDescription: true,
      coverImageUrl: true,
      verification: {
        select: {
          fiscalCode: true,
          registrationNumber: true,
          address: true,
          county: true,
          city: true,
        },
      },
    },
  });

  if (!ngo) {
    return NextResponse.json({ error: "Organizatia nu a fost gasita" }, { status: 404 });
  }

  return NextResponse.json({
    id: ngo.id,
    name: ngo.name,
    slug: ngo.slug,
    description: ngo.description,
    logoUrl: ngo.logoUrl,
    websiteUrl: ngo.websiteUrl,
    category: ngo.category,
    shortDescription: ngo.shortDescription,
    coverImageUrl: ngo.coverImageUrl,
    cui: ngo.verification?.fiscalCode || ngo.verification?.registrationNumber || null,
    address: ngo.verification?.address || null,
    county: ngo.verification?.county || null,
    city: ngo.verification?.city || null,
  });
}

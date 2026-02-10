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
      miniSiteConfig: {
        select: {
          formular230EmbedCode: true,
          formular230PdfUrl: true,
          formular230Address: true,
          bankAccount: true,
          cui: true,
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
    cui: ngo.miniSiteConfig?.cui || ngo.verification?.fiscalCode || ngo.verification?.registrationNumber || null,
    iban: ngo.miniSiteConfig?.bankAccount || null,
    address: ngo.verification?.address || null,
    county: ngo.verification?.county || null,
    city: ngo.verification?.city || null,
    formular230EmbedCode: ngo.miniSiteConfig?.formular230EmbedCode || null,
    formular230PdfUrl: ngo.miniSiteConfig?.formular230PdfUrl || null,
    formular230Address: ngo.miniSiteConfig?.formular230Address || null,
  });
}

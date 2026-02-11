import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Public endpoint - returns NGO data for mini-site pages
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        verification: {
          select: {
            fiscalCode: true,
            registrationNumber: true,
            address: true,
            county: true,
            city: true,
            representativeName: true,
            representativeRole: true,
          },
        },
        miniSiteConfig: {
          select: {
            heroTitle: true,
            heroDescription: true,
            primaryColor: true,
            showNewsletter: true,
            showDonation: true,
            bankAccount: true,
            bankName: true,
            contactEmail: true,
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
      verification: ngo.verification,
      miniSiteConfig: ngo.miniSiteConfig,
    });
  } catch (error) {
    console.error("Minisite GET error:", error);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}

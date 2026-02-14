import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      return NextResponse.json({ error: "Parametri lipsa" }, { status: 400 });
    }

    // Find all donors with this email across all NGOs
    const donors = await prisma.donor.findMany({
      where: {
        email,
        isAnonymized: false,
        status: { not: "DELETED" },
      },
      include: {
        ngo: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        donations: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            currency: true,
            createdAt: true,
            campaign: { select: { name: true } },
          },
        },
      },
    });

    if (donors.length === 0) {
      return NextResponse.json({ error: "Niciun profil gasit" }, { status: 404 });
    }

    // Simple token verification: hash of email
    const crypto = await import("crypto");
    const expectedToken = crypto.createHash("sha256").update(email + "donor-profile-salt").digest("hex").slice(0, 16);

    if (token !== expectedToken) {
      return NextResponse.json({ error: "Token invalid" }, { status: 403 });
    }

    const profile = donors.map((donor) => ({
      ngo: {
        name: donor.ngo.name,
        slug: donor.ngo.slug,
        logoUrl: donor.ngo.logoUrl,
      },
      donorName: donor.name,
      totalDonated: donor.totalDonated,
      donationCount: donor.donationCount,
      lastDonationAt: donor.lastDonationAt,
      donations: donor.donations.map((d) => ({
        id: d.id,
        amount: d.amount,
        currency: d.currency,
        createdAt: d.createdAt,
        campaignName: d.campaign?.name || null,
      })),
    }));

    return NextResponse.json({ profile, donorEmail: email });
  } catch (error: any) {
    console.error("Donor profile GET error:", error);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}

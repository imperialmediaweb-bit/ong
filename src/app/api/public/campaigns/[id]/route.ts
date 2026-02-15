import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        goalAmount: true,
        currentAmount: true,
        recipientCount: true,
        totalSent: true,
        createdAt: true,
        sentAt: true,
        completedAt: true,
        ngo: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
            websiteUrl: true,
          },
        },
        donations: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            amount: true,
            currency: true,
            createdAt: true,
            donor: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campania nu a fost gasita" },
        { status: 404 }
      );
    }

    // Only show campaigns that have been sent or are actively sending
    if (!["SENT", "SENDING", "SCHEDULED"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Aceasta campanie nu este disponibila public" },
        { status: 404 }
      );
    }

    // Anonymize donor names for privacy (show only first name + initial)
    const anonymizedDonations = campaign.donations.map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      createdAt: d.createdAt,
      donorName: d.donor?.name
        ? anonymizeName(d.donor.name)
        : "Anonim",
    }));

    const totalDonors = await prisma.donation.count({
      where: {
        campaignId: campaign.id,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      goalAmount: campaign.goalAmount,
      currentAmount: campaign.currentAmount,
      totalDonors,
      createdAt: campaign.createdAt,
      sentAt: campaign.sentAt,
      ngo: campaign.ngo,
      recentDonations: anonymizedDonations,
    });
  } catch (error) {
    console.error("Error fetching public campaign:", error);
    return NextResponse.json(
      { error: "Eroare interna" },
      { status: 500 }
    );
  }
}

function anonymizeName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Anonim";
  if (parts.length === 1) return parts[0][0] + "***";
  return parts[0] + " " + parts[1][0] + ".";
}

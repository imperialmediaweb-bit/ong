import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/db";
import { CampaignPublicView } from "./campaign-public-view";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

async function getCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      goalAmount: true,
      currentAmount: true,
      recipientCount: true,
      createdAt: true,
      sentAt: true,
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

  if (!campaign) return null;
  if (!["SENT", "SENDING", "SCHEDULED"].includes(campaign.status)) return null;

  return campaign;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign(params.id);
  if (!campaign) {
    return { title: "Campanie negasita - Binevo" };
  }

  const progressText = campaign.goalAmount
    ? `${Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}% din obiectiv atins`
    : `${campaign.currentAmount.toLocaleString("ro-RO")} RON stransi`;

  const description = `${campaign.name} - campanie de la ${campaign.ngo.name}. ${progressText}. Sustine aceasta cauza!`;

  return {
    title: `${campaign.name} - ${campaign.ngo.name} | Binevo`,
    description,
    openGraph: {
      title: campaign.name,
      description,
      type: "website",
      siteName: "Binevo",
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.name,
      description,
    },
  };
}

function anonymizeName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Anonim";
  if (parts.length === 1) return parts[0][0] + "***";
  return parts[0] + " " + parts[1][0] + ".";
}

export default async function CampaignPublicPage({ params }: Props) {
  const campaign = await getCampaign(params.id);
  if (!campaign) notFound();

  const totalDonors = await prisma.donation.count({
    where: {
      campaignId: campaign.id,
      status: "COMPLETED",
    },
  });

  const data = {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    goalAmount: campaign.goalAmount,
    currentAmount: campaign.currentAmount,
    totalDonors,
    createdAt: campaign.createdAt.toISOString(),
    sentAt: campaign.sentAt?.toISOString() || null,
    ngo: {
      name: campaign.ngo.name,
      slug: campaign.ngo.slug,
      description: campaign.ngo.description,
      logoUrl: campaign.ngo.logoUrl,
      websiteUrl: campaign.ngo.websiteUrl,
    },
    recentDonations: campaign.donations.map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      createdAt: d.createdAt.toISOString(),
      donorName: d.donor?.name ? anonymizeName(d.donor.name) : "Anonim",
    })),
  };

  return <CampaignPublicView campaign={data} />;
}

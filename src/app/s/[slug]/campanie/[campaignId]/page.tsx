import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/db";
import { getEffectivePlan, isSectionAllowedForPlan } from "@/lib/permissions";
import { CampaignDetailView } from "./campaign-detail-view";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string; campaignId: string };
}

async function getNgoWithCampaign(slug: string, campaignId: string) {
  let ngo: any = null;
  try {
    ngo = await prisma.ngo.findUnique({
      where: { slug, isActive: true },
      include: {
        miniSiteConfig: true,
        consentTexts: { where: { isActive: true } },
      },
    });
  } catch {
    return null;
  }
  if (!ngo) return null;

  const effectivePlan = getEffectivePlan(ngo);
  if (!isSectionAllowedForPlan(effectivePlan, "campaigns")) return null;

  const config = ngo.miniSiteConfig;
  const miniSiteCampaigns: any[] = Array.isArray((config as any)?.miniSiteCampaigns)
    ? (config as any).miniSiteCampaigns.filter((c: any) => c.isActive)
    : [];
  const campaign = miniSiteCampaigns.find((c: any) => c.id === campaignId);
  if (!campaign) return null;

  return { ngo, campaign, config };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getNgoWithCampaign(params.slug, params.campaignId);
  if (!result) {
    return { title: "Campanie negasita - Binevo" };
  }

  const { ngo, campaign } = result;
  const title = campaign.name || "Campanie";
  const description = (campaign.description || `${title} - campanie de la ${ngo.name}`).slice(0, 160);

  const ogImage = campaign.imageUrl
    || ngo.coverImageUrl
    || ngo.logoUrl
    || `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(ngo.name)}`;

  return {
    title: `${title} - ${ngo.name} | Binevo`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Binevo",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CampaignDetailPage({ params }: Props) {
  let ngo: any = null;
  try {
    ngo = await prisma.ngo.findUnique({
      where: { slug: params.slug, isActive: true },
      include: {
        miniSiteConfig: true,
        consentTexts: { where: { isActive: true } },
      },
    });
  } catch (error) {
    console.error("Campaign detail error:", error);
  }

  if (!ngo) notFound();

  const effectivePlan = getEffectivePlan(ngo);
  const canShowCampaigns = isSectionAllowedForPlan(effectivePlan, "campaigns");
  if (!canShowCampaigns) notFound();

  const config = ngo.miniSiteConfig;
  const miniSiteCampaigns: any[] = Array.isArray((config as any)?.miniSiteCampaigns)
    ? (config as any).miniSiteCampaigns.filter((c: any) => c.isActive)
    : [];

  const campaign = miniSiteCampaigns.find((c: any) => c.id === params.campaignId);
  if (!campaign) notFound();

  const consentTexts = Object.fromEntries(
    ngo.consentTexts.map((ct: any) => [ct.type, ct.text])
  );

  const primaryColor = config?.primaryColor || "#6366f1";
  const accentColor = config?.accentColor || "#f59e0b";

  return (
    <CampaignDetailView
      campaign={campaign}
      ngoName={ngo.name}
      ngoSlug={ngo.slug}
      ngoLogoUrl={ngo.logoUrl}
      primaryColor={primaryColor}
      accentColor={accentColor}
      consentTexts={consentTexts}
    />
  );
}

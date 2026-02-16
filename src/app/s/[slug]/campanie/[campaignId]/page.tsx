import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getEffectivePlan, isSectionAllowedForPlan } from "@/lib/permissions";
import { CampaignDetailView } from "./campaign-detail-view";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string; campaignId: string };
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      include: {
        miniSiteConfig: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const config = ngo.miniSiteConfig;

    // Return FLAT data matching frontend field names exactly
    return NextResponse.json({
      // NGO fields
      ngoName: ngo.name || "",
      slug: ngo.slug || "",
      description: ngo.description || "",
      shortDescription: ngo.shortDescription || "",
      logoUrl: ngo.logoUrl || "",
      coverImageUrl: ngo.coverImageUrl || "",
      websiteUrl: ngo.websiteUrl || "",
      category: ngo.category || "",

      // Config fields (all from MiniSiteConfig or defaults)
      heroTitle: config?.heroTitle || "",
      heroDescription: config?.heroDescription || "",
      heroCtaText: config?.heroCtaText || "Doneaza acum",
      aboutText: config?.aboutText || "",
      aboutImageUrl: config?.aboutImageUrl || "",
      missionText: config?.missionText || "",
      impactText: config?.impactText || "",

      contactEmail: config?.contactEmail || "",
      contactPhone: config?.contactPhone || "",
      contactAddress: config?.contactAddress || "",

      cui: config?.cui || "",
      registrationNr: config?.registrationNr || "",
      bankAccount: config?.bankAccount || "",
      bankName: config?.bankName || "",

      socialFacebook: config?.socialFacebook || "",
      socialInstagram: config?.socialInstagram || "",
      socialLinkedin: config?.socialLinkedin || "",
      socialTwitter: config?.socialTwitter || "",
      socialYoutube: config?.socialYoutube || "",
      socialTiktok: config?.socialTiktok || "",

      primaryColor: config?.primaryColor || "#6366f1",
      accentColor: config?.accentColor || "#f59e0b",
      theme: config?.theme || "modern",

      showNewsletter: config?.showNewsletter ?? true,
      showDonation: config?.showDonation ?? true,
      showUpdates: config?.showUpdates ?? true,
      showAbout: config?.showAbout ?? true,
      showMission: config?.showMission ?? true,
      showImpact: config?.showImpact ?? true,
      showContact: config?.showContact ?? true,
      showSocial: config?.showSocial ?? true,
      showFormular230: config?.showFormular230 ?? false,
      showContract: config?.showContract ?? false,

      formular230EmbedCode: config?.formular230EmbedCode || "",
      formular230PdfUrl: config?.formular230PdfUrl || "",

      miniSiteCampaigns: config?.miniSiteCampaigns || [],
      templateStyle: config?.templateStyle || "modern",
      customCss: config?.customCss || "",
      isPublished: config?.isPublished ?? false,

      videoUrl: config?.videoUrl || "",
      showVideo: config?.showVideo ?? false,
      teamMembers: config?.teamMembers || [],
      showTeam: config?.showTeam ?? false,
      testimonials: config?.testimonials || [],
      showTestimonials: config?.showTestimonials ?? false,
      partners: config?.partners || [],
      showPartners: config?.showPartners ?? false,
      events: config?.events || [],
      showEvents: config?.showEvents ?? false,
      faqItems: config?.faqItems || [],
      showFaq: config?.showFaq ?? false,
      showVolunteerForm: config?.showVolunteerForm ?? false,
      transparencyDocs: config?.transparencyDocs || [],
      showTransparency: config?.showTransparency ?? false,
      urgentBanner: config?.urgentBanner || { text: "", ctaText: "", ctaUrl: "", isActive: false, bgColor: "#dc2626" },
      showUrgentBanner: config?.showUrgentBanner ?? false,
      googleMapsEmbed: config?.googleMapsEmbed || "",
      showGoogleMaps: config?.showGoogleMaps ?? false,
      showDonationPopup: config?.showDonationPopup ?? false,
      donationPopupDelay: config?.donationPopupDelay ?? 15,
      donationPopupText: config?.donationPopupText || "",
      seoTitle: config?.seoTitle || "",
      seoDescription: config?.seoDescription || "",
      seoKeywords: config?.seoKeywords || "",
      counterStats: config?.counterStats || [],
      showCounterStats: config?.showCounterStats ?? false,
    });
  } catch (error) {
    console.error("Minisite builder GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// All config field names that can be saved
const CONFIG_FIELDS = [
  "heroTitle", "heroDescription", "heroCtaText",
  "aboutText", "aboutImageUrl", "missionText", "impactText",
  "contactEmail", "contactPhone", "contactAddress",
  "cui", "registrationNr", "bankAccount", "bankName",
  "socialFacebook", "socialInstagram", "socialLinkedin",
  "socialTwitter", "socialYoutube", "socialTiktok",
  "primaryColor", "accentColor", "theme",
  "showNewsletter", "showDonation", "showUpdates",
  "showAbout", "showMission", "showImpact",
  "showContact", "showSocial", "showFormular230", "showContract",
  "formular230EmbedCode", "formular230PdfUrl",
  "templateStyle", "customCss", "isPublished",
  // New fields
  "videoUrl", "showVideo",
  "showTeam", "showTestimonials", "showPartners",
  "showEvents", "showFaq", "showVolunteerForm",
  "showTransparency", "showUrgentBanner",
  "googleMapsEmbed", "showGoogleMaps",
  "showDonationPopup", "donationPopupDelay", "donationPopupText",
  "seoTitle", "seoDescription", "seoKeywords",
  "showCounterStats",
];

// Json fields that need `as any` casting
const JSON_FIELDS = [
  "miniSiteCampaigns", "customSections",
  "teamMembers", "testimonials", "partners",
  "events", "faqItems", "transparencyDocs",
  "urgentBanner", "counterStats",
];

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const body = await request.json();

    // Update NGO fields
    const ngoUpdateData: any = {};
    if (body.ngoName !== undefined && body.ngoName.trim()) ngoUpdateData.name = body.ngoName.trim();
    if (body.description !== undefined) ngoUpdateData.description = body.description;
    if (body.shortDescription !== undefined) ngoUpdateData.shortDescription = body.shortDescription;
    if (body.logoUrl !== undefined) ngoUpdateData.logoUrl = body.logoUrl;
    if (body.coverImageUrl !== undefined) ngoUpdateData.coverImageUrl = body.coverImageUrl;
    if (body.websiteUrl !== undefined) ngoUpdateData.websiteUrl = body.websiteUrl;
    if (body.category !== undefined) ngoUpdateData.category = body.category;

    if (Object.keys(ngoUpdateData).length > 0) {
      await prisma.ngo.update({
        where: { id: ngoId },
        data: ngoUpdateData,
      });
    }

    // Build minisite config data
    const configData: any = {};

    // Regular fields
    for (const field of CONFIG_FIELDS) {
      if (body[field] !== undefined) {
        configData[field] = body[field];
      }
    }

    // Json fields (need casting)
    for (const field of JSON_FIELDS) {
      if (body[field] !== undefined) {
        configData[field] = body[field] as any;
      }
    }

    // Upsert MiniSiteConfig
    const miniSiteConfig = await prisma.miniSiteConfig.upsert({
      where: { ngoId },
      create: {
        ngoId,
        ...configData,
      },
      update: configData,
    });

    return NextResponse.json({
      success: true,
      config: miniSiteConfig,
    });
  } catch (error) {
    console.error("Minisite builder PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

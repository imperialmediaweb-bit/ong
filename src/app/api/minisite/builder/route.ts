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

    const config = ngo.miniSiteConfig ?? {
      heroTitle: "",
      heroDescription: "",
      heroCtaText: "Doneaza acum",
      aboutText: "",
      aboutImageUrl: "",
      missionText: "",
      impactText: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      cui: "",
      registrationNr: "",
      bankAccount: "",
      bankName: "",
      socialFacebook: "",
      socialInstagram: "",
      socialLinkedin: "",
      socialTwitter: "",
      socialYoutube: "",
      socialTiktok: "",
      primaryColor: "#6366f1",
      accentColor: "#f59e0b",
      theme: "modern",
      showNewsletter: true,
      showDonation: true,
      showUpdates: true,
      showAbout: true,
      showMission: true,
      showImpact: true,
      showContact: true,
      showSocial: true,
      showFormular230: false,
      showContract: false,
      formular230EmbedCode: "",
      formular230PdfUrl: "",
      formular230Address: "",
      miniSiteCampaigns: null,
      templateStyle: "modern",
      // New fields
      videoUrl: "",
      showVideo: false,
      teamMembers: null,
      showTeam: false,
      testimonials: null,
      showTestimonials: false,
      partners: null,
      showPartners: false,
      events: null,
      showEvents: false,
      faqItems: null,
      showFaq: false,
      showVolunteerForm: false,
      transparencyDocs: null,
      showTransparency: false,
      urgentBanner: null,
      showUrgentBanner: false,
      googleMapsEmbed: "",
      showGoogleMaps: false,
      showDonationPopup: false,
      donationPopupDelay: 15,
      donationPopupText: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      counterStats: null,
      showCounterStats: false,
      customCss: "",
      customSections: null,
      isPublished: false,
    };

    return NextResponse.json({
      ngo: {
        name: ngo.name,
        slug: ngo.slug,
        description: ngo.description,
        shortDescription: ngo.shortDescription,
        logoUrl: ngo.logoUrl,
        coverImageUrl: ngo.coverImageUrl,
        websiteUrl: ngo.websiteUrl,
        category: ngo.category,
      },
      config,
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
  "formular230EmbedCode", "formular230PdfUrl", "formular230Address",
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

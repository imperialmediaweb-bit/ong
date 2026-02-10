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

    const {
      // NGO fields
      ngoName,
      description,
      shortDescription,
      logoUrl,
      coverImageUrl,
      websiteUrl,
      category,
      // MiniSiteConfig fields
      heroTitle,
      heroDescription,
      heroCtaText,
      aboutText,
      missionText,
      impactText,
      contactEmail,
      contactPhone,
      contactAddress,
      cui,
      registrationNr,
      bankAccount,
      bankName,
      socialFacebook,
      socialInstagram,
      socialLinkedin,
      socialTwitter,
      socialYoutube,
      socialTiktok,
      primaryColor,
      accentColor,
      theme,
      showNewsletter,
      showDonation,
      showUpdates,
      showAbout,
      showMission,
      showImpact,
      showContact,
      showSocial,
      showFormular230,
      showContract,
      customCss,
      customSections,
      isPublished,
    } = body;

    // Update NGO fields
    const ngoUpdateData: any = {};
    if (ngoName !== undefined && ngoName.trim()) ngoUpdateData.name = ngoName.trim();
    if (description !== undefined) ngoUpdateData.description = description;
    if (shortDescription !== undefined) ngoUpdateData.shortDescription = shortDescription;
    if (logoUrl !== undefined) ngoUpdateData.logoUrl = logoUrl;
    if (coverImageUrl !== undefined) ngoUpdateData.coverImageUrl = coverImageUrl;
    if (websiteUrl !== undefined) ngoUpdateData.websiteUrl = websiteUrl;
    if (category !== undefined) ngoUpdateData.category = category;

    if (Object.keys(ngoUpdateData).length > 0) {
      await prisma.ngo.update({
        where: { id: ngoId },
        data: ngoUpdateData,
      });
    }

    // Build minisite config data
    const configData: any = {};
    if (heroTitle !== undefined) configData.heroTitle = heroTitle;
    if (heroDescription !== undefined) configData.heroDescription = heroDescription;
    if (heroCtaText !== undefined) configData.heroCtaText = heroCtaText;
    if (aboutText !== undefined) configData.aboutText = aboutText;
    if (missionText !== undefined) configData.missionText = missionText;
    if (impactText !== undefined) configData.impactText = impactText;
    if (contactEmail !== undefined) configData.contactEmail = contactEmail;
    if (contactPhone !== undefined) configData.contactPhone = contactPhone;
    if (contactAddress !== undefined) configData.contactAddress = contactAddress;
    if (cui !== undefined) configData.cui = cui;
    if (registrationNr !== undefined) configData.registrationNr = registrationNr;
    if (bankAccount !== undefined) configData.bankAccount = bankAccount;
    if (bankName !== undefined) configData.bankName = bankName;
    if (socialFacebook !== undefined) configData.socialFacebook = socialFacebook;
    if (socialInstagram !== undefined) configData.socialInstagram = socialInstagram;
    if (socialLinkedin !== undefined) configData.socialLinkedin = socialLinkedin;
    if (socialTwitter !== undefined) configData.socialTwitter = socialTwitter;
    if (socialYoutube !== undefined) configData.socialYoutube = socialYoutube;
    if (socialTiktok !== undefined) configData.socialTiktok = socialTiktok;
    if (primaryColor !== undefined) configData.primaryColor = primaryColor;
    if (accentColor !== undefined) configData.accentColor = accentColor;
    if (theme !== undefined) configData.theme = theme;
    if (showNewsletter !== undefined) configData.showNewsletter = showNewsletter;
    if (showDonation !== undefined) configData.showDonation = showDonation;
    if (showUpdates !== undefined) configData.showUpdates = showUpdates;
    if (showAbout !== undefined) configData.showAbout = showAbout;
    if (showMission !== undefined) configData.showMission = showMission;
    if (showImpact !== undefined) configData.showImpact = showImpact;
    if (showContact !== undefined) configData.showContact = showContact;
    if (showSocial !== undefined) configData.showSocial = showSocial;
    if (showFormular230 !== undefined) configData.showFormular230 = showFormular230;
    if (showContract !== undefined) configData.showContract = showContract;
    if (customCss !== undefined) configData.customCss = customCss;
    if (customSections !== undefined) configData.customSections = customSections as any;
    if (isPublished !== undefined) configData.isPublished = isPublished;

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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

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
      select: {
        slug: true,
        miniSiteConfig: {
          select: {
            heroTitle: true,
            heroDescription: true,
            primaryColor: true,
            showNewsletter: true,
            showDonation: true,
            showUpdates: true,
            customCss: true,
          },
        },
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    const minisite = ngo.miniSiteConfig ?? {
      heroTitle: "",
      heroDescription: "",
      primaryColor: "#6366f1",
      showNewsletter: true,
      showDonation: true,
      showUpdates: true,
      customCss: "",
    };

    return NextResponse.json({ minisite, slug: ngo.slug });
  } catch (error) {
    console.error("Minisite GET error:", error);
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
    const role = (session.user as any).role;
    if (!ngoId || !hasPermission(role, "settings:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      heroTitle,
      heroDescription,
      primaryColor,
      showNewsletter,
      showDonation,
      showUpdates,
      customCss,
    } = body;

    const updateData: any = {};
    if (heroTitle !== undefined) updateData.heroTitle = heroTitle;
    if (heroDescription !== undefined) updateData.heroDescription = heroDescription;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (showNewsletter !== undefined) updateData.showNewsletter = showNewsletter;
    if (showDonation !== undefined) updateData.showDonation = showDonation;
    if (showUpdates !== undefined) updateData.showUpdates = showUpdates;
    if (customCss !== undefined) updateData.customCss = customCss;

    const miniSiteConfig = await prisma.miniSiteConfig.upsert({
      where: { ngoId },
      create: {
        ngoId,
        ...updateData,
      },
      update: updateData,
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "MINISITE_CONFIG_UPDATED",
      entityType: "MiniSiteConfig",
      entityId: miniSiteConfig.id,
      details: { fields: Object.keys(updateData) },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      minisite: {
        heroTitle: miniSiteConfig.heroTitle,
        heroDescription: miniSiteConfig.heroDescription,
        primaryColor: miniSiteConfig.primaryColor,
        showNewsletter: miniSiteConfig.showNewsletter,
        showDonation: miniSiteConfig.showDonation,
        showUpdates: miniSiteConfig.showUpdates,
        customCss: miniSiteConfig.customCss,
      },
    });
  } catch (error) {
    console.error("Minisite PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

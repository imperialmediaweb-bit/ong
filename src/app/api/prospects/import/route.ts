import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

// POST /api/prospects/import — Token-authenticated endpoint for Chrome extension
export async function POST(request: NextRequest) {
  try {
    // Bearer token auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { ngo: { select: { id: true, name: true } } },
    });

    if (!apiToken || !apiToken.isActive) {
      return NextResponse.json({ error: "Invalid or inactive token" }, { status: 401 });
    }

    // Update last used
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    const ngoId = apiToken.ngoId;
    const userId = apiToken.userId;

    const plan = await fetchEffectivePlan(ngoId);
    if (!hasFeature(plan, "linkedin_prospects")) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const body = await request.json();
    const { prospects } = body;

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: "No prospects provided" }, { status: 400 });
    }

    // Daily limit check — max 150 imports per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.linkedInProspect.count({
      where: { ngoId, createdAt: { gte: todayStart } },
    });

    const DAILY_LIMIT = 150;
    const remaining = Math.max(0, DAILY_LIMIT - todayCount);

    if (remaining === 0) {
      return NextResponse.json({
        error: "Daily import limit reached (150/day)",
        imported: 0,
        duplicates: 0,
        dailyRemaining: 0,
      }, { status: 429 });
    }

    // Process prospects (up to remaining limit)
    const toProcess = prospects.slice(0, remaining);
    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const p of toProcess) {
      if (!p.fullName || !p.profileUrl) {
        errors.push(`Skipped: missing name or profileUrl`);
        continue;
      }

      // Normalize LinkedIn URL
      const profileUrl = p.profileUrl.split("?")[0].replace(/\/$/, "");

      try {
        await prisma.linkedInProspect.create({
          data: {
            ngoId,
            fullName: p.fullName.trim(),
            headline: p.headline?.trim() || null,
            company: p.company?.trim() || null,
            location: p.location?.trim() || null,
            profileUrl,
            profileImageUrl: p.profileImageUrl || null,
            importedBy: userId,
            importSource: "chrome_extension",
            tags: p.tags || [],
          },
        });
        imported++;
      } catch (err: any) {
        if (err?.code === "P2002") {
          duplicates++;
        } else {
          errors.push(`Error importing ${p.fullName}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      errors: errors.length > 0 ? errors : undefined,
      dailyRemaining: remaining - imported,
      ngoName: apiToken.ngo.name,
    });
  } catch (err) {
    console.error("Prospect import error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

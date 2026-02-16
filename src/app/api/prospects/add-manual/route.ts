import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

// POST /api/prospects/add-manual — Manually add a LinkedIn prospect by URL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const body = await request.json();
    const { linkedinUrl, fullName, headline, company, location } = body;

    if (!linkedinUrl) {
      return NextResponse.json({ error: "LinkedIn URL este obligatoriu" }, { status: 400 });
    }

    // Validate LinkedIn URL
    const urlPattern = /linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+/;
    if (!urlPattern.test(linkedinUrl)) {
      return NextResponse.json({ error: "URL-ul nu pare a fi un profil LinkedIn valid. Exemple: linkedin.com/in/nume sau linkedin.com/company/firma" }, { status: 400 });
    }

    // Normalize URL
    const profileUrl = linkedinUrl.split("?")[0].replace(/\/$/, "");

    // Check for duplicates
    const existing = await prisma.linkedInProspect.findFirst({
      where: { ngoId, profileUrl },
    });

    if (existing) {
      return NextResponse.json({ error: "Acest profil LinkedIn exista deja in lista ta", duplicate: true, prospect: existing }, { status: 409 });
    }

    // Extract name from URL if not provided
    const isCompany = profileUrl.includes("/company/");
    const urlSlug = profileUrl.split("/").pop() || "";
    const derivedName = fullName || urlSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    const prospect = await prisma.linkedInProspect.create({
      data: {
        ngoId,
        fullName: derivedName,
        headline: headline || (isCompany ? "Companie" : null),
        company: company || (isCompany ? derivedName : null),
        location: location || null,
        profileUrl,
        importedBy: userId,
        importSource: "manual",
        tags: isCompany ? ["companie", "manual"] : ["manual"],
      },
    });

    return NextResponse.json({
      success: true,
      prospect,
    });
  } catch (err: any) {
    console.error("Manual prospect add error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Acest profil LinkedIn exista deja" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

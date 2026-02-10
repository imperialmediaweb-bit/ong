import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
  });
}

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI not configured - set OPENAI_API_KEY" }, { status: 500 });
    }

    const { message, conversationHistory } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch comprehensive NGO data for the agent context
    const [
      ngo,
      donorStats,
      recentDonations,
      campaignStats,
      topCampaigns,
      donorGrowth,
      miniSiteConfig,
    ] = await Promise.all([
      prisma.ngo.findUnique({
        where: { id: ngoId },
        select: { name: true, description: true, category: true, slug: true },
      }),

      // Donor summary
      prisma.donor.aggregate({
        where: { ngoId, isAnonymized: false },
        _count: true,
        _avg: { totalDonated: true },
      }),

      // Recent donations (last 30 days)
      prisma.donation.findMany({
        where: {
          ngoId,
          status: "COMPLETED",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          campaign: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Campaign stats
      prisma.campaign.aggregate({
        where: { ngoId, status: "SENT" },
        _count: true,
        _sum: {
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          totalBounced: true,
        },
      }),

      // Top campaigns
      prisma.campaign.findMany({
        where: { ngoId, status: "SENT" },
        orderBy: { totalOpened: "desc" },
        take: 10,
        select: {
          name: true,
          type: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          sentAt: true,
        },
      }),

      // Donor growth (new donors per month, last 6 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM "Donor"
        WHERE "ngoId" = ${ngoId}
          AND "isAnonymized" = false
          AND "createdAt" >= ${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,

      // Mini-site config
      prisma.miniSiteConfig.findFirst({
        where: { ngoId },
        select: {
          showDonation: true,
          showFormular230: true,
          showContract: true,
          showNewsletter: true,
          showEvents: true,
        },
      }),
    ]);

    // Compute aggregated metrics
    const totalDonors = donorStats._count || 0;
    const avgDonation = donorStats._avg?.totalDonated || 0;
    const totalSent = campaignStats._sum?.totalSent || 0;
    const totalOpened = campaignStats._sum?.totalOpened || 0;
    const totalClicked = campaignStats._sum?.totalClicked || 0;
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";
    const totalCampaigns = campaignStats._count || 0;

    const totalDonationsLast30 = recentDonations.length;
    const revenueLast30 = recentDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const topCampaignsSummary = topCampaigns.map((c) => ({
      name: c.name,
      type: c.type,
      sent: c.totalSent,
      opened: c.totalOpened,
      clicked: c.totalClicked,
      openRate: c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) + "%" : "0%",
      clickRate: c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) + "%" : "0%",
    }));

    const donorGrowthData = (donorGrowth as any[]).map((g) => ({
      month: new Date(g.month).toLocaleDateString("ro-RO", { month: "short", year: "numeric" }),
      newDonors: g.count,
    }));

    const contextData = `
=== DATELE ORGANIZATIEI ===
Nume: ${ngo?.name || "N/A"}
Descriere: ${ngo?.description || "N/A"}
Categorie: ${ngo?.category || "N/A"}
Mini-site: /s/${ngo?.slug || "N/A"}

=== METRICI GENERALE ===
Total donatori: ${totalDonors}
Media donatie per donator: ${avgDonation.toFixed(2)} RON
Total campanii trimise: ${totalCampaigns}
Rata medie deschidere email: ${openRate}%
Rata medie click: ${clickRate}%

=== ULTIMELE 30 ZILE ===
Donatii primite: ${totalDonationsLast30}
Venituri: ${revenueLast30.toFixed(2)} RON

=== TOP CAMPANII (dupa open rate) ===
${topCampaignsSummary.map((c, i) => `${i + 1}. "${c.name}" (${c.type}) - Trimise: ${c.sent}, Open: ${c.openRate}, Click: ${c.clickRate}`).join("\n")}

=== CRESTERE DONATORI (ultimele 6 luni) ===
${donorGrowthData.map((g) => `${g.month}: +${g.newDonors} donatori noi`).join("\n")}

=== CONFIGURARE MINI-SITE ===
Donatii online: ${miniSiteConfig?.showDonation ? "Da" : "Nu"}
Formular 230: ${miniSiteConfig?.showFormular230 ? "Da" : "Nu"}
Contract sponsorizare: ${miniSiteConfig?.showContract ? "Da" : "Nu"}
Newsletter: ${miniSiteConfig?.showNewsletter ? "Da" : "Nu"}
Evenimente: ${miniSiteConfig?.showEvents ? "Da" : "Nu"}
`;

    // Build conversation
    const messages: any[] = [
      {
        role: "system",
        content: `Esti un super-agent de marketing AI specializat in organizatii non-profit din Romania. Numele tau este "NGO Marketing Agent".

Rolul tau:
- Analizezi datele organizatiei si oferi sfaturi concrete si actionabile
- Identifici ce merge bine si ce trebuie imbunatatit
- Recomanzi strategii de fundraising, campanii email/SMS, content marketing
- Analizezi ratele de deschidere/click si sugerezi optimizari
- Propui idei pentru cresterea bazei de donatori
- Sugerezi texte pentru campanii, posturi social media, newsletter-uri
- Ajuti cu strategie de redirectionare 3.5% si sponsorizari

Raspunde INTOTDEAUNA in limba romana.
Fii concis, practic si orientat pe actiuni concrete.
Foloseste emoji-uri moderat pentru a face raspunsurile mai vizuale.
Structureaza raspunsurile cu bullet points si sectiuni clare.
Cand dai sfaturi, specifica pasii concreti de implementare.

Iata datele curente ale organizatiei:
${contextData}`,
      },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: message });

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 3000,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || "Nu am putut genera un raspuns.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Marketing agent error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

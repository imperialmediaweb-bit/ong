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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Return settings
  if (action === "settings") {
    const config = await prisma.mentionConfig.findUnique({
      where: { ngoId },
    });
    return NextResponse.json({ config });
  }

  // Return mentions with filters
  const sentiment = searchParams.get("sentiment");
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const where: any = { ngoId };
  if (sentiment && sentiment !== "all") where.sentiment = sentiment;
  if (source && source !== "all") where.sourceType = source;
  if (status && status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { snippet: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const [mentions, total, positive, neutral, negative, confirmed, pending] = await Promise.all([
    prisma.mention.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.mention.count({ where: { ngoId } }),
    prisma.mention.count({ where: { ngoId, sentiment: "POSITIVE" } }),
    prisma.mention.count({ where: { ngoId, sentiment: "NEUTRAL" } }),
    prisma.mention.count({ where: { ngoId, sentiment: "NEGATIVE" } }),
    prisma.mention.count({ where: { ngoId, status: "CONFIRMED" } }),
    prisma.mention.count({ where: { ngoId, status: "PENDING" } }),
  ]);

  // Count today's mentions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.mention.count({
    where: { ngoId, createdAt: { gte: todayStart } },
  });

  // Calculate average relevance
  const avgResult = await prisma.mention.aggregate({
    where: { ngoId, relevanceScore: { not: null } },
    _avg: { relevanceScore: true },
  });

  return NextResponse.json({
    mentions,
    stats: {
      total,
      positive,
      neutral,
      negative,
      confirmed,
      pending,
      avgRelevance: Math.round(avgResult._avg.relevanceScore || 0),
      todayCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "save_settings") {
    const { searchQueries, rssSources, relevanceThreshold, notifyEmail, notifyFrequency } = body;

    const config = await prisma.mentionConfig.upsert({
      where: { ngoId },
      update: {
        searchQueries: searchQueries as any,
        rssSources: rssSources as any,
        relevanceThreshold: relevanceThreshold || 70,
        notifyEmail: notifyEmail ?? true,
        notifyFrequency: notifyFrequency || "DAILY",
      },
      create: {
        ngoId,
        searchQueries: searchQueries as any,
        rssSources: rssSources as any,
        relevanceThreshold: relevanceThreshold || 70,
        notifyEmail: notifyEmail ?? true,
        notifyFrequency: notifyFrequency || "DAILY",
      },
    });

    return NextResponse.json({ config });
  }

  if (action === "update_status") {
    const { mentionId, status } = body;
    const userId = (session.user as any).id;

    const mention = await prisma.mention.update({
      where: { id: mentionId },
      data: {
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ mention });
  }

  if (action === "crawl") {
    // Get NGO info and config
    const [ngo, config] = await Promise.all([
      prisma.ngo.findUnique({ where: { id: ngoId } }),
      prisma.mentionConfig.findUnique({ where: { ngoId } }),
    ]);

    if (!ngo) {
      return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
    }

    const searchQueries = (config?.searchQueries as string[] | null) || [ngo.name];
    const threshold = config?.relevanceThreshold || 70;

    // Generate demo mentions for now (in production, this would call search APIs)
    const demoMentions = generateDemoMentions(ngo.name, searchQueries);

    // Process with AI if available
    const processedMentions = process.env.OPENAI_API_KEY
      ? await processWithAI(demoMentions, ngo.name, threshold)
      : processDemo(demoMentions, ngo.name, threshold);

    // Save to database (skip duplicates)
    let saved = 0;
    for (const mention of processedMentions) {
      try {
        await prisma.mention.upsert({
          where: {
            ngoId_url: { ngoId, url: mention.url },
          },
          update: {},
          create: {
            ngoId,
            sourceType: mention.sourceType as any,
            title: mention.title,
            url: mention.url,
            snippet: mention.snippet,
            publishedAt: mention.publishedAt ? new Date(mention.publishedAt) : null,
            relevanceScore: mention.relevanceScore,
            relevanceReason: mention.relevanceReason,
            sentiment: mention.sentiment as any,
            mentionType: mention.mentionType as any,
            summary: mention.summary,
            entities: mention.entities as any,
            status: mention.relevanceScore >= threshold ? "PENDING" : "NEEDS_REVIEW",
          },
        });
        saved++;
      } catch {
        // Skip duplicates silently
      }
    }

    // Update last crawl time
    if (config) {
      await prisma.mentionConfig.update({
        where: { ngoId },
        data: { lastCrawlAt: new Date() },
      });
    }

    return NextResponse.json({ crawled: processedMentions.length, saved });
  }

  return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
}

function generateDemoMentions(ngoName: string, queries: string[]) {
  const sources = [
    {
      sourceType: "GOOGLE",
      title: `${ngoName} a lansat o noua campanie de strangere de fonduri`,
      url: `https://stiri-locale.ro/articol-${Date.now()}-1`,
      snippet: `Organizatia ${ngoName} a anuntat astazi lansarea unei noi campanii de strangere de fonduri pentru educatia copiilor din medii defavorizate. Campania are un obiectiv de 100.000 RON.`,
      publishedAt: new Date().toISOString(),
    },
    {
      sourceType: "NEWS",
      title: `Interviu cu reprezentantul ${ngoName} despre impactul proiectelor sociale`,
      url: `https://publicatie-nationala.ro/interviu-${Date.now()}-2`,
      snippet: `Intr-un interviu acordat redactiei noastre, reprezentantul ${ngoName} a vorbit despre impactul proiectelor sociale desfasurate in ultimul an si despre planurile de viitor ale organizatiei.`,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      sourceType: "FACEBOOK",
      title: `Postare virala despre actiunea ${ngoName}`,
      url: `https://facebook.com/post-${Date.now()}-3`,
      snippet: `O postare despre actiunea de voluntariat organizata de ${ngoName} a devenit virala pe Facebook, strangand mii de reactii si comentarii pozitive din partea comunitatii.`,
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      sourceType: "NEWS",
      title: `Raport: Cele mai active ONG-uri din Romania - ${ngoName} in top 10`,
      url: `https://raport-ong.ro/top-${Date.now()}-4`,
      snippet: `Conform celui mai recent raport, ${ngoName} se numara printre cele mai active organizatii neguvernamentale din Romania, fiind remarcata pentru transparenta si impactul social.`,
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      sourceType: "RSS",
      title: `Comunitatea locala sustine proiectele ${ngoName}`,
      url: `https://presa-locala.ro/comunitate-${Date.now()}-5`,
      snippet: `Primaria orasului a anuntat ca va sprijini proiectele derulate de ${ngoName} prin punerea la dispozitie a spatiilor comunitare si a unui fond de 50.000 RON.`,
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  return sources;
}

async function processWithAI(mentions: any[], ngoName: string, threshold: number) {
  const openai = getOpenAI();

  const processed = [];
  for (const mention of mentions) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Esti un analist media AI. Analizeaza mentiunea urmatoare despre organizatia "${ngoName}". Raspunde in JSON cu: { "relevanceScore": 0-100, "relevanceReason": "...", "sentiment": "POSITIVE"|"NEUTRAL"|"NEGATIVE", "mentionType": "NEWS"|"PRESS_RELEASE"|"INTERVIEW"|"OPINION"|"REVIEW"|"SOCIAL_MENTION"|"BLOG"|"OTHER", "summary": "rezumat 2-3 propozitii", "entities": { "project": null, "location": null, "persons": [], "ngoNameFound": "" } }`,
          },
          {
            role: "user",
            content: `Titlu: ${mention.title}\nSnippet: ${mention.snippet}\nSursa: ${mention.sourceType}\nURL: ${mention.url}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
      processed.push({
        ...mention,
        ...analysis,
      });
    } catch {
      // Fallback to demo processing if AI fails
      processed.push({
        ...mention,
        ...processSingleDemo(mention, ngoName),
      });
    }
  }

  return processed;
}

function processSingleDemo(mention: any, ngoName: string) {
  const positiveWords = ["succes", "excelent", "top", "remarcabil", "impact", "sprijin", "virala", "pozitiv"];
  const negativeWords = ["problema", "scandal", "critic", "esec", "ingrijorare"];
  const text = `${mention.title} ${mention.snippet}`.toLowerCase();

  let sentiment = "NEUTRAL";
  if (positiveWords.some(w => text.includes(w))) sentiment = "POSITIVE";
  if (negativeWords.some(w => text.includes(w))) sentiment = "NEGATIVE";

  const mentionTypeMap: Record<string, string> = {
    GOOGLE: "NEWS",
    NEWS: "NEWS",
    FACEBOOK: "SOCIAL_MENTION",
    TWITTER: "SOCIAL_MENTION",
    YOUTUBE: "SOCIAL_MENTION",
    RSS: "NEWS",
    OTHER: "OTHER",
  };

  return {
    relevanceScore: 75 + Math.floor(Math.random() * 20),
    relevanceReason: `Mentiunea contine referinta directa la "${ngoName}".`,
    sentiment,
    mentionType: mentionTypeMap[mention.sourceType] || "OTHER",
    summary: mention.snippet?.slice(0, 200) || mention.title,
    entities: {
      project: null,
      location: null,
      persons: [],
      ngoNameFound: ngoName,
    },
  };
}

function processDemo(mentions: any[], ngoName: string, threshold: number) {
  return mentions.map(m => ({
    ...m,
    ...processSingleDemo(m, ngoName),
  }));
}

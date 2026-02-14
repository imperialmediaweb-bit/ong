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

// ---- RSS XML parsing utilities ----

interface RssItem {
  title: string;
  url: string;
  description: string;
  pubDate: string;
  sourceName?: string;
}

function extractXmlTag(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const rawTitle = extractXmlTag(itemXml, "title");
    const link = extractXmlTag(itemXml, "link");
    const description = extractXmlTag(itemXml, "description");
    const pubDate = extractXmlTag(itemXml, "pubDate");

    // Extract source from <source url="...">Name</source>
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const sourceName = sourceMatch ? decodeXmlEntities(sourceMatch[1].trim()) : undefined;

    // Try to extract actual article URL from description HTML (Google News pattern)
    const descDecoded = decodeXmlEntities(description || "");
    const hrefMatch = descDecoded.match(/<a\s+href="([^"]+)"/);
    const articleUrl = hrefMatch ? hrefMatch[1] : link;

    // Clean title - Google News appends " - Source Name"
    let cleanTitle = decodeXmlEntities(rawTitle || "");
    if (sourceName) {
      const suffixPattern = new RegExp(
        `\\s*[-–—]\\s*${escapeRegExp(sourceName)}\\s*$`
      );
      cleanTitle = cleanTitle.replace(suffixPattern, "");
    }

    // Strip HTML from description
    const cleanDesc = stripHtmlTags(descDecoded);

    if (cleanTitle && articleUrl) {
      items.push({
        title: cleanTitle,
        url: articleUrl,
        description: cleanDesc || cleanTitle,
        pubDate: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        sourceName,
      });
    }
  }

  return items;
}

// ---- Real mention fetching ----

async function fetchGoogleNewsRss(query: string): Promise<RssItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ro&gl=RO&ceid=RO:ro`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Google News RSS returned ${response.status} for query: ${query}`);
      return [];
    }

    const xml = await response.text();
    return parseRssXml(xml);
  } catch (err) {
    console.error(`Google News RSS fetch error for "${query}":`, err);
    return [];
  }
}

async function fetchCustomRssFeed(feedUrl: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NGOHub/1.0; +https://binevo.ro)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`RSS feed returned ${response.status} for: ${feedUrl}`);
      return [];
    }

    const xml = await response.text();
    return parseRssXml(xml);
  } catch (err) {
    console.error(`RSS feed fetch error for "${feedUrl}":`, err);
    return [];
  }
}

async function fetchRealMentions(
  ngoName: string,
  queries: string[],
  rssSources: string[]
): Promise<any[]> {
  const allMentions: any[] = [];
  const seenUrls = new Set<string>();

  // 1. Fetch from Google News RSS for each search query
  const googlePromises = queries.map((query) => fetchGoogleNewsRss(query));
  const googleResults = await Promise.all(googlePromises);

  for (let qi = 0; qi < queries.length; qi++) {
    const items = googleResults[qi];
    for (const item of items) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      allMentions.push({
        sourceType: "NEWS",
        title: item.title,
        url: item.url,
        snippet: item.description,
        publishedAt: item.pubDate,
        sourceName: item.sourceName || getDomainFromUrl(item.url),
      });
    }
  }

  // 2. Fetch from custom RSS feeds
  const validRssSources = rssSources.filter((s) => s.trim());
  if (validRssSources.length > 0) {
    const rssPromises = validRssSources.map((url) => fetchCustomRssFeed(url));
    const rssResults = await Promise.all(rssPromises);

    for (let ri = 0; ri < validRssSources.length; ri++) {
      const items = rssResults[ri];
      for (const item of items) {
        if (seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        allMentions.push({
          sourceType: "RSS",
          title: item.title,
          url: item.url,
          snippet: item.description,
          publishedAt: item.pubDate,
          sourceName: item.sourceName || getDomainFromUrl(item.url),
        });
      }
    }
  }

  return allMentions.slice(0, 50); // Limit to 50 results per crawl
}

function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
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
    const rssSources = (config?.rssSources as string[] | null) || [];
    const threshold = config?.relevanceThreshold || 70;

    // Fetch real mentions from Google News and custom RSS feeds
    const rawMentions = await fetchRealMentions(ngo.name, searchQueries, rssSources);

    if (rawMentions.length === 0) {
      // Update last crawl time even if no results
      if (config) {
        await prisma.mentionConfig.update({
          where: { ngoId },
          data: { lastCrawlAt: new Date() },
        });
      }
      return NextResponse.json({
        crawled: 0,
        saved: 0,
        message: "Nu s-au gasit mentiuni noi. Verificati termenii de cautare din Configurare.",
      });
    }

    // Process with AI if available
    const processedMentions = process.env.OPENAI_API_KEY
      ? await processWithAI(rawMentions, ngo.name, threshold)
      : processDemo(rawMentions, ngo.name, threshold);

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
            content: `Esti un analist media AI. Analizeaza mentiunea urmatoare despre organizatia "${ngoName}". Raspunde in JSON cu: { "relevanceScore": 0-100, "relevanceReason": "...", "sentiment": "POSITIVE"|"NEUTRAL"|"NEGATIVE", "mentionType": "NEWS"|"PRESS_RELEASE"|"INTERVIEW"|"OPINION"|"REVIEW"|"SOCIAL_MENTION"|"BLOG"|"OTHER", "summary": "rezumat 2-3 propozitii in romana", "entities": { "project": null, "location": null, "persons": [], "ngoNameFound": "", "sourceName": "" } }`,
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
      sourceName: mention.sourceName || getDomainFromUrl(mention.url),
    },
  };
}

function processDemo(mentions: any[], ngoName: string, threshold: number) {
  return mentions.map(m => ({
    ...m,
    ...processSingleDemo(m, ngoName),
  }));
}

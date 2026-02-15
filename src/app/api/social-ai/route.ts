import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
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

  const role = (session.user as any).role;
  const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
  if (!hasFeature(plan, "social_ai", role)) {
    return NextResponse.json({ error: "Social AI nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  // Get NGO data for context
  const ngo = await prisma.ngo.findUnique({
    where: { id: ngoId },
    include: {
      campaigns: { where: { status: "SENT" }, take: 5, orderBy: { createdAt: "desc" } },
      verification: true,
    },
  });

  if (!ngo) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Return demo content when OpenAI is not configured
    return handleDemoMode(action, body, ngo);
  }

  try {
    const openai = getOpenAI();

    if (action === "generate_post") {
      return await generateSocialPost(openai, body, ngo);
    } else if (action === "fundraising_advice") {
      return await getFundraisingAdvice(openai, body, ngo);
    } else if (action === "campaign_strategy") {
      return await getCampaignStrategy(openai, body, ngo);
    } else if (action === "optimize_post") {
      return await optimizeSocialPost(openai, body, ngo);
    } else {
      return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Social AI error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateSocialPost(openai: OpenAI, body: any, ngo: any) {
  const { platform, topic, tone, campaignName, includeHashtags, includeEmoji, customContext } = body;

  const platformGuides: Record<string, string> = {
    facebook: "Facebook post (can be longer, 1-3 paragraphs, include a call-to-action). Use engaging storytelling.",
    instagram: "Instagram caption (engaging, use line breaks, end with hashtags). Focus on visual storytelling.",
    twitter: "Twitter/X post (max 280 characters, punchy and shareable). Be concise and impactful.",
    linkedin: "LinkedIn post (professional tone, 2-4 paragraphs, thought leadership style). Focus on impact and credibility.",
    tiktok: "TikTok caption (short, trendy, use Gen Z language where appropriate). Be catchy and relatable.",
  };

  const toneMap: Record<string, string> = {
    emotional: "emotional, heartfelt, touching",
    urgent: "urgent, compelling, time-sensitive",
    informative: "informative, educational, factual",
    inspiring: "inspiring, motivational, uplifting",
    casual: "casual, friendly, conversational",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Esti un expert in social media marketing pentru organizatii nonprofit din Romania. Genereaza postari creative si eficiente. Scrie INTOTDEAUNA in limba romana. Organizatia se numeste "${ngo.name}". ${ngo.description ? `Descriere: ${ngo.description}.` : ""} ${ngo.category ? `Categorie: ${ngo.category}.` : ""}`,
      },
      {
        role: "user",
        content: `Genereaza o postare pentru ${platformGuides[platform] || "social media"}.\n\nSubiect: ${topic}\n${campaignName ? `Campanie: ${campaignName}` : ""}\nTon: ${toneMap[tone] || "engaging"}\n${includeHashtags ? "Include hashtag-uri relevante." : "Fara hashtag-uri."}\n${includeEmoji ? "Foloseste emoji-uri." : "Fara emoji-uri."}\n${customContext ? `Context aditional: ${customContext}` : ""}\n\nGenereaza 3 variante diferite, separate prin ---`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.85,
  });

  const content = response.choices[0]?.message?.content || "";
  const variants = content.split("---").map((v: string) => v.trim()).filter(Boolean);

  return NextResponse.json({ variants, platform });
}

async function getFundraisingAdvice(openai: OpenAI, body: any, ngo: any) {
  const { question, context } = body;

  const campaignInfo = ngo.campaigns.length > 0
    ? `Campaniile recente: ${ngo.campaigns.map((c: any) => c.name).join(", ")}.`
    : "Nu au campanii recente.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Esti un trainer expert in fundraising pentru ONG-uri din Romania. Oferi sfaturi practice, strategice si adaptate contextului romanesc. Raspunzi INTOTDEAUNA in romana. Cunosti legislatia romaneasca (Legea sponsorizarii 32/1994, Formularul 230, OG 26/2000). Organizatia: "${ngo.name}". ${ngo.category ? `Categorie: ${ngo.category}.` : ""} ${campaignInfo} Plan: ${ngo.subscriptionPlan}.`,
      },
      {
        role: "user",
        content: question || context || "Ofera sfaturi generale de fundraising pentru ONG-ul nostru. Ce strategii ar functiona cel mai bine?",
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  return NextResponse.json({
    advice: response.choices[0]?.message?.content || "",
  });
}

async function getCampaignStrategy(openai: OpenAI, body: any, ngo: any) {
  const { campaignGoal, targetAudience, budget, timeline } = body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Esti un strateg de campanii pentru ONG-uri din Romania. Creezi planuri complete de campanie cu calendar, canale, mesaje si KPI-uri. Raspunzi INTOTDEAUNA in romana. Organizatia: "${ngo.name}". ${ngo.category ? `Domeniu: ${ngo.category}.` : ""}`,
      },
      {
        role: "user",
        content: `Creaza o strategie de campanie:\n\nObiectiv: ${campaignGoal || "strangere de fonduri"}\nPublic tinta: ${targetAudience || "donatori individuali"}\nBuget: ${budget || "minimal"}\nTimeline: ${timeline || "1 luna"}\n\nInclude:\n1. Calendar saptamanal de postari\n2. Canale recomandate (Facebook, Instagram, LinkedIn, email, SMS)\n3. Tipuri de continut pentru fiecare canal\n4. Mesaje cheie\n5. KPI-uri de urmarit\n6. Sfaturi pentru maximizarea impactului`,
      },
    ],
    max_tokens: 3000,
    temperature: 0.75,
  });

  return NextResponse.json({
    strategy: response.choices[0]?.message?.content || "",
  });
}

async function optimizeSocialPost(openai: OpenAI, body: any, ngo: any) {
  const { content, platform } = body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Esti un expert in optimizarea postarilor social media pentru ONG-uri romanesti. Analizeaza si imbunatateste postarea data. Raspunde in romana.`,
      },
      {
        role: "user",
        content: `Analizeaza si imbunatateste aceasta postare ${platform ? `pentru ${platform}` : ""}:\n\n${content}\n\nOfera:\n1. Scor de impact (1-10)\n2. Ce e bine\n3. Ce poate fi imbunatatit\n4. Versiune optimizata\n5. Cel mai bun moment pentru postare`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  return NextResponse.json({
    analysis: response.choices[0]?.message?.content || "",
  });
}

function handleDemoMode(action: string, body: any, ngo: any) {
  if (action === "generate_post") {
    const platform = body.platform || "facebook";
    return NextResponse.json({
      variants: [
        `Fiecare gest conteaza! ${ngo.name} continua sa faca diferenta in comunitate. Impreuna putem schimba vieti. 💙\n\n${body.includeHashtags ? "#NGO #Romania #FacemBine #Comunitate" : ""}`,
        `Stiai ca poti redirectiona 3,5% din impozitul pe venit catre ${ngo.name}? Nu te costa nimic, dar impactul este imens!\n\nCompleteaza Formularul 230 astazi. 📝\n\n${body.includeHashtags ? "#Formular230 #35LaONG #Romania" : ""}`,
        `Multumim tuturor sustinatorilor nostri! Datorita voua, ${ngo.name} a reusit sa ajute sute de persoane anul acesta. 🙏\n\nFiecare donatie, oricat de mica, conteaza.\n\n${body.includeHashtags ? "#Multumim #Doneaza #ImpactSocial" : ""}`,
      ],
      platform,
    });
  }

  if (action === "fundraising_advice") {
    return NextResponse.json({
      advice: `## Sfaturi de Fundraising pentru ${ngo.name}\n\n### 1. Diversifica sursele de finantare\n- **Formularul 230** - Campaniile de 3,5% sunt gratuite si pot aduce venituri semnificative\n- **Sponsorizari corporate** - Contacteaza firme locale cu propuneri concrete\n- **Crowdfunding** - Lanseaza campanii online cu obiective clare\n- **Granturi** - Aplica la finantari europene si nationale\n\n### 2. Construieste relatii pe termen lung\n- Trimite multumiri personalizate donatorilor\n- Creeaza rapoarte de impact transparente\n- Organizeaza evenimente pentru sustinatori\n\n### 3. Strategia Social Media\n- Posteaza regulat (minim 3x/saptamana)\n- Foloseste storytelling cu beneficiarii\n- Partajeaza rezultate concrete (numere, poze, testimoniale)\n- Raspunde la comentarii si mesaje in maxim 24h\n\n### 4. Email Marketing\n- Segmenteaza lista de donatori\n- Trimite newsletter lunar cu update-uri\n- Personalizeaza mesajele\n\n### 5. Momentul potrivit\n- **Decembrie** - Sezonul generozitaei (Craciun)\n- **Martie-Mai** - Campania Formular 230\n- **Septembrie** - Back to school / revenire din vacanta`,
    });
  }

  if (action === "campaign_strategy") {
    return NextResponse.json({
      strategy: `## Strategie de Campanie - ${ngo.name}\n\n### Saptamana 1: Pregatire\n- **Luni**: Postare teaser pe Facebook + Instagram\n- **Miercuri**: Email catre donatorii existenti\n- **Vineri**: Lansare oficiala pe toate canalele\n\n### Saptamana 2: Amplificare\n- **Luni**: Testimonial de la un beneficiar\n- **Miercuri**: Video scurt (30s) pentru Instagram/TikTok\n- **Vineri**: Update progres + apel la actiune\n\n### Saptamana 3: Intensificare\n- **Zilnic**: Update-uri de progres pe Stories\n- **Miercuri**: Live Q&A pe Facebook\n- **Vineri**: Post de urgenta daca obiectivul nu e atins\n\n### Saptamana 4: Finalizare\n- **Luni**: Ultimul apel\n- **Miercuri**: Multumiri intermediare\n- **Vineri**: Anunt rezultate + multumiri\n\n### KPI-uri de urmarit\n- Reach si engagement pe social media\n- Rata de deschidere email (obiectiv: >25%)\n- Nr. donatori noi\n- Suma stransa vs. obiectiv\n- Cost per donator achizitionat`,
    });
  }

  if (action === "optimize_post") {
    return NextResponse.json({
      analysis: `## Analiza Postarii\n\n**Scor de impact: 6/10**\n\n### Ce e bine:\n- Mesajul e clar si direct\n- Include call-to-action\n\n### Ce poate fi imbunatatit:\n- Adauga o poveste personala sau testimonial\n- Foloseste numere concrete (impact)\n- Adauga un element vizual descriptiv\n- Include hashtag-uri relevante\n\n### Cel mai bun moment pentru postare:\n- **Facebook**: Miercuri-Joi, 12:00-14:00\n- **Instagram**: Marti-Joi, 11:00-13:00 sau 19:00-21:00\n- **LinkedIn**: Marti-Joi, 08:00-10:00`,
    });
  }

  return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
}

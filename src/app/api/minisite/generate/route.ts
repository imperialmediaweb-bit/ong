import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const CATEGORY_COLORS: Record<string, { primary: string; accent: string }[]> = {
  Social: [
    { primary: "#6366f1", accent: "#f59e0b" },
    { primary: "#7c3aed", accent: "#fb923c" },
    { primary: "#4f46e5", accent: "#fbbf24" },
  ],
  Educatie: [
    { primary: "#2563eb", accent: "#10b981" },
    { primary: "#1d4ed8", accent: "#34d399" },
    { primary: "#3b82f6", accent: "#059669" },
  ],
  Sanatate: [
    { primary: "#dc2626", accent: "#f97316" },
    { primary: "#e11d48", accent: "#fb923c" },
    { primary: "#be123c", accent: "#ea580c" },
  ],
  Mediu: [
    { primary: "#16a34a", accent: "#0ea5e9" },
    { primary: "#15803d", accent: "#06b6d4" },
    { primary: "#22c55e", accent: "#0284c7" },
  ],
  Cultura: [
    { primary: "#9333ea", accent: "#ec4899" },
    { primary: "#7e22ce", accent: "#f472b6" },
    { primary: "#a855f7", accent: "#db2777" },
  ],
  Sport: [
    { primary: "#0891b2", accent: "#84cc16" },
    { primary: "#0e7490", accent: "#65a30d" },
    { primary: "#06b6d4", accent: "#a3e635" },
  ],
  "Drepturile omului": [
    { primary: "#b91c1c", accent: "#7c3aed" },
    { primary: "#991b1b", accent: "#6d28d9" },
    { primary: "#dc2626", accent: "#8b5cf6" },
  ],
  Altele: [
    { primary: "#4f46e5", accent: "#f59e0b" },
    { primary: "#6366f1", accent: "#ec4899" },
    { primary: "#2563eb", accent: "#f97316" },
  ],
};

// Template styles for unique sites
const TEMPLATE_STYLES = [
  "modern",
  "elegant",
  "bold",
  "warm",
  "minimal",
  "vibrant",
  "corporate",
  "creative",
];

// Different writing tones for AI
const WRITING_STYLES = [
  "profesional si empatic, cu accent pe incredere si rezultate concrete",
  "cald si personal, ca o scrisoare de la un prieten care face diferenta",
  "puternic si motivant, cu apel la actiune si urgenta",
  "elegant si sofisticat, cu date si realizari impresionante",
  "autentic si direct, vorbind pe limba comunitatii",
];

function getDemoContent(name: string, category?: string, description?: string) {
  const cat = category || "Social";
  const desc = description || `organizatie dedicata comunitatii in domeniul ${cat.toLowerCase()}`;
  const variants = [
    {
      heroTitle: `${name} - Impreuna schimbam vieti`,
      heroDescription: `${desc.length > 150 ? desc.substring(0, 150) + "..." : desc}. Alatura-te misiunii noastre si fa diferenta.`,
      aboutText: `${name} este o organizatie non-guvernamentala dedicata imbunatatirii vietii comunitatii prin programe si initiative in domeniul ${cat.toLowerCase()}.\n\nDe la infiintare, am reusit sa implementam proiecte care au avut un impact real asupra beneficiarilor nostri. Echipa noastra de voluntari si profesionisti lucreaza zi de zi pentru a transforma viziunea noastra in realitate.\n\nCredinta noastra este ca fiecare persoana merita sansa la o viata mai buna, iar prin colaborare si dedicare putem construi o societate mai echitabila.`,
      missionText: `Misiunea ${name} este de a contribui la dezvoltarea durabila a comunitatii prin programe inovatoare in domeniul ${cat.toLowerCase()}.\n\nNe propunem sa fim un catalizator al schimbarii pozitive, oferind resurse, educatie si sprijin celor care au cea mai mare nevoie.`,
      impactText: `De-a lungul activitatii noastre, ${name} a reusit sa ajunga la mii de beneficiari prin programele sale. Fiecare donatie contribuie direct la imbunatatirea vietii celor din comunitate.`,
      heroCtaText: "Sustine cauza noastra",
    },
    {
      heroTitle: `Fiecare gest conteaza - ${name}`,
      heroDescription: `Descopera cum ${name} transforma comunitati prin ${cat.toLowerCase()}. Fii parte din schimbare.`,
      aboutText: `Bine ai venit la ${name}! Suntem o echipa de oameni pasionati care cred in puterea comunitatii de a genera schimbare.\n\nLucram in domeniul ${cat.toLowerCase()} pentru a adresa provocarile reale cu care se confrunta societatea. Fiecare proiect pe care il implementam porneste de la nevoile reale ale beneficiarilor nostri.\n\nTransparenta si responsabilitatea sunt valorile care ne ghideaza. Fiecare leu donat este investit cu grija pentru a maximiza impactul pozitiv.`,
      missionText: `Ne-am propus sa construim o lume in care ${cat.toLowerCase()} nu mai este un privilegiu, ci un drept fundamental.\n\nPrin programele noastre, oferim instrumente concrete pentru dezvoltare si autonomie. Credem ca investitia in oameni este cea mai valoroasa.`,
      impactText: `Rezultatele noastre vorbesc de la sine: sute de beneficiari sustinuti, zeci de proiecte finalizate si o comunitate tot mai puternica. Impreuna am demonstrat ca schimbarea e posibila.`,
      heroCtaText: "Doneaza pentru viitor",
    },
    {
      heroTitle: `Construim viitorul impreuna`,
      heroDescription: `${name} - dedicati ${cat.toLowerCase()} si dezvoltarii comunitatii. Fiecare contributie face diferenta.`,
      aboutText: `${name} s-a nascut din dorinta de a raspunde la o nevoie reala: aceea de a aduce schimbare in domeniul ${cat.toLowerCase()}.\n\nCu o echipa dedicata si parteneriate solide, am dezvoltat programe care au transformat vieti. Nu suntem doar o organizatie - suntem o comunitate de oameni care aleg sa actioneze.\n\nFiecare poveste de succes ne motiveaza sa continuam si sa ne extindem impactul catre cat mai multi beneficiari.`,
      missionText: `Viziunea noastra este o societate in care fiecare persoana are acces la resurse si oportunitati in domeniul ${cat.toLowerCase()}.\n\nLucram strategic, cu programe bazate pe date si nevoi reale, pentru a asigura un impact durabil si masurabil.`,
      impactText: `${name} a implementat peste 20 de proiecte, sustinand direct mii de persoane. Comunitatile in care lucram sunt mai puternice datorita eforturilor noastre comune.`,
      heroCtaText: "Fii parte din schimbare",
    },
  ];
  return variants[Math.floor(Math.random() * variants.length)];
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

    const body = await request.json();
    const {
      name, description, category, shortDescription,
      cui, registrationNr, bankAccount, bankName,
      contactEmail, contactPhone, contactAddress,
      socialFacebook, socialInstagram, socialLinkedin,
      socialYoutube, socialTiktok, socialTwitter,
      logoUrl, websiteUrl, coverImageUrl,
      autoSave, autoPublish,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Numele organizatiei este obligatoriu" }, { status: 400 });
    }

    // Pick random color variant for category
    const colorVariants = CATEGORY_COLORS[category || "Social"] || CATEGORY_COLORS.Altele;
    const colors = colorVariants[Math.floor(Math.random() * colorVariants.length)];

    // Pick random template style
    const templateStyle = TEMPLATE_STYLES[Math.floor(Math.random() * TEMPLATE_STYLES.length)];

    // Pick random writing style for AI
    const writingStyle = WRITING_STYLES[Math.floor(Math.random() * WRITING_STYLES.length)];

    let generated;
    let isDemo = true;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const contextParts: string[] = [];
        contextParts.push(`Numele organizatiei: ${name}`);
        if (cui) contextParts.push(`CUI: ${cui}`);
        if (category) contextParts.push(`Domeniu: ${category}`);
        if (description) contextParts.push(`Descriere: ${description}`);
        if (shortDescription) contextParts.push(`Descriere scurta: ${shortDescription}`);
        if (contactAddress) contextParts.push(`Sediu: ${contactAddress}`);

        const prompt = `Esti un expert in comunicare si marketing pentru ONG-uri din Romania.
Stilul tau de scriere: ${writingStyle}.
Template vizual ales: ${templateStyle}.

Creeaza continutul complet si UNIC pentru site-ul web al organizatiei:

${contextParts.join("\n")}

Genereaza un JSON cu EXACT aceste campuri:
{
  "heroTitle": "titlu puternic, emotionant, max 80 caractere - NU repeta numele ONG-ului, fii creativ si unic",
  "heroDescription": "descriere captivanta, 1-2 propozitii, max 200 caractere - unica si personalizata",
  "aboutText": "3 paragrafe profesionale despre organizatie, separate prin \\n\\n. Include: cine suntem, ce facem, de ce facem. Min 400 caractere. Stil unic.",
  "missionText": "2 paragrafe despre misiunea si viziunea organizatiei, separate prin \\n\\n. Specific si concret. Min 300 caractere.",
  "impactText": "1 paragraf despre impactul real, cu cifre estimate daca e posibil. Min 150 caractere. Inspirant.",
  "heroCtaText": "text buton call-to-action, max 25 caractere, creativ si orientat spre actiune"
}

REGULI CRITICE:
- Limba romana, fara diacritice
- Ton: ${writingStyle}
- Continut 100% UNIC - NU folosi formulari generice sau clisee
- Personalizeaza totul pe baza informatiilor reale ale organizatiei
- Fiecare generare trebuie sa fie DIFERITA de cele anterioare
- DOAR JSON valid, fara markdown, fara backticks`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Raspunde DOAR cu JSON valid. Fara markdown, fara text suplimentar. Fii CREATIV si UNIC la fiecare generare." },
            { role: "user", content: prompt },
          ],
          temperature: 1.0,
          max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content?.trim();
        if (responseText) {
          try {
            generated = JSON.parse(responseText);
            isDemo = false;
          } catch {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              generated = JSON.parse(jsonMatch[0]);
              isDemo = false;
            }
          }
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    if (!generated) {
      generated = getDemoContent(name, category, description);
    }

    const result = {
      heroTitle: generated.heroTitle || "",
      heroDescription: generated.heroDescription || "",
      aboutText: generated.aboutText || "",
      missionText: generated.missionText || "",
      impactText: generated.impactText || "",
      heroCtaText: generated.heroCtaText || "Sustine cauza noastra",
      primaryColor: colors.primary,
      accentColor: colors.accent,
      templateStyle,
    };

    // Auto-save: update NGO + upsert MiniSiteConfig + publish site
    if (autoSave) {
      const ngoUpdate: any = {};
      if (description) ngoUpdate.description = description;
      if (shortDescription) ngoUpdate.shortDescription = shortDescription;
      if (logoUrl !== undefined) ngoUpdate.logoUrl = logoUrl;
      if (websiteUrl !== undefined) ngoUpdate.websiteUrl = websiteUrl;
      if (coverImageUrl !== undefined) ngoUpdate.coverImageUrl = coverImageUrl;
      if (category) ngoUpdate.category = category;

      if (Object.keys(ngoUpdate).length > 0) {
        await prisma.ngo.update({ where: { id: ngoId }, data: ngoUpdate });
      }

      const configData: any = {
        heroTitle: result.heroTitle,
        heroDescription: result.heroDescription,
        aboutText: result.aboutText,
        missionText: result.missionText,
        impactText: result.impactText,
        heroCtaText: result.heroCtaText,
        primaryColor: result.primaryColor,
        accentColor: result.accentColor,
        templateStyle: result.templateStyle,
        theme: "modern",
        showAbout: true,
        showMission: true,
        showImpact: true,
        showDonation: true,
        showNewsletter: true,
        showContact: !!(contactEmail || contactPhone || contactAddress),
        showSocial: !!(socialFacebook || socialInstagram || socialLinkedin || socialYoutube || socialTiktok || socialTwitter),
        showFormular230: true,
        showContract: true,
        isPublished: autoPublish !== false,
      };

      if (contactEmail) configData.contactEmail = contactEmail;
      if (contactPhone) configData.contactPhone = contactPhone;
      if (contactAddress) configData.contactAddress = contactAddress;
      if (cui) configData.cui = cui;
      if (registrationNr) configData.registrationNr = registrationNr;
      if (bankAccount) configData.bankAccount = bankAccount;
      if (bankName) configData.bankName = bankName;
      if (socialFacebook) configData.socialFacebook = socialFacebook;
      if (socialInstagram) configData.socialInstagram = socialInstagram;
      if (socialLinkedin) configData.socialLinkedin = socialLinkedin;
      if (socialTwitter) configData.socialTwitter = socialTwitter;
      if (socialYoutube) configData.socialYoutube = socialYoutube;
      if (socialTiktok) configData.socialTiktok = socialTiktok;

      await prisma.miniSiteConfig.upsert({
        where: { ngoId },
        create: { ngoId, ...configData },
        update: configData,
      });

      const ngo = await prisma.ngo.findUnique({ where: { id: ngoId }, select: { slug: true } });

      return NextResponse.json({
        success: true,
        generated: result,
        isDemo,
        saved: true,
        published: autoPublish !== false,
        siteUrl: `/s/${ngo?.slug}`,
        templateStyle,
      });
    }

    return NextResponse.json({
      success: true,
      generated: result,
      isDemo,
      saved: false,
      templateStyle,
    });
  } catch (error) {
    console.error("Minisite generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

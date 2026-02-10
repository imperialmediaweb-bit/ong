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

const TEMPLATE_STYLES = [
  "modern", "elegant", "bold", "warm", "minimal", "vibrant", "corporate", "creative",
];

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
      aboutText: `${name} este o organizatie non-guvernamentala dedicata imbunatatirii vietii comunitatii prin programe si initiative in domeniul ${cat.toLowerCase()}.\n\nDe la infiintare, am reusit sa implementam proiecte care au avut un impact real asupra beneficiarilor nostri.`,
      missionText: `Misiunea ${name} este de a contribui la dezvoltarea durabila a comunitatii prin programe inovatoare in domeniul ${cat.toLowerCase()}.`,
      impactText: `De-a lungul activitatii noastre, ${name} a reusit sa ajunga la mii de beneficiari prin programele sale.`,
      heroCtaText: "Sustine cauza noastra",
      faqItems: [
        { question: "Cum pot dona?", answer: "Puteti dona direct prin platforma noastra online, prin transfer bancar sau folosind Formularul 230 pentru redirectionarea a 3,5% din impozitul pe venit." },
        { question: "Cum sunt folositi banii?", answer: `Toate donatiile sunt utilizate direct in programele ${name}. Publicam rapoarte de transparenta anuale pentru a demonstra impactul fiecarei contributii.` },
        { question: "Pot redirectiona 3,5% din impozit?", answer: "Da! Completati Formularul 230 cu datele noastre si 3,5% din impozitul dumneavoastra pe venit va fi redirectionat catre organizatia noastra, fara niciun cost suplimentar." },
        { question: "Cum ma pot implica ca voluntar?", answer: "Completati formularul de voluntariat de pe site-ul nostru si va vom contacta in cel mai scurt timp pentru a discuta despre oportunitatile disponibile." },
      ],
      testimonials: [
        { name: "Maria Ionescu", role: "Donator", text: "Sunt impresionata de transparenta si dedicarea echipei. Fiecare donatie conteaza!", photoUrl: "" },
        { name: "Andrei Popescu", role: "Beneficiar", text: "Programele lor mi-au schimbat viata. Sunt recunoscator pentru tot sprijinul primit.", photoUrl: "" },
        { name: "Elena Stoica", role: "Voluntar", text: "Cea mai frumoasa experienta de voluntariat. Echipa este minunata si impactul real.", photoUrl: "" },
      ],
      counterStats: [
        { label: "Beneficiari ajutati", value: 1500, suffix: "+" },
        { label: "Proiecte implementate", value: 45, suffix: "" },
        { label: "Voluntari activi", value: 200, suffix: "+" },
        { label: "Comunitati sustinute", value: 12, suffix: "" },
      ],
    },
  ];
  return variants[0];
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

    const colorVariants = CATEGORY_COLORS[category || "Social"] || CATEGORY_COLORS.Altele;
    const colors = colorVariants[Math.floor(Math.random() * colorVariants.length)];
    const templateStyle = TEMPLATE_STYLES[Math.floor(Math.random() * TEMPLATE_STYLES.length)];
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
  "heroCtaText": "text buton call-to-action, max 25 caractere, creativ si orientat spre actiune",
  "faqItems": [
    {"question": "intrebare frecventa relevanta", "answer": "raspuns detaliat si util, 2-3 propozitii"},
    {"question": "alta intrebare", "answer": "raspuns detaliat"},
    {"question": "alta intrebare", "answer": "raspuns detaliat"},
    {"question": "alta intrebare", "answer": "raspuns detaliat"},
    {"question": "alta intrebare", "answer": "raspuns detaliat"},
    {"question": "alta intrebare", "answer": "raspuns detaliat"}
  ],
  "testimonials": [
    {"name": "prenume si nume romanesc realist", "role": "Donator", "text": "testimonial autentic 2-3 propozitii", "photoUrl": ""},
    {"name": "prenume si nume romanesc", "role": "Beneficiar", "text": "testimonial", "photoUrl": ""},
    {"name": "prenume si nume romanesc", "role": "Voluntar", "text": "testimonial", "photoUrl": ""}
  ],
  "counterStats": [
    {"label": "eticheta", "value": 1500, "suffix": "+"},
    {"label": "eticheta", "value": 45, "suffix": ""},
    {"label": "eticheta", "value": 200, "suffix": "+"},
    {"label": "eticheta", "value": 12, "suffix": ""}
  ],
  "seoTitle": "titlu SEO optimizat max 60 caractere",
  "seoDescription": "meta description SEO max 155 caractere"
}

REGULI CRITICE:
- Limba romana, fara diacritice
- Ton: ${writingStyle}
- Continut 100% UNIC
- Personalizeaza totul pe baza informatiilor reale ale organizatiei
- FAQ: 6 intrebari relevante despre organizatie, donatii, transparenta, voluntariat
- Testimoniale: 3 testimoniale de la donator, beneficiar, voluntar
- Counter stats: 4 statistici realiste de impact cu numere
- DOAR JSON valid, fara markdown, fara backticks`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Raspunde DOAR cu JSON valid. Fara markdown, fara text suplimentar. Fii CREATIV si UNIC la fiecare generare." },
            { role: "user", content: prompt },
          ],
          temperature: 1.0,
          max_tokens: 3000,
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
      faqItems: generated.faqItems || null,
      testimonials: generated.testimonials || null,
      counterStats: generated.counterStats || null,
      seoTitle: generated.seoTitle || "",
      seoDescription: generated.seoDescription || "",
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
        // New AI-generated content
        showFaq: true,
        showTestimonials: true,
        showDonationPopup: true,
        donationPopupDelay: 20,
        donationPopupText: `Fiecare donatie conteaza! Sustine ${name} si fa o diferenta reala.`,
      };

      if (result.faqItems) configData.faqItems = result.faqItems as any;
      if (result.testimonials) configData.testimonials = result.testimonials as any;
      if (result.counterStats) configData.counterStats = result.counterStats as any;
      if (result.seoTitle) configData.seoTitle = result.seoTitle;
      if (result.seoDescription) configData.seoDescription = result.seoDescription;

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

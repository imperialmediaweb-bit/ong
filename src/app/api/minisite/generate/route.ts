import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const CATEGORY_COLORS: Record<string, { primary: string; accent: string }> = {
  Social: { primary: "#6366f1", accent: "#f59e0b" },
  Educatie: { primary: "#2563eb", accent: "#10b981" },
  Sanatate: { primary: "#dc2626", accent: "#f97316" },
  Mediu: { primary: "#16a34a", accent: "#0ea5e9" },
  Cultura: { primary: "#9333ea", accent: "#ec4899" },
  Sport: { primary: "#0891b2", accent: "#84cc16" },
  "Drepturile omului": { primary: "#b91c1c", accent: "#7c3aed" },
  Altele: { primary: "#4f46e5", accent: "#f59e0b" },
};

function getDemoContent(name: string, category?: string, description?: string) {
  const cat = category || "Social";
  const desc = description || `organizatie dedicata comunitatii in domeniul ${cat.toLowerCase()}`;
  return {
    heroTitle: `${name} - Impreuna schimbam vieti`,
    heroDescription: `${desc.length > 150 ? desc.substring(0, 150) + "..." : desc}. Alatura-te misiunii noastre si fa diferenta.`,
    aboutText: `${name} este o organizatie non-guvernamentala dedicata imbunatatirii vietii comunitatii prin programe si initiative in domeniul ${cat.toLowerCase()}.\n\nDe la infiintare, am reusit sa implementam proiecte care au avut un impact real asupra beneficiarilor nostri. Echipa noastra de voluntari si profesionisti lucreaza zi de zi pentru a transforma viziunea noastra in realitate.\n\nCredinta noastra este ca fiecare persoana merita sansa la o viata mai buna, iar prin colaborare si dedicare putem construi o societate mai echitabila.`,
    missionText: `Misiunea ${name} este de a contribui la dezvoltarea durabila a comunitatii prin programe inovatoare in domeniul ${cat.toLowerCase()}.\n\nNe propunem sa fim un catalizator al schimbarii pozitive, oferind resurse, educatie si sprijin celor care au cea mai mare nevoie. Fiecare actiune pe care o intreprindem este ghidata de valorile integritatii, transparentei si respectului pentru demnitatea umana.`,
    impactText: `De-a lungul activitatii noastre, ${name} a reusit sa ajunga la mii de beneficiari prin programele sale. Fiecare donatie si fiecare gest de voluntariat contribuie direct la imbunatatirea vietii celor din comunitatea noastra.`,
    heroCtaText: "Sustine cauza noastra",
  };
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

    const colors = CATEGORY_COLORS[category || "Social"] || CATEGORY_COLORS.Altele;

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

Creeaza continutul complet pentru site-ul web al organizatiei:

${contextParts.join("\n")}

Genereaza un JSON cu EXACT aceste campuri:
{
  "heroTitle": "titlu puternic, emotionant, max 80 caractere - NU repeta numele ONG-ului",
  "heroDescription": "descriere captivanta pentru prima sectiune, 1-2 propozitii, max 200 caractere",
  "aboutText": "3 paragrafe profesionale despre organizatie, separate prin \\n\\n. Include: cine suntem, ce facem, de ce facem. Min 400 caractere.",
  "missionText": "2 paragrafe despre misiunea si viziunea organizatiei, separate prin \\n\\n. Specific si concret. Min 300 caractere.",
  "impactText": "1 paragraf despre impactul real al organizatiei, cu cifre estimate daca e posibil. Min 150 caractere.",
  "heroCtaText": "text buton call-to-action, max 25 caractere, orientat spre actiune"
}

REGULI:
- Limba romana, fara diacritice
- Ton profesional, empatic, motivant
- Continut unic si personalizat pe baza informatiilor date
- NU folosi cuvinte generice goale - fi specific
- DOAR JSON valid, fara markdown, fara backticks`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Raspunde DOAR cu JSON valid. Fara markdown, fara text suplimentar." },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
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
      });
    }

    return NextResponse.json({
      success: true,
      generated: result,
      isDemo,
      saved: false,
    });
  } catch (error) {
    console.error("Minisite generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

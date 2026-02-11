import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import prisma from "@/lib/db";

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

    const providers = await getAvailableProviders();
    if (providers.length === 0) {
      return NextResponse.json({
        error: "Niciun provider AI configurat.",
        noProvider: true,
      }, { status: 503 });
    }

    const body = await request.json();
    const { companyName, industry, city, website, description, estimatedSize, decisionMakerTitle } = body;

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { name: true, description: true, category: true },
    });

    const targetDesc = decisionMakerTitle
      ? `un ${decisionMakerTitle} de la compania ${companyName}`
      : `compania ${companyName}`;

    const systemMsg = `Esti un expert in psihologie organizationala, comunicare persuasiva si fundraising pentru ONG-uri din Romania.
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const prompt = `Analizeaza profilul companiei/persoanei si ofera o strategie completa de abordare pentru a obtine sponsorizare.

Organizatia non-profit: ${ngo?.name || ""}
Descriere ONG: ${ngo?.description || ""}
Categorie ONG: ${ngo?.category || ""}

Target: ${targetDesc}
Industrie: ${industry || "necunoscuta"}
Oras: ${city || "Romania"}
Website: ${website || "necunoscut"}
Descriere companie: ${description || ""}
Marime companie: ${estimatedSize || "necunoscuta"}
${decisionMakerTitle ? `Rol persoana de contact: ${decisionMakerTitle}` : ""}

Raspunde cu JSON:
{
  "companyProfile": {
    "strengths": ["3-4 puncte forte ale companiei relevante pentru sponsorizare"],
    "csrInterests": ["2-3 domenii CSR probabile bazate pe industrie si profil"],
    "budgetEstimate": "mic / mediu / mare - estimare buget CSR/sponsorizari",
    "decisionProcess": "cum se iau deciziile de sponsorizare in acest tip de companie"
  },
  "psychologicalProfile": {
    "motivations": ["3-4 motivatii principale care ar impinge compania/persoana sa sponsorizeze"],
    "values": ["2-3 valori probabile ale companiei/persoanei"],
    "fears": ["2 preocupari/obiectii probabile pe care le-ar avea"],
    "persuasionTriggers": ["3-4 tactici de persuasiune recomandate, specifice acestui profil"]
  },
  "approachStrategy": {
    "bestChannel": "linkedin / email / telefon / intalnire directa - cel mai bun canal",
    "bestTiming": "cand e cel mai bun moment sa contactezi (luna, saptamana, moment din zi)",
    "toneOfVoice": "tonul recomandat (formal / semiformal / prietenos / profesional-empatic)",
    "openingHook": "propozitia de deschidere perfecta care sa capteze atentia",
    "keyArguments": ["3-4 argumente cheie de folosit in conversatie, ordonate dupa impact"],
    "objectionHandling": [
      {
        "objection": "obiectie probabila",
        "response": "cum sa raspunzi la aceasta obiectie"
      }
    ],
    "callToAction": "propunerea concreta de actiune (intalnire, vizita la ONG, etc.)"
  },
  "whyThisMatch": "2-3 propozitii despre de ce aceasta companie/persoana e potrivita pentru ONG-ul tau - conexiunea directa intre activitatea lor si cauza ta",
  "riskLevel": "scazut / mediu / ridicat - sansa de succes",
  "estimatedConversionTime": "1-2 saptamani / 1 luna / 2-3 luni - cat dureaza pana la decizie"
}

IMPORTANT:
- Fii cat mai specific si practic, nu generic
- Bazeaza-te pe cunoasterea industriei si psihologiei de business din Romania
- Adapteaza strategia la marimea companiei (corporatie vs firma mica)
- Personalizeaza pentru cauza ONG-ului
- Gandeste ca un consultant de vanzari/fundraising profesionist`;

    const aiResult = await callAI(systemMsg, prompt, {
      temperature: 0.7,
      maxTokens: 3000,
    });

    if (!aiResult) {
      return NextResponse.json({
        error: "AI nu a putut genera analiza.",
      }, { status: 500 });
    }

    let result;
    try {
      result = parseAiJson(aiResult.text);
    } catch {
      return NextResponse.json({ error: "Raspunsul AI nu este valid." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      provider: aiResult.provider,
    });
  } catch (error) {
    console.error("Sponsor analyze error:", error);
    return NextResponse.json({ error: "Eroare la analiza profilului" }, { status: 500 });
  }
}

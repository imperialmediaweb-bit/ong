import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import prisma from "@/lib/db";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

// POST /api/prospects/analyze — AI-analyze a LinkedIn prospect + match score
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

    const role = (session.user as any).role;
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const providers = await getAvailableProviders();
    if (providers.length === 0) {
      return NextResponse.json({ error: "Niciun provider AI configurat.", noProvider: true }, { status: 503 });
    }

    const body = await request.json();
    const { prospectId } = body;

    if (!prospectId) {
      return NextResponse.json({ error: "prospectId required" }, { status: 400 });
    }

    const prospect = await prisma.linkedInProspect.findFirst({
      where: { id: prospectId, ngoId },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { name: true, description: true, category: true },
    });

    const systemMsg = `Esti un expert in psihologie organizationala, comunicare persuasiva si fundraising/sponsorizare pentru ONG-uri din Romania.
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const prompt = `Analizeaza acest profil LinkedIn si evalueaza cat de potrivit este ca potential sponsor/partener pentru ONG-ul nostru.

ONG: ${ngo?.name || ""}
Descriere ONG: ${ngo?.description || ""}
Categorie ONG: ${ngo?.category || ""}

Profil LinkedIn:
- Nume: ${prospect.fullName}
- Titlu/Headline: ${prospect.headline || "necunoscut"}
- Companie: ${prospect.company || "necunoscuta"}
- Locatie: ${prospect.location || "necunoscuta"}
- URL: ${prospect.profileUrl}

Raspunde cu JSON:
{
  "matchScore": 0-100,
  "matchReasons": ["3-4 motive specifice de ce aceasta persoana e un match bun/slab"],
  "psychologicalProfile": {
    "personalityType": "tip de personalitate estimat (ex: lider, inovator, conservator, etc.)",
    "motivations": ["3 motivatii principale care l-ar determina sa sustina un ONG"],
    "values": ["2-3 valori probabile"],
    "communicationStyle": "stilul preferat de comunicare (formal/informal/tehnic/empatic)",
    "decisionStyle": "cum ia decizii (rapid/analitic/consultativ/impulsiv)"
  },
  "approachStrategy": {
    "bestChannel": "linkedin / email / telefon",
    "bestTiming": "cand sa contactezi (luna, zi din saptamana, moment)",
    "toneOfVoice": "tonul recomandat",
    "openingHook": "propozitia de deschidere perfecta",
    "keyArguments": ["3-4 argumente de impact"],
    "objectionHandling": [
      {"objection": "obiectie probabila", "response": "raspuns recomandat"}
    ],
    "callToAction": "actiunea pe care sa o ceri"
  },
  "companyInsights": {
    "estimatedSize": "mic/mediu/mare",
    "csrPotential": "scazut/mediu/ridicat",
    "budgetEstimate": "mic/mediu/mare",
    "industry": "industria estimata"
  },
  "riskLevel": "low / medium / high",
  "conversionEstimate": "1-2 saptamani / 1 luna / 2-3 luni / 6+ luni",
  "followUpPlan": ["3 pasi de follow-up recomandat"]
}`;

    const aiResponse = await callAI(systemMsg, prompt, { temperature: 0.7 });
    if (!aiResponse) {
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const analysis = parseAiJson(aiResponse.text);
    if (!analysis) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save analysis to prospect
    await prisma.linkedInProspect.update({
      where: { id: prospectId },
      data: {
        aiMatchScore: typeof analysis.matchScore === "number" ? analysis.matchScore : null,
        aiMatchReasons: analysis.matchReasons as any,
        aiAnalysis: analysis as any,
        aiAnalyzedAt: new Date(),
        status: "ANALYZED",
      },
    });

    return NextResponse.json({
      analysis,
      matchScore: analysis.matchScore,
      provider: aiResponse.provider,
    });
  } catch (err) {
    console.error("Prospect analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

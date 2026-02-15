import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import prisma from "@/lib/db";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

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
    if (!hasFeature(plan, "sponsor_ai", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const providers = await getAvailableProviders();
    if (providers.length === 0) {
      return NextResponse.json({
        error: "Niciun provider AI configurat.",
        noProvider: true,
      }, { status: 503 });
    }

    const body = await request.json();
    const { companyName, industry, city, whySponsor, channel, decisionMakerTitle, analysisContext } = body;

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { name: true, description: true, category: true },
    });

    const systemMsg = `Esti un expert in comunicare persuasiva, psihologie organizationala si fundraising pentru ONG-uri din Romania.
Scrii mesaje care conving, nu care cer. Folosesti principii de psihologie sociala (reciprocitate, dovada sociala, autoritate, urgenta).
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const channelDesc = channel === "linkedin"
      ? "mesaj LinkedIn (scurt, 150-200 cuvinte, profesional dar personal, optimizat pentru a primi raspuns)"
      : channel === "email"
      ? "email formal (subiect atragator + corp, 200-300 cuvinte, profesional si persuasiv)"
      : "mesaj general (200 cuvinte, conversational)";

    const personContext = decisionMakerTitle
      ? `\nPersoana tinta: ${decisionMakerTitle} la ${companyName} (adapteaza mesajul la rolul si interesele specifice ale acestei persoane)`
      : "";

    const analysisInfo = analysisContext
      ? `\nContext analiza anterioara:\n- Motivatii identificate: ${analysisContext.motivations?.join(", ") || "N/A"}\n- Trigger-e de persuasiune: ${analysisContext.persuasionTriggers?.join(", ") || "N/A"}\n- Ton recomandat: ${analysisContext.toneOfVoice || "N/A"}\n- Hook de deschidere: ${analysisContext.openingHook || "N/A"}\n- Argumente cheie: ${analysisContext.keyArguments?.join(", ") || "N/A"}`
      : "";

    const prompt = `Genereaza un ${channelDesc} pentru a contacta o companie/persoana ca potential sponsor.

ONG: ${ngo?.name || ""}
Descriere ONG: ${ngo?.description || ""}
Categorie ONG: ${ngo?.category || ""}

Companie tinta: ${companyName}
Industrie: ${industry || "necunoscuta"}
Oras: ${city || "Romania"}
De ce ar fi potrivita: ${whySponsor || ""}${personContext}${analysisInfo}

Raspunde cu JSON:
{
  "subject": "subiect email (doar pentru email, atragator, care starneste curiozitatea)",
  "message": "mesajul complet, gata de trimis, care foloseste principii de persuasiune",
  "psychologicalApproach": "explicatie scurta a strategiei psihologice folosite in mesaj (ce principii ai aplicat si de ce)",
  "tips": ["4-5 sfaturi practice pentru a maximiza sansele de raspuns"],
  "followUpSuggestion": "ce sa faci daca nu raspunde in 3-5 zile (mesaj de follow-up sugerit)"
}

REGULI:
- Tonul: profesional, empatic, care creeaza conexiune - NU insistent sau disperat
- Incepe cu ceva care arata ca stii cine sunt (research-ul tau)
- Mentioneaza CONCRET ce face ONG-ul si impactul masurabil
- Foloseste principiul reciprocitatii - ofera ceva inainte de a cere (invitatie, raport, vizita)
- Creeaza un sentiment de exclusivitate ("am ales sa va contactam pe dumneavoastra in mod special")
- Propune o intalnire/discutie scurta (15 min), nu cere bani direct
- Include social proof daca e posibil (alti parteneri, rezultate, numere)
- Personalizeaza la maximum pentru companie si industria lor
- Daca e LinkedIn: scurt, direct, personal - max 300 caractere ideal pentru connection note
- Call-to-action clar si simplu - o singura actiune specifica
- Semneaza cu numele ONG-ului`;

    const aiResult = await callAI(systemMsg, prompt, {
      temperature: 0.8,
      maxTokens: 2000,
    });

    if (!aiResult) {
      return NextResponse.json({ error: "AI nu a putut genera mesajul" }, { status: 500 });
    }

    let result;
    try {
      result = parseAiJson(aiResult.text);
    } catch {
      return NextResponse.json({ error: "Raspunsul AI nu este valid" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...result,
      provider: aiResult.provider,
    });
  } catch (error) {
    console.error("Sponsor message error:", error);
    return NextResponse.json({ error: "Eroare la generarea mesajului" }, { status: 500 });
  }
}

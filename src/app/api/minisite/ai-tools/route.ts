import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "ai_generator", role)) {
      return NextResponse.json({ error: "Instrumentele AI nu sunt disponibile pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const body = await request.json();
    const { tool, context } = body;

    const providers = await getAvailableProviders();
    if (providers.length === 0) {
      return NextResponse.json({ error: "Niciun provider AI nu este configurat (OPENAI_API_KEY, ANTHROPIC_API_KEY, sau GOOGLE_AI_API_KEY)" }, { status: 500 });
    }

    let prompt = "";
    let systemMsg = "Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.";

    switch (tool) {
      case "seo": {
        prompt = `Genereaza meta tags SEO optimizate pentru site-ul organizatiei non-profit:
Nume: ${context.name || ""}
Descriere: ${context.description || ""}
Categorie: ${context.category || ""}
Despre: ${context.aboutText || ""}
Misiune: ${context.missionText || ""}

Raspunde cu JSON:
{
  "seoTitle": "titlu SEO optimizat, max 60 caractere, include cuvinte cheie",
  "seoDescription": "meta description SEO, max 155 caractere, captivanta si cu call-to-action",
  "seoKeywords": "10-15 cuvinte cheie separate prin virgula, relevante pentru ONG si cauza"
}`;
        break;
      }

      case "faq": {
        prompt = `Genereaza 6-8 intrebari frecvente (FAQ) pentru site-ul organizatiei non-profit:
Nume: ${context.name || ""}
Descriere: ${context.description || ""}
Categorie: ${context.category || ""}
Despre: ${context.aboutText || ""}
Misiune: ${context.missionText || ""}
Are formular 230: ${context.showFormular230 ? "Da" : "Nu"}
Are donatii: ${context.showDonation ? "Da" : "Nu"}

Raspunde cu JSON:
{
  "faqItems": [
    {"question": "intrebare relevanta", "answer": "raspuns detaliat 2-3 propozitii"},
    ...
  ]
}

Include intrebari despre: cum pot dona, cum sunt folositi banii, formular 230 (daca e activ), cum ma pot implica, transparenta, deductibilitate fiscala.`;
        break;
      }

      case "testimonials": {
        prompt = `Genereaza 4 testimoniale realiste pentru site-ul organizatiei non-profit:
Nume: ${context.name || ""}
Descriere: ${context.description || ""}
Categorie: ${context.category || ""}
Despre: ${context.aboutText || ""}

Raspunde cu JSON:
{
  "testimonials": [
    {"name": "prenume si nume romanesc realist", "role": "Donator / Beneficiar / Voluntar / Partener", "text": "testimonial autentic 2-3 propozitii, emotional si specific", "photoUrl": ""},
    ...
  ]
}

Creaza testimoniale variate: un donator, un beneficiar, un voluntar, un partener. Fiecare sa fie unic si specific organizatiei.`;
        break;
      }

      case "team": {
        prompt = `Genereaza 4-6 membri ai echipei (fictivi dar realisti) pentru site-ul organizatiei non-profit:
Nume: ${context.name || ""}
Categorie: ${context.category || ""}
Descriere: ${context.description || ""}

Raspunde cu JSON:
{
  "teamMembers": [
    {"name": "Prenume Nume romanesc", "role": "Director Executiv / Coordonator Proiecte / etc", "photoUrl": "", "bio": "scurta descriere 1-2 propozitii despre experienta si pasiune"},
    ...
  ]
}

Include roluri tipice: Director, Coordonator proiecte, Manager comunicare, Responsabil fundraising, Coordonator voluntari.`;
        break;
      }

      case "events": {
        prompt = `Genereaza 3 evenimente viitoare realiste pentru organizatia non-profit:
Nume: ${context.name || ""}
Categorie: ${context.category || ""}
Descriere: ${context.description || ""}
Adresa: ${context.contactAddress || ""}

Raspunde cu JSON:
{
  "events": [
    {"title": "titlu eveniment", "date": "2025-04-15", "location": "locatie specifica", "description": "descriere 2-3 propozitii", "imageUrl": ""},
    ...
  ]
}

Creeaza evenimente relevante: un eveniment de fundraising, un workshop/training, un eveniment comunitar. Date in viitor.`;
        break;
      }

      case "enhanceCampaign": {
        prompt = `Imbunatateste descrierea campaniei de strangere de fonduri:
Titlu campanie: ${context.title || ""}
Descriere curenta: ${context.description || ""}
Obiectiv: ${context.goalAmount || 0} RON
Organizatie: ${context.ngoName || ""}

Raspunde cu JSON:
{
  "title": "titlu imbunatatit, emotionant si clar",
  "description": "descriere persuasiva 3-4 propozitii, include: problema, solutia, impactul donatiei, urgenta"
}

Fii specific, emotional dar profesional. Arata EXACT ce se intampla cu banii donati.`;
        break;
      }

      case "socialPosts": {
        prompt = `Genereaza 3 postari social media pentru campania de strangere de fonduri:
Titlu campanie: ${context.title || ""}
Descriere: ${context.description || ""}
Obiectiv: ${context.goalAmount || 0} RON
Link: ${context.donateUrl || ""}
Organizatie: ${context.ngoName || ""}

Raspunde cu JSON:
{
  "posts": [
    {"platform": "Facebook", "text": "postare Facebook 2-3 propozitii + hashtags"},
    {"platform": "Instagram", "text": "postare Instagram cu emoji-uri relevante + hashtags"},
    {"platform": "LinkedIn", "text": "postare LinkedIn profesionala + hashtags"}
  ]
}`;
        break;
      }

      case "generateCampaigns": {
        prompt = `Genereaza 3 campanii de strangere de fonduri pentru organizatia non-profit:
Nume: ${context.name || ""}
Categorie: ${context.category || ""}
Descriere: ${context.description || ""}
Despre: ${context.aboutText || ""}
Misiune: ${context.missionText || ""}

Raspunde cu JSON:
{
  "campaigns": [
    {"title": "titlu campanie emotionant si clar", "description": "descriere persuasiva 3-4 propozitii: problema, solutia, impactul donatiei, urgenta", "goalAmount": 10000, "imageUrl": ""},
    ...
  ]
}

Creeaza campanii diverse si relevante pentru cauza organizatiei. Fiecare campanie trebuie sa aiba:
- Un titlu clar, emotional si specific (nu generic)
- O descriere care explica EXACT ce se intampla cu banii donati
- Un obiectiv realist (intre 2000-50000 RON)
- Tonul: empatic, urgent dar profesional, cu date concrete
Exemple de tonuri bune: "Cu doar 50 de lei, un copil primeste rechizite pentru un an intreg", "Fiecare leu conteaza - ajuta-ne sa construim..."`;
        break;
      }

      case "counterStats": {
        prompt = `Genereaza statistici de impact estimate pentru organizatia non-profit:
Nume: ${context.name || ""}
Categorie: ${context.category || ""}
Descriere: ${context.description || ""}
Ani de activitate: ${context.yearsActive || 1}
Donatori: ${context.donorCount || 0}

Raspunde cu JSON:
{
  "counterStats": [
    {"label": "eticheta statistica", "value": 1500, "suffix": "+ / % / etc sau gol"},
    ...
  ]
}

Genereaza 4 statistici relevante: beneficiari ajutati, proiecte implementate, voluntari implicati, comunitati sustinute. Numere realiste.`;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    const preferredProvider = context?.aiProvider as "openai" | "claude" | "gemini" | undefined;
    const aiResult = await callAI(systemMsg, prompt, {
      temperature: 0.9,
      maxTokens: 2000,
      preferredProvider,
    });

    if (!aiResult) {
      return NextResponse.json({ error: "AI nu a generat continut" }, { status: 500 });
    }

    let result;
    try {
      result = parseAiJson(aiResult.text);
    } catch {
      return NextResponse.json({ error: "Raspunsul AI nu este valid" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result, provider: aiResult.provider });
  } catch (error) {
    console.error("AI tools error:", error);
    return NextResponse.json({ error: "Eroare la generarea continutului AI" }, { status: 500 });
  }
}

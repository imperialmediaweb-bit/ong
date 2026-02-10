import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tool, context } = body;

    const openai = await getOpenAI();
    if (!openai) {
      return NextResponse.json({ error: "AI nu este configurat" }, { status: 500 });
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      return NextResponse.json({ error: "AI nu a generat continut" }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ error: "Raspunsul AI nu este valid" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("AI tools error:", error);
    return NextResponse.json({ error: "Eroare la generarea continutului AI" }, { status: 500 });
  }
}

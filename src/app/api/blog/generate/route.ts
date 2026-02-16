import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function getOpenAIClient() {
  const { default: OpenAI } = require("openai");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const { topic, tone, language, ngoName, ngoDescription } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Subiectul este obligatoriu" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Cheia API OpenAI nu este configurata" }, { status: 500 });
    }

    const openai = getOpenAIClient();

    const toneMap: Record<string, string> = {
      professional: "profesional si informativ",
      friendly: "prietenos si accesibil",
      emotional: "emotional si inspirational",
      formal: "formal si oficial",
    };

    const toneDesc = toneMap[tone] || "profesional si informativ";
    const lang = language === "en" ? "engleza" : "romana";

    const systemPrompt = `Esti un expert in content marketing pentru organizatii nonprofit din Romania. Scrii articole de blog captivante, bine structurate si optimizate SEO.`;

    const userPrompt = `Scrie un articol de blog in limba ${lang} cu tonul ${toneDesc} pe tema: "${topic}"

${ngoName ? `Organizatia: ${ngoName}` : ""}
${ngoDescription ? `Descriere: ${ngoDescription}` : ""}

Structureaza articolul astfel:
1. Un titlu captivant (max 80 caractere)
2. Un excerpt/rezumat scurt (max 200 caractere)
3. Continutul complet in format HTML cu:
   - Paragrafe (<p>)
   - Subtitluri (<h2>, <h3>)
   - Liste (<ul>, <ol>) unde e potrivit
   - Text bold (<strong>) pentru punctele cheie
   - Minimum 500 cuvinte

Raspunde STRICT in format JSON:
{
  "title": "titlul articolului",
  "excerpt": "rezumatul scurt",
  "content": "<h2>...</h2><p>...</p>...",
  "category": "categoria sugerata (Noutati/Ghiduri/Resurse/Comunitate/Proiecte)",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const text = response.choices[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Raspuns AI invalid" }, { status: 500 });
    }

    const generated = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      title: generated.title || "",
      excerpt: generated.excerpt || "",
      content: generated.content || "",
      category: generated.category || "Noutati",
      tags: generated.tags || [],
    });
  } catch (error: any) {
    console.error("Blog AI generate error:", error);
    return NextResponse.json({ error: "Eroare la generarea continutului AI" }, { status: 500 });
  }
}

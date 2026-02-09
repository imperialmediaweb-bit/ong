import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getDemoContent(name: string, category?: string) {
  const cat = category || "Social";
  return {
    heroTitle: `Impreuna pentru un viitor mai bun`,
    heroDescription: `${name} lucreaza pentru a aduce schimbari pozitive in comunitate. Alatura-te misiunii noastre si fa diferenta alaturi de noi.`,
    aboutText: `${name} este o organizatie non-guvernamentala dedicata imbunatatirii vietii comunitatii prin programe si initiative in domeniul ${cat.toLowerCase()}.\n\nDe la infiintare, am reusit sa implementam proiecte care au avut un impact real asupra beneficiarilor nostri. Echipa noastra de voluntari si profesionisti lucreaza zi de zi pentru a transforma viziunea noastra in realitate.\n\nCredinta noastra este ca fiecare persoana merita sansa la o viata mai buna, iar prin colaborare si dedicare putem construi o societate mai echitabila.`,
    missionText: `Misiunea ${name} este de a contribui la dezvoltarea durabila a comunitatii prin programe inovatoare in domeniul ${cat.toLowerCase()}.\n\nNe propunem sa fim un catalizator al schimbarii pozitive, oferind resurse, educatie si sprijin celor care au cea mai mare nevoie.`,
    impactText: `De-a lungul activitatii noastre, ${name} a reusit sa ajunga la mii de beneficiari prin programele sale. Fiecare donatie si fiecare gest de voluntariat contribuie direct la imbunatatirea vietii celor din comunitatea noastra.`,
    heroCtaText: "Doneaza acum",
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
    const { name, description, category, shortDescription } = body;

    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // If no API key, return demo content
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        generated: getDemoContent(name, category),
        isDemo: true,
      });
    }

    try {
      // Lazily initialize OpenAI client
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const contextParts: string[] = [];
      contextParts.push(`Numele organizatiei: ${name}`);
      if (category) contextParts.push(`Domeniul de activitate: ${category}`);
      if (description) contextParts.push(`Descriere: ${description}`);
      if (shortDescription) contextParts.push(`Descriere scurta: ${shortDescription}`);

      const userPrompt = `Genereaza continut pentru mini-site-ul urmatoarei organizatii:

${contextParts.join("\n")}

Raspunde STRICT in format JSON valid cu urmatoarele campuri:
{
  "heroTitle": "titlu impactant pentru sectiunea hero (max 60 caractere)",
  "heroDescription": "descriere scurta si captivanta pentru hero (max 200 caractere)",
  "aboutText": "2-3 paragrafe despre organizatie, separate prin \\n\\n",
  "missionText": "1-2 paragrafe despre misiunea organizatiei, separate prin \\n\\n",
  "impactText": "1 paragraf despre impactul organizatiei",
  "heroCtaText": "text pentru butonul CTA (max 25 caractere)"
}

Foloseste un ton profesional, empatic si motivant. Continutul trebuie sa fie in limba romana.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Esti un expert in marketing si comunicare pentru ONG-uri din Romania. Genereaza continut pentru mini-site-ul organizatiei. Raspunde DOAR cu JSON valid, fara markdown, fara backticks, fara explicatii.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        return NextResponse.json({
          success: true,
          generated: getDemoContent(name, category),
          isDemo: true,
        });
      }

      // Try to parse JSON from the response (handle potential markdown wrapping)
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }

      return NextResponse.json({
        success: true,
        generated: {
          heroTitle: parsed.heroTitle || "",
          heroDescription: parsed.heroDescription || "",
          aboutText: parsed.aboutText || "",
          missionText: parsed.missionText || "",
          impactText: parsed.impactText || "",
          heroCtaText: parsed.heroCtaText || "Doneaza acum",
        },
        isDemo: false,
      });
    } catch (aiError) {
      console.error("OpenAI generation error:", aiError);
      // Fall back to demo content on AI failure
      return NextResponse.json({
        success: true,
        generated: getDemoContent(name, category),
        isDemo: true,
      });
    }
  } catch (error) {
    console.error("Minisite generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

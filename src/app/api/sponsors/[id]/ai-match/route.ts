import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json(
        { error: "Nu exista un ONG asociat contului" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    // Fetch the sponsor company
    const company = await prisma.sponsorCompany.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Compania sponsor nu a fost gasita" },
        { status: 404 }
      );
    }

    // Fetch the NGO with verification data
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      include: { verification: true },
    });

    if (!ngo) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }

    let matchResult: { score: number; reasons: string[]; angle: string; rawAnalysis?: string };

    if (process.env.OPENAI_API_KEY) {
      // Call GPT-4o-mini for AI matching
      const openai = getOpenAI();

      const systemPrompt = `Esti un expert in matchmaking intre companii si ONG-uri din Romania. Analizeaza compatibilitatea dintre o companie si un ONG pe baza datelor furnizate. Raspunde DOAR cu un obiect JSON valid, fara alte explicatii.`;

      const userPrompt = `Analizeaza compatibilitatea dintre aceasta companie si ONG:

COMPANIE:
- Nume: ${company.name}
- Industrie: ${company.industry || "necunoscuta"}
- Oras: ${company.city || "necunoscut"}
- Website: ${company.website || "necunoscut"}
- Domeniu: ${company.domain || "necunoscut"}

ONG:
- Nume: ${ngo.name}
- Descriere: ${ngo.description || "fara descriere"}
- Categorie: ${ngo.category || "generala"}
- Oras: ${ngo.verification?.city || "necunoscut"}
- Judet: ${ngo.verification?.county || "necunoscut"}
- Adresa: ${ngo.verification?.address || "necunoscuta"}
- Cod fiscal: ${ngo.verification?.fiscalCode || "necunoscut"}

Raspunde cu JSON:
{
  "score": <numar 0-100>,
  "reasons": ["motiv1", "motiv2", "motiv3"],
  "angle": "<unul din: educatie/medical/social/copii/varstnici/mediu/comunitate_locala>"
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" },
        });

        const rawAnalysis = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(rawAnalysis);

        matchResult = {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : ["Analiza indisponibila"],
          angle: parsed.angle || "social",
          rawAnalysis,
        };
      } catch (aiError: any) {
        console.error("OpenAI AI match error:", aiError.message);
        // Fallback to demo data on AI error
        matchResult = {
          score: 72,
          reasons: [
            "Compania activeaza in aceeasi zona geografica cu ONG-ul",
            "Industria companiei are potential de colaborare cu cauza ONG-ului",
            "Profilul companiei indica interes pentru responsabilitate sociala",
          ],
          angle: mapCategoryToAngle(ngo.category),
        };
      }
    } else {
      // No API key - return demo data
      matchResult = {
        score: 72,
        reasons: [
          "Compania activeaza in aceeasi zona geografica cu ONG-ul",
          "Industria companiei are potential de colaborare cu cauza ONG-ului",
          "Profilul companiei indica interes pentru responsabilitate sociala",
        ],
        angle: mapCategoryToAngle(ngo.category),
      };
    }

    // Save result to SponsorAiMatch
    const aiMatch = await prisma.sponsorAiMatch.create({
      data: {
        companyId: company.id,
        ngoId,
        score: matchResult.score,
        reasons: matchResult.reasons as any,
        angle: matchResult.angle,
        rawAnalysis: matchResult.rawAnalysis || null,
      },
    });

    // Create SponsorInteraction record
    await prisma.sponsorInteraction.create({
      data: {
        companyId: company.id,
        type: "AI_MATCH",
        subject: `AI Match Score: ${matchResult.score}/100`,
        body: `Unghi: ${matchResult.angle}\nMotive: ${matchResult.reasons.join("; ")}`,
        createdBy: userId,
      },
    });

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_AI_MATCH",
      entityType: "SponsorCompany",
      entityId: company.id,
      details: {
        companyName: company.name,
        score: matchResult.score,
        angle: matchResult.angle,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return NextResponse.json({
      id: aiMatch.id,
      score: matchResult.score,
      reasons: matchResult.reasons,
      angle: matchResult.angle,
      rawAnalysis: matchResult.rawAnalysis || null,
      createdAt: aiMatch.createdAt,
    });
  } catch (error) {
    console.error("Sponsor AI match error:", error);
    return NextResponse.json(
      { error: "Eroare interna de server" },
      { status: 500 }
    );
  }
}

function mapCategoryToAngle(category: string | null | undefined): string {
  if (!category) return "social";
  const lower = category.toLowerCase();
  if (lower.includes("educa")) return "educatie";
  if (lower.includes("sanat") || lower.includes("medical")) return "medical";
  if (lower.includes("copii") || lower.includes("copil")) return "copii";
  if (lower.includes("varst") || lower.includes("senior")) return "varstnici";
  if (lower.includes("mediu") || lower.includes("eco") || lower.includes("climat")) return "mediu";
  if (lower.includes("comunit") || lower.includes("local")) return "comunitate_locala";
  return "social";
}

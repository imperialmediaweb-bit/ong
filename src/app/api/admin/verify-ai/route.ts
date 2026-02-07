import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { ngoId, registrationNumber, organizationName, legalForm } = body;

    if (!ngoId || !organizationName) {
      return NextResponse.json(
        { error: "ID-ul ONG-ului si numele organizatiei sunt obligatorii" },
        { status: 400 }
      );
    }

    // Verifica daca ONG-ul exista
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Cheia API OpenAI nu este configurata" },
        { status: 500 }
      );
    }

    const openai = getOpenAI();

    const systemPrompt = `Esti un analist expert in verificarea organizatiilor non-profit din Romania.
Analizeaza datele furnizate si ofera o evaluare de incredere.

Raspunde STRICT in format JSON cu urmatoarea structura:
{
  "confidenceScore": <numar intre 0 si 100>,
  "analysis": {
    "nameAnalysis": "<analiza numelui organizatiei>",
    "registrationAnalysis": "<analiza numarului de inregistrare>",
    "legalFormAnalysis": "<analiza formei juridice>",
    "overallAssessment": "<evaluare generala>"
  },
  "flags": [
    {
      "type": "warning" | "error" | "info",
      "message": "<descrierea problemei sau observatiei>"
    }
  ],
  "recommendation": "APPROVE" | "REVIEW" | "REJECT"
}`;

    const userPrompt = `Analizeaza urmatoarea organizatie non-profit din Romania:

Nume organizatie: ${organizationName}
Numar de inregistrare (CUI/CIF): ${registrationNumber || "Nespecificat"}
Forma juridica: ${legalForm || "Nespecificata"}

Verifica:
1. Daca numele organizatiei este tipic pentru un ONG legitimate din Romania (asociatie, fundatie, etc.)
2. Daca numarul de inregistrare are formatul corect pentru Romania (daca este furnizat)
3. Daca forma juridica este valida si corespunde cu tipul organizatiei
4. Semnaleaza orice probleme potentiale: date lipsa, tipar suspect, inconsistente

Ofera un scor de incredere de la 0 la 100 si o analiza detaliata.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const aiResponseText = response.choices[0]?.message?.content || "{}";
    let aiResult;

    try {
      aiResult = JSON.parse(aiResponseText);
    } catch {
      aiResult = {
        confidenceScore: 0,
        analysis: { overallAssessment: "Eroare la parsarea raspunsului AI" },
        flags: [{ type: "error", message: "Raspunsul AI nu a putut fi procesat" }],
        recommendation: "REVIEW",
      };
    }

    // Actualizeaza verificarea ONG-ului cu rezultatele AI
    const verification = await prisma.ngoVerification.upsert({
      where: { ngoId },
      create: {
        ngoId,
        status: "AI_CHECKED",
        registrationNumber: registrationNumber || null,
        legalForm: legalForm || null,
        aiScore: aiResult.confidenceScore || 0,
        aiAnalysis: aiResult.analysis as any,
        aiFlags: aiResult.flags as any,
      },
      update: {
        status: "AI_CHECKED",
        aiScore: aiResult.confidenceScore || 0,
        aiAnalysis: aiResult.analysis as any,
        aiFlags: aiResult.flags as any,
      },
    });

    return NextResponse.json({
      verification,
      aiResult: {
        confidenceScore: aiResult.confidenceScore,
        analysis: aiResult.analysis,
        flags: aiResult.flags,
        recommendation: aiResult.recommendation,
      },
      message: "Verificarea AI a fost efectuata cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la verificarea AI:", error);
    return NextResponse.json(
      { error: "Eroare la verificarea cu inteligenta artificiala" },
      { status: 500 }
    );
  }
}

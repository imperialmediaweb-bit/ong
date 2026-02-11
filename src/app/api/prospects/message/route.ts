import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import prisma from "@/lib/db";

// POST /api/prospects/message — Generate a personalized message for a LinkedIn prospect
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
      return NextResponse.json({ error: "Niciun provider AI configurat.", noProvider: true }, { status: 503 });
    }

    const body = await request.json();
    const { prospectId, channel, customContext } = body;

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
      select: { name: true, description: true, category: true, senderName: true, senderEmail: true },
    });

    const isLinkedIn = channel === "linkedin";
    const hasAnalysis = prospect.aiAnalysis;

    const analysisContext = hasAnalysis
      ? `\nAnaliza AI existenta: ${JSON.stringify(prospect.aiAnalysis)}`
      : "";

    const systemMsg = `Esti un expert in copywriting persuasiv, comunicare si fundraising pentru ONG-uri din Romania.
${isLinkedIn ? "Genereaza un mesaj LinkedIn scurt (max 300 caractere pentru connection request, sau max 1000 caractere pentru InMail)." : "Genereaza un email profesional de la asociatie (nu de la platforma)."}
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const prompt = `Genereaza un mesaj ${isLinkedIn ? "LinkedIn" : "email"} personalizat pentru a contacta aceasta persoana in numele asociatiei noastre.

Asociatie: ${ngo?.name || ""}
Descriere: ${ngo?.description || ""}
Categorie: ${ngo?.category || ""}
${!isLinkedIn ? `Email expeditor: ${ngo?.senderEmail || "contact@asociatie.ro"}\nNume expeditor: ${ngo?.senderName || ngo?.name || "Asociatia"}` : ""}

Persoana de contact:
- Nume: ${prospect.fullName}
- Titlu: ${prospect.headline || "necunoscut"}
- Companie: ${prospect.company || "necunoscuta"}
- Locatie: ${prospect.location || "necunoscuta"}
${analysisContext}
${customContext ? `Context suplimentar: ${customContext}` : ""}

Raspunde cu JSON:
{
  ${isLinkedIn ? `"connectionMessage": "mesaj scurt pentru connection request (max 280 caractere, personal, nu vanzare directa)",
  "inMailMessage": "mesaj InMail mai detaliat (max 800 caractere)",` : `"subject": "subiectul emailului",
  "emailBody": "corpul emailului in HTML simplu (paragraphs, bold)",`}
  "psychologicalApproach": "ce abordare psihologica s-a folosit si de ce",
  "tips": ["3 sfaturi pentru trimiterea mesajului"],
  "followUpSuggestion": "ce sa faci daca nu raspunde in 5-7 zile",
  "bestTimeToSend": "cel mai bun moment sa trimiti mesajul"
}`;

    const aiResponse = await callAI(systemMsg, prompt, { temperature: 0.8 });
    if (!aiResponse) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const result = parseAiJson(aiResponse.text);
    if (!result) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Update prospect message count
    await prisma.linkedInProspect.update({
      where: { id: prospectId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      ...result,
      channel,
      provider: aiResponse.provider,
      senderName: ngo?.senderName || ngo?.name,
      senderEmail: ngo?.senderEmail,
    });
  } catch (err) {
    console.error("Prospect message error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

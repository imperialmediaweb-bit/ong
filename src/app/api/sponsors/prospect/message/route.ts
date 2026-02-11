import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAI, parseAiJson } from "@/lib/ai-providers";
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

    const body = await request.json();
    const { companyName, industry, city, whySponsor, channel } = body;

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { name: true, description: true, category: true },
    });

    const systemMsg = `Esti un expert in comunicare si fundraising pentru ONG-uri din Romania.
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const channelDesc = channel === "linkedin"
      ? "mesaj LinkedIn (scurt, 150-200 cuvinte, profesional dar personal)"
      : channel === "email"
      ? "email formal (subiect + corp, 200-300 cuvinte, profesional)"
      : "mesaj general (200 cuvinte)";

    const prompt = `Genereaza un ${channelDesc} pentru a contacta o companie ca potential sponsor.

ONG: ${ngo?.name || ""}
Descriere ONG: ${ngo?.description || ""}
Categorie ONG: ${ngo?.category || ""}

Companie tinta: ${companyName}
Industrie: ${industry || "necunoscuta"}
Oras: ${city || "Romania"}
De ce ar fi potrivita: ${whySponsor || ""}

Raspunde cu JSON:
{
  "subject": "subiect email (doar pentru email)",
  "message": "mesajul complet, gata de trimis",
  "tips": ["3 sfaturi pentru a maximiza sansele de raspuns"]
}

REGULI:
- Tonul: profesional, empatic, nu insistent/disperat
- Mentioneaza CONCRET ce face ONG-ul si impactul
- Propune o intalnire/discutie, nu cere bani direct
- Personalizeaza pentru companie (mentioneaza industria lor)
- Include un call-to-action clar
- Daca e LinkedIn: incepe cu un connection request note scurt
- Semneaza cu numele ONG-ului`;

    const aiResult = await callAI(systemMsg, prompt, {
      temperature: 0.8,
      maxTokens: 1500,
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

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
    const { keywords, industry, city, count } = body;

    if (!keywords && !industry) {
      return NextResponse.json({ error: "Introduceti cuvinte cheie sau industrie" }, { status: 400 });
    }

    // Get NGO info for context
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { name: true, description: true, category: true },
    });

    // Get existing sponsors to avoid duplicates
    const existingSponsors = await prisma.sponsorCompany.findMany({
      where: { ngoId },
      select: { name: true },
    });
    const existingNames = existingSponsors.map((s) => s.name.toLowerCase());

    const systemMsg = `Esti un expert in identificarea companiilor potentiale sponsor pentru organizatii non-profit din Romania.
Raspunde DOAR cu JSON valid. Fara markdown, fara backticks, fara text suplimentar. Limba romana, fara diacritice.`;

    const prompt = `Gaseste ${count || 8} companii REALE din Romania care ar putea fi sponsori potentiali.

Organizatia non-profit: ${ngo?.name || ""}
Descriere ONG: ${ngo?.description || ""}
Categorie ONG: ${ngo?.category || ""}

Criterii cautare:
- Cuvinte cheie: ${keywords || "orice"}
- Industrie: ${industry || "orice"}
- Oras: ${city || "orice oras din Romania"}

Companii deja in baza noastra (NU le include): ${existingNames.slice(0, 20).join(", ") || "niciuna"}

Raspunde cu JSON:
{
  "companies": [
    {
      "name": "Numele REAL al companiei (companie existenta in Romania)",
      "industry": "IT / Constructii / Retail / Financiar / Productie / FMCG / etc",
      "city": "orasul sediului",
      "website": "website-ul real al companiei (daca il stii, altfel pune domeniu probabil)",
      "linkedinUrl": "URL LinkedIn al companiei (daca il stii)",
      "description": "scurta descriere 1-2 propozitii despre companie",
      "whySponsor": "de ce ar fi sponsor bun pentru acest ONG - 1-2 propozitii",
      "estimatedSize": "mica / medie / mare / corporatie",
      "contactTip": "sfat scurt cum sa ii abordezi (ex: prin HR, prin CSR department, prin directorul general)"
    }
  ]
}

IMPORTANT:
- Foloseste companii REALE din Romania, nu inventate
- Include un mix de companii mari si mici
- Fiecare companie sa aiba o legatura logica cu cauza ONG-ului
- Sugereaza strategia de abordare specifica fiecarei companii
- Include URL-uri LinkedIn cat mai realiste (linkedin.com/company/nume-companie)
- Pune website-uri reale sau cele mai probabile domenii`;

    const aiResult = await callAI(systemMsg, prompt, {
      temperature: 0.8,
      maxTokens: 3000,
    });

    if (!aiResult) {
      return NextResponse.json({ error: "AI nu a putut genera rezultate" }, { status: 500 });
    }

    let result;
    try {
      result = parseAiJson(aiResult.text);
    } catch {
      return NextResponse.json({ error: "Raspunsul AI nu este valid" }, { status: 500 });
    }

    // Filter out already existing companies
    if (result.companies && Array.isArray(result.companies)) {
      result.companies = result.companies.filter(
        (c: any) => !existingNames.includes((c.name || "").toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      companies: result.companies || [],
      provider: aiResult.provider,
    });
  } catch (error) {
    console.error("Sponsor prospect error:", error);
    return NextResponse.json({ error: "Eroare la prospectarea companiilor" }, { status: 500 });
  }
}

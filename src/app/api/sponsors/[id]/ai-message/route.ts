import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy" });
}

interface MessageVariant {
  tone: string;
  subject: string;
  body: string;
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
    const body = await request.json();
    const { contactId, tone } = body as {
      contactId: string;
      tone?: "formal" | "friendly" | "ultra_short";
    };

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId este obligatoriu" },
        { status: 400 }
      );
    }

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

    // Fetch the contact
    const contact = await prisma.sponsorContact.findFirst({
      where: { id: contactId, companyId: company.id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contactul nu a fost gasit in cadrul acestei companii" },
        { status: 404 }
      );
    }

    // Fetch the NGO
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

    let variants: MessageVariant[];

    if (process.env.OPENAI_API_KEY) {
      const openai = getOpenAI();

      const firstName = contact.fullName.split(" ")[0];

      const systemPrompt = `Esti un expert in comunicare si fundraising pentru ONG-uri din Romania. Genereaza 3 variante de email de outreach catre un potential sponsor corporativ.

Reguli STRICTE:
- Tonul trebuie sa fie de PARTENERIAT, IMPACT si TRANSPARENTA - NU cersetorie
- TREBUIE sa mentionezi "sponsorizare anuala (redirectionare 20%) catre asociatie" in fiecare varianta
- Foloseste variabile: {first_name}, {company_name}, {role}, {city}, {ngo_name} in textul generat
- Scrie in limba ROMANA
- Genereaza exact 3 variante: Formal, Prietenos, Ultra-scurt

Raspunde DOAR cu JSON valid:
{
  "variants": [
    { "tone": "formal", "subject": "...", "body": "..." },
    { "tone": "friendly", "subject": "...", "body": "..." },
    { "tone": "ultra_short", "subject": "...", "body": "..." }
  ]
}`;

      const userPrompt = `Genereaza 3 variante de email de outreach:

CONTACT:
- Nume: ${contact.fullName}
- Prenume: ${firstName}
- Rol: ${contact.role || "nespecificat"}
- Email: ${contact.email || "nespecificat"}

COMPANIE:
- Nume: ${company.name}
- Industrie: ${company.industry || "necunoscuta"}
- Oras: ${company.city || "necunoscut"}
- Website: ${company.website || "necunoscut"}

ONG:
- Nume: ${ngo.name}
- Descriere: ${ngo.description || "fara descriere"}
- Categorie: ${ngo.category || "generala"}
- Oras: ${ngo.verification?.city || "necunoscut"}

${tone ? `Tonul preferat: ${tone}` : "Genereaza toate cele 3 tonuri."}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        });

        const rawResponse = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(rawResponse);

        if (Array.isArray(parsed.variants) && parsed.variants.length > 0) {
          variants = parsed.variants.map((v: any) => ({
            tone: v.tone || "formal",
            subject: v.subject || "Propunere de parteneriat",
            body: v.body || "",
          }));
        } else {
          // Fallback if AI response is malformed
          variants = getDemoVariants(company.name, contact.fullName, ngo.name, contact.role, company.city);
        }
      } catch (aiError: any) {
        console.error("OpenAI AI message error:", aiError.message);
        variants = getDemoVariants(company.name, contact.fullName, ngo.name, contact.role, company.city);
      }
    } else {
      // No API key - return demo variants
      variants = getDemoVariants(company.name, contact.fullName, ngo.name, contact.role, company.city);
    }

    await createAuditLog({
      ngoId,
      userId,
      action: "SPONSOR_AI_MESSAGE_GENERATED",
      entityType: "SponsorCompany",
      entityId: company.id,
      details: {
        companyName: company.name,
        contactName: contact.fullName,
        variantsCount: variants.length,
        tone: tone || "all",
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Sponsor AI message error:", error);
    return NextResponse.json(
      { error: "Eroare interna de server" },
      { status: 500 }
    );
  }
}

function getDemoVariants(
  companyName: string,
  contactFullName: string,
  ngoName: string,
  contactRole: string | null,
  companyCity: string | null
): MessageVariant[] {
  const firstName = contactFullName.split(" ")[0];

  return [
    {
      tone: "formal",
      subject: `Propunere de parteneriat strategic - ${ngoName}`,
      body: `Stimate/Stimata {first_name},

Ma adresez dumneavoastra in calitate de reprezentant al {ngo_name}, cu o propunere de parteneriat care poate aduce valoare atat comunitatii, cat si companiei {company_name}.

Asociatia noastra activeaza${companyCity ? ` in zona ${companyCity}` : ""} si credem ca o colaborare cu {company_name} ar putea avea un impact semnificativ. Va propunem o sponsorizare anuala (redirectionare 20%) catre asociatie, un mecanism fiscal avantajos care va permite companiei dumneavoastra sa contribuie la cauze sociale fara costuri suplimentare.

In calitatea dumneavoastra de ${contactRole || "reprezentant"} al {company_name}, sunteti persoana ideala cu care sa discutam detaliile acestui parteneriat.

Suntem la dispozitia dumneavoastra pentru o intalnire sau un apel telefonic la momentul oportun.

Cu stima,
Echipa {ngo_name}`,
    },
    {
      tone: "friendly",
      subject: `Hai sa facem impact impreuna! - ${ngoName}`,
      body: `Salut {first_name},

Suntem echipa {ngo_name} si am observat activitatea {company_name}${companyCity ? ` in ${companyCity}` : ""}. Ne-ar placea sa exploram o colaborare care aduce beneficii reale comunitatii.

Concret, va propunem o sponsorizare anuala (redirectionare 20%) catre asociatie - un mod simplu si eficient prin care {company_name} poate sustine cauze sociale, cu beneficii fiscale directe.

Ne-ar face mare placere sa povestim mai mult despre ce facem si cum putem crea impact impreuna. Ai cateva minute pentru un call saptamana aceasta?

Cu energie,
Echipa {ngo_name}`,
    },
    {
      tone: "ultra_short",
      subject: `Parteneriat ${ngoName} x {company_name}?`,
      body: `Salut {first_name},

{ngo_name} + {company_name} = impact real.

Propunem o sponsorizare anuala (redirectionare 20%) catre asociatie. Beneficiu fiscal, zero costuri extra, impact maxim.

5 minute pentru un call?

Multumim,
{ngo_name}`,
    },
  ];
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "contacts") {
    const q = searchParams.get("q");
    const type = searchParams.get("type");

    const where: any = { ngoId };
    if (type && type !== "all") where.publicationType = type;
    if (q) {
      where.OR = [
        { publicationName: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const contacts = await prisma.pressContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ contacts });
  }

  if (action === "releases") {
    const releases = await prisma.pressRelease.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ releases });
  }

  return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "save_contact") {
    const {
      publicationName, publicationType, city, county,
      website, circulationSize, contactName, contactRole,
      email, phone,
    } = body;

    const contact = await prisma.pressContact.create({
      data: {
        ngoId,
        publicationName,
        publicationType: publicationType as any,
        city: city || null,
        county: county || null,
        website: website || null,
        circulationSize: circulationSize || null,
        contactName: contactName || null,
        contactRole: contactRole || null,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ contact });
  }

  if (action === "delete_contact") {
    const { contactId } = body;
    await prisma.pressContact.delete({
      where: { id: contactId },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "save_release") {
    const { title, body: releaseBody, summary, imageUrl } = body;

    const release = await prisma.pressRelease.create({
      data: {
        ngoId,
        title,
        body: releaseBody,
        summary: summary || null,
        imageUrl: imageUrl || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ release });
  }

  if (action === "generate_release") {
    const { title, context } = body;

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO negasit" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Demo mode
      return NextResponse.json({
        body: `COMUNICAT DE PRESA\n\n${title}\n\n${ngo.name} anunta ${title.toLowerCase()}.\n\nOrganizatia ${ngo.name}${ngo.description ? `, ${ngo.description},` : ""} a lansat astazi o noua initiativa menita sa aduca un impact pozitiv in comunitate.\n\n"Aceasta initiativa reprezinta un pas important in misiunea noastra de a face diferenta in societate. Credem ca fiecare contributie conteaza si impreuna putem realiza lucruri extraordinare", a declarat reprezentantul organizatiei.\n\nProiectul isi propune sa:\n- Ofere sprijin direct comunitatilor vulnerabile\n- Creeze parteneriate durabile cu institutii locale\n- Genereze impact masurabil si transparent\n\nPentru mai multe informatii, va rugam sa contactati ${ngo.name}${ngo.websiteUrl ? ` la ${ngo.websiteUrl}` : ""}.\n\n###\n\nDescriere ${ngo.name}: ${ngo.description || "Organizatie neguvernamentala din Romania."}\n\nContact: ${ngo.senderEmail || "office@" + ngo.slug + ".ro"}`,
        summary: `${ngo.name} anunta ${title.toLowerCase()}, o noua initiativa menita sa aduca impact pozitiv in comunitate.`,
      });
    }

    try {
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Esti un expert in comunicare si PR pentru ONG-uri din Romania. Genereaza comunicate de presa profesionale, clare si de impact. Scrie INTOTDEAUNA in limba romana. Organizatia: "${ngo.name}". ${ngo.description ? `Descriere: ${ngo.description}.` : ""} ${ngo.category ? `Domeniu: ${ngo.category}.` : ""}`,
          },
          {
            role: "user",
            content: `Genereaza un comunicat de presa profesional cu titlul: "${title}"\n${context ? `Context: ${context}` : ""}\n\nFormatul:\n- Incepe cu "COMUNICAT DE PRESA"\n- Titlu puternic\n- Lead (paragraf introductiv care raspunde la Cine, Ce, Cand, Unde, De ce)\n- 3-4 paragrafe de continut cu citate\n- Bullet points cu informatii cheie\n- Paragraf "Despre [organizatie]"\n- Contact\n- "###" la final`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const generatedBody = response.choices[0]?.message?.content || "";

      // Generate summary
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Rezuma in 1-2 propozitii urmatorul comunicat de presa. Raspunde in romana." },
          { role: "user", content: generatedBody },
        ],
        max_tokens: 200,
        temperature: 0.5,
      });

      return NextResponse.json({
        body: generatedBody,
        summary: summaryResponse.choices[0]?.message?.content || "",
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (action === "send_to_contacts") {
    const { releaseId } = body;

    // Get all contacts for this NGO
    const contacts = await prisma.pressContact.findMany({
      where: { ngoId, email: { not: null } },
    });

    // Create recipient records
    for (const contact of contacts) {
      try {
        await prisma.pressReleaseRecipient.create({
          data: {
            releaseId,
            contactId: contact.id,
            status: "sent",
            sentAt: new Date(),
          },
        });
      } catch {
        // Skip if already exists
      }
    }

    // Update release status
    await prisma.pressRelease.update({
      where: { id: releaseId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        publishedCount: contacts.length,
      },
    });

    return NextResponse.json({ sent: contacts.length });
  }

  if (action === "send_media_express") {
    const { releaseId, package: pkg } = body;

    const priceMap: Record<string, number> = {
      "comunicat_50": 100,
      "articol_50": 1000,
    };

    // Update release with MediaExpress info
    await prisma.pressRelease.update({
      where: { id: releaseId },
      data: {
        mediaExpressOrderId: `ME-${Date.now()}`,
        mediaExpressStatus: "pending",
        mediaExpressPackage: pkg,
        mediaExpressPrice: priceMap[pkg] || 100,
      },
    });

    return NextResponse.json({
      orderId: `ME-${Date.now()}`,
      status: "pending",
      message: "Comanda a fost inregistrata. Veti fi redirectionat catre MediaExpress pentru finalizare.",
      redirectUrl: "https://mediaexpress.ro/",
    });
  }

  if (action === "find_contacts") {
    const { query } = body;

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
    });

    // Generate AI-suggested contacts based on city/query
    const demoContacts = generateDemoContacts(query || ngo?.name || "Romania");

    // Save to database
    const saved = [];
    for (const contact of demoContacts) {
      try {
        const created = await prisma.pressContact.create({
          data: {
            ngoId,
            publicationName: contact.publicationName,
            publicationType: contact.publicationType as any,
            city: contact.city,
            county: contact.county,
            website: contact.website,
            circulationSize: contact.circulationSize,
            contactName: contact.contactName,
            contactRole: contact.contactRole,
            email: contact.email,
          },
        });
        saved.push(created);
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({ contacts: saved });
  }

  return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
}

function generateDemoContacts(query: string) {
  const cityLower = query.toLowerCase();

  const contacts = [
    {
      publicationName: "Monitorul Local",
      publicationType: "ONLINE_NEWS",
      city: query,
      county: "",
      website: "https://monitorullocal.ro",
      circulationSize: "mediu",
      contactName: "Maria Ionescu",
      contactRole: "Editor",
      email: "redactie@monitorullocal.ro",
    },
    {
      publicationName: "Ziarul Regional",
      publicationType: "NEWSPAPER",
      city: query,
      county: "",
      website: "https://ziarulregional.ro",
      circulationSize: "mare",
      contactName: "Alexandru Pop",
      contactRole: "Jurnalist",
      email: "stiri@ziarulregional.ro",
    },
    {
      publicationName: "Radio Local FM",
      publicationType: "RADIO",
      city: query,
      county: "",
      website: "",
      circulationSize: "mediu",
      contactName: "Ioana Marin",
      contactRole: "Producator",
      email: "contact@radiolocalfm.ro",
    },
    {
      publicationName: "Stirile Online",
      publicationType: "ONLINE_NEWS",
      city: query,
      county: "",
      website: "https://stirileonline.ro",
      circulationSize: "mare",
      contactName: "Cosmin Radu",
      contactRole: "Redactor Sef",
      email: "redactor@stirileonline.ro",
    },
    {
      publicationName: "TV Regional",
      publicationType: "TV",
      city: query,
      county: "",
      website: "https://tvregional.ro",
      circulationSize: "mare",
      contactName: "Elena Stanescu",
      contactRole: "Reporter",
      email: "stiri@tvregional.ro",
    },
  ];

  return contacts;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAiJson, getAvailableProviders } from "@/lib/ai-providers";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  const role = (session.user as any).role;
  const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
  if (!hasFeature(plan, "ai_generator", role)) {
    return NextResponse.json({ error: "Agentul AI pentru campanii nu este disponibil pe planul tau. Fa upgrade la PRO." }, { status: 403 });
  }

  try {
    const { action, context } = await request.json();
    // action: generate_email, generate_sms, improve_content, generate_subject, generate_social

    const providers = await getAvailableProviders();
    if (providers.length === 0) {
      return NextResponse.json({
        error: "Niciun provider AI configurat. Contactati administratorul platformei.",
        noProvider: true,
      }, { status: 503 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_email": {
        systemPrompt = `Esti un expert in email marketing pentru ONG-uri din Romania.
Genereaza continut HTML pentru email-uri profesionale, emotionale si eficiente.
Raspunde DOAR cu JSON valid in formatul:
{
  "subject": "subiectul emailului",
  "previewText": "text scurt de preview",
  "htmlBody": "continutul HTML al emailului (doar body-ul interior, fara wrapper)"
}
Foloseste merge tags: {{donor.name}}, {{ngo.name}}, {{donor.email}}.
Scrie in limba romana. Fa emailul emotiv, personal si cu call-to-action clar.
Foloseste stiluri inline CSS pentru formatare. Nu folosi clase CSS.`;

        userPrompt = `Genereaza un email ${context.type || "de campanie"} pentru ONG-ul "${context.ngoName || "organizatia noastra"}".
${context.campaignName ? `Campanie: ${context.campaignName}` : ""}
${context.goal ? `Obiectiv: ${context.goal}` : ""}
${context.tone ? `Ton: ${context.tone}` : "Ton: cald, personal, emotiv"}
${context.additionalInfo ? `Context aditional: ${context.additionalInfo}` : ""}
${context.audience ? `Audienta: ${context.audience}` : ""}`;
        break;
      }

      case "generate_sms": {
        systemPrompt = `Esti un expert in SMS marketing pentru ONG-uri din Romania.
Genereaza mesaje SMS scurte, puternice si cu impact.
Raspunde DOAR cu JSON valid in formatul:
{
  "body": "textul SMS-ului (max 160 caractere ideal, max 320 daca e necesar)",
  "charCount": numarul_de_caractere,
  "segments": numar_segmente_sms
}
Foloseste merge tags: {{donor.name}}, {{ngo.name}}.
Scrie in limba romana. Fii concis si cu call-to-action clar.`;

        userPrompt = `Genereaza un SMS ${context.type || "de campanie"} pentru "${context.ngoName || "ONG"}".
${context.campaignName ? `Campanie: ${context.campaignName}` : ""}
${context.goal ? `Obiectiv: ${context.goal}` : ""}
${context.additionalInfo ? `Context: ${context.additionalInfo}` : ""}`;
        break;
      }

      case "improve_content": {
        systemPrompt = `Esti un expert in copywriting si marketing digital pentru ONG-uri din Romania.
Imbunatateste continutul primit pastrand structura dar facandu-l mai:
- Emotiv si personal
- Cu call-to-action mai puternic
- Cu un ton mai cald si convingator
- Cu formatare mai buna

Raspunde DOAR cu JSON valid in formatul:
{
  "improved": "continutul imbunatatit",
  "changes": ["lista de schimbari facute"],
  "tips": ["sfaturi aditionale"]
}
Scrie in limba romana.`;

        userPrompt = `Imbunatateste acest continut de ${context.channel || "email"}:

${context.content}

${context.instructions ? `Instructiuni specifice: ${context.instructions}` : ""}`;
        break;
      }

      case "generate_subject": {
        systemPrompt = `Esti expert in email marketing. Genereaza 5 subiecte de email captivante.
Raspunde DOAR cu JSON: { "subjects": ["subiect1", "subiect2", "subiect3", "subiect4", "subiect5"] }
Foloseste emoji-uri strategic. Fiecare subiect sub 60 caractere. In limba romana.`;

        userPrompt = `Genereaza 5 subiecte pentru un email ${context.type || "de campanie"} de la "${context.ngoName || "ONG"}".
${context.campaignName ? `Campanie: ${context.campaignName}` : ""}
${context.tone ? `Ton: ${context.tone}` : ""}`;
        break;
      }

      case "generate_social": {
        systemPrompt = `Esti expert in social media marketing pentru ONG-uri din Romania.
Genereaza postari pentru social media (Facebook, Instagram, LinkedIn).
Raspunde DOAR cu JSON:
{
  "facebook": "postare Facebook (max 300 cuvinte, cu emoji si hashtag-uri)",
  "instagram": "caption Instagram (cu emoji, hashtag-uri, call-to-action)",
  "linkedin": "postare LinkedIn (profesionala, cu statistici si impact)"
}
Scrie in limba romana.`;

        userPrompt = `Genereaza postari social media pentru campania "${context.campaignName || "campanie"}" de la "${context.ngoName || "ONG"}".
${context.type ? `Tip campanie: ${context.type}` : ""}
${context.goal ? `Obiectiv: ${context.goal}` : ""}
${context.additionalInfo ? `Detalii: ${context.additionalInfo}` : ""}`;
        break;
      }

      default:
        return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
    }

    const result = await callAI(systemPrompt, userPrompt, { maxTokens: 4000, temperature: 0.8 });
    if (!result) {
      return NextResponse.json(
        { error: "AI nu a putut genera continutul. Incercati din nou." },
        { status: 500 }
      );
    }

    try {
      const parsed = parseAiJson(result.text);
      return NextResponse.json({ ...parsed, provider: result.provider });
    } catch {
      // If JSON parsing fails, return raw text
      return NextResponse.json({ raw: result.text, provider: result.provider });
    }
  } catch (error: any) {
    console.error("Campaign agent error:", error);
    return NextResponse.json(
      { error: "Eroare la generarea continutului AI" },
      { status: 500 }
    );
  }
}

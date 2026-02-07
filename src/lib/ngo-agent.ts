/**
 * Super Agent AI pentru ONG-uri
 * Foloseste OpenAI, Gemini si Claude pentru functii inteligente
 */

import { callLLMWithFallback, LLMProvider, LLMResponse } from "./llm-providers";

// ─── Agent Types ─────────────────────────────────────────────────

export type AgentCapability =
  | "campaign_generator"
  | "donor_analyzer"
  | "fundraising_advisor"
  | "email_writer"
  | "sms_writer"
  | "donor_segmentation"
  | "performance_insights"
  | "content_translator"
  | "donor_retention"
  | "ngo_verifier"
  | "report_generator"
  | "chatbot";

export interface AgentRequest {
  capability: AgentCapability;
  context: Record<string, any>;
  language?: "ro" | "en";
  provider?: LLMProvider;
}

export interface AgentResponse {
  result: any;
  explanation: string;
  suggestions?: string[];
  confidence?: number;
  provider: LLMProvider;
  model: string;
}

// ─── System Prompts ──────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `Esti un Super Agent AI specializat in ajutarea ONG-urilor din Romania.
Numele tau este "NGO HUB AI Assistant".
Raspunzi INTOTDEAUNA in limba romana.
Esti expert in:
- Marketing si comunicare pentru ONG-uri
- Strangere de fonduri si retentie donatori
- Legislatia romaneasca privind ONG-urile
- GDPR si protectia datelor
- Strategii de campanii si automatizari
- Analiza si segmentare donatori

Raspunde concis, actionabil si profesional. Ofera sfaturi practice, nu teoretice.`;

// ─── Capability Handlers ─────────────────────────────────────────

async function handleCampaignGenerator(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { campaignType, ngoName, targetAudience, goal, tone } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nEsti un expert in crearea campaniilor de email si SMS pentru ONG-uri. Genereaza continut complet pentru campanii.`,
      },
      {
        role: "user",
        content: `Genereaza o campanie completa pentru ONG-ul "${ngoName || "ONG"}".

Tip campanie: ${campaignType || "strangere de fonduri"}
Audienta: ${targetAudience || "toti donatorii"}
Obiectiv: ${goal || "cresterea donatiilor"}
Ton: ${tone || "cald si empatic"}

Genereaza in format JSON:
{
  "name": "Numele campaniei",
  "subject": "Subiect email",
  "previewText": "Text previzualizare",
  "emailBody": "HTML complet al emailului cu inline styles",
  "smsVersion": "Varianta SMS sub 160 caractere",
  "suggestedSegment": "Segmentul recomandat",
  "bestSendTime": "Momentul optim de trimitere",
  "tips": ["sfat1", "sfat2", "sfat3"]
}`,
      },
    ],
    { provider, temperature: 0.8 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Campanie generata cu succes folosind AI.",
    suggestions: result.tips || [],
    confidence: 85,
    provider: response.provider,
    model: response.model,
  };
}

async function handleDonorAnalyzer(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { donors, totalDonations, avgDonation, topDonors, retentionRate } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nAnalizezi datele donatorilor si oferi perspective valoroase.`,
      },
      {
        role: "user",
        content: `Analizeaza datele donatorilor ONG-ului:

Total donatori: ${donors || 0}
Total donatii: ${totalDonations || 0} RON
Donatie medie: ${avgDonation || 0} RON
Top donatori: ${JSON.stringify(topDonors || [])}
Rata retentie: ${retentionRate || "necunoscuta"}

Ofera:
1. Analiza generala a bazei de donatori
2. Segmente identificate (VIP, regulari, la risc, noi)
3. Recomandari concrete de actiune pentru fiecare segment
4. Strategii de crestere a donatiei medii
5. Predicta de churn (donatori la risc de pierdere)

Raspunde in format JSON:
{
  "analysis": "Analiza generala",
  "segments": [{"name": "...", "count": "...", "action": "..."}],
  "recommendations": ["..."],
  "riskDonors": "Descriere donatori la risc",
  "growthStrategy": "Strategie de crestere",
  "predictedChurn": "Rata estimata de pierdere"
}`,
      },
    ],
    { provider, temperature: 0.6 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Analiza donatorilor finalizata.",
    suggestions: result.recommendations || [],
    confidence: 80,
    provider: response.provider,
    model: response.model,
  };
}

async function handleFundraisingAdvisor(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { ngoName, ngoType, currentRevenue, donorCount, campaigns, goals } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nEsti un consultant expert in strangere de fonduri pentru ONG-uri romanesti.`,
      },
      {
        role: "user",
        content: `Ofera consultanta de fundraising pentru:

ONG: ${ngoName || "ONG"}
Tip activitate: ${ngoType || "general"}
Venituri curente: ${currentRevenue || 0} RON/luna
Numar donatori: ${donorCount || 0}
Campanii active: ${campaigns || 0}
Obiective: ${goals || "cresterea veniturilor"}

Vreau:
1. Strategie de fundraising pe 3 luni
2. Idei de campanii lunare
3. Canale de comunicare recomandate
4. Tehnici de retentie donatori
5. Oportunnitati de grant-uri si sponsorizari
6. Calendar de actiuni

Raspunde in format JSON:
{
  "strategy": "Strategia generala pe 3 luni",
  "monthlyPlan": [
    {"month": 1, "campaign": "...", "target": "...", "actions": ["..."]},
    {"month": 2, "campaign": "...", "target": "...", "actions": ["..."]},
    {"month": 3, "campaign": "...", "target": "...", "actions": ["..."]}
  ],
  "channels": ["..."],
  "retentionTips": ["..."],
  "grantOpportunities": ["..."],
  "kpis": ["..."]
}`,
      },
    ],
    { provider, temperature: 0.7 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Plan de fundraising generat cu succes.",
    suggestions: result.retentionTips || [],
    confidence: 82,
    provider: response.provider,
    model: response.model,
  };
}

async function handleEmailWriter(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { purpose, ngoName, donorName, tone, details } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nScrii emailuri perfecte pentru ONG-uri. Emailurile trebuie sa fie personale, emotionale si cu call-to-action clar. Foloseste HTML cu inline styles.`,
      },
      {
        role: "user",
        content: `Scrie un email pentru ONG-ul "${ngoName || "ONG"}".

Scop: ${purpose || "multumire"}
Destinatar: ${donorName || "Donator"}
Ton: ${tone || "cald"}
Detalii: ${details || ""}

Genereaza in format JSON:
{
  "subject": "Subiectul emailului",
  "previewText": "Text de previzualizare",
  "body": "HTML complet al emailului cu inline styles, header, continut, buton CTA si footer",
  "variants": [
    {"subject": "Varianta alternativa subiect 1", "preview": "..."},
    {"subject": "Varianta alternativa subiect 2", "preview": "..."}
  ]
}`,
      },
    ],
    { provider, temperature: 0.8 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Email generat cu succes.",
    provider: response.provider,
    model: response.model,
  };
}

async function handleSmsWriter(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { purpose, ngoName, tone, details } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nScrii mesaje SMS scurte si eficiente pentru ONG-uri. Fiecare mesaj TREBUIE sa fie sub 160 caractere.`,
      },
      {
        role: "user",
        content: `Scrie mesaje SMS pentru ONG-ul "${ngoName || "ONG"}".

Scop: ${purpose || "notificare"}
Ton: ${tone || "prietenos"}
Detalii: ${details || ""}

Genereaza 5 variante in format JSON:
{
  "messages": [
    {"text": "Mesaj SMS sub 160 caractere", "chars": 120},
    ...
  ],
  "bestTime": "Momentul optim de trimitere",
  "tip": "Sfat pentru eficienta maxima"
}`,
      },
    ],
    { provider, temperature: 0.8 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Mesaje SMS generate cu succes.",
    provider: response.provider,
    model: response.model,
  };
}

async function handleDonorSegmentation(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { donors } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nEsti expert in segmentare RFM (Recency, Frequency, Monetary) pentru donatori.`,
      },
      {
        role: "user",
        content: `Analizeaza si segmenteaza acesti donatori:

${JSON.stringify(donors || [], null, 2)}

Creeaza segmente bazate pe:
- Recenta ultimei donatii
- Frecventa donatiilor
- Valoarea totala donata

Raspunde in format JSON:
{
  "segments": [
    {
      "name": "Numele segmentului",
      "criteria": "Criteriile de includere",
      "donorIds": ["id1", "id2"],
      "count": 5,
      "strategy": "Strategia recomandata pentru acest segment",
      "campaignIdea": "Idee de campanie targetata"
    }
  ],
  "insights": ["Perspectiva 1", "Perspectiva 2"],
  "immediateActions": ["Actiune urgenta 1", "Actiune urgenta 2"]
}`,
      },
    ],
    { provider, temperature: 0.5 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Segmentare donatori finalizata.",
    suggestions: result.immediateActions || [],
    confidence: 78,
    provider: response.provider,
    model: response.model,
  };
}

async function handlePerformanceInsights(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { campaigns, openRate, clickRate, bounceRate, revenue } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nAnalizezi performanta campaniilor si oferi recomandari de imbunatatire.`,
      },
      {
        role: "user",
        content: `Analizeaza performanta campaniilor:

Campanii trimise: ${campaigns || 0}
Rata deschidere: ${openRate || 0}%
Rata click: ${clickRate || 0}%
Rata bounce: ${bounceRate || 0}%
Venituri generate: ${revenue || 0} RON

Compara cu benchmark-urile din industrie si ofera:
1. Scor general de performanta
2. Ce merge bine si ce trebuie imbunatatit
3. Recomandari concrete
4. A/B testing suggestions
5. Optimizari de timing

Raspunde in format JSON:
{
  "score": 75,
  "grade": "B+",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "abTestIdeas": ["..."],
  "timingTips": ["..."],
  "benchmarkComparison": {
    "openRate": {"yours": 25, "industry": 21, "verdict": "Peste medie"},
    "clickRate": {"yours": 3, "industry": 2.5, "verdict": "Peste medie"}
  }
}`,
      },
    ],
    { provider, temperature: 0.5 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Analiza performantei finalizata.",
    suggestions: result.recommendations || [],
    confidence: result.score || 75,
    provider: response.provider,
    model: response.model,
  };
}

async function handleContentTranslator(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { content, targetLang, preserveHtml } = context;

  const htmlInstr = preserveHtml
    ? "Pastreaza EXACT formatarea HTML si inline styles."
    : "";

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `Esti un traducator profesionist. Traduci text cu acuratete pastrand tonul si intentia originala. ${htmlInstr}`,
      },
      {
        role: "user",
        content: `Traduceti urmatorul text in ${targetLang === "ro" ? "romana" : "engleza"}:\n\n${content}`,
      },
    ],
    { provider, temperature: 0.3 }
  );

  return {
    result: { translatedContent: response.content },
    explanation: `Continut tradus in ${targetLang === "ro" ? "romana" : "engleza"}.`,
    provider: response.provider,
    model: response.model,
  };
}

async function handleDonorRetention(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { atRiskDonors, lastCampaigns, avgTimeBetweenDonations } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nEsti expert in retentia donatorilor. Creezi strategii personalizate de re-engagement.`,
      },
      {
        role: "user",
        content: `Creeaza strategii de retentie pentru donatorii la risc:

Donatori la risc: ${JSON.stringify(atRiskDonors || [])}
Ultimele campanii: ${JSON.stringify(lastCampaigns || [])}
Timp mediu intre donatii: ${avgTimeBetweenDonations || "necunoscut"}

Genereaza:
1. Plan de re-engagement personalizat
2. Secventa de emailuri (3-5 emailuri)
3. Mesaje SMS de follow-up
4. Oferte speciale / incentive

Format JSON:
{
  "plan": "Strategia generala",
  "emailSequence": [
    {"day": 1, "subject": "...", "preview": "...", "type": "empathy"},
    {"day": 7, "subject": "...", "preview": "...", "type": "impact"},
    {"day": 14, "subject": "...", "preview": "...", "type": "urgency"}
  ],
  "smsMessages": ["..."],
  "incentives": ["..."],
  "expectedRecoveryRate": "15-25%"
}`,
      },
    ],
    { provider, temperature: 0.7 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Plan de retentie generat cu succes.",
    suggestions: result.incentives || [],
    confidence: 80,
    provider: response.provider,
    model: response.model,
  };
}

async function handleNgoVerifier(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { registrationNumber, organizationName, legalForm, fiscalCode, address } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `Esti un expert in legislatia romaneasca privind ONG-urile (asociatii, fundatii, federatii).
Analizezi datele de inregistrare si identifici potential de frauda sau inconsistente.
Cunosti:
- Formatele CUI/CIF romanesti
- Tipurile de forme juridice (Asociatie, Fundatie, Federatie)
- Registrul National ONG
- Cerintele legale de inregistrare`,
      },
      {
        role: "user",
        content: `Verifica legitimitatea acestui ONG:

Nume: ${organizationName || "necunoscut"}
Numar inregistrare (CUI): ${registrationNumber || "necunoscut"}
Forma juridica: ${legalForm || "necunoscut"}
Cod fiscal: ${fiscalCode || "necunoscut"}
Adresa: ${address || "necunoscuta"}

Analizeaza:
1. Consistenta numelui cu forma juridica
2. Formatul CUI/CIF (valid in Romania?)
3. Completitudinea datelor
4. Red flags potentiale
5. Scor de incredere (0-100)

Format JSON:
{
  "score": 75,
  "status": "NEEDS_REVIEW",
  "analysis": {
    "nameCheck": {"valid": true, "note": "..."},
    "cuiCheck": {"valid": true, "note": "..."},
    "legalFormCheck": {"valid": true, "note": "..."},
    "completeness": {"score": 80, "missing": ["..."]}
  },
  "flags": [
    {"severity": "warning", "message": "..."}
  ],
  "recommendation": "Aprobat / Necesita verificare manuala / Respins",
  "nextSteps": ["..."]
}`,
      },
    ],
    { provider, temperature: 0.3 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Verificare AI finalizata.",
    confidence: result.score || 50,
    provider: response.provider,
    model: response.model,
  };
}

async function handleReportGenerator(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { ngoName, period, stats } = context;

  const response = await callLLMWithFallback(
    [
      {
        role: "system",
        content: `${AGENT_SYSTEM_PROMPT}\n\nGenerezi rapoarte profesionale de activitate pentru ONG-uri in format HTML.`,
      },
      {
        role: "user",
        content: `Genereaza un raport de activitate pentru ONG-ul "${ngoName || "ONG"}".

Perioada: ${period || "ultima luna"}
Statistici: ${JSON.stringify(stats || {})}

Genereaza raportul in HTML cu sectiuni:
1. Rezumat executiv
2. Donatori si donatii
3. Campanii si comunicare
4. Obiective si realizari
5. Recomandari pentru perioada urmatoare

Format JSON:
{
  "title": "Titlul raportului",
  "htmlContent": "HTML complet al raportului",
  "keyMetrics": [{"label": "...", "value": "...", "trend": "up/down/stable"}],
  "executiveSummary": "Rezumat in 2-3 propozitii"
}`,
      },
    ],
    { provider, temperature: 0.6 }
  );

  let result;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    result = { raw: response.content };
  }

  return {
    result,
    explanation: "Raport generat cu succes.",
    provider: response.provider,
    model: response.model,
  };
}

async function handleChatbot(
  context: Record<string, any>,
  provider?: LLMProvider
): Promise<AgentResponse> {
  const { message, conversationHistory, ngoContext } = context;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: `${AGENT_SYSTEM_PROMPT}

Context ONG: ${JSON.stringify(ngoContext || {})}

Raspunzi la intrebari despre:
- Cum sa foloseasca platforma NGO HUB
- Strategii de fundraising
- GDPR si protectia datelor
- Campanii email/SMS
- Automatizari
- Best practices pentru ONG-uri
- Legislatie romaneasca ONG

Fii concis, prietenos si actionabil.`,
    },
  ];

  if (conversationHistory) {
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  messages.push({ role: "user", content: message });

  const response = await callLLMWithFallback(messages, {
    provider,
    temperature: 0.7,
  });

  return {
    result: { reply: response.content },
    explanation: "Raspuns generat.",
    provider: response.provider,
    model: response.model,
  };
}

// ─── Main Agent Entry Point ──────────────────────────────────────

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const { capability, context, provider } = request;

  switch (capability) {
    case "campaign_generator":
      return handleCampaignGenerator(context, provider);
    case "donor_analyzer":
      return handleDonorAnalyzer(context, provider);
    case "fundraising_advisor":
      return handleFundraisingAdvisor(context, provider);
    case "email_writer":
      return handleEmailWriter(context, provider);
    case "sms_writer":
      return handleSmsWriter(context, provider);
    case "donor_segmentation":
      return handleDonorSegmentation(context, provider);
    case "performance_insights":
      return handlePerformanceInsights(context, provider);
    case "content_translator":
      return handleContentTranslator(context, provider);
    case "donor_retention":
      return handleDonorRetention(context, provider);
    case "ngo_verifier":
      return handleNgoVerifier(context, provider);
    case "report_generator":
      return handleReportGenerator(context, provider);
    case "chatbot":
      return handleChatbot(context, provider);
    default:
      throw new Error(`Capabilitate necunoscuta: ${capability}`);
  }
}

import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
  });
}

interface AiGenerateParams {
  type: "subject" | "email_body" | "sms_copy";
  campaignType: string;
  tone: "formal" | "emotional" | "urgent";
  language: "ro" | "en";
  context?: string;
  ngoName?: string;
}

const TONE_MAP = {
  formal: "professional and respectful",
  emotional: "warm, heartfelt, and emotionally engaging",
  urgent: "urgent, compelling, and action-oriented",
};

export async function generateCampaignContent(params: AiGenerateParams): Promise<{ content: string; error?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { content: "", error: "OpenAI API key not configured" };
  }

  const languageInstr = params.language === "ro"
    ? "Write the content in Romanian."
    : "Write the content in English.";

  const ngoContext = params.ngoName
    ? `The NGO is called "${params.ngoName}".`
    : "";

  const additionalContext = params.context
    ? `Additional context: ${params.context}`
    : "";

  let systemPrompt: string;
  let userPrompt: string;

  switch (params.type) {
    case "subject":
      systemPrompt = "You are an expert email marketer for nonprofit organizations. Generate compelling email subject lines.";
      userPrompt = `Generate 5 email subject lines for a ${params.campaignType.replace(/_/g, " ").toLowerCase()} campaign. Tone: ${TONE_MAP[params.tone]}. ${ngoContext} ${additionalContext} ${languageInstr}\n\nReturn only the subject lines, one per line, numbered 1-5.`;
      break;

    case "email_body":
      systemPrompt = "You are an expert nonprofit copywriter. Generate compelling email content in HTML format suitable for email clients.";
      userPrompt = `Write an email body for a ${params.campaignType.replace(/_/g, " ").toLowerCase()} campaign. Tone: ${TONE_MAP[params.tone]}. ${ngoContext} ${additionalContext} ${languageInstr}\n\nUse simple HTML with inline styles. Include a clear call-to-action button. Keep it concise but impactful.`;
      break;

    case "sms_copy":
      systemPrompt = "You are an expert at writing SMS messages for nonprofit organizations. Messages must be under 160 characters.";
      userPrompt = `Write 3 SMS message variants for a ${params.campaignType.replace(/_/g, " ").toLowerCase()} campaign. Tone: ${TONE_MAP[params.tone]}. ${ngoContext} ${additionalContext} ${languageInstr}\n\nEach message must be under 160 characters. Number them 1-3.`;
      break;
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    return { content: response.choices[0]?.message?.content || "" };
  } catch (error: any) {
    console.error("OpenAI error:", error.message);
    return { content: "", error: error.message };
  }
}

export async function optimizeContent(content: string, type: "subject" | "body", language: "ro" | "en"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return content;

  const langInstr = language === "ro" ? "in Romanian" : "in English";

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert nonprofit copywriter. Optimize the given ${type} ${langInstr} for better engagement. Return only the optimized text.`,
        },
        { role: "user", content },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || content;
  } catch {
    return content;
  }
}

export async function translateContent(content: string, targetLang: "ro" | "en"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return content;

  const target = targetLang === "ro" ? "Romanian" : "English";

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Translate the following text to ${target}. Preserve any HTML formatting. Return only the translated text.`,
        },
        { role: "user", content },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || content;
  } catch {
    return content;
  }
}

/**
 * Multi-LLM Provider System
 * Supports OpenAI, Google Gemini, and Anthropic Claude
 * Provides a unified interface for all AI operations
 */

// ─── Types ───────────────────────────────────────────────────────

export type LLMProvider = "openai" | "gemini" | "claude";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensUsed?: number;
}

// ─── Default Models ──────────────────────────────────────────────

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  claude: "claude-sonnet-4-5-20250929",
};

// ─── Provider Availability ───────────────────────────────────────

export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  return providers;
}

export function getBestProvider(): LLMProvider | null {
  // Priority: Claude > OpenAI > Gemini
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

// ─── OpenAI Provider ─────────────────────────────────────────────

async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: config.model || DEFAULT_MODELS.openai,
    messages: messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    max_tokens: config.maxTokens || 4000,
    temperature: config.temperature ?? 0.7,
  });

  return {
    content: response.choices[0]?.message?.content || "",
    provider: "openai",
    model: config.model || DEFAULT_MODELS.openai,
    tokensUsed: response.usage?.total_tokens,
  };
}

// ─── Gemini Provider ─────────────────────────────────────────────

async function callGemini(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = config.model || DEFAULT_MODELS.gemini;

  // Build Gemini API request
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const contents = conversationMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens || 4000,
    },
  };

  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    content: text,
    provider: "gemini",
    model,
    tokensUsed: data.usageMetadata?.totalTokenCount,
  };
}

// ─── Claude Provider ─────────────────────────────────────────────

async function callClaude(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = config.model || DEFAULT_MODELS.claude;

  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const body: any = {
    model,
    max_tokens: config.maxTokens || 4000,
    temperature: config.temperature ?? 0.7,
    messages: conversationMessages,
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const text =
    data.content?.[0]?.text || "";

  return {
    content: text,
    provider: "claude",
    model,
    tokensUsed:
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

// ─── Unified Call ────────────────────────────────────────────────

export async function callLLM(
  messages: LLMMessage[],
  config?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const provider = config?.provider || getBestProvider();

  if (!provider) {
    throw new Error(
      "Niciun provider AI configurat. Adaugati OPENAI_API_KEY, GEMINI_API_KEY sau ANTHROPIC_API_KEY."
    );
  }

  const fullConfig: LLMConfig = {
    provider,
    model: config?.model,
    temperature: config?.temperature,
    maxTokens: config?.maxTokens,
  };

  switch (provider) {
    case "openai":
      return callOpenAI(messages, fullConfig);
    case "gemini":
      return callGemini(messages, fullConfig);
    case "claude":
      return callClaude(messages, fullConfig);
    default:
      throw new Error(`Provider necunoscut: ${provider}`);
  }
}

// ─── Fallback Call (tries multiple providers) ────────────────────

export async function callLLMWithFallback(
  messages: LLMMessage[],
  config?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error("Niciun provider AI disponibil.");
  }

  // Try preferred provider first, then fallback
  const preferred = config?.provider;
  const ordered = preferred
    ? [preferred, ...providers.filter((p) => p !== preferred)]
    : providers;

  let lastError: Error | null = null;

  for (const provider of ordered) {
    try {
      return await callLLM(messages, { ...config, provider });
    } catch (err: any) {
      lastError = err;
      console.error(`Provider ${provider} a esuat:`, err.message);
    }
  }

  throw lastError || new Error("Toti providerii AI au esuat.");
}

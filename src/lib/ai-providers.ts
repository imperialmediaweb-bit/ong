/**
 * Multi-AI Provider Support
 * Supports: OpenAI, Claude (Anthropic), Gemini (Google)
 * Reads API keys from: 1) PlatformSettings DB  2) Environment variables (fallback)
 */

import prisma from "@/lib/db";

interface AiResponse {
  text: string;
  provider: string;
}

// Cache keys for 5 minutes to avoid DB hits on every AI call
let cachedKeys: { openai?: string; anthropic?: string; google?: string } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getApiKeys() {
  const now = Date.now();
  if (cachedKeys && now - cacheTimestamp < CACHE_TTL) {
    return cachedKeys;
  }

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        googleAiApiKey: true,
      },
    });

    cachedKeys = {
      openai: settings?.openaiApiKey || process.env.OPENAI_API_KEY || undefined,
      anthropic: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || undefined,
      google: settings?.googleAiApiKey || process.env.GOOGLE_AI_API_KEY || undefined,
    };
  } catch {
    // If DB fails, fall back to env vars
    cachedKeys = {
      openai: process.env.OPENAI_API_KEY || undefined,
      anthropic: process.env.ANTHROPIC_API_KEY || undefined,
      google: process.env.GOOGLE_AI_API_KEY || undefined,
    };
  }

  cacheTimestamp = now;
  return cachedKeys;
}

// Force cache refresh (call after saving new keys)
export function invalidateApiKeysCache() {
  cachedKeys = null;
  cacheTimestamp = 0;
}

async function callOpenAI(systemMsg: string, userMsg: string, options?: { temperature?: number; maxTokens?: number }): Promise<AiResponse | null> {
  const keys = await getApiKeys();
  if (!keys.openai) return null;
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: keys.openai });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      temperature: options?.temperature ?? 0.9,
      max_tokens: options?.maxTokens ?? 3000,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;
    return { text, provider: "openai" };
  } catch (err) {
    console.error("OpenAI error:", err);
    return null;
  }
}

async function callClaude(systemMsg: string, userMsg: string, options?: { temperature?: number; maxTokens?: number }): Promise<AiResponse | null> {
  const keys = await getApiKeys();
  if (!keys.anthropic) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": keys.anthropic,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: options?.maxTokens ?? 3000,
        system: systemMsg,
        messages: [
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`Claude API error (${res.status}):`, errBody);
      return null;
    }
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) return null;
    return { text, provider: "claude" };
  } catch (err) {
    console.error("Claude error:", err);
    return null;
  }
}

async function callGemini(systemMsg: string, userMsg: string, options?: { temperature?: number; maxTokens?: number }): Promise<AiResponse | null> {
  const keys = await getApiKeys();
  if (!keys.google) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.google}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemMsg}\n\n${userMsg}` }] },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.9,
          maxOutputTokens: options?.maxTokens ?? 3000,
        },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`Gemini API error (${res.status}):`, errBody);
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    return { text, provider: "gemini" };
  } catch (err) {
    console.error("Gemini error:", err);
    return null;
  }
}

/**
 * Call AI with fallback between providers
 */
export async function callAI(
  systemMsg: string,
  userMsg: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    preferredProvider?: "openai" | "claude" | "gemini";
  }
): Promise<AiResponse | null> {
  const providers = [
    { name: "openai" as const, fn: callOpenAI },
    { name: "claude" as const, fn: callClaude },
    { name: "gemini" as const, fn: callGemini },
  ];

  if (options?.preferredProvider) {
    const preferred = providers.find(p => p.name === options.preferredProvider);
    if (preferred) {
      const others = providers.filter(p => p.name !== options.preferredProvider);
      providers.length = 0;
      providers.push(preferred, ...others);
    }
  }

  for (const provider of providers) {
    const result = await provider.fn(systemMsg, userMsg, options);
    if (result) return result;
  }

  return null;
}

/**
 * Parse JSON from AI response
 */
export function parseAiJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch { /* continue */ }
    }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    throw new Error("Could not parse JSON from AI response");
  }
}

/**
 * Get available providers
 */
export async function getAvailableProviders(): Promise<string[]> {
  const keys = await getApiKeys();
  const providers: string[] = [];
  if (keys.openai) providers.push("openai");
  if (keys.anthropic) providers.push("claude");
  if (keys.google) providers.push("gemini");
  return providers;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { invalidateApiKeysCache } from "@/lib/ai-providers";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  // Force cache refresh before testing
  invalidateApiKeysCache();

  let settings;
  try {
    settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        googleAiApiKey: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Nu s-au putut citi cheile din baza de date: " + (err.message || "eroare necunoscuta"),
    }, { status: 500 });
  }

  const results: Record<string, { status: string; error?: string; model?: string }> = {};

  // Test OpenAI
  if (settings?.openaiApiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: settings.openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Spune doar: OK" }],
        max_tokens: 10,
      });
      const text = completion.choices[0]?.message?.content?.trim();
      results.openai = { status: "ok", model: "gpt-4o-mini" };
    } catch (err: any) {
      results.openai = {
        status: "error",
        error: err.message || err.status || "Eroare necunoscuta",
      };
    }
  } else {
    results.openai = { status: "not_configured" };
  }

  // Test Claude / Anthropic
  if (settings?.anthropicApiKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": settings.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 10,
          messages: [{ role: "user", content: "Spune doar: OK" }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        results.claude = {
          status: "error",
          error: `HTTP ${res.status}: ${errData.error?.message || res.statusText}`,
        };
      } else {
        results.claude = { status: "ok", model: "claude-sonnet-4-5-20250929" };
      }
    } catch (err: any) {
      results.claude = {
        status: "error",
        error: err.message || "Eroare necunoscuta",
      };
    }
  } else {
    results.claude = { status: "not_configured" };
  }

  // Test Gemini
  if (settings?.googleAiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.googleAiApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Spune doar: OK" }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        results.gemini = {
          status: "error",
          error: `HTTP ${res.status}: ${errData.error?.message || res.statusText}`,
        };
      } else {
        results.gemini = { status: "ok", model: "gemini-2.0-flash" };
      }
    } catch (err: any) {
      results.gemini = {
        status: "error",
        error: err.message || "Eroare necunoscuta",
      };
    }
  } else {
    results.gemini = { status: "not_configured" };
  }

  const workingProviders = Object.entries(results)
    .filter(([, v]) => v.status === "ok")
    .map(([k]) => k);

  return NextResponse.json({
    results,
    workingProviders,
    summary: workingProviders.length > 0
      ? `${workingProviders.length} provider(i) functioneaza: ${workingProviders.join(", ")}`
      : "Niciun provider AI nu functioneaza. Verificati cheile API.",
  });
}

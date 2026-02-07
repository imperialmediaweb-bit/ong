import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvailableProviders, getBestProvider } from "@/lib/llm-providers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const available = getAvailableProviders();
  const best = getBestProvider();

  return NextResponse.json({
    available,
    recommended: best,
    providers: {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        models: ["gemini-2.0-flash", "gemini-1.5-pro"],
      },
      claude: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        models: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
      },
    },
  });
}

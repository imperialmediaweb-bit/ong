import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAgent, AgentCapability } from "@/lib/ngo-agent";
import { LLMProvider } from "@/lib/llm-providers";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { capability, context, provider } = body;

    if (!capability) {
      return NextResponse.json(
        { error: "Capabilitatea este obligatorie" },
        { status: 400 }
      );
    }

    const validCapabilities: AgentCapability[] = [
      "campaign_generator",
      "donor_analyzer",
      "fundraising_advisor",
      "email_writer",
      "sms_writer",
      "donor_segmentation",
      "performance_insights",
      "content_translator",
      "donor_retention",
      "ngo_verifier",
      "report_generator",
      "chatbot",
    ];

    if (!validCapabilities.includes(capability)) {
      return NextResponse.json(
        { error: `Capabilitate invalida: ${capability}` },
        { status: 400 }
      );
    }

    const result = await runAgent({
      capability,
      context: {
        ...context,
        ngoName: (session.user as any).ngoName,
        ngoId: (session.user as any).ngoId,
      },
      provider: provider as LLMProvider | undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent error:", error.message);
    return NextResponse.json(
      { error: error.message || "Eroare agent AI" },
      { status: 500 }
    );
  }
}

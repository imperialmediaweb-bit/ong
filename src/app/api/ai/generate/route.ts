import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateCampaignContent } from "@/lib/ai";
import { aiGenerateSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission, fetchEffectivePlan } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const role = (session.user as any).role;
    if (!hasPermission(role, "campaigns:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "ai_generator")) {
      return NextResponse.json({ error: "Generarea AI nu este disponibila pe planul tau. Fa upgrade la PRO." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = aiGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Use NGO name from session if not provided
    if (!data.ngoName) {
      data.ngoName = (session.user as any).ngoName;
    }

    const result = await generateCampaignContent({
      type: data.type,
      campaignType: data.campaignType,
      tone: data.tone,
      language: data.language,
      context: data.context,
      ngoName: data.ngoName,
    });

    if (result.error) {
      return NextResponse.json(
        { error: "AI generation failed", details: result.error },
        { status: 502 }
      );
    }

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "AI_CONTENT_GENERATED",
      details: { type: data.type, campaignType: data.campaignType, tone: data.tone, language: data.language },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: { content: result.content } });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

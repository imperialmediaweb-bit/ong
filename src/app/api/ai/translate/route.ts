import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { translateContent } from "@/lib/ai";
import { createAuditLog } from "@/lib/audit";
import { hasFeature, hasPermission } from "@/lib/permissions";
import { z } from "zod";

const translateSchema = z.object({
  content: z.string().min(1, "Content is required"),
  targetLanguage: z.enum(["ro", "en"]),
});

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

    const plan = (session.user as any).plan;
    if (!hasFeature(plan, "ai_generator")) {
      return NextResponse.json({ error: "AI features are not available on your plan" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = translateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, targetLanguage } = parsed.data;

    const translated = await translateContent(content, targetLanguage);

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "AI_CONTENT_TRANSLATED",
      details: { targetLanguage, contentLength: content.length },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: { translatedContent: translated } });
  } catch (error) {
    console.error("AI translate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

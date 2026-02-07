import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { consentTextSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
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
    if (!hasPermission(role, "settings:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = { ngoId };

    if (type) {
      where.type = type;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const consentTexts = await prisma.consentText.findMany({
      where,
      orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ data: consentTexts });
  } catch (error) {
    console.error("Consent GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    if (!hasPermission(role, "settings:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = consentTextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, text } = parsed.data;

    // Deactivate any previous active consent text of the same type
    await prisma.consentText.updateMany({
      where: { ngoId, type, isActive: true },
      data: { isActive: false },
    });

    // Create new active consent text
    const consentText = await prisma.consentText.create({
      data: {
        ngoId,
        type,
        text,
        isActive: true,
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "CONSENT_TEXT_UPDATED",
      entityType: "ConsentText",
      entityId: consentText.id,
      details: { type },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: consentText }, { status: 201 });
  } catch (error) {
    console.error("Consent POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

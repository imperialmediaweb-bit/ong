import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";
import { hasFeature, fetchEffectivePlan } from "@/lib/permissions";

function generateToken(): string {
  return `ngo_${crypto.randomBytes(32).toString("hex")}`;
}

// GET /api/prospects/token — List tokens for current NGO
export async function GET() {
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
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { ngoId },
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        token: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask tokens (show first 8 + last 4 chars)
    const masked = tokens.map((t) => ({
      ...t,
      tokenPreview: `${t.token.slice(0, 12)}...${t.token.slice(-4)}`,
    }));

    return NextResponse.json({ tokens: masked });
  } catch (err) {
    console.error("Token list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/prospects/token — Generate a new API token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const userId = (session.user as any).id;
    if (!ngoId) {
      return NextResponse.json({ error: "No NGO associated" }, { status: 403 });
    }

    const role = (session.user as any).role;
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || "Chrome Extension";

    const token = generateToken();

    const apiToken = await prisma.apiToken.create({
      data: {
        ngoId,
        userId,
        token,
        name,
      },
    });

    return NextResponse.json({
      id: apiToken.id,
      token, // Show full token only on creation
      name: apiToken.name,
      createdAt: apiToken.createdAt,
    });
  } catch (err) {
    console.error("Token create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/prospects/token — Revoke a token
export async function DELETE(request: NextRequest) {
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
    const plan = await fetchEffectivePlan(ngoId, (session.user as any).plan, role);
    if (!hasFeature(plan, "linkedin_prospects", role)) {
      return NextResponse.json({ error: "LinkedIn Prospects nu este disponibil pe planul tau. Fa upgrade la ELITE." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("id");

    if (!tokenId) {
      return NextResponse.json({ error: "Token ID required" }, { status: 400 });
    }

    await prisma.apiToken.deleteMany({
      where: { id: tokenId, ngoId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Token delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

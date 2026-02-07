import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format").default("#6366f1"),
});

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
    if (!hasPermission(role, "donors:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const tags = await prisma.donorTag.findMany({
      where: { ngoId },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error("Tags GET error:", error);
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
    if (!hasPermission(role, "donors:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = tagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, color } = parsed.data;

    // Check for duplicate tag name within the NGO
    const existing = await prisma.donorTag.findUnique({
      where: { ngoId_name: { ngoId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = await prisma.donorTag.create({
      data: {
        ngoId,
        name,
        color,
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "TAG_CREATED",
      entityType: "DonorTag",
      entityId: tag.id,
      details: { name, color },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    console.error("Tags POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

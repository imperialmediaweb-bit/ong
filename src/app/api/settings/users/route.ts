import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    const role = (session.user as any).role;
    if (!ngoId || !hasPermission(role, "settings:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, password, userRole } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const validRoles = ["STAFF", "VIEWER", "NGO_ADMIN"];
    if (userRole && !validRoles.includes(userRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        role: userRole || "STAFF",
        ngoId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      ngoId,
      userId: (session.user as any).id,
      action: "USER_INVITED",
      entityType: "User",
      entityId: user.id,
      details: { email, role: userRole || "STAFF" },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error("User invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

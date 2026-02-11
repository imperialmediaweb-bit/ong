import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
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
    const { email, role: inviteRole } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalid" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un utilizator cu acest email exista deja" }, { status: 400 });
    }

    // Create user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await hash(tempPassword, 12);

    const validRoles = ["NGO_ADMIN", "STAFF", "VIEWER"];
    const userRole = validRoles.includes(inviteRole) ? inviteRole : "STAFF";

    await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        passwordHash,
        role: userRole as any,
        ngoId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Utilizatorul a fost creat" });
  } catch (error) {
    console.error("Team invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

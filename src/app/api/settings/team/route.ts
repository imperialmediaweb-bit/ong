import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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

    const users = await prisma.user.findMany({
      where: { ngoId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const members = users.map((u) => ({
      id: u.id,
      name: u.name || "",
      email: u.email,
      role: u.role,
      status: u.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Settings team GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

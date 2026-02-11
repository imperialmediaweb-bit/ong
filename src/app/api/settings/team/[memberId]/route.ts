import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
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

    const { memberId } = params;

    // Cannot delete yourself
    if (memberId === (session.user as any).id) {
      return NextResponse.json({ error: "Nu te poti sterge pe tine insuti" }, { status: 400 });
    }

    // Verify user belongs to this NGO
    const user = await prisma.user.findFirst({
      where: { id: memberId, ngoId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizatorul nu a fost gasit" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team member DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

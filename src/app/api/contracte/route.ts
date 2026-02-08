import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const ngoId = (session.user as any).ngoId;
    if (!ngoId) {
      return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
    }

    const contracts = await prisma.sponsorshipContract.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Contracte GET error:", error);
    return NextResponse.json(
      { error: "Eroare interna" },
      { status: 500 }
    );
  }
}

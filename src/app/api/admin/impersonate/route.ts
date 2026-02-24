import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

// POST - Start impersonation (returns NGO data for client-side session.update())
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { ngoId } = await request.json();
    if (!ngoId) {
      return NextResponse.json({ error: "ngoId este obligatoriu" }, { status: 400 });
    }

    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isActive: true,
      },
    });

    if (!ngo) {
      return NextResponse.json({ error: "ONG-ul nu a fost gasit" }, { status: 404 });
    }

    await createAuditLog({
      ngoId: ngo.id,
      userId: (session.user as any).id,
      action: "IMPERSONATION_START",
      entityType: "Ngo",
      entityId: ngo.id,
      details: {
        ngoName: ngo.name,
        adminEmail: session.user?.email,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({
      ngoId: ngo.id,
      ngoName: ngo.name,
      ngoSlug: ngo.slug,
      ngoLogoUrl: ngo.logoUrl,
    });
  } catch (error: any) {
    console.error("Eroare la impersonare:", error);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}

// DELETE - Stop impersonation (audit log only; actual JWT reset is client-side)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    await createAuditLog({
      ngoId: (session.user as any).ngoId,
      userId: (session.user as any).id,
      action: "IMPERSONATION_STOP",
      entityType: "Ngo",
      entityId: (session.user as any).ngoId,
      details: {
        adminEmail: session.user?.email,
      },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Eroare la oprirea impersonarii:", error);
    return NextResponse.json({ error: "Eroare interna" }, { status: 500 });
  }
}

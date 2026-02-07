import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        ngoId: true,
        ngo: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            auditLogs: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilizatorul nu a fost gasit" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Eroare la incarcarea utilizatorului:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea detaliilor utilizatorului" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowedFields = ["name", "role", "isActive", "ngoId"];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    if (data.role && !["SUPER_ADMIN", "NGO_ADMIN", "STAFF", "VIEWER"].includes(data.role)) {
      return NextResponse.json(
        { error: "Rol invalid. Roluri disponibile: SUPER_ADMIN, NGO_ADMIN, STAFF, VIEWER" },
        { status: 400 }
      );
    }

    // Verifica daca ONG-ul exista (daca a fost specificat)
    if (data.ngoId) {
      const ngo = await prisma.ngo.findUnique({ where: { id: data.ngoId } });
      if (!ngo) {
        return NextResponse.json(
          { error: "ONG-ul specificat nu a fost gasit" },
          { status: 404 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        ngoId: true,
        ngo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      user,
      message: "Utilizatorul a fost actualizat cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea utilizatorului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Utilizatorul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la actualizarea utilizatorului" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    // Nu permite dezactivarea propriului cont
    if (params.id === (session.user as any).id) {
      return NextResponse.json(
        { error: "Nu va puteti dezactiva propriul cont" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      user,
      message: "Utilizatorul a fost dezactivat cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la dezactivarea utilizatorului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Utilizatorul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la dezactivarea utilizatorului" },
      { status: 500 }
    );
  }
}

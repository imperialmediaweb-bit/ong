import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// PATCH /api/retea/connections/[id] - Accept or reject a connection request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const connectionId = params.id;
    const body = await request.json();
    const { action } = body; // "accept" or "reject"

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Actiunea trebuie sa fie 'accept' sau 'reject'" },
        { status: 400 }
      );
    }

    // Find the connection - user must be the receiver to accept/reject
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json({ error: "Conexiunea nu a fost gasita" }, { status: 404 });
    }

    if (connection.receiverId !== userId) {
      return NextResponse.json(
        { error: "Doar destinatarul poate accepta sau respinge cererea" },
        { status: 403 }
      );
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "Aceasta cerere a fost deja procesata" },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: newStatus as any },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            ngo: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                logoUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            ngo: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[RETEA] Error updating connection:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

// DELETE /api/retea/connections/[id] - Remove/cancel a connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const connectionId = params.id;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json({ error: "Conexiunea nu a fost gasita" }, { status: 404 });
    }

    // Both requester and receiver can delete/cancel
    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      return NextResponse.json(
        { error: "Nu aveti permisiunea de a sterge aceasta conexiune" },
        { status: 403 }
      );
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ success: true, message: "Conexiunea a fost stearsa" });
  } catch (error: any) {
    console.error("[RETEA] Error deleting connection:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

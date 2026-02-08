import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/retea/connections - List connections (accepted, pending sent, pending received)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "accepted", "pending_sent", "pending_received"

    // Get accepted connections (where user is either requester or receiver)
    const accepted = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
      },
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
      orderBy: { updatedAt: "desc" },
    });

    // Get pending received requests
    const pendingReceived = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Get pending sent requests
    const pendingSent = await prisma.connection.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
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
      orderBy: { createdAt: "desc" },
    });

    // Map connections to show the "other" user
    const acceptedMapped = accepted.map((conn) => {
      const otherUser = conn.requesterId === userId ? conn.receiver : conn.requester;
      return {
        id: conn.id,
        user: otherUser,
        connectedAt: conn.updatedAt,
        message: conn.message,
      };
    });

    const pendingReceivedMapped = pendingReceived.map((conn) => ({
      id: conn.id,
      user: conn.requester,
      requestedAt: conn.createdAt,
      message: conn.message,
    }));

    const pendingSentMapped = pendingSent.map((conn) => ({
      id: conn.id,
      user: conn.receiver,
      requestedAt: conn.createdAt,
      message: conn.message,
    }));

    return NextResponse.json({
      accepted: acceptedMapped,
      pendingReceived: pendingReceivedMapped,
      pendingSent: pendingSentMapped,
    });
  } catch (error: any) {
    console.error("[RETEA] Error fetching connections:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

// POST /api/retea/connections - Send connection request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { receiverId, message } = body;

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId este obligatoriu" }, { status: 400 });
    }

    if (receiverId === userId) {
      return NextResponse.json({ error: "Nu te poti conecta cu tine insuti" }, { status: 400 });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return NextResponse.json({ error: "Utilizatorul nu a fost gasit" }, { status: 404 });
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId },
          { requesterId: receiverId, receiverId: userId },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === "ACCEPTED") {
        return NextResponse.json({ error: "Sunteti deja conectati" }, { status: 400 });
      }
      if (existingConnection.status === "PENDING") {
        return NextResponse.json({ error: "Cererea de conectare exista deja" }, { status: 400 });
      }
      if (existingConnection.status === "BLOCKED") {
        return NextResponse.json({ error: "Conexiunea este blocata" }, { status: 400 });
      }
      // If REJECTED, allow re-requesting by deleting old and creating new
      if (existingConnection.status === "REJECTED") {
        await prisma.connection.delete({
          where: { id: existingConnection.id },
        });
      }
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: userId,
        receiverId,
        message: message || null,
      },
      include: {
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

    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    console.error("[RETEA] Error creating connection:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Cererea de conectare exista deja" }, { status: 400 });
    }
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

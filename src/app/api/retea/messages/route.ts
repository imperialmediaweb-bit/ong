import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/retea/messages - List conversations with last message preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all direct messages involving this user
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
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
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group messages by conversation partner
    const conversationsMap = new Map<string, {
      user: any;
      lastMessage: any;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
          },
          unreadCount: 0,
        });
      }

      // Count unread messages sent to current user
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(otherUserId)!;
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("[RETEA] Error fetching conversations:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

// POST /api/retea/messages - Send a direct message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "receiverId si content sunt obligatorii" },
        { status: 400 }
      );
    }

    if (receiverId === userId) {
      return NextResponse.json(
        { error: "Nu poti trimite mesaje catre tine insuti" },
        { status: 400 }
      );
    }

    // Verify they are connected (accepted connection)
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId, receiverId },
          { requesterId: receiverId, receiverId: userId },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Trebuie sa fiti conectati pentru a trimite mesaje" },
        { status: 403 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
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
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("[RETEA] Error sending message:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

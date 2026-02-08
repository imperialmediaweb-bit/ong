import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/retea/messages/[userId] - Get messages with a specific user and mark as read
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const otherUserId = params.userId;

    // Verify they are connected
    const connection = await prisma.connection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: currentUserId, receiverId: otherUserId },
          { requesterId: otherUserId, receiverId: currentUserId },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Trebuie sa fiti conectati pentru a vedea mesajele" },
        { status: 403 }
      );
    }

    // Get all messages between the two users
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            ngo: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages from the other user as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
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
    });

    return NextResponse.json({
      messages,
      otherUser,
    });
  } catch (error: any) {
    console.error("[RETEA] Error fetching messages:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

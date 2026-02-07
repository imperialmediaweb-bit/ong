import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Get notifications for current NGO
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: any = { ngoId };
  if (unreadOnly) where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { ngoId, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "NGO negasit" }, { status: 400 });
  }

  const body = await req.json();
  const { ids, markAll } = body;

  if (markAll) {
    await prisma.notification.updateMany({
      where: { ngoId, isRead: false },
      data: { isRead: true },
    });
  } else if (ids && Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, ngoId },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}

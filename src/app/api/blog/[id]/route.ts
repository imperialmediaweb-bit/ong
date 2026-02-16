import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;

  try {
    const post = await prisma.blogPost.findFirst({
      where: { id: params.id, ngoId },
    });

    if (!post) {
      return NextResponse.json({ error: "Articolul nu a fost gasit" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;

  try {
    const existing = await prisma.blogPost.findFirst({
      where: { id: params.id, ngoId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Articolul nu a fost gasit" }, { status: 404 });
    }

    const body = await request.json();
    const data: any = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.excerpt !== undefined) data.excerpt = body.excerpt;
    if (body.content !== undefined) data.content = body.content;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage;
    if (body.category !== undefined) data.category = body.category;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ post, message: "Articolul a fost actualizat" });
  } catch (error: any) {
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;

  try {
    const existing = await prisma.blogPost.findFirst({
      where: { id: params.id, ngoId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Articolul nu a fost gasit" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Articolul a fost sters" });
  } catch (error: any) {
    return NextResponse.json({ error: "Eroare la stergere" }, { status: 500 });
  }
}

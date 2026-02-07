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
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Articolul nu a fost gasit" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Eroare la incarcarea articolului:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea articolului" },
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
    const allowedFields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "coverImage",
      "category",
      "tags",
      "status",
      "featured",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Verifica unicitatea slug-ului daca se schimba
    if (data.slug) {
      const existingPost = await prisma.blogPost.findFirst({
        where: {
          slug: data.slug,
          id: { not: params.id },
        },
      });

      if (existingPost) {
        return NextResponse.json(
          { error: "Un alt articol cu acest slug exista deja" },
          { status: 409 }
        );
      }
    }

    // Seteaza publishedAt daca statusul se schimba la PUBLISHED
    if (data.status === "PUBLISHED") {
      const currentPost = await prisma.blogPost.findUnique({
        where: { id: params.id },
        select: { publishedAt: true },
      });
      if (!currentPost?.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      post,
      message: "Articolul a fost actualizat cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea articolului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Articolul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la actualizarea articolului" },
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
    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Articolul a fost sters cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la stergerea articolului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Articolul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la stergerea articolului" },
      { status: 500 }
    );
  }
}

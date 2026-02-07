import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const isPublished = searchParams.get("isPublished");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isPublished !== null && isPublished !== undefined && isPublished !== "") {
      where.isPublished = isPublished === "true";
    }

    const [pages, total] = await Promise.all([
      prisma.sitePage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.sitePage.count({ where }),
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Eroare la listarea paginilor:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea paginilor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { slug, title, content, metaTitle, metaDesc, isPublished, sortOrder } =
      body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug-ul si titlul sunt obligatorii" },
        { status: 400 }
      );
    }

    // Verifica daca slug-ul exista deja
    const existingPage = await prisma.sitePage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "O pagina cu acest slug exista deja" },
        { status: 409 }
      );
    }

    const page = await prisma.sitePage.create({
      data: {
        slug,
        title,
        content: (content || {}) as any,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        isPublished: isPublished || false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(
      { page, message: "Pagina a fost creata cu succes" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Eroare la crearea paginii:", error);
    return NextResponse.json(
      { error: "Eroare la crearea paginii" },
      { status: 500 }
    );
  }
}

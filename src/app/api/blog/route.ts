import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "Fara ONG asociat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = { ngoId };
    if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          status: true,
          category: true,
          publishedAt: true,
          viewCount: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Blog list error:", error);
    return NextResponse.json({ error: "Eroare la incarcarea articolelor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "Fara ONG asociat" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, category, tags, status, featured } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Titlul si continutul sunt obligatorii" }, { status: 400 });
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

    const existing = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: "Un articol cu acest slug exista deja" }, { status: 409 });
    }

    const postStatus = status || "DRAFT";
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        category: category || null,
        tags: tags || [],
        status: postStatus,
        featured: featured || false,
        authorId: (session.user as any).id,
        ngoId,
        publishedAt: postStatus === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json({ post, message: "Articolul a fost creat" }, { status: 201 });
  } catch (error: any) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Eroare la crearea articolului" }, { status: 500 });
  }
}

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
    const page = await prisma.sitePage.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Pagina nu a fost gasita" },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error("Eroare la incarcarea paginii:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea paginii" },
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
      "slug",
      "title",
      "content",
      "metaTitle",
      "metaDesc",
      "isPublished",
      "sortOrder",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "content") {
          data[field] = body[field] as any;
        } else {
          data[field] = body[field];
        }
      }
    }

    // Verifica unicitatea slug-ului daca se schimba
    if (data.slug) {
      const existingPage = await prisma.sitePage.findFirst({
        where: {
          slug: data.slug,
          id: { not: params.id },
        },
      });

      if (existingPage) {
        return NextResponse.json(
          { error: "O alta pagina cu acest slug exista deja" },
          { status: 409 }
        );
      }
    }

    const page = await prisma.sitePage.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      page,
      message: "Pagina a fost actualizata cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea paginii:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Pagina nu a fost gasita" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la actualizarea paginii" },
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
    await prisma.sitePage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Pagina a fost stearsa cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la stergerea paginii:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Pagina nu a fost gasita" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la stergerea paginii" },
      { status: 500 }
    );
  }
}

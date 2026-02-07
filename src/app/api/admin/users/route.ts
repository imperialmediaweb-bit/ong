import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const isActive = searchParams.get("isActive");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && ["SUPER_ADMIN", "NGO_ADMIN", "STAFF", "VIEWER"].includes(role)) {
      where.role = role;
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          ngoId: true,
          ngo: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Eroare la listarea utilizatorilor:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea listei de utilizatori" },
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
    const { email, password, name, role, ngoId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email-ul si parola sunt obligatorii" },
        { status: 400 }
      );
    }

    if (role && !["SUPER_ADMIN", "NGO_ADMIN", "STAFF", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: "Rol invalid. Roluri disponibile: SUPER_ADMIN, NGO_ADMIN, STAFF, VIEWER" },
        { status: 400 }
      );
    }

    // Verifica daca email-ul exista deja
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilizator cu acest email exista deja" },
        { status: 409 }
      );
    }

    // Verifica daca ONG-ul exista (daca a fost specificat)
    if (ngoId) {
      const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });
      if (!ngo) {
        return NextResponse.json(
          { error: "ONG-ul specificat nu a fost gasit" },
          { status: 404 }
        );
      }
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: role || "STAFF",
        ngoId: ngoId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        ngoId: true,
        ngo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { user, message: "Utilizatorul a fost creat cu succes" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Eroare la crearea utilizatorului:", error);
    return NextResponse.json(
      { error: "Eroare la crearea utilizatorului" },
      { status: 500 }
    );
  }
}

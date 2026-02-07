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
    const ngo = await prisma.ngo.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            donors: true,
            donations: true,
            campaigns: true,
            automations: true,
          },
        },
        verification: true,
        miniSiteConfig: true,
        donations: {
          select: { amount: true },
        },
      },
    });

    if (!ngo) {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }

    const donationTotal = ngo.donations.reduce((sum, d) => sum + d.amount, 0);
    const { donations, sendgridApiKey, twilioAccountSid, twilioAuthToken, ...safeNgo } = ngo;

    return NextResponse.json({
      ...safeNgo,
      donationTotal,
    });
  } catch (error: any) {
    console.error("Eroare la incarcarea ONG-ului:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea detaliilor ONG-ului" },
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
      "name",
      "description",
      "logoUrl",
      "websiteUrl",
      "subscriptionPlan",
      "isActive",
      "senderEmail",
      "senderName",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const ngo = await prisma.ngo.update({
      where: { id: params.id },
      data,
      include: {
        verification: {
          select: { status: true },
        },
      },
    });

    return NextResponse.json({ ngo, message: "ONG-ul a fost actualizat cu succes" });
  } catch (error: any) {
    console.error("Eroare la actualizarea ONG-ului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la actualizarea ONG-ului" },
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
    const ngo = await prisma.ngo.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      ngo,
      message: "ONG-ul a fost dezactivat cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la dezactivarea ONG-ului:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ONG-ul nu a fost gasit" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Eroare la dezactivarea ONG-ului" },
      { status: 500 }
    );
  }
}

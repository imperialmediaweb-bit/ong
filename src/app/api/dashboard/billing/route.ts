/**
 * GET /api/dashboard/billing
 * Returns billing info and invoices for the current NGO
 *
 * PATCH /api/dashboard/billing
 * Updates billing details for the current NGO
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const user = session.user as any;
  if (!user.ngoId) {
    return NextResponse.json({ error: "Nu aveti un ONG asociat" }, { status: 400 });
  }

  try {
    const [ngo, invoices] = await Promise.all([
      prisma.ngo.findUnique({
        where: { id: user.ngoId },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionStartAt: true,
          subscriptionExpiresAt: true,
          autoRenew: true,
          paymentMethod: true,
          billingName: true,
          billingCui: true,
          billingRegCom: true,
          billingAddress: true,
          billingCity: true,
          billingCounty: true,
          billingEmail: true,
          billingPhone: true,
        },
      }),
      prisma.invoice.findMany({
        where: { ngoId: user.ngoId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          issueDate: true,
          dueDate: true,
          paidAt: true,
          paymentToken: true,
          subscriptionPlan: true,
          subscriptionMonth: true,
        },
      }),
    ]);

    return NextResponse.json({ ngo, invoices });
  } catch (error: any) {
    console.error("Error fetching billing info:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const user = session.user as any;
  if (!user.ngoId || !["NGO_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "billingName", "billingCui", "billingRegCom", "billingAddress",
      "billingCity", "billingCounty", "billingEmail", "billingPhone",
      "paymentMethod",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field] || null;
      }
    }

    const ngo = await prisma.ngo.update({
      where: { id: user.ngoId },
      data,
    });

    return NextResponse.json({ success: true, ngo });
  } catch (error: any) {
    console.error("Error updating billing:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

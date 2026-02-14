/**
 * POST /api/checkout
 * Creates a subscription invoice and returns payment URL
 * Can be called after registration or from dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createSubscriptionInvoice } from "@/lib/invoice-generator";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const user = session.user as any;
    const { plan, paymentMethod } = await request.json();

    if (!plan || !["PRO", "ELITE"].includes(plan)) {
      return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
    }

    if (!user.ngoId) {
      return NextResponse.json({ error: "Nu aveti un ONG asociat" }, { status: 400 });
    }

    // Check if there's already an unpaid invoice for this month
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        ngoId: user.ngoId,
        subscriptionPlan: plan,
        subscriptionMonth: billingMonth,
        status: { in: ["DRAFT", "ISSUED", "SENT"] },
      },
    });

    if (existingInvoice && existingInvoice.paymentToken) {
      return NextResponse.json({
        paymentUrl: `${APP_URL}/factura/${existingInvoice.paymentToken}`,
        invoiceId: existingInvoice.id,
        message: "Factura existenta",
      });
    }

    // Update payment method preference
    if (paymentMethod) {
      await prisma.ngo.update({
        where: { id: user.ngoId },
        data: { paymentMethod },
      });
    }

    // Generate the invoice
    const result = await createSubscriptionInvoice({
      ngoId: user.ngoId,
      plan: plan as "PRO" | "ELITE",
      billingMonth,
      isRecurring: paymentMethod === "recurring_card",
      autoIssue: true,
    });

    if (!result) {
      return NextResponse.json({ error: "Eroare la generarea facturii" }, { status: 500 });
    }

    // Invoice notification is sent automatically by createSubscriptionInvoice
    // via notifyInvoiceCreated (email + in-app + super admin alert)

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      invoiceId: result.invoiceId,
      message: "Factura a fost generata cu succes",
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Eroare la procesarea comenzii" }, { status: 500 });
  }
}

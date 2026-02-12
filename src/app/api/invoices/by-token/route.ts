/**
 * GET /api/invoices/by-token?token=xxx
 * Public endpoint - fetches invoice details by payment token
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token lipsa" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { paymentToken: token },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    // Return safe public data (no internal notes, no createdBy)
    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sellerName: invoice.sellerName,
      sellerCui: invoice.sellerCui,
      sellerRegCom: invoice.sellerRegCom,
      sellerAddress: invoice.sellerAddress,
      sellerCity: invoice.sellerCity,
      sellerCounty: invoice.sellerCounty,
      sellerEmail: invoice.sellerEmail,
      sellerPhone: invoice.sellerPhone,
      sellerIban: invoice.sellerIban,
      sellerBankName: invoice.sellerBankName,
      sellerVatPayer: invoice.sellerVatPayer,
      buyerName: invoice.buyerName,
      buyerCui: invoice.buyerCui,
      buyerEmail: invoice.buyerEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      items: invoice.items,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      paidAt: invoice.paidAt,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
      subscriptionPlan: invoice.subscriptionPlan,
      paymentProofUrl: invoice.paymentProofUrl,
    });
  } catch (error: any) {
    console.error("Error fetching invoice by token:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

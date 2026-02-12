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
    const status = searchParams.get("status");
    const ngoId = searchParams.get("ngoId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (status) where.status = status;
    if (ngoId) where.ngoId = ngoId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error: any) {
    console.error("Eroare la incarcarea facturilor:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea facturilor" },
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

    // Get billing info for seller details
    let billing = await prisma.platformBilling.findUnique({
      where: { id: "billing" },
    });

    if (!billing) {
      billing = await prisma.platformBilling.create({
        data: { id: "billing" },
      });
    }

    // Generate invoice number
    const prefix = billing.invoicePrefix || "BNV";
    const series = billing.invoiceSeries || "";
    const nextNum = billing.invoiceNextNumber || 1;
    const invoiceNumber = series
      ? `${series}-${String(nextNum).padStart(4, "0")}`
      : `${prefix}-${String(nextNum).padStart(4, "0")}`;

    // Calculate totals from items
    const items = body.items || [];
    let subtotal = 0;
    let vatAmount = 0;

    const processedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate ?? billing!.invoiceVatRate ?? 19);
      const totalNet = qty * unitPrice;
      const totalVat = billing!.companyVatPayer ? totalNet * (vatRate / 100) : 0;
      const totalGross = totalNet + totalVat;

      subtotal += totalNet;
      vatAmount += totalVat;

      return {
        description: item.description || "",
        quantity: qty,
        unit: item.unit || "buc",
        unitPrice,
        vatRate,
        totalNet,
        totalVat,
        totalGross,
      };
    });

    const totalAmount = subtotal + vatAmount;

    // Calculate due date
    const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
    const paymentTerms = billing.invoicePaymentTerms || 30;
    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(issueDate.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceSeries: series || null,

        // Seller
        sellerName: billing.companyName || "Neconfigurat",
        sellerCui: billing.companyCui,
        sellerRegCom: billing.companyRegCom,
        sellerAddress: billing.companyAddress,
        sellerCity: billing.companyCity,
        sellerCounty: billing.companyCounty,
        sellerEmail: billing.companyEmail,
        sellerPhone: billing.companyPhone,
        sellerIban: billing.companyIban,
        sellerBankName: billing.companyBankName,
        sellerVatPayer: billing.companyVatPayer,

        // Buyer
        buyerName: body.buyerName || "",
        buyerCui: body.buyerCui || null,
        buyerRegCom: body.buyerRegCom || null,
        buyerAddress: body.buyerAddress || null,
        buyerCity: body.buyerCity || null,
        buyerCounty: body.buyerCounty || null,
        buyerEmail: body.buyerEmail || null,
        buyerPhone: body.buyerPhone || null,
        ngoId: body.ngoId || null,

        // Dates
        issueDate,
        dueDate,
        status: body.status || "DRAFT",

        // Items and totals
        items: processedItems as any,
        subtotal,
        vatAmount,
        totalAmount,
        currency: billing.invoiceCurrency || "RON",

        // Notes
        notes: body.notes || billing.invoiceNotes || null,
        internalNotes: body.internalNotes || null,

        // Meta
        createdBy: (session.user as any).id,
      },
    });

    // Increment invoice number
    await prisma.platformBilling.update({
      where: { id: "billing" },
      data: { invoiceNextNumber: nextNum + 1 },
    });

    return NextResponse.json({
      invoice,
      message: "Factura a fost creata cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la crearea facturii:", error);
    return NextResponse.json(
      { error: "Eroare la crearea facturii" },
      { status: 500 }
    );
  }
}

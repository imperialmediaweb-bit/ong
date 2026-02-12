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
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Eroare la incarcarea facturii:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea facturii" },
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
      "status", "paidAt", "paymentMethod", "notes", "internalNotes",
      "buyerName", "buyerCui", "buyerRegCom", "buyerAddress",
      "buyerCity", "buyerCounty", "buyerEmail", "buyerPhone",
      "dueDate", "ngoId",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "dueDate" || field === "paidAt") {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    // If items are updated, recalculate totals
    if (body.items) {
      const billing = await prisma.platformBilling.findUnique({
        where: { id: "billing" },
      });
      const isVatPayer = billing?.companyVatPayer ?? false;

      let subtotal = 0;
      let vatAmount = 0;
      const processedItems = body.items.map((item: any) => {
        const qty = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const vatRate = parseFloat(item.vatRate ?? 19);
        const totalNet = qty * unitPrice;
        const totalVat = isVatPayer ? totalNet * (vatRate / 100) : 0;
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

      data.items = processedItems as any;
      data.subtotal = subtotal;
      data.vatAmount = vatAmount;
      data.totalAmount = subtotal + vatAmount;
    }

    // If marking as paid, set paidAt
    if (body.status === "PAID" && !data.paidAt) {
      data.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      invoice,
      message: "Factura a fost actualizata cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea facturii:", error);
    return NextResponse.json(
      { error: "Eroare la actualizarea facturii" },
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
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Doar facturile in stare DRAFT pot fi sterse" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Factura a fost stearsa" });
  } catch (error: any) {
    console.error("Eroare la stergerea facturii:", error);
    return NextResponse.json(
      { error: "Eroare la stergerea facturii" },
      { status: 500 }
    );
  }
}

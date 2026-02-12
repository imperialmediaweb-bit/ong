import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    let billing = await prisma.platformBilling.findUnique({
      where: { id: "billing" },
    });

    if (!billing) {
      billing = await prisma.platformBilling.create({
        data: { id: "billing" },
      });
    }

    return NextResponse.json(billing);
  } catch (error: any) {
    console.error("Eroare la incarcarea datelor de facturare:", error);
    return NextResponse.json(
      { error: "Eroare la incarcarea datelor de facturare" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const allowedFields = [
      "companyName", "companyCui", "companyRegCom", "companyAddress",
      "companyCity", "companyCounty", "companyPostalCode", "companyCountry",
      "companyEmail", "companyPhone", "companyIban", "companyBankName",
      "companyVatPayer", "companyCapital",
      "invoicePrefix", "invoiceNextNumber", "invoiceSeries",
      "invoiceCurrency", "invoiceVatRate", "invoiceNotes", "invoicePaymentTerms",
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const billing = await prisma.platformBilling.upsert({
      where: { id: "billing" },
      create: { id: "billing", ...data },
      update: data,
    });

    return NextResponse.json({
      billing,
      message: "Datele de facturare au fost salvate cu succes",
    });
  } catch (error: any) {
    console.error("Eroare la salvarea datelor de facturare:", error);
    return NextResponse.json(
      { error: "Eroare la salvarea datelor de facturare" },
      { status: 500 }
    );
  }
}

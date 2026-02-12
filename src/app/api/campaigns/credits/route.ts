import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CREDIT_PACKAGES } from "@/lib/campaign-templates";
import { createCreditInvoice } from "@/lib/invoice-generator";

// GET - get credit balance and packages
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const ngoId = (session.user as any).ngoId;
  if (!ngoId) {
    return NextResponse.json({ error: "Fara ONG asociat" }, { status: 403 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: { emailCredits: true, smsCredits: true },
    });

    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      emailCredits: ngo?.emailCredits ?? 0,
      smsCredits: ngo?.smsCredits ?? 0,
      packages: CREDIT_PACKAGES,
      transactions: recentTransactions,
    });
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    return NextResponse.json({ error: "Eroare la incarcarea creditelor" }, { status: 500 });
  }
}

// POST - purchase credit package (creates invoice + returns payment URL)
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
    const { packageId } = await request.json();
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Pachet invalid" }, { status: 400 });
    }

    // Create invoice for this credit package
    const invoiceResult = await createCreditInvoice({
      ngoId,
      packageId: pkg.id,
      packageName: pkg.name,
      emailCredits: pkg.emailCredits,
      smsCredits: pkg.smsCredits,
      price: pkg.price,
    });

    if (!invoiceResult) {
      return NextResponse.json(
        { error: "Eroare la generarea facturii. Verificati datele de facturare ale organizatiei." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Factura creata. Redirectionare catre plata...",
      paymentUrl: invoiceResult.paymentUrl,
      paymentToken: invoiceResult.paymentToken,
      invoiceId: invoiceResult.invoiceId,
    });
  } catch (error: any) {
    console.error("Error purchasing credits:", error);
    return NextResponse.json({ error: "Eroare la achizitionarea creditelor" }, { status: 500 });
  }
}

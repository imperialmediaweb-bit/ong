import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendPlatformEmail } from "@/lib/email-sender";
import { invoiceEmail } from "@/lib/notification-emails";

export async function POST(
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
      include: { ngo: { select: { billingEmail: true, name: true, users: { where: { role: "NGO_ADMIN" }, select: { email: true }, take: 1 } } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    // Determine recipient email: buyerEmail > ngo.billingEmail > ngo admin email
    const recipientEmail =
      invoice.buyerEmail ||
      invoice.ngo?.billingEmail ||
      invoice.ngo?.users?.[0]?.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Nu exista email de contact pentru aceasta factura. Adaugati un email cumparator." },
        { status: 400 }
      );
    }

    // Build payment URL if invoice has a payment token
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://binevo.ro";
    const invoiceUrl = invoice.paymentToken
      ? `${baseUrl}/factura/${invoice.paymentToken}`
      : undefined;

    // Generate email content
    const emailContent = invoiceEmail({
      ngoName: invoice.buyerName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      plan: invoice.subscriptionPlan || "Servicii",
      period: invoice.subscriptionMonth || new Date(invoice.issueDate).toLocaleDateString("ro-RO", { month: "long", year: "numeric" }),
      dueDate: invoice.dueDate || undefined,
      paidAt: invoice.paidAt || undefined,
      invoiceUrl,
    });

    // Send email
    const result = await sendPlatformEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      fromName: "Binevo",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Eroare la trimiterea emailului: ${result.error}` },
        { status: 500 }
      );
    }

    // Update invoice status to SENT if currently ISSUED or DRAFT
    if (invoice.status === "DRAFT" || invoice.status === "ISSUED") {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({
      message: `Factura trimisa cu succes la ${recipientEmail}`,
      sentTo: recipientEmail,
    });
  } catch (error: any) {
    console.error("Eroare la trimiterea facturii pe email:", error);
    return NextResponse.json(
      { error: "Eroare la trimiterea emailului" },
      { status: 500 }
    );
  }
}

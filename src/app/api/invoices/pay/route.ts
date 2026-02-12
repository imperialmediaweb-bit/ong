/**
 * POST /api/invoices/pay
 * Public endpoint - creates Stripe checkout session for invoice payment
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

export async function POST(request: NextRequest) {
  try {
    const { paymentToken, paymentMethod } = await request.json();

    if (!paymentToken) {
      return NextResponse.json({ error: "Token lipsa" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { paymentToken },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura nu a fost gasita" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Factura este deja platita" }, { status: 400 });
    }

    if (invoice.status === "CANCELLED" || invoice.status === "STORNO") {
      return NextResponse.json({ error: "Factura a fost anulata" }, { status: 400 });
    }

    if (paymentMethod === "card") {
      // Create Stripe checkout session
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: invoice.currency.toLowerCase(),
              product_data: {
                name: `Factura ${invoice.invoiceNumber}`,
                description: invoice.subscriptionPlan
                  ? `Abonament ${invoice.subscriptionPlan} Binevo`
                  : `Factura ${invoice.invoiceNumber}`,
              },
              unit_amount: Math.round(invoice.totalAmount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}/factura/${paymentToken}?paid=true`,
        cancel_url: `${APP_URL}/factura/${paymentToken}?cancelled=true`,
        metadata: {
          invoiceId: invoice.id,
          paymentToken,
          type: "invoice_payment",
        },
        customer_email: invoice.buyerEmail || undefined,
      });

      // Store the stripe session ID
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { stripePaymentIntentId: session.id },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    return NextResponse.json({ error: "Metoda de plata invalida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Eroare la procesarea platii" }, { status: 500 });
  }
}

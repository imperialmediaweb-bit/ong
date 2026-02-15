/**
 * POST /api/invoices/pay
 * Public endpoint - creates payment session (Stripe or Netopia) for invoice payment
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

// GET - check available payment methods for platform billing
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        stripeEnabled: true,
        netopiaEnabled: true,
        paypalPlatformEnabled: true,
      },
    });

    const methods = [];

    if (settings?.stripeEnabled || process.env.STRIPE_SECRET_KEY) {
      methods.push({
        id: "card",
        label: "Card bancar (Stripe)",
        description: "Plateste securizat cu cardul prin Stripe",
        processor: "stripe",
      });
    }

    if (settings?.netopiaEnabled) {
      methods.push({
        id: "netopia",
        label: "Card bancar (Netopia)",
        description: "Plateste cu cardul prin Netopia Payments",
        processor: "netopia",
      });
    }

    if (settings?.paypalPlatformEnabled) {
      methods.push({
        id: "paypal",
        label: "PayPal",
        description: "Plateste cu PayPal",
        processor: "paypal",
      });
    }

    // Bank transfer is always available
    methods.push({
      id: "bank_transfer",
      label: "Transfer bancar",
      description: "Plateste prin transfer bancar cu referinta",
      processor: "manual",
    });

    return NextResponse.json({ methods });
  } catch (error: any) {
    console.error("Payment methods error:", error.message);
    return NextResponse.json({ methods: [{ id: "card", label: "Card bancar", processor: "stripe" }] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentToken, paymentMethod } = await request.json();

    if (!paymentToken) {
      return NextResponse.json({ error: "Token lipsa" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { paymentToken },
      include: { ngo: { select: { name: true, billingEmail: true, billingName: true, billingCity: true } } },
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

    // ─── Stripe Payment ───────────────────────────────────
    if (paymentMethod === "card") {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = await getStripe();

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

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { stripePaymentIntentId: session.id },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    // ─── Netopia Payment ──────────────────────────────────
    if (paymentMethod === "netopia") {
      const { startNetopiaPayment } = await import("@/lib/netopia");

      // Parse buyer name into first/last
      const buyerName = invoice.buyerName || invoice.ngo?.billingName || "Client";
      const nameParts = buyerName.split(" ");
      const firstName = nameParts[0] || "Client";
      const lastName = nameParts.slice(1).join(" ") || "Binevo";

      const result = await startNetopiaPayment({
        orderRef: invoice.id,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        description: invoice.subscriptionPlan
          ? `Abonament ${invoice.subscriptionPlan} Binevo - ${invoice.invoiceNumber}`
          : `Factura ${invoice.invoiceNumber}`,
        billing: {
          email: invoice.buyerEmail || "noreply@binevo.ro",
          firstName,
          lastName,
          city: invoice.ngo?.billingCity || "Bucuresti",
        },
        metadata: {
          invoiceId: invoice.id,
          paymentToken: paymentToken,
          type: "invoice_payment",
        },
      });

      if (result.payment?.paymentURL) {
        // Store Netopia transaction ID
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            metadata: {
              ...(typeof invoice.metadata === "object" && invoice.metadata !== null ? invoice.metadata : {}),
              netopiaNtpID: result.payment.ntpID,
              netopiaStartedAt: new Date().toISOString(),
            } as any,
          },
        });

        return NextResponse.json({ checkoutUrl: result.payment.paymentURL });
      }

      return NextResponse.json(
        { error: "Netopia nu a returnat un URL de plata" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Metoda de plata invalida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Eroare la procesarea platii: " + error.message }, { status: 500 });
  }
}

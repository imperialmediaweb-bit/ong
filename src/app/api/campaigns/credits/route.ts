import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CREDIT_PACKAGES } from "@/lib/campaign-templates";
import { createCreditInvoice } from "@/lib/invoice-generator";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

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
      select: {
        emailCredits: true,
        smsCredits: true,
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioPhoneNumber: true,
        telnyxApiKey: true,
        telnyxPhoneNumber: true,
      },
    });

    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // SMS is configured if the NGO has their own Twilio or Telnyx credentials
    const smsConfigured = !!(
      (ngo?.twilioAccountSid && ngo?.twilioAuthToken && ngo?.twilioPhoneNumber) ||
      (ngo?.telnyxApiKey && ngo?.telnyxPhoneNumber)
    );

    return NextResponse.json({
      emailCredits: ngo?.emailCredits ?? 0,
      smsCredits: ngo?.smsCredits ?? 0,
      smsConfigured,
      packages: CREDIT_PACKAGES,
      transactions: recentTransactions,
    });
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    return NextResponse.json({ error: "Eroare la incarcarea creditelor" }, { status: 500 });
  }
}

// POST - purchase credit package (direct Stripe checkout or invoice fallback)
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

    // Try direct Stripe checkout first for instant payment
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = await getStripe();

      const parts: string[] = [];
      if (pkg.emailCredits > 0) parts.push(`${pkg.emailCredits.toLocaleString("ro-RO")} emailuri`);
      if (pkg.smsCredits > 0) parts.push(`${pkg.smsCredits.toLocaleString("ro-RO")} SMS-uri`);

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "ron",
              product_data: {
                name: `Pachet credite: ${pkg.name}`,
                description: parts.join(" + "),
              },
              unit_amount: Math.round(pkg.price * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}/dashboard/campaigns?tab=credits&purchased=${pkg.id}`,
        cancel_url: `${APP_URL}/dashboard/campaigns?tab=credits&cancelled=true`,
        metadata: {
          type: "credit_purchase",
          ngoId,
          packageId: pkg.id,
          packageName: pkg.name,
          emailCredits: String(pkg.emailCredits),
          smsCredits: String(pkg.smsCredits),
          price: String(pkg.price),
        },
      });

      if (checkoutSession.url) {
        return NextResponse.json({
          message: "Redirectionare catre Stripe...",
          paymentUrl: checkoutSession.url,
        });
      }
    } catch (stripeErr: any) {
      console.log("Stripe direct checkout not available, falling back to invoice:", stripeErr.message);
    }

    // Fallback: Create invoice for this credit package
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

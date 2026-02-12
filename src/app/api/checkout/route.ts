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
import { sendEmail } from "@/lib/email";
import { getBinevoLogoHtml } from "@/components/BinevoLogo";

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

    // Send invoice email
    const ngo = await prisma.ngo.findUnique({ where: { id: user.ngoId } });
    if (ngo) {
      const logo = getBinevoLogoHtml(140);
      const planPrices: Record<string, number> = { PRO: 149, ELITE: 349 };
      const price = planPrices[plan] || 0;

      try {
        await sendEmail({
          to: user.email,
          subject: `Factura Binevo - Abonament ${plan}`,
          html: `
            <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="padding:24px;text-align:center;border-bottom:3px solid #6366f1;">
                ${logo}
              </div>
              <div style="padding:24px;">
                <h2 style="color:#1a1a2e;margin-bottom:16px;">Factura pentru abonamentul ${plan}</h2>
                <p style="color:#4b5563;line-height:1.6;">
                  Buna, ${user.name || ngo.name}!
                </p>
                <p style="color:#4b5563;line-height:1.6;">
                  Am generat factura pentru abonamentul <strong>${plan}</strong> Binevo
                  in valoare de <strong>${price} RON/luna</strong>.
                </p>
                <div style="margin:24px 0;text-align:center;">
                  <a href="${result.paymentUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                    Plateste factura
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:13px;text-align:center;">
                  Puteti plati cu cardul sau prin transfer bancar.
                </p>
              </div>
              <div style="padding:16px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
                Binevo - Platforma pentru ONG-uri din Romania
              </div>
            </div>
          `,
          from: "noreply@binevo.ro",
          fromName: "Binevo",
        });
      } catch (err) {
        console.error("Failed to send invoice email:", err);
      }
    }

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

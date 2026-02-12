/**
 * GET /api/cron/billing
 * Cron job endpoint for billing operations:
 * 1. Generate monthly recurring invoices
 * 2. Check and mark overdue invoices
 * 3. Suspend services for non-payment
 * 4. Send payment reminders
 *
 * Should be called daily via Railway cron or external scheduler
 * Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateMonthlyRecurringInvoices,
  checkOverdueInvoices,
} from "@/lib/invoice-generator";
import { sendEmail } from "@/lib/email";
import prisma from "@/lib/db";
import { getBinevoLogoHtml } from "@/components/BinevoLogo";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      invoiceGeneration: null,
      overdueCheck: null,
      reminders: { sent: 0, errors: [] as string[] },
    };

    // 1. Generate monthly invoices
    results.invoiceGeneration = await generateMonthlyRecurringInvoices();

    // 2. Check overdue invoices & suspend
    results.overdueCheck = await checkOverdueInvoices();

    // 3. Send payment reminders for invoices due in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const today = new Date();

    const dueSoonInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["ISSUED", "SENT"] },
        dueDate: {
          gt: today,
          lte: threeDaysFromNow,
        },
        ngoId: { not: null },
      },
    });

    const logo = getBinevoLogoHtml(140);

    for (const invoice of dueSoonInvoices) {
      try {
        if (invoice.buyerEmail && invoice.paymentToken) {
          const daysLeft = Math.ceil(
            (invoice.dueDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const paymentUrl = `${APP_URL}/factura/${invoice.paymentToken}`;

          await sendEmail({
            to: invoice.buyerEmail,
            subject: `Reminder: Factura ${invoice.invoiceNumber} scadenta in ${daysLeft} zile`,
            html: `
              <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="padding:24px;text-align:center;border-bottom:3px solid #6366f1;">
                  ${logo}
                </div>
                <div style="padding:24px;">
                  <h2 style="color:#1a1a2e;">Reminder plata factura</h2>
                  <p style="color:#4b5563;line-height:1.6;">
                    Factura <strong>${invoice.invoiceNumber}</strong> in valoare de
                    <strong>${invoice.totalAmount.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} ${invoice.currency}</strong>
                    este scadenta in <strong>${daysLeft} zile</strong>.
                  </p>
                  ${invoice.subscriptionPlan ? `
                  <p style="color:#4b5563;line-height:1.6;">
                    Aceasta factura este pentru abonamentul <strong>${invoice.subscriptionPlan}</strong> Binevo.
                    Daca nu este platita la timp, serviciile vor fi suspendate.
                  </p>` : ""}
                  <div style="margin:24px 0;text-align:center;">
                    <a href="${paymentUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                      Plateste acum
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

          results.reminders.sent++;
        }
      } catch (err: any) {
        results.reminders.errors.push(`Reminder failed for ${invoice.invoiceNumber}: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Cron billing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

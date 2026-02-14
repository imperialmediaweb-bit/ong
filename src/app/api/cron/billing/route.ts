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
import prisma from "@/lib/db";
import { notifyPaymentReminder } from "@/lib/platform-notifications";

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

    for (const invoice of dueSoonInvoices) {
      try {
        if (invoice.ngoId) {
          const paymentUrl = invoice.paymentToken
            ? `${APP_URL}/factura/${invoice.paymentToken}`
            : `${APP_URL}/dashboard/billing`;

          await notifyPaymentReminder({
            ngoName: invoice.buyerName || "ONG",
            ngoId: invoice.ngoId,
            plan: invoice.subscriptionPlan || "abonament",
            amount: invoice.totalAmount,
            currency: invoice.currency,
            dueDate: invoice.dueDate!,
            paymentUrl,
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

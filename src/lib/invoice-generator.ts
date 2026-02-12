/**
 * Invoice Generator
 * Auto-generates invoices for subscription payments,
 * handles payment tokens, and invoice HTML rendering
 */

import prisma from "@/lib/db";
import { randomBytes } from "crypto";
import { getBinevoLogoHtml } from "@/components/BinevoLogo";

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

// ─── Generate Payment Token ─────────────────────────────────────

function generatePaymentToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Create Subscription Invoice ────────────────────────────────

export async function createSubscriptionInvoice(params: {
  ngoId: string;
  plan: "PRO" | "ELITE";
  billingMonth?: string; // e.g. "2026-02"
  isRecurring?: boolean;
  autoIssue?: boolean;
}): Promise<{ invoiceId: string; paymentToken: string; paymentUrl: string } | null> {
  const ngo = await prisma.ngo.findUnique({
    where: { id: params.ngoId },
    include: {
      users: {
        where: { role: "NGO_ADMIN" },
        select: { email: true, name: true, id: true },
      },
    },
  });

  if (!ngo) return null;

  // Get billing config
  let billing = await prisma.platformBilling.findUnique({
    where: { id: "billing" },
  });

  if (!billing) {
    billing = await prisma.platformBilling.create({
      data: { id: "billing" },
    });
  }

  // Plan prices
  const planPrices: Record<string, number> = { PRO: 149, ELITE: 349 };
  const price = planPrices[params.plan] || 0;
  if (price === 0) return null;

  // Generate invoice number
  const prefix = billing.invoicePrefix || "BNV";
  const series = billing.invoiceSeries || "";
  const nextNum = billing.invoiceNextNumber || 1;
  const invoiceNumber = series
    ? `${series}-${String(nextNum).padStart(4, "0")}`
    : `${prefix}-${String(nextNum).padStart(4, "0")}`;

  // Calculate billing period
  const now = new Date();
  const billingMonth = params.billingMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthNames = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
  ];
  const [year, month] = billingMonth.split("-").map(Number);
  const periodLabel = `${monthNames[month - 1]} ${year}`;

  // Calculate VAT
  const isVatPayer = billing.companyVatPayer;
  const vatRate = isVatPayer ? (billing.invoiceVatRate || 19) : 0;
  const subtotal = price;
  const vatAmount = isVatPayer ? subtotal * (vatRate / 100) : 0;
  const totalAmount = subtotal + vatAmount;

  // Payment terms
  const paymentTerms = billing.invoicePaymentTerms || 15;
  const dueDate = new Date(now.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

  // Generate unique payment token
  const paymentToken = generatePaymentToken();

  // Items
  const items = [
    {
      description: `Abonament ${params.plan} Binevo - ${periodLabel}`,
      quantity: 1,
      unit: "luna",
      unitPrice: price,
      vatRate,
      totalNet: subtotal,
      totalVat: vatAmount,
      totalGross: totalAmount,
    },
  ];

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      invoiceSeries: series || null,

      // Seller (Platform)
      sellerName: billing.companyName || "Binevo SRL",
      sellerCui: billing.companyCui,
      sellerRegCom: billing.companyRegCom,
      sellerAddress: billing.companyAddress,
      sellerCity: billing.companyCity,
      sellerCounty: billing.companyCounty,
      sellerEmail: billing.companyEmail,
      sellerPhone: billing.companyPhone,
      sellerIban: billing.companyIban,
      sellerBankName: billing.companyBankName,
      sellerVatPayer: isVatPayer,

      // Buyer (NGO)
      buyerName: ngo.billingName || ngo.name,
      buyerCui: ngo.billingCui || ngo.cui,
      buyerAddress: ngo.billingAddress,
      buyerCity: ngo.billingCity,
      buyerCounty: ngo.billingCounty,
      buyerEmail: ngo.billingEmail || ngo.users[0]?.email,
      buyerPhone: ngo.billingPhone,

      ngoId: ngo.id,

      // Dates
      issueDate: now,
      dueDate,
      status: params.autoIssue ? "ISSUED" : "DRAFT",

      // Items and totals
      items: items as any,
      subtotal,
      vatAmount,
      totalAmount,
      currency: billing.invoiceCurrency || "RON",

      // Payment token for public page
      paymentToken,

      // Subscription info
      subscriptionPlan: params.plan,
      subscriptionMonth: billingMonth,
      isRecurring: params.isRecurring || false,

      // Notes
      notes: billing.invoiceNotes || `Termen de plata: ${paymentTerms} zile de la emitere.`,
    },
  });

  // Increment invoice number
  await prisma.platformBilling.update({
    where: { id: "billing" },
    data: { invoiceNextNumber: nextNum + 1 },
  });

  return {
    invoiceId: invoice.id,
    paymentToken,
    paymentUrl: `${APP_URL}/factura/${paymentToken}`,
  };
}

// ─── Generate Monthly Recurring Invoices ────────────────────────

export async function generateMonthlyRecurringInvoices(): Promise<{
  generated: number;
  errors: string[];
}> {
  const results = { generated: 0, errors: [] as string[] };

  const now = new Date();
  const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Find all active NGOs with paid plans that need invoicing
  const ngos = await prisma.ngo.findMany({
    where: {
      isActive: true,
      subscriptionPlan: { in: ["PRO", "ELITE"] },
      subscriptionStatus: "active",
    },
  });

  for (const ngo of ngos) {
    try {
      // Check if invoice already exists for this month
      const existing = await prisma.invoice.findFirst({
        where: {
          ngoId: ngo.id,
          subscriptionMonth: billingMonth,
        },
      });

      if (existing) continue; // Already invoiced

      const result = await createSubscriptionInvoice({
        ngoId: ngo.id,
        plan: ngo.subscriptionPlan as "PRO" | "ELITE",
        billingMonth,
        isRecurring: ngo.paymentMethod === "recurring_card",
        autoIssue: true,
      });

      if (result) {
        results.generated++;

        // If recurring card payment, auto-charge
        if (ngo.paymentMethod === "recurring_card" && ngo.stripePaymentMethodId) {
          try {
            await chargeRecurringPayment(ngo.id, result.invoiceId);
          } catch (err: any) {
            results.errors.push(`Auto-charge failed for ${ngo.name}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      results.errors.push(`Invoice generation failed for ${ngo.name}: ${err.message}`);
    }
  }

  return results;
}

// ─── Charge Recurring Payment ───────────────────────────────────

async function chargeRecurringPayment(ngoId: string, invoiceId: string): Promise<void> {
  // Lazy import to avoid build errors
  const { getStripe } = await import("@/lib/stripe");

  const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!ngo || !invoice || !ngo.stripeCustomerId || !ngo.stripePaymentMethodId) {
    throw new Error("Missing payment configuration for recurring charge");
  }

  const stripe = getStripe();

  // Create and confirm payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(invoice.totalAmount * 100), // Stripe uses cents
    currency: invoice.currency.toLowerCase(),
    customer: ngo.stripeCustomerId,
    payment_method: ngo.stripePaymentMethodId,
    off_session: true,
    confirm: true,
    metadata: {
      invoiceId: invoice.id,
      ngoId: ngo.id,
      type: "subscription_recurring",
    },
  });

  if (paymentIntent.status === "succeeded") {
    // Mark invoice as paid
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "stripe_recurring",
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // Extend subscription
    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + 1);
    await prisma.ngo.update({
      where: { id: ngoId },
      data: {
        subscriptionStatus: "active",
        subscriptionExpiresAt: newExpiry,
      },
    });
  }
}

// ─── Mark Invoice as Paid ───────────────────────────────────────

export async function markInvoicePaid(params: {
  invoiceId: string;
  paymentMethod: string;
  stripePaymentIntentId?: string;
}): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });

  if (!invoice || invoice.status === "PAID") return false;

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: params.paymentMethod,
      stripePaymentIntentId: params.stripePaymentIntentId,
    },
  });

  // If this is a subscription invoice, activate the plan
  if (invoice.ngoId && invoice.subscriptionPlan) {
    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + 1);

    await prisma.ngo.update({
      where: { id: invoice.ngoId },
      data: {
        subscriptionPlan: invoice.subscriptionPlan as any,
        subscriptionStatus: "active",
        subscriptionStartAt: new Date(),
        subscriptionExpiresAt: newExpiry,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        ngoId: invoice.ngoId,
        type: "SUBSCRIPTION_RENEWED",
        title: `Plata confirmata - Plan ${invoice.subscriptionPlan}`,
        message: `Factura ${invoice.invoiceNumber} a fost platita. Planul ${invoice.subscriptionPlan} este activ.`,
        actionUrl: "/dashboard/settings",
      },
    });
  }

  return true;
}

// ─── Check Overdue Invoices & Suspend Services ──────────────────

export async function checkOverdueInvoices(): Promise<{
  overdue: number;
  suspended: number;
  errors: string[];
}> {
  const results = { overdue: 0, suspended: 0, errors: [] as string[] };
  const now = new Date();

  // Find invoices past due date that aren't paid
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["ISSUED", "SENT"] },
      dueDate: { lt: now },
    },
  });

  for (const invoice of overdueInvoices) {
    try {
      // Mark as overdue
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });
      results.overdue++;

      // If subscription invoice, check grace period (7 days after due date)
      if (invoice.ngoId && invoice.subscriptionPlan) {
        const gracePeriodEnd = new Date(invoice.dueDate!.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (now > gracePeriodEnd) {
          // Suspend/downgrade
          await prisma.ngo.update({
            where: { id: invoice.ngoId },
            data: {
              subscriptionPlan: "BASIC",
              subscriptionStatus: "suspended",
            },
          });

          await prisma.notification.create({
            data: {
              ngoId: invoice.ngoId,
              type: "SUBSCRIPTION_EXPIRED",
              title: "Servicii suspendate - factura neplatita",
              message: `Factura ${invoice.invoiceNumber} nu a fost platita. Serviciile au fost suspendate. Platiti factura pentru a reactiva planul.`,
              actionUrl: `/factura/${invoice.paymentToken}`,
            },
          });

          results.suspended++;
        }
      }
    } catch (err: any) {
      results.errors.push(`Error processing invoice ${invoice.invoiceNumber}: ${err.message}`);
    }
  }

  return results;
}

// ─── Generate Invoice HTML ──────────────────────────────────────

export function generateInvoiceHtml(invoice: any): string {
  const items = (invoice.items as any[]) || [];
  const logo = getBinevoLogoHtml(160);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const paymentUrl = invoice.paymentToken ? `${APP_URL}/factura/${invoice.paymentToken}` : "";

  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #f8f9fa; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
    .header { padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; }
    .invoice-title { font-size: 28px; font-weight: 800; color: #6366f1; margin-top: 8px; }
    .invoice-number { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; padding: 30px 40px; }
    .party { flex: 1; }
    .party h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; margin-bottom: 12px; font-weight: 600; }
    .party p { font-size: 13px; color: #374151; line-height: 1.6; }
    .party .company-name { font-weight: 700; font-size: 15px; color: #1a1a2e; }
    .dates { padding: 0 40px 20px; display: flex; gap: 40px; }
    .dates .date-item { }
    .dates .date-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600; }
    .dates .date-value { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-top: 2px; }
    table { width: calc(100% - 80px); margin: 0 40px; border-collapse: collapse; }
    thead th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    tbody td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5) { text-align: right; }
    .totals { padding: 20px 40px; display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals-table .row.total { border-top: 2px solid #6366f1; padding-top: 12px; margin-top: 6px; font-size: 18px; font-weight: 800; color: #6366f1; }
    .payment-section { margin: 20px 40px; padding: 20px; background: #f0f0ff; border-radius: 8px; border: 1px solid #c7d2fe; }
    .payment-section h3 { font-size: 14px; font-weight: 700; color: #4338ca; margin-bottom: 8px; }
    .payment-section p { font-size: 13px; color: #4b5563; line-height: 1.6; }
    .payment-link { display: inline-block; margin-top: 12px; padding: 10px 24px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .notes { padding: 20px 40px 30px; font-size: 12px; color: #9ca3af; }
    .footer { padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-ISSUED, .status-SENT { background: #dbeafe; color: #1e40af; }
    .status-OVERDUE { background: #fee2e2; color: #991b1b; }
    .status-DRAFT { background: #f3f4f6; color: #4b5563; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div>
        ${logo}
        <div class="invoice-title">FACTURA</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>
      <div style="text-align:right;">
        <span class="status-badge status-${invoice.status}">${
    invoice.status === "PAID" ? "PLATITA" :
    invoice.status === "ISSUED" ? "EMISA" :
    invoice.status === "SENT" ? "TRIMISA" :
    invoice.status === "OVERDUE" ? "RESTANTA" :
    invoice.status === "DRAFT" ? "CIORNA" :
    invoice.status
  }</span>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Furnizor</h3>
        <p class="company-name">${invoice.sellerName || ""}</p>
        ${invoice.sellerCui ? `<p>CUI: ${invoice.sellerCui}</p>` : ""}
        ${invoice.sellerRegCom ? `<p>Reg. Com.: ${invoice.sellerRegCom}</p>` : ""}
        ${invoice.sellerAddress ? `<p>${invoice.sellerAddress}</p>` : ""}
        ${invoice.sellerCity ? `<p>${invoice.sellerCity}${invoice.sellerCounty ? `, ${invoice.sellerCounty}` : ""}</p>` : ""}
        ${invoice.sellerEmail ? `<p>Email: ${invoice.sellerEmail}</p>` : ""}
        ${invoice.sellerIban ? `<p>IBAN: ${invoice.sellerIban}</p>` : ""}
        ${invoice.sellerBankName ? `<p>Banca: ${invoice.sellerBankName}</p>` : ""}
      </div>
      <div class="party" style="text-align:right;">
        <h3>Cumparator</h3>
        <p class="company-name">${invoice.buyerName || ""}</p>
        ${invoice.buyerCui ? `<p>CUI: ${invoice.buyerCui}</p>` : ""}
        ${invoice.buyerRegCom ? `<p>Reg. Com.: ${invoice.buyerRegCom}</p>` : ""}
        ${invoice.buyerAddress ? `<p>${invoice.buyerAddress}</p>` : ""}
        ${invoice.buyerCity ? `<p>${invoice.buyerCity}${invoice.buyerCounty ? `, ${invoice.buyerCounty}` : ""}</p>` : ""}
        ${invoice.buyerEmail ? `<p>Email: ${invoice.buyerEmail}</p>` : ""}
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <div class="date-label">Data emiterii</div>
        <div class="date-value">${formatDate(invoice.issueDate)}</div>
      </div>
      ${invoice.dueDate ? `
      <div class="date-item">
        <div class="date-label">Scadenta</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>` : ""}
      ${invoice.paidAt ? `
      <div class="date-item">
        <div class="date-label">Data platii</div>
        <div class="date-value">${formatDate(invoice.paidAt)}</div>
      </div>` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Descriere</th>
          <th>Cant.</th>
          <th>Pret unitar</th>
          ${invoice.sellerVatPayer ? "<th>TVA %</th>" : ""}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description}</td>
          <td style="text-align:right;">${item.quantity} ${item.unit || ""}</td>
          <td style="text-align:right;">${formatAmount(item.unitPrice)} ${invoice.currency}</td>
          ${invoice.sellerVatPayer ? `<td style="text-align:right;">${item.vatRate}%</td>` : ""}
          <td style="text-align:right;font-weight:600;">${formatAmount(item.totalGross || item.totalNet)} ${invoice.currency}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="row">
          <span>Subtotal:</span>
          <span>${formatAmount(invoice.subtotal)} ${invoice.currency}</span>
        </div>
        ${invoice.sellerVatPayer ? `
        <div class="row">
          <span>TVA:</span>
          <span>${formatAmount(invoice.vatAmount)} ${invoice.currency}</span>
        </div>` : ""}
        <div class="row total">
          <span>TOTAL:</span>
          <span>${formatAmount(invoice.totalAmount)} ${invoice.currency}</span>
        </div>
      </div>
    </div>

    ${invoice.status !== "PAID" && paymentUrl ? `
    <div class="payment-section">
      <h3>Plateste online</h3>
      <p>Puteti plati aceasta factura online prin card bancar sau transfer bancar. Faceti click pe butonul de mai jos:</p>
      <a href="${paymentUrl}" class="payment-link">Plateste ${formatAmount(invoice.totalAmount)} ${invoice.currency}</a>
    </div>` : ""}

    ${invoice.notes ? `<div class="notes">${invoice.notes}</div>` : ""}

    <div class="footer">
      <p>Aceasta factura a fost generata automat de platforma Binevo - binevo.ro</p>
      <p style="margin-top:4px;">Pentru intrebari, contactati-ne la contact@binevo.ro</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Invoice Generator
 * Auto-generates invoices for subscription payments and credit packages,
 * handles payment tokens, and invoice HTML rendering
 */

import prisma from "@/lib/db";
import { randomBytes } from "crypto";
import { getBinevoLogoHtml } from "@/components/BinevoLogo";
import { sendEmail } from "@/lib/email";
import { creditPurchaseEmail } from "@/lib/subscription-emails";
import {
  notifyInvoiceCreated,
  notifyInvoicePaid,
  notifyCreditPurchase,
  notifySubscriptionRenewed,
  notifySubscriptionExpired,
  notifyPaymentFailed,
  notifyPaymentReminder,
} from "@/lib/platform-notifications";

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

  // Send invoice notification (email + in-app + super admin)
  notifyInvoiceCreated({
    ngoName: ngo.billingName || ngo.name,
    ngoId: ngo.id,
    invoiceNumber,
    amount: totalAmount,
    currency: billing.invoiceCurrency || "RON",
    plan: params.plan,
    period: periodLabel,
    dueDate,
    invoiceUrl: `${APP_URL}/factura/${paymentToken}`,
  }).catch(console.error);

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

  const stripe = await getStripe();

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

    // Send paid invoice notification (email + in-app)
    notifyInvoicePaid({
      ngoName: ngo.name,
      ngoId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      paymentMethod: "Stripe (recurenta)",
    }).catch(console.error);

    // Send subscription renewed notification
    notifySubscriptionRenewed({
      ngoName: ngo.name,
      ngoId,
      plan: invoice.subscriptionPlan || ngo.subscriptionPlan,
      nextExpiresAt: newExpiry,
    }).catch(console.error);
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

  // Get NGO name for notifications
  const ngo = invoice.ngoId ? await prisma.ngo.findUnique({
    where: { id: invoice.ngoId },
    select: { name: true },
  }) : null;

  // Send paid notification (email + in-app + super admin)
  if (invoice.ngoId && ngo) {
    notifyInvoicePaid({
      ngoName: ngo.name,
      ngoId: invoice.ngoId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      paymentMethod: params.paymentMethod,
    }).catch(console.error);
  }

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

    // Send subscription renewed notification
    if (ngo) {
      notifySubscriptionRenewed({
        ngoName: ngo.name,
        ngoId: invoice.ngoId,
        plan: invoice.subscriptionPlan,
        nextExpiresAt: newExpiry,
      }).catch(console.error);
    }
  }

  // If this is a credit purchase invoice, fulfill credits
  const meta = typeof invoice.metadata === "object" && invoice.metadata !== null ? invoice.metadata as any : {};
  if (meta.type === "credit_purchase") {
    await fulfillCreditPurchase(params.invoiceId);
  }

  return true;
}

// ─── Check Overdue Invoices & Suspend Services ──────────────────
// Flow:
// 1. Due date passed → mark OVERDUE + first warning email with payment link
// 2. +5 days overdue → second warning with cancel/downgrade option
// 3. +5 more days (10 total) → suspend services, downgrade to BASIC (free)

export async function checkOverdueInvoices(): Promise<{
  overdue: number;
  warned: number;
  suspended: number;
  errors: string[];
}> {
  const results = { overdue: 0, warned: 0, suspended: 0, errors: [] as string[] };
  const now = new Date();

  // Find invoices past due date that aren't paid
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["ISSUED", "SENT", "OVERDUE"] },
      dueDate: { lt: now },
    },
  });

  for (const invoice of unpaidInvoices) {
    try {
      const daysPastDue = Math.floor(
        (now.getTime() - invoice.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get NGO info for notifications
      let ngoName = invoice.buyerName || "ONG";
      if (invoice.ngoId) {
        const ngoData = await prisma.ngo.findUnique({
          where: { id: invoice.ngoId },
          select: { name: true, subscriptionPlan: true },
        });
        if (ngoData) ngoName = ngoData.name;
      }

      const paymentUrl = invoice.paymentToken
        ? `${APP_URL}/factura/${invoice.paymentToken}`
        : `${APP_URL}/dashboard/billing`;

      // Step 1: Just became overdue (0-5 days) → mark OVERDUE + first warning
      if (invoice.status !== "OVERDUE") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });
        results.overdue++;

        // First warning: factura + payment link
        if (invoice.ngoId) {
          notifyPaymentReminder({
            ngoName,
            ngoId: invoice.ngoId,
            plan: invoice.subscriptionPlan || "abonament",
            amount: invoice.totalAmount,
            currency: invoice.currency,
            dueDate: invoice.dueDate!,
            paymentUrl,
          }).catch(console.error);
        }
      }

      // Step 2: 5 days overdue → second warning with cancel/downgrade option
      if (daysPastDue >= 5 && daysPastDue < 10 && invoice.ngoId && invoice.subscriptionPlan) {
        // Check if we already sent second warning (using metadata)
        const meta = (typeof invoice.metadata === "object" && invoice.metadata !== null ? invoice.metadata : {}) as any;
        if (!meta.secondWarningAt) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              metadata: {
                ...meta,
                secondWarningAt: now.toISOString(),
              } as any,
            },
          });

          // Second warning: payment link + cancel/downgrade option
          const cancelUrl = `${APP_URL}/dashboard/settings`;
          await prisma.notification.create({
            data: {
              ngoId: invoice.ngoId,
              type: "PAYMENT_FAILED",
              title: `Ultima avertizare: factura ${invoice.invoiceNumber} restanta`,
              message: `Factura de ${invoice.totalAmount} ${invoice.currency} este restanta de ${daysPastDue} zile. Platiti acum sau planul va fi retrogradat la BASIC (gratuit) in 5 zile.`,
              actionUrl: paymentUrl,
            },
          });

          // Send second warning email with cancel option
          if (invoice.buyerEmail || invoice.ngoId) {
            const { default: prismaDb } = await import("@/lib/db");
            const ngoUsers = await prismaDb.user.findMany({
              where: { ngoId: invoice.ngoId, role: "NGO_ADMIN", isActive: true },
              select: { email: true },
            });

            const { sendPlatformEmail } = await import("@/lib/email-sender");
            const warningHtml = `
              <!DOCTYPE html>
              <html><head><meta charset="utf-8"></head>
              <body style="margin:0;padding:20px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                  <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:28px 24px;text-align:center;color:white;">
                    <h1 style="margin:0;font-size:22px;">Ultima Avertizare - Factura Restanta</h1>
                  </div>
                  <div style="padding:28px 24px;color:#374151;line-height:1.6;">
                    <p>Buna ziua,</p>
                    <p>Factura <strong>${invoice.invoiceNumber}</strong> in valoare de <strong>${invoice.totalAmount} ${invoice.currency}</strong> pentru planul <strong>${invoice.subscriptionPlan}</strong> este restanta de <strong>${daysPastDue} zile</strong>.</p>
                    <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
                      <p style="margin:0;color:#991b1b;font-weight:600;">Ce se intampla daca nu platiti:</p>
                      <ul style="color:#991b1b;font-size:14px;margin:8px 0 0;padding-left:20px;">
                        <li>Planul ${invoice.subscriptionPlan} va fi dezactivat</li>
                        <li>Contul va fi retrogradat la BASIC (gratuit)</li>
                        <li>Functiile avansate vor fi dezactivate</li>
                      </ul>
                    </div>
                    <div style="text-align:center;margin:24px 0;">
                      <a href="${paymentUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#dc2626,#ef4444);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Plateste acum</a>
                    </div>
                    <div style="text-align:center;margin:16px 0;padding-top:16px;border-top:1px solid #e5e7eb;">
                      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Nu mai doriti acest abonament?</p>
                      <a href="${cancelUrl}" style="display:inline-block;padding:10px 24px;background:#f3f4f6;color:#4b5563;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #d1d5db;">Anuleaza abonamentul (treci la BASIC)</a>
                    </div>
                  </div>
                  <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Binevo - Platforma pentru ONG-uri din Romania
                  </div>
                </div>
              </body></html>`;

            const recipients = [invoice.buyerEmail, ...ngoUsers.map(u => u.email)].filter(Boolean) as string[];
            const uniqueRecipients = Array.from(new Set(recipients));
            for (const email of uniqueRecipients) {
              await sendPlatformEmail({
                to: email!,
                subject: `ULTIMA AVERTIZARE: Factura ${invoice.invoiceNumber} restanta de ${daysPastDue} zile`,
                html: warningHtml,
              }).catch(console.error);
            }
          }

          results.warned++;
        }
      }

      // Step 3: 10+ days overdue → suspend + downgrade to BASIC (free)
      if (daysPastDue >= 10 && invoice.ngoId && invoice.subscriptionPlan) {
        const meta = (typeof invoice.metadata === "object" && invoice.metadata !== null ? invoice.metadata : {}) as any;
        if (!meta.suspendedAt) {
          const previousPlan = invoice.subscriptionPlan;

          // Downgrade to BASIC
          await prisma.ngo.update({
            where: { id: invoice.ngoId },
            data: {
              subscriptionPlan: "BASIC",
              subscriptionStatus: "suspended",
              subscriptionExpiresAt: null,
            },
          });

          // Mark in invoice metadata
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              metadata: {
                ...meta,
                suspendedAt: now.toISOString(),
                previousPlan,
              } as any,
            },
          });

          // Audit log
          await prisma.auditLog.create({
            data: {
              ngoId: invoice.ngoId,
              action: "SUBSCRIPTION_SUSPENDED",
              entityType: "Invoice",
              entityId: invoice.id,
              details: {
                reason: "Factura neplatita",
                invoiceNumber: invoice.invoiceNumber,
                previousPlan,
                daysPastDue,
              } as any,
            },
          });

          // Send suspended notification
          notifySubscriptionExpired({
            ngoName,
            ngoId: invoice.ngoId,
            previousPlan,
          }).catch(console.error);

          results.suspended++;
        }
      }
    } catch (err: any) {
      results.errors.push(`Error processing invoice ${invoice.invoiceNumber}: ${err.message}`);
    }
  }

  return results;
}

// ─── Create Credit Package Invoice ──────────────────────────────

export async function createCreditInvoice(params: {
  ngoId: string;
  packageId: string;
  packageName: string;
  emailCredits: number;
  smsCredits: number;
  price: number;
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

  const price = params.price;
  if (price <= 0) return null;

  // Generate invoice number
  const prefix = billing.invoicePrefix || "BNV";
  const series = billing.invoiceSeries || "";
  const nextNum = billing.invoiceNextNumber || 1;
  const invoiceNumber = series
    ? `${series}-${String(nextNum).padStart(4, "0")}`
    : `${prefix}-${String(nextNum).padStart(4, "0")}`;

  // Calculate VAT
  const isVatPayer = billing.companyVatPayer;
  const vatRate = isVatPayer ? (billing.invoiceVatRate || 19) : 0;
  const subtotal = price;
  const vatAmount = isVatPayer ? subtotal * (vatRate / 100) : 0;
  const totalAmount = subtotal + vatAmount;

  // Payment terms - immediate for credit packages
  const paymentTerms = 7;
  const dueDate = new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000);

  // Generate unique payment token
  const paymentToken = generatePaymentToken();

  // Build item description
  const parts: string[] = [];
  if (params.emailCredits > 0) parts.push(`${params.emailCredits.toLocaleString("ro-RO")} emailuri`);
  if (params.smsCredits > 0) parts.push(`${params.smsCredits.toLocaleString("ro-RO")} SMS-uri`);
  const creditsDescription = parts.join(" + ");

  const items = [
    {
      description: `Pachet credite: ${params.packageName} (${creditsDescription})`,
      quantity: 1,
      unit: "pachet",
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
      issueDate: new Date(),
      dueDate,
      status: "ISSUED",

      // Items and totals
      items: items as any,
      subtotal,
      vatAmount,
      totalAmount,
      currency: billing.invoiceCurrency || "RON",

      // Payment token for public page
      paymentToken,

      // No subscription link - this is a credit purchase
      subscriptionPlan: null,
      subscriptionMonth: null,
      isRecurring: false,

      // Metadata for credit package
      metadata: {
        type: "credit_purchase",
        packageId: params.packageId,
        packageName: params.packageName,
        emailCredits: params.emailCredits,
        smsCredits: params.smsCredits,
      } as any,

      notes: `Pachet credite campanii: ${params.packageName}. Termen de plata: ${paymentTerms} zile.`,
    },
  });

  // Increment invoice number
  await prisma.platformBilling.update({
    where: { id: "billing" },
    data: { invoiceNextNumber: nextNum + 1 },
  });

  // Send invoice notification (email + in-app + super admin)
  notifyInvoiceCreated({
    ngoName: ngo.billingName || ngo.name,
    ngoId: ngo.id,
    invoiceNumber,
    amount: totalAmount,
    currency: billing.invoiceCurrency || "RON",
    plan: params.packageName,
    period: `Pachet credite: ${creditsDescription}`,
    dueDate,
    invoiceUrl: `${APP_URL}/factura/${paymentToken}`,
  }).catch(console.error);

  return {
    invoiceId: invoice.id,
    paymentToken,
    paymentUrl: `${APP_URL}/factura/${paymentToken}`,
  };
}

// ─── Fulfill Credit Purchase (after payment) ───────────────────

export async function fulfillCreditPurchase(invoiceId: string): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice || !invoice.ngoId || !invoice.metadata) return false;

  const meta = invoice.metadata as any;
  if (meta.type !== "credit_purchase" || meta.fulfilled) return false;

  const emailCredits = meta.emailCredits || 0;
  const smsCredits = meta.smsCredits || 0;
  const packageName = meta.packageName || "Pachet credite";

  // Get current balance
  const ngo = await prisma.ngo.findUnique({
    where: { id: invoice.ngoId },
    select: { emailCredits: true, smsCredits: true },
  });

  if (!ngo) return false;

  const currentEmail = ngo.emailCredits ?? 0;
  const currentSms = ngo.smsCredits ?? 0;

  // Update credits
  const updatedNgo = await prisma.ngo.update({
    where: { id: invoice.ngoId },
    data: {
      emailCredits: currentEmail + emailCredits,
      smsCredits: currentSms + smsCredits,
    },
  });

  // Log transactions
  const transactions = [];
  if (emailCredits > 0) {
    transactions.push(
      prisma.creditTransaction.create({
        data: {
          ngoId: invoice.ngoId,
          type: "PURCHASE",
          channel: "EMAIL",
          amount: emailCredits,
          balance: updatedNgo.emailCredits,
          description: `Pachet: ${packageName} (${emailCredits} emailuri) - Factura ${invoice.invoiceNumber}`,
        },
      })
    );
  }
  if (smsCredits > 0) {
    transactions.push(
      prisma.creditTransaction.create({
        data: {
          ngoId: invoice.ngoId,
          type: "PURCHASE",
          channel: "SMS",
          amount: smsCredits,
          balance: updatedNgo.smsCredits,
          description: `Pachet: ${packageName} (${smsCredits} SMS-uri) - Factura ${invoice.invoiceNumber}`,
        },
      })
    );
  }

  await Promise.all(transactions);

  // Mark as fulfilled in metadata to prevent double-fulfillment
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      metadata: {
        ...meta,
        fulfilled: true,
        fulfilledAt: new Date().toISOString(),
      } as any,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      ngoId: invoice.ngoId,
      type: "PAYMENT_RECEIVED" as any,
      title: "Credite adaugate cu succes",
      message: `Pachetul ${packageName} a fost activat. ${emailCredits > 0 ? `+${emailCredits} emailuri` : ""}${emailCredits > 0 && smsCredits > 0 ? " si " : ""}${smsCredits > 0 ? `+${smsCredits} SMS-uri` : ""}.`,
      actionUrl: "/dashboard/campaigns",
    },
  });

  // Send credit purchase notification (email + in-app + super admin)
  const ngoData = await prisma.ngo.findUnique({
    where: { id: invoice.ngoId },
    select: { name: true },
  });

  if (ngoData) {
    notifyCreditPurchase({
      ngoName: ngoData.name,
      ngoId: invoice.ngoId,
      packageName,
      emailCredits,
      smsCredits,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
      paymentUrl: `${APP_URL}/factura/${invoice.paymentToken}`,
    }).catch(console.error);
  }

  return true;
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

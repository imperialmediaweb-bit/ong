/**
 * Stripe Connect Integration - Donatiile merg direct in contul ONG-ului
 * Platforma ia un comision optional prin application_fee_amount
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY nu este configurat");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as any,
    });
  }
  return _stripe;
}

// ─── Creare Cont Connect ────────────────────────────────────────

/**
 * Creeaza un cont Stripe Connect Express pentru un ONG
 * Returneaza ID-ul contului (acct_xxx)
 */
export async function createConnectAccount(
  ngoId: string,
  email: string,
  ngoName: string
): Promise<string> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    country: "RO",
    email,
    business_type: "non_profit",
    company: {
      name: ngoName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      ngoId,
      platform: "ngo-hub",
    },
  });

  return account.id;
}

// ─── Link Onboarding ────────────────────────────────────────────

/**
 * Creeaza link-ul de onboarding pentru ca ONG-ul sa isi completeze configurarea Stripe
 */
export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripe();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });

  return accountLink.url;
}

// ─── Status Cont ────────────────────────────────────────────────

/**
 * Verifica statusul contului Connect - daca poate primi plati si transferuri
 */
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requiresAction: boolean;
  currentlyDue: string[];
}> {
  const stripe = getStripe();

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requiresAction: (account.requirements?.currently_due?.length || 0) > 0,
    currentlyDue: account.requirements?.currently_due || [],
  };
}

// ─── Link Dashboard Express ─────────────────────────────────────

/**
 * Creeaza un link catre dashboard-ul Express pentru ca ONG-ul sa isi gestioneze platile
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const stripe = getStripe();

  const loginLink = await stripe.accounts.createLoginLink(accountId);

  return loginLink.url;
}

// ─── Payment Intent (plata directa) ─────────────────────────────

/**
 * Creeaza un Payment Intent - banii merg direct in contul Connect al ONG-ului
 * application_fee_amount = comisionul platformei (in bani, ex: 250 = 2.50 RON)
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  connectedAccountId: string;
  applicationFeePercent?: number;
  donorEmail?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  const applicationFeeAmount = params.applicationFeePercent
    ? Math.round(params.amount * (params.applicationFeePercent / 100))
    : undefined;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    application_fee_amount: applicationFeeAmount,
    receipt_email: params.donorEmail,
    metadata: params.metadata || {},
    transfer_data: {
      destination: params.connectedAccountId,
    },
  });

  return paymentIntent;
}

// ─── Checkout Session (donatie) ─────────────────────────────────

/**
 * Creeaza o sesiune Checkout pentru o donatie unica
 * Banii merg direct in contul ONG-ului, platforma ia comision optional
 */
export async function createDonationCheckout(params: {
  ngoName: string;
  amount: number;
  currency: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
  donorEmail?: string;
  applicationFeePercent?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const applicationFeeAmount = params.applicationFeePercent
    ? Math.round(params.amount * (params.applicationFeePercent / 100))
    : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Donatie pentru ${params.ngoName}`,
            description: `Donatie prin platforma NGO HUB`,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: params.connectedAccountId,
      },
      metadata: params.metadata || {},
    },
    customer_email: params.donorEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  });

  return session;
}

// ─── Verificare Webhook Signature ───────────────────────────────

/**
 * Verifica semnatura webhook-ului Stripe Connect
 */
export function constructConnectWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET nu este configurat");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

// ─── Retrieve Checkout Session ──────────────────────────────────

/**
 * Recupereaza detaliile unei sesiuni Checkout (pentru verificare dupa plata)
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

/**
 * Stripe Connect Integration - Donatiile merg direct in contul ONG-ului
 * Platforma ia un comision prin application_fee_amount bazat pe planul ONG-ului
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

export interface ConnectAccountStatus {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requiresAction: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  disabledReason: string | null;
}

/**
 * Verifica statusul contului Connect - daca poate primi plati si transferuri
 */
export async function getAccountStatus(accountId: string): Promise<ConnectAccountStatus> {
  const stripe = getStripe();

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requiresAction: (account.requirements?.currently_due?.length || 0) > 0,
    currentlyDue: account.requirements?.currently_due || [],
    eventuallyDue: account.requirements?.eventually_due || [],
    disabledReason: account.requirements?.disabled_reason || null,
  };
}

/**
 * Full account sync - retrieves status and returns all data needed for DB update
 */
export async function syncAccountStatus(accountId: string): Promise<{
  status: string;
  onboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsJson: Record<string, any>;
}> {
  const accountStatus = await getAccountStatus(accountId);

  let status = "pending";
  let onboarded = false;

  if (accountStatus.chargesEnabled && accountStatus.payoutsEnabled) {
    status = "active";
    onboarded = true;
  } else if (accountStatus.detailsSubmitted && !accountStatus.chargesEnabled) {
    status = "restricted";
  }

  return {
    status,
    onboarded,
    chargesEnabled: accountStatus.chargesEnabled,
    payoutsEnabled: accountStatus.payoutsEnabled,
    requirementsJson: {
      currentlyDue: accountStatus.currentlyDue,
      eventuallyDue: accountStatus.eventuallyDue,
      disabledReason: accountStatus.disabledReason,
      requiresAction: accountStatus.requiresAction,
    },
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

// ─── Checkout Session (donatie cu fee calculat) ─────────────────

/**
 * Creeaza o sesiune Checkout pentru o donatie unica
 * Banii merg direct in contul ONG-ului, platforma ia comision calculat prin DonationFeeService
 */
export async function createDonationCheckout(params: {
  ngoName: string;
  amount: number;           // amount in minor units (bani)
  currency: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
  donorEmail?: string;
  applicationFeeAmount?: number;  // fee in minor units (bani), pre-calculated
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

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
      application_fee_amount: params.applicationFeeAmount || undefined,
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

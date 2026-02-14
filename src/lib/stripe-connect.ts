/**
 * Stripe Connect Integration - Donatiile merg direct in contul ONG-ului
 * Platforma ia un comision prin application_fee_amount bazat pe planul ONG-ului
 *
 * Keys are resolved from env vars first, then PlatformSettings DB as fallback.
 */

import Stripe from "stripe";
import { getStripeKeys } from "@/lib/stripe-keys";

let _stripe: Stripe | null = null;
let _stripeKeyUsed: string | null = null;

async function getStripe(): Promise<Stripe> {
  const keys = await getStripeKeys();

  if (!keys.secretKey) {
    throw new Error("STRIPE_SECRET_KEY nu este configurat (nici in env, nici in PlatformSettings)");
  }

  if (!keys.enabled) {
    throw new Error("Stripe este dezactivat din setarile platformei");
  }

  // Re-create instance if key changed
  if (_stripe && _stripeKeyUsed === keys.secretKey) {
    return _stripe;
  }

  _stripe = new Stripe(keys.secretKey, {
    apiVersion: "2024-06-20" as any,
  });
  _stripeKeyUsed = keys.secretKey;

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
  const stripe = await getStripe();

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
      platform: "binevo",
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
  const stripe = await getStripe();

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
  const stripe = await getStripe();

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
  const stripe = await getStripe();

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
  const stripe = await getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Donatie pentru ${params.ngoName}`,
            description: `Donatie prin platforma Binevo`,
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
export async function constructConnectWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = await getStripe();
  const keys = await getStripeKeys();

  if (!keys.connectWebhookSecret) {
    throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET nu este configurat (nici in env, nici in PlatformSettings)");
  }

  return stripe.webhooks.constructEvent(body, signature, keys.connectWebhookSecret);
}

// ─── Retrieve Checkout Session ──────────────────────────────────

/**
 * Recupereaza detaliile unei sesiuni Checkout (pentru verificare dupa plata)
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = await getStripe();

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

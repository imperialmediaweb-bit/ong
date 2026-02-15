/**
 * Stripe Integration for Subscription Payments
 * Handles checkout, webhooks, and subscription management
 *
 * Keys are resolved from env vars first, then PlatformSettings DB as fallback.
 */

import Stripe from "stripe";
import { getStripeKeys } from "@/lib/stripe-keys";

let _stripe: Stripe | null = null;
let _stripeKeyUsed: string | null = null;

/**
 * Get or create Stripe instance. Async because keys may come from DB.
 * Re-creates instance if the secret key changed (e.g. admin updated it).
 */
export async function getStripe(): Promise<Stripe> {
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

// ─── Plan Configuration ──────────────────────────────────────────

export interface PlanConfig {
  name: string;
  priceId: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  BASIC: {
    name: "Basic",
    priceId: process.env.STRIPE_PRICE_BASIC || "",
    price: 0,
    currency: "RON",
    interval: "month",
    features: [
      "Vizualizare donatori",
      "GDPR tools de baza",
      "Mini-site",
      "100 donatori",
    ],
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO || "",
    price: 149,
    currency: "RON",
    interval: "month",
    features: [
      "Totul din Basic",
      "Campanii email",
      "Generator AI",
      "Automatizari de baza",
      "Analitica",
      "Export CSV",
      "1.000 donatori",
      "Suport prioritar",
    ],
  },
  ELITE: {
    name: "Elite",
    priceId: process.env.STRIPE_PRICE_ELITE || "",
    price: 349,
    currency: "RON",
    interval: "month",
    features: [
      "Totul din Pro",
      "Campanii SMS",
      "Automatizari avansate",
      "A/B Testing",
      "Optimizare AI",
      "Super Agent AI",
      "Donatori nelimitati",
      "Suport dedicat",
    ],
  },
};

// ─── Checkout Session ────────────────────────────────────────────

export async function createCheckoutSession(params: {
  ngoId: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<string> {
  const stripe = await getStripe();
  const planConfig = PLAN_CONFIGS[params.plan];

  if (!planConfig || !planConfig.priceId) {
    throw new Error(`Plan invalid sau pretul nu este configurat: ${params.plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: {
      ngoId: params.ngoId,
      plan: params.plan,
    },
    subscription_data: {
      metadata: {
        ngoId: params.ngoId,
        plan: params.plan,
      },
    },
  });

  return session.url || "";
}

// ─── Customer Portal ─────────────────────────────────────────────

export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = await getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session.url;
}

// ─── Subscription Management ─────────────────────────────────────

export async function getSubscription(subscriptionId: string) {
  const stripe = await getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = await getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string) {
  const stripe = await getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// ─── Webhook Signature Verification ─────────────────────────────

export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = await getStripe();
  const keys = await getStripeKeys();

  if (!keys.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET nu este configurat (nici in env, nici in PlatformSettings)");
  }

  return stripe.webhooks.constructEvent(body, signature, keys.webhookSecret);
}

// ─── Check Expiration ────────────────────────────────────────────

export function isSubscriptionExpiring(
  currentPeriodEnd: number,
  daysThreshold: number = 7
): boolean {
  const endDate = new Date(currentPeriodEnd * 1000);
  const now = new Date();
  const diffDays = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= daysThreshold && diffDays > 0;
}

export function isSubscriptionExpired(currentPeriodEnd: number): boolean {
  const endDate = new Date(currentPeriodEnd * 1000);
  return endDate < new Date();
}

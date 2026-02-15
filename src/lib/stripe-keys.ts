/**
 * Stripe Keys Provider
 * Reads Stripe keys from environment variables first, then falls back to PlatformSettings in DB.
 * Caches DB results for 5 minutes to avoid hitting DB on every request.
 */

import prisma from "@/lib/db";

export interface StripeKeys {
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  connectWebhookSecret: string | null;
  enabled: boolean;
}

let _cachedKeys: StripeKeys | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve Stripe keys: env vars take priority, DB (PlatformSettings) is fallback.
 * Results are cached for 5 minutes.
 */
export async function getStripeKeys(): Promise<StripeKeys> {
  // Check if cache is still valid
  if (_cachedKeys && Date.now() - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedKeys;
  }

  // Start with env vars
  let secretKey = process.env.STRIPE_SECRET_KEY || null;
  let publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || null;
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;
  let connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || null;
  let enabled = true;

  // If secret key is missing from env, try DB
  if (!secretKey) {
    try {
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "platform" },
        select: {
          stripeEnabled: true,
          stripeSecretKey: true,
          stripePublishableKey: true,
          stripeWebhookSecret: true,
          stripeConnectWebhookSecret: true,
        },
      });

      if (settings) {
        enabled = settings.stripeEnabled;
        secretKey = settings.stripeSecretKey || secretKey;
        publishableKey = settings.stripePublishableKey || publishableKey;
        webhookSecret = settings.stripeWebhookSecret || webhookSecret;
        connectWebhookSecret = settings.stripeConnectWebhookSecret || connectWebhookSecret;
      }
    } catch (error) {
      console.error("Failed to load Stripe keys from DB:", error);
      // Continue with whatever we have from env
    }
  }

  _cachedKeys = { secretKey, publishableKey, webhookSecret, connectWebhookSecret, enabled };
  _cacheTimestamp = Date.now();

  return _cachedKeys;
}

/**
 * Invalidate the cached keys (e.g. after admin updates settings).
 */
export function invalidateStripeKeysCache(): void {
  _cachedKeys = null;
  _cacheTimestamp = 0;
}

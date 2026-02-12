/**
 * Netopia Payments Integration (V2 API)
 * Used for platform billing (subscriptions, SMS packages)
 *
 * Flow:
 * 1. Start payment → POST /payment/card/start
 * 2. Netopia returns payment URL or 3DS form
 * 3. User completes payment on Netopia
 * 4. IPN callback notifies our server
 * 5. User redirected back to our platform
 */

import crypto from "crypto";

// ─── Types ──────────────────────────────────────────────────────

export interface NetopiaConfig {
  apiKey: string;
  posSignature: string; // merchantId / POS Signature
  sandbox: boolean;
  notifyUrl: string;
  redirectUrl: string;
}

export interface NetopiaPaymentRequest {
  orderRef: string;        // unique order reference (invoice ID)
  amount: number;          // amount in RON
  currency: string;        // RON, EUR
  description: string;
  billing: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    country?: string;      // ISO 2 letter code
    countryCode?: string;
    address?: string;
  };
  metadata?: Record<string, string>;
}

export interface NetopiaStartResponse {
  status: number;          // 0 = success
  code: string;
  message: string;
  payment?: {
    ntpID: string;
    status: number;
    paymentURL?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface NetopiaIPNData {
  payment: {
    ntpID: string;
    status: number;     // 3 = confirmed/paid, 5 = confirmed pending, etc.
    amount: number;
    currency: string;
    token: string;
    data?: Record<string, any>;
  };
  order: {
    ntpID: string;
    posSignature: string;
    orderID: string;      // our order reference
    amount: number;
    currency: string;
    status: number;
    description: string;
  };
}

// ─── Payment Status Codes ───────────────────────────────────────

export const NETOPIA_STATUS = {
  NEW: 0,
  PENDING_AUTH: 1,
  PENDING: 2,
  CONFIRMED: 3,
  PAID_PENDING: 5,        // confirmed but pending settlement
  SCHEDULED: 6,
  DECLINED: 10,
  REVERSED: 11,
  REFUNDED: 12,
  REJECTED: 15,
  ERROR: -1,
} as const;

export function isNetopiaPaymentSuccessful(status: number): boolean {
  return status === NETOPIA_STATUS.CONFIRMED || status === NETOPIA_STATUS.PAID_PENDING;
}

export function getNetopiaStatusLabel(status: number): string {
  switch (status) {
    case NETOPIA_STATUS.NEW: return "Noua";
    case NETOPIA_STATUS.PENDING_AUTH: return "In asteptare autorizare";
    case NETOPIA_STATUS.PENDING: return "In procesare";
    case NETOPIA_STATUS.CONFIRMED: return "Confirmata";
    case NETOPIA_STATUS.PAID_PENDING: return "Confirmata (in curs de decontare)";
    case NETOPIA_STATUS.SCHEDULED: return "Programata";
    case NETOPIA_STATUS.DECLINED: return "Refuzata";
    case NETOPIA_STATUS.REVERSED: return "Reversata";
    case NETOPIA_STATUS.REFUNDED: return "Rambursata";
    case NETOPIA_STATUS.REJECTED: return "Respinsa";
    default: return "Necunoscuta";
  }
}

// ─── Configuration ──────────────────────────────────────────────

const NETOPIA_SANDBOX_URL = "https://secure.sandbox.netopia-payments.com";
const NETOPIA_PRODUCTION_URL = "https://secure.mobilpay.ro";

const NETOPIA_API_V2_SANDBOX = "https://sandbox.netopia-payments.com/payment/card/start";
const NETOPIA_API_V2_PRODUCTION = "https://secure.mobilpay.ro/pay/payment/card/start";

function getApiUrl(sandbox: boolean): string {
  return sandbox ? NETOPIA_API_V2_SANDBOX : NETOPIA_API_V2_PRODUCTION;
}

// ─── Lazy Config Loading ────────────────────────────────────────

let _config: NetopiaConfig | null = null;

export async function getNetopiaConfig(): Promise<NetopiaConfig | null> {
  // Load config from database (platform settings)
  try {
    const { default: prisma } = await import("@/lib/db");
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        netopiaEnabled: true,
        netopiaApiKey: true,
        netopiaMerchantId: true,
        netopiaSandbox: true,
        netopiaNotifyUrl: true,
      },
    });

    if (!settings?.netopiaEnabled || !settings.netopiaApiKey || !settings.netopiaMerchantId) {
      return null;
    }

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

    return {
      apiKey: settings.netopiaApiKey,
      posSignature: settings.netopiaMerchantId,
      sandbox: settings.netopiaSandbox,
      notifyUrl: settings.netopiaNotifyUrl || `${appUrl}/api/webhooks/netopia`,
      redirectUrl: `${appUrl}/factura`,
    };
  } catch (err) {
    console.error("Failed to load Netopia config:", err);
    return null;
  }
}

// ─── Start Payment ──────────────────────────────────────────────

/**
 * Start a Netopia card payment using V2 API
 * Returns payment URL to redirect user to
 */
export async function startNetopiaPayment(
  request: NetopiaPaymentRequest,
  config?: NetopiaConfig
): Promise<NetopiaStartResponse> {
  const cfg = config || await getNetopiaConfig();
  if (!cfg) {
    throw new Error("Netopia nu este configurat");
  }

  const apiUrl = getApiUrl(cfg.sandbox);

  // Netopia V2 API payload
  const payload = {
    config: {
      emailTemplate: "",
      notifyUrl: cfg.notifyUrl,
      redirectUrl: `${cfg.redirectUrl}/${request.metadata?.paymentToken || ""}?netopia=true`,
      language: "ro",
    },
    payment: {
      options: {
        installments: 0,
        bonus: 0,
      },
      instrument: {
        type: "card",
      },
      data: {
        ...(request.metadata || {}),
      },
    },
    order: {
      ntpID: "",
      posSignature: cfg.posSignature,
      dateTime: new Date().toISOString(),
      description: request.description,
      orderID: request.orderRef,
      amount: request.amount,
      currency: request.currency,
      billing: {
        email: request.billing.email,
        phone: request.billing.phone || "0700000000",
        firstName: request.billing.firstName,
        lastName: request.billing.lastName,
        city: request.billing.city || "Bucuresti",
        country: 642,  // Romania ISO numeric code
        countryName: "Romania",
        state: request.billing.city || "Bucuresti",
        postalCode: "000000",
        details: request.billing.address || "",
      },
      shipping: {
        email: request.billing.email,
        phone: request.billing.phone || "0700000000",
        firstName: request.billing.firstName,
        lastName: request.billing.lastName,
        city: request.billing.city || "Bucuresti",
        country: 642,
        countryName: "Romania",
        state: request.billing.city || "Bucuresti",
        postalCode: "000000",
        details: request.billing.address || "",
      },
      products: [
        {
          name: request.description,
          code: request.orderRef,
          category: "subscription",
          price: request.amount,
          vat: 0,
        },
      ],
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": cfg.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Netopia API error:", response.status, text);
    throw new Error(`Netopia API error: ${response.status}`);
  }

  const result: NetopiaStartResponse = await response.json();

  if (result.error) {
    throw new Error(`Netopia: ${result.error.message} (${result.error.code})`);
  }

  return result;
}

// ─── Verify IPN Signature ───────────────────────────────────────

/**
 * Verify and parse Netopia IPN callback
 * For V2 API, we just parse the JSON body
 */
export function parseNetopiaIPN(body: any): NetopiaIPNData {
  // V2 API sends JSON directly
  return body as NetopiaIPNData;
}

/**
 * Generate the standard IPN response (acknowledge)
 * Netopia expects specific XML/JSON response
 */
export function generateIPNResponse(errorCode: number = 0): { errorCode: number; errorMessage: string } {
  return {
    errorCode,
    errorMessage: errorCode === 0 ? "" : "Error processing IPN",
  };
}

/**
 * PayPal Integration - Orders API v2
 * Donatiile se proceseaza prin PayPal, banii ajung in contul ONG-ului
 */

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
  payer: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
}

function getPayPalBaseUrl(): string {
  const sandbox = process.env.PAYPAL_MODE !== "live";
  return sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

/**
 * Obtine un access token OAuth2 de la PayPal folosind credentialele ONG-ului
 */
async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal auth failed: ${errorText}`);
  }

  const data: PayPalTokenResponse = await res.json();
  return data.access_token;
}

/**
 * Creeaza o comanda PayPal (order) pentru o donatie
 */
export async function createPayPalOrder(params: {
  clientId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  ngoName: string;
  donationId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const accessToken = await getAccessToken(params.clientId, params.clientSecret);
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.donationId,
          description: `Donatie pentru ${params.ngoName}`,
          amount: {
            currency_code: params.currency === "RON" ? "RON" : params.currency,
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: params.ngoName,
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal create order failed: ${errorText}`);
  }

  const order: PayPalOrderResponse = await res.json();
  const approveLink = order.links.find((l) => l.rel === "approve");

  if (!approveLink) {
    throw new Error("PayPal approve link not found in order response");
  }

  return {
    orderId: order.id,
    approveUrl: approveLink.href,
  };
}

/**
 * Captureaza plata dupa ce donatorul a aprobat-o pe PayPal
 */
export async function capturePayPalOrder(params: {
  clientId: string;
  clientSecret: string;
  orderId: string;
}): Promise<PayPalCaptureResponse> {
  const accessToken = await getAccessToken(params.clientId, params.clientSecret);
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(
    `${baseUrl}/v2/checkout/orders/${params.orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal capture failed: ${errorText}`);
  }

  return res.json();
}

/**
 * Verifica statusul unei comenzi PayPal
 */
export async function getPayPalOrder(params: {
  clientId: string;
  clientSecret: string;
  orderId: string;
}): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken(params.clientId, params.clientSecret);
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(
    `${baseUrl}/v2/checkout/orders/${params.orderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayPal get order failed: ${errorText}`);
  }

  return res.json();
}

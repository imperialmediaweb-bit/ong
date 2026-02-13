import twilio from "twilio";

type SmsProvider = "twilio" | "telnyx";

interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
  senderId?: string;
}

interface SmsConfig {
  // Twilio
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  // Telnyx
  telnyxApiKey?: string;
  telnyxPhoneNumber?: string;
}

type SmsResult = { success: boolean; sid?: string; error?: string };

function getProvider(): SmsProvider {
  const provider = (process.env.SMS_PROVIDER || "twilio").toLowerCase();
  if (provider === "telnyx") return "telnyx";
  return "twilio";
}

async function sendViaTwilio(
  params: SendSmsParams,
  config?: SmsConfig
): Promise<SmsResult> {
  const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = params.from || config?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    to: params.to,
    from: params.senderId || fromNumber,
    body: params.body,
  });

  return { success: true, sid: message.sid };
}

async function sendViaTelnyx(
  params: SendSmsParams,
  config?: SmsConfig
): Promise<SmsResult> {
  const apiKey = config?.telnyxApiKey || process.env.TELNYX_API_KEY;
  const fromNumber = params.from || config?.telnyxPhoneNumber || process.env.TELNYX_PHONE_NUMBER;

  if (!apiKey || !fromNumber) {
    return { success: false, error: "Telnyx credentials not configured" };
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: params.senderId || fromNumber,
      to: params.to,
      text: params.body,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = (errorData as any)?.errors?.[0]?.detail || `Telnyx API error (${response.status})`;
    throw new Error(detail);
  }

  const data = await response.json();
  return { success: true, sid: (data as any).data?.id };
}

export async function sendSms(
  params: SendSmsParams,
  config?: SmsConfig
): Promise<SmsResult> {
  // Append STOP instructions for compliance
  const bodyWithStop = params.body.endsWith("STOP")
    ? params.body
    : `${params.body}\n\nReply STOP to unsubscribe.`;

  const paramsWithStop = { ...params, body: bodyWithStop };
  const provider = getProvider();

  try {
    switch (provider) {
      case "telnyx":
        return await sendViaTelnyx(paramsWithStop, config);
      case "twilio":
      default:
        return await sendViaTwilio(paramsWithStop, config);
    }
  } catch (error: any) {
    console.error(`SMS error (${provider}):`, error.message);
    return { success: false, error: error.message };
  }
}

export function getActiveProvider(): SmsProvider {
  return getProvider();
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "+40" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("+")) {
    return "+" + cleaned;
  }
  return cleaned;
}

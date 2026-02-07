import twilio from "twilio";

interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
  senderId?: string;
}

export async function sendSms(
  params: SendSmsParams,
  config?: { accountSid?: string; authToken?: string; phoneNumber?: string }
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = params.from || config?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  // Append STOP instructions for compliance
  const bodyWithStop = params.body.endsWith("STOP")
    ? params.body
    : `${params.body}\n\nReply STOP to unsubscribe.`;

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      to: params.to,
      from: params.senderId || fromNumber,
      body: bodyWithStop,
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("Twilio error:", error.message);
    return { success: false, error: error.message };
  }
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

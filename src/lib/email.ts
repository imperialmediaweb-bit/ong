import sgMail from "@sendgrid/mail";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeUrl?: string;
}

export async function sendEmail(params: SendEmailParams, apiKey?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const key = apiKey || process.env.SENDGRID_API_KEY;
  if (!key) {
    return { success: false, error: "SendGrid API key not configured" };
  }

  sgMail.setApiKey(key);

  const footerHtml = params.unsubscribeUrl
    ? `<br/><hr style="margin-top:30px;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#999;text-align:center">You received this because you subscribed to updates. <a href="${params.unsubscribeUrl}">Unsubscribe</a></p>`
    : "";

  try {
    const [response] = await sgMail.send({
      to: params.to,
      from: {
        email: params.from || process.env.SENDGRID_FROM_EMAIL || "noreply@ngohub.ro",
        name: params.fromName || "NGO HUB",
      },
      subject: params.subject,
      html: params.html + footerHtml,
      trackingSettings: {
        openTracking: { enable: params.trackOpens !== false },
        clickTracking: { enable: params.trackClicks !== false },
      },
    });

    return {
      success: true,
      messageId: response.headers["x-message-id"],
    };
  } catch (error: any) {
    console.error("SendGrid error:", error?.response?.body || error.message);
    return {
      success: false,
      error: error?.response?.body?.errors?.[0]?.message || error.message,
    };
  }
}

export function generateUnsubscribeUrl(donorId: string, ngoSlug: string): string {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  return `${baseUrl}/unsubscribe/${ngoSlug}?did=${donorId}`;
}

import sgMail from "@sendgrid/mail";
import { sendPlatformEmail } from "@/lib/email-sender";

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

/**
 * Send email - tries platform SMTP config first, falls back to SendGrid env var
 */
export async function sendEmail(params: SendEmailParams, apiKey?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const footerHtml = params.unsubscribeUrl
    ? `<br/><hr style="margin-top:30px;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#999;text-align:center">You received this because you subscribed to updates. <a href="${params.unsubscribeUrl}">Unsubscribe</a></p>`
    : "";

  const htmlWithFooter = params.html + footerHtml;

  // If no explicit API key, try platform email sender first
  if (!apiKey) {
    try {
      const result = await sendPlatformEmail({
        to: params.to,
        subject: params.subject,
        html: htmlWithFooter,
        from: params.from,
        fromName: params.fromName,
        replyTo: params.replyTo,
      });

      if (result.success) {
        return result;
      }
      // If platform sender fails, fall through to SendGrid env var
      console.warn("Platform email sender failed, trying SendGrid fallback:", result.error);
    } catch (err) {
      console.warn("Platform email sender error, trying SendGrid fallback:", err);
    }
  }

  // Fallback: direct SendGrid with API key
  const key = apiKey || process.env.SENDGRID_API_KEY;
  if (!key) {
    return { success: false, error: "Niciun provider email configurat. Configureaza SMTP din Admin > Email & Notificari." };
  }

  sgMail.setApiKey(key);

  try {
    const [response] = await sgMail.send({
      to: params.to,
      from: {
        email: params.from || process.env.SENDGRID_FROM_EMAIL || "noreply@binevo.ro",
        name: params.fromName || "Binevo",
      },
      subject: params.subject,
      html: htmlWithFooter,
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
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";
  return `${baseUrl}/unsubscribe/${ngoSlug}?did=${donorId}`;
}

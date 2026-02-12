/**
 * Universal Email Sender
 * Supports: SMTP (nodemailer), SendGrid API, Mailgun API
 * Used for platform-level notifications (registration, invoices, subscriptions, etc.)
 */
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

interface SmtpConfig {
  provider: "smtp" | "sendgrid" | "mailgun";
  // SMTP
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpEncryption?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
  smtpReplyTo?: string | null;
  // SendGrid
  sendgridApiKey?: string | null;
  // Mailgun
  mailgunApiKey?: string | null;
  mailgunDomain?: string | null;
  mailgunRegion?: string | null;
}

// Cache for platform email config
let configCache: SmtpConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

export function invalidateEmailConfigCache() {
  configCache = null;
  configCacheTime = 0;
}

async function getPlatformEmailConfig(): Promise<SmtpConfig> {
  if (configCache && Date.now() - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  // Lazy import to avoid circular deps
  const { default: prisma } = await import("@/lib/db");

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "platform" },
  });

  if (!settings) {
    return { provider: "smtp" };
  }

  configCache = {
    provider: (settings.emailProvider as SmtpConfig["provider"]) || "smtp",
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassword: settings.smtpPassword,
    smtpEncryption: settings.smtpEncryption,
    smtpFromEmail: settings.smtpFromEmail,
    smtpFromName: settings.smtpFromName,
    smtpReplyTo: settings.smtpReplyTo,
    sendgridApiKey: settings.sendgridApiKey,
    mailgunApiKey: settings.mailgunApiKey,
    mailgunDomain: settings.mailgunDomain,
    mailgunRegion: settings.mailgunRegion,
  };
  configCacheTime = Date.now();

  return configCache;
}

/**
 * Send email via SMTP (nodemailer)
 */
async function sendViaSmtp(config: SmtpConfig, payload: EmailPayload): Promise<EmailResult> {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return { success: false, error: "SMTP nu este configurat complet (host, user, password)", provider: "smtp" };
  }

  const port = config.smtpPort || 587;
  const secure = config.smtpEncryption === "ssl" || port === 465;

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port,
    secure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
    tls: config.smtpEncryption === "none" ? { rejectUnauthorized: false } : undefined,
  });

  const fromEmail = payload.from || config.smtpFromEmail || config.smtpUser;
  const fromName = payload.fromName || config.smtpFromName || "Binevo";

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo || config.smtpReplyTo || undefined,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: "smtp",
    };
  } catch (error: any) {
    console.error("SMTP error:", error.message);
    return {
      success: false,
      error: error.message || "Eroare SMTP necunoscuta",
      provider: "smtp",
    };
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(config: SmtpConfig, payload: EmailPayload): Promise<EmailResult> {
  const apiKey = config.sendgridApiKey;
  if (!apiKey) {
    return { success: false, error: "SendGrid API key nu este configurat", provider: "sendgrid" };
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = payload.from || config.smtpFromEmail || "noreply@binevo.ro";
  const fromName = payload.fromName || config.smtpFromName || "Binevo";

  try {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    const [response] = await sgMail.send({
      to: recipients,
      from: { email: fromEmail, name: fromName },
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo || config.smtpReplyTo || undefined,
      trackingSettings: {
        openTracking: { enable: true },
        clickTracking: { enable: true },
      },
    });

    return {
      success: true,
      messageId: response.headers["x-message-id"],
      provider: "sendgrid",
    };
  } catch (error: any) {
    console.error("SendGrid error:", error?.response?.body || error.message);
    return {
      success: false,
      error: error?.response?.body?.errors?.[0]?.message || error.message,
      provider: "sendgrid",
    };
  }
}

/**
 * Send email via Mailgun API
 */
async function sendViaMailgun(config: SmtpConfig, payload: EmailPayload): Promise<EmailResult> {
  if (!config.mailgunApiKey || !config.mailgunDomain) {
    return { success: false, error: "Mailgun API key sau domain nu sunt configurate", provider: "mailgun" };
  }

  const region = config.mailgunRegion || "eu";
  const baseUrl = region === "eu"
    ? "https://api.eu.mailgun.net/v3"
    : "https://api.mailgun.net/v3";

  const fromEmail = payload.from || config.smtpFromEmail || `noreply@${config.mailgunDomain}`;
  const fromName = payload.fromName || config.smtpFromName || "Binevo";
  const recipients = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;

  const form = new FormData();
  form.append("from", `${fromName} <${fromEmail}>`);
  form.append("to", recipients);
  form.append("subject", payload.subject);
  form.append("html", payload.html);

  if (payload.replyTo || config.smtpReplyTo) {
    form.append("h:Reply-To", payload.replyTo || config.smtpReplyTo || "");
  }

  try {
    const response = await fetch(`${baseUrl}/${config.mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${config.mailgunApiKey}`).toString("base64")}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mailgun error ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id,
      provider: "mailgun",
    };
  } catch (error: any) {
    console.error("Mailgun error:", error.message);
    return {
      success: false,
      error: error.message || "Eroare Mailgun necunoscuta",
      provider: "mailgun",
    };
  }
}

/**
 * Main email sending function - uses the configured provider
 * Automatically reads config from PlatformSettings
 */
export async function sendPlatformEmail(payload: EmailPayload): Promise<EmailResult> {
  const config = await getPlatformEmailConfig();
  return sendEmailWithConfig(config, payload);
}

/**
 * Send email with explicit config (useful for testing)
 */
export async function sendEmailWithConfig(config: SmtpConfig, payload: EmailPayload): Promise<EmailResult> {
  switch (config.provider) {
    case "sendgrid":
      return sendViaSendGrid(config, payload);
    case "mailgun":
      return sendViaMailgun(config, payload);
    case "smtp":
    default:
      return sendViaSmtp(config, payload);
  }
}

/**
 * Test the email configuration by sending a test email
 */
export async function testEmailConfig(config: SmtpConfig, testEmail: string): Promise<EmailResult> {
  const payload: EmailPayload = {
    to: testEmail,
    subject: "Test Email - Binevo Platform",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 20px;">Test Email Reusit!</h1>
        </div>
        <div style="padding: 24px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151;">Aceasta este un email de test trimis de pe platforma Binevo.</p>
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Provider:</strong> ${config.provider}<br/>
            <strong>De la:</strong> ${config.smtpFromEmail || config.smtpUser || "noreply@binevo.ro"}<br/>
            <strong>Data:</strong> ${new Date().toLocaleString("ro-RO")}
          </p>
          <p style="color: #059669; font-weight: 600;">Configuratia email functioneaza corect!</p>
        </div>
      </div>
    `,
  };

  return sendEmailWithConfig(config, payload);
}

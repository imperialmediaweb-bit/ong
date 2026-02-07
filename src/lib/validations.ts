import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name is required"),
  ngoName: z.string().min(2, "NGO name is required"),
});

export const donorSchema = z.object({
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  name: z.string().optional().or(z.literal("")),
  preferredChannel: z.enum(["EMAIL", "SMS", "BOTH"]).default("EMAIL"),
  notes: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const donationFormSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  name: z.string().optional().or(z.literal("")),
  emailConsent: z.boolean().default(false),
  smsConsent: z.boolean().default(false),
  privacyConsent: z.boolean().refine((v) => v === true, "You must accept the privacy policy"),
  isRecurring: z.boolean().default(false),
});

export const newsletterSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().optional().or(z.literal("")),
  emailConsent: z.boolean().refine((v) => v === true, "You must consent to receive emails"),
  privacyConsent: z.boolean().refine((v) => v === true, "You must accept the privacy policy"),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.enum([
    "THANK_YOU", "UPDATE", "EMERGENCY_APPEAL",
    "NEWSLETTER", "REACTIVATION", "CORPORATE_OUTREACH", "CUSTOM",
  ]),
  channel: z.enum(["EMAIL", "SMS", "BOTH"]),
  subject: z.string().optional().or(z.literal("")),
  emailBody: z.string().optional().or(z.literal("")),
  smsBody: z.string().optional().or(z.literal("")),
  previewText: z.string().optional().or(z.literal("")),
  segmentQuery: z.any().optional(),
  scheduledAt: z.string().optional().or(z.literal("")),
  goalAmount: z.number().optional(),
  isAbTest: z.boolean().default(false),
});

export const automationSchema = z.object({
  name: z.string().min(1, "Automation name is required"),
  description: z.string().optional().or(z.literal("")),
  trigger: z.enum([
    "NEW_DONATION", "CAMPAIGN_GOAL_REACHED", "NO_DONATION_PERIOD",
    "NEW_SUBSCRIBER", "CAMPAIGN_ENDED", "LOW_PERFORMANCE", "MANUAL",
  ]),
  triggerConfig: z.any().optional(),
  steps: z.array(z.object({
    order: z.number(),
    action: z.enum([
      "SEND_EMAIL", "SEND_SMS", "ADD_TAG", "REMOVE_TAG",
      "NOTIFY_ADMIN", "AI_SUGGESTION", "WAIT", "CONDITION",
    ]),
    config: z.any(),
    delayMinutes: z.number().default(0),
  })),
});

export const consentTextSchema = z.object({
  type: z.enum(["EMAIL_MARKETING", "SMS_MARKETING", "PRIVACY_POLICY", "TERMS_OF_SERVICE"]),
  text: z.string().min(1, "Consent text is required"),
});

export const aiGenerateSchema = z.object({
  type: z.enum(["subject", "email_body", "sms_copy"]),
  campaignType: z.string(),
  tone: z.enum(["formal", "emotional", "urgent"]).default("formal"),
  language: z.enum(["ro", "en"]).default("ro"),
  context: z.string().optional(),
  ngoName: z.string().optional(),
});

import { SubscriptionPlan, UserRole } from "@prisma/client";
import prisma from "@/lib/db";

type Feature =
  | "donors_view"
  | "donors_manage"
  | "campaigns_email"
  | "campaigns_sms"
  | "ai_generator"
  | "ai_advanced"
  | "automations_basic"
  | "automations_advanced"
  | "ab_testing"
  | "ai_optimization"
  | "gdpr_tools"
  | "analytics"
  | "analytics_advanced"
  | "export_csv"
  | "mentions_monitor"
  | "sponsor_crm"
  | "sponsor_ai"
  | "linkedin_prospects"
  | "press_media"
  | "social_ai"
  | "minisite_custom_css"
  | "minisite_premium_sections";

const PLAN_FEATURES: Record<SubscriptionPlan, Feature[]> = {
  BASIC: [
    "donors_view", "donors_manage",
    "gdpr_tools", "analytics", "export_csv",
  ],
  PRO: [
    "donors_view", "donors_manage",
    "campaigns_email", "campaigns_sms",
    "ai_generator", "automations_basic",
    "automations_advanced", "ab_testing",
    "gdpr_tools", "analytics", "analytics_advanced",
    "export_csv",
    "minisite_custom_css", "minisite_premium_sections",
  ],
  ELITE: [
    "donors_view", "donors_manage",
    "campaigns_email", "campaigns_sms",
    "ai_generator", "ai_advanced", "ai_optimization",
    "automations_basic", "automations_advanced",
    "ab_testing", "gdpr_tools",
    "analytics", "analytics_advanced",
    "export_csv", "mentions_monitor",
    "sponsor_crm", "sponsor_ai",
    "linkedin_prospects", "press_media", "social_ai",
    "minisite_custom_css", "minisite_premium_sections",
  ],
};

// ── Plan Limits ──────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<SubscriptionPlan, {
  maxDonors: number;          // 0 = unlimited
  maxTeamMembers: number;     // 0 = unlimited
  maxAutomations: number;     // 0 = unlimited
  donationFeePercent: number;
  aiCapabilities: number;     // number of AI capabilities available
  auditLogDays: number;       // 0 = unlimited
}> = {
  BASIC: {
    maxDonors: 50,
    maxTeamMembers: 1,
    maxAutomations: 0,
    donationFeePercent: 5,
    aiCapabilities: 0,
    auditLogDays: 0,
  },
  PRO: {
    maxDonors: 3000,
    maxTeamMembers: 5,
    maxAutomations: 5,
    donationFeePercent: 2,
    aiCapabilities: 5,
    auditLogDays: 60,
  },
  ELITE: {
    maxDonors: 0, // unlimited
    maxTeamMembers: 0, // unlimited
    maxAutomations: 0, // unlimited
    donationFeePercent: 0,
    aiCapabilities: 12,
    auditLogDays: 0, // unlimited
  },
};

// ── Mini-site sections available per plan ────────────────────────────

// Basic (free) plan gets these sections
export const BASIC_MINISITE_SECTIONS = [
  "about", "mission", "impact", "donation", "newsletter",
  "contact", "social", "formular230", "contract",
] as const;

// Premium sections (PRO + ELITE only)
export const PREMIUM_MINISITE_SECTIONS = [
  "teamMembers", "testimonials", "partners", "events",
  "faqItems", "volunteerForm", "transparencyDocs",
  "urgentBanner", "counterStats", "videoSection",
  "donationPopup", "googleMaps", "campaigns", "blog",
] as const;

export function isSectionAllowedForPlan(
  plan: SubscriptionPlan,
  section: string
): boolean {
  if (plan === "PRO" || plan === "ELITE") return true;
  return (BASIC_MINISITE_SECTIONS as readonly string[]).includes(section);
}

// ── Feature check ────────────────────────────────────────────────────

export function hasFeature(plan: SubscriptionPlan, feature: Feature, role?: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

// ── Donor limit check ────────────────────────────────────────────────

export function getDonorLimit(plan: SubscriptionPlan): number {
  return PLAN_LIMITS[plan].maxDonors;
}

export function isOverDonorLimit(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].maxDonors;
  if (limit === 0) return false; // unlimited
  return currentCount >= limit;
}

// ── Automation limit check ───────────────────────────────────────────

export function getAutomationLimit(plan: SubscriptionPlan): number {
  return PLAN_LIMITS[plan].maxAutomations;
}

export function isOverAutomationLimit(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].maxAutomations;
  if (limit === 0) return false; // unlimited
  return currentCount >= limit;
}

// ── Team member limit check ──────────────────────────────────────────

export function getTeamMemberLimit(plan: SubscriptionPlan): number {
  return PLAN_LIMITS[plan].maxTeamMembers;
}

export function isOverTeamMemberLimit(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].maxTeamMembers;
  if (limit === 0) return false; // unlimited
  return currentCount >= limit;
}

// ── Subscription expiration check ────────────────────────────────────

export function isSubscriptionExpired(ngo: {
  subscriptionExpiresAt?: Date | null;
  currentPeriodEnd?: Date | null;
  subscriptionStatus?: string | null;
}): boolean {
  // If subscription status is explicitly cancelled/expired
  if (ngo.subscriptionStatus === "canceled" || ngo.subscriptionStatus === "expired") {
    return true;
  }

  const now = new Date();

  // Check manual subscription expiration
  if (ngo.subscriptionExpiresAt && new Date(ngo.subscriptionExpiresAt) < now) {
    return true;
  }

  // Check Stripe subscription period end
  if (ngo.currentPeriodEnd && new Date(ngo.currentPeriodEnd) < now) {
    return true;
  }

  return false;
}

// ── Effective plan (accounting for expiration) ───────────────────────

export function getEffectivePlan(ngo: {
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date | null;
  currentPeriodEnd?: Date | null;
  subscriptionStatus?: string | null;
}): SubscriptionPlan {
  // If plan is already BASIC, no downgrade needed
  if (ngo.subscriptionPlan === "BASIC") return "BASIC";

  // If subscription expired, downgrade to BASIC
  if (isSubscriptionExpired(ngo)) return "BASIC";

  return ngo.subscriptionPlan;
}

// ── Fetch effective plan from DB (for API routes) ────────────────────

export async function fetchEffectivePlan(ngoId: string, sessionPlan?: string, role?: string): Promise<SubscriptionPlan> {
  // SUPER_ADMIN always gets ELITE
  if (role === "SUPER_ADMIN") return "ELITE";

  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: ngoId },
      select: {
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        currentPeriodEnd: true,
        subscriptionStatus: true,
      },
    });

    if (!ngo) return "BASIC";
    return getEffectivePlan(ngo);
  } catch {
    // Fallback to session plan if DB query fails
    return (sessionPlan as SubscriptionPlan) || "BASIC";
  }
}

// ── Role permissions ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  NGO_ADMIN: [
    "donors:read", "donors:write", "donors:delete",
    "campaigns:read", "campaigns:write", "campaigns:send",
    "automations:read", "automations:write",
    "settings:read", "settings:write",
    "analytics:read", "audit:read",
    "gdpr:export", "gdpr:delete",
  ],
  STAFF: [
    "donors:read", "donors:write",
    "campaigns:read", "campaigns:write",
    "automations:read",
    "analytics:read",
  ],
  VIEWER: [
    "donors:read",
    "campaigns:read",
    "analytics:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

import { SubscriptionPlan, UserRole } from "@prisma/client";

type Feature =
  | "donors_view"
  | "donors_manage"
  | "campaigns_email"
  | "campaigns_sms"
  | "ai_generator"
  | "automations_basic"
  | "automations_advanced"
  | "ab_testing"
  | "ai_optimization"
  | "gdpr_tools"
  | "analytics"
  | "export_csv";

const PLAN_FEATURES: Record<SubscriptionPlan, Feature[]> = {
  BASIC: [
    "donors_view", "donors_manage", "campaigns_email",
    "ai_generator", "automations_basic", "gdpr_tools",
    "analytics", "export_csv",
  ],
  PRO: [
    "donors_view", "donors_manage", "campaigns_email",
    "campaigns_sms", "ai_generator", "automations_basic",
    "automations_advanced", "gdpr_tools",
    "analytics", "export_csv",
  ],
  ELITE: [
    "donors_view", "donors_manage", "campaigns_email",
    "campaigns_sms", "ai_generator", "automations_basic",
    "automations_advanced", "ab_testing", "ai_optimization",
    "gdpr_tools", "analytics", "export_csv",
  ],
};

export function hasFeature(plan: SubscriptionPlan, feature: Feature, role?: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

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

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Lock, Sparkles, type LucideIcon } from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
}

interface PlanGateProps {
  requiredPlan: "PRO" | "ELITE";
  featureName: string;
  featureDescription: string;
  features?: FeatureCard[];
  children: React.ReactNode;
}

const PLAN_ORDER: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 };

export function PlanGate({
  requiredPlan,
  featureName,
  featureDescription,
  features = [],
  children,
}: PlanGateProps) {
  const { data: session } = useSession();
  const plan = (session?.user as any)?.plan || "BASIC";
  const role = (session?.user as any)?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const hasAccess = isSuperAdmin || (PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[requiredPlan] ?? 0);

  if (hasAccess) {
    return <>{children}</>;
  }

  const isPro = requiredPlan === "PRO";
  const gradientFrom = isPro ? "from-violet-500" : "from-amber-500";
  const gradientVia = isPro ? "via-purple-500" : "via-orange-500";
  const gradientTo = isPro ? "to-indigo-500" : "to-red-500";
  const btnFrom = isPro ? "from-violet-500" : "from-amber-500";
  const btnTo = isPro ? "to-purple-500" : "to-orange-500";
  const btnHoverFrom = isPro ? "from-violet-600" : "from-amber-600";
  const btnHoverTo = isPro ? "to-purple-600" : "to-orange-600";
  const accentColor = isPro ? "from-violet-500 to-purple-500" : "from-amber-500 to-orange-500";

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} p-8 text-white shadow-xl`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMnY2aC02VjE2aDZ6bTAgMTJ2Nmg2djZoLTZ2LTZ6bTEyLTEydjZoLTZWMTZoNnptLTI0IDB2Nmg2djZILTZ2LTZIMjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-4">
            {isPro ? <Sparkles className="h-8 w-8" /> : <Crown className="h-8 w-8" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{featureName}</h1>
          <p className="text-white/90 text-lg mb-1">
            Functie disponibila in pachetul{" "}
            <Badge className="bg-white/20 text-white border-0 text-base px-2 py-0.5 font-bold">
              {requiredPlan}
            </Badge>
          </p>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            {featureDescription}
          </p>
        </div>
      </div>

      {/* Feature cards */}
      {features.length > 0 && (
        <div className={`grid gap-4 ${features.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-md">
              <CardContent className="pt-6 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mx-auto mb-3 ${feature.iconBg || "bg-blue-100"} ${feature.iconColor || "text-blue-600"}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upgrade CTA */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${accentColor}`} />
        <CardContent className="py-8 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Upgradare la pachetul {requiredPlan}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {isPro
              ? "Obtine acces la campanii email/SMS, automatizari, generare AI si toate functiile premium."
              : "Obtine acces la monitorizarea mentiunilor, AI avansat, CRM sponsori si toate functiile premium."}
          </p>
          <Link href="/dashboard/billing">
            <Button className={`bg-gradient-to-r ${btnFrom} ${btnTo} hover:${btnHoverFrom} hover:${btnHoverTo} text-white shadow-md rounded-lg px-8 py-3 text-base font-semibold`}>
              <Zap className="mr-2 h-5 w-5" />
              Upgradare {requiredPlan}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Small inline badge showing required plan for a feature.
 * Use in lists, cards, or next to feature names.
 */
export function PlanBadge({ plan }: { plan: "PRO" | "ELITE" }) {
  const isPro = plan === "PRO";
  return (
    <Badge
      className={`text-[9px] px-1.5 py-0 h-4 text-white border-0 font-semibold ${
        isPro
          ? "bg-gradient-to-r from-violet-500 to-purple-500"
          : "bg-gradient-to-r from-amber-500 to-orange-500"
      }`}
    >
      {plan}
    </Badge>
  );
}

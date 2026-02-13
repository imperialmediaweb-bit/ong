"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users, Mail, Zap, BarChart3,
  Shield, Settings, Home, Heart, LogOut, Menu, X, FileText,
  Globe, Briefcase, Share2, Sparkles, ChevronRight, CircleDollarSign,
  Banknote, Receipt, Building2, ShieldCheck, CreditCard,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BinevoLogo } from "@/components/BinevoLogo";

const superAdminNavGroups = [
  {
    label: "Acasa",
    items: [
      { name: "Panou principal", href: "/dashboard", icon: Home },
    ],
  },
  {
    label: "Administrare Platforma",
    items: [
      { name: "Gestionare ONG-uri", href: "/admin/ngos", icon: Building2 },
      { name: "Utilizatori", href: "/admin/users", icon: Users },
      { name: "Verificari", href: "/admin/verifications", icon: ShieldCheck },
      { name: "Abonamente", href: "/admin/subscriptions", icon: CreditCard },
      { name: "Blog", href: "/admin/blog", icon: FileText },
      { name: "Setari platforma", href: "/admin", icon: Settings },
    ],
  },
];

const ngoNavGroups = [
  {
    label: "Acasa",
    items: [
      { name: "Panou principal", href: "/dashboard", icon: Home },
      { name: "Analitica", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Donatori & Donatii",
    items: [
      { name: "Donatori", href: "/dashboard/donors", icon: Users },
      { name: "Donatii", href: "/dashboard/donations", icon: CircleDollarSign },
      { name: "Verificare plati", href: "/dashboard/donations/pledges", icon: Banknote },
      { name: "Formular 230", href: "/dashboard/formular-230", icon: FileText },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Campanii", href: "/dashboard/campaigns", icon: Mail },
      { name: "Automatizari", href: "/dashboard/automations", icon: Zap },
      { name: "AI & Social Media", href: "/dashboard/social-ai", icon: Sparkles },
    ],
  },
  {
    label: "Legal & Conformitate",
    items: [
      { name: "Contracte", href: "/dashboard/contracte", icon: Briefcase },
      { name: "GDPR & Consimtamant", href: "/dashboard/privacy", icon: Shield },
    ],
  },
  {
    label: "Prezenta Online",
    items: [
      { name: "Mini-Site", href: "/dashboard/minisite", icon: Globe },
      { name: "Retea & Sponsori", href: "/dashboard/retea", icon: Share2 },
    ],
  },
  {
    label: "Abonament",
    items: [
      { name: "Facturare", href: "/dashboard/billing", icon: Receipt },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const plan = (session?.user as any)?.plan || "BASIC";
  const navGroups = isSuperAdmin ? superAdminNavGroups : ngoNavGroups;

  const planColor = plan === "ELITE"
    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
    : plan === "PRO"
    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0"
    : "";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <BinevoLogo size="sm" showText={false} />
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">Binevo</h1>
          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
            {(session?.user as any)?.ngoName || "Platforma CRM"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const exactMatchPaths = ["/dashboard", "/admin"];
                const isExactMatch = exactMatchPaths.includes(item.href) && pathname === item.href;
                const isPrefixMatch = !exactMatchPaths.includes(item.href) && (pathname === item.href || pathname?.startsWith(item.href + "/"));
                const active = isExactMatch || isPrefixMatch;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "")} />
                    <span className="truncate">{item.name}</span>
                    {active && (
                      <ChevronRight className="h-3 w-3 ml-auto opacity-70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link - only for NGO users */}
      {!isSuperAdmin && (
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/settings"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Setari</span>
          </Link>
        </div>
      )}

      {/* Footer - User & Plan */}
      <div className="border-t p-4">
        {!isSuperAdmin && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Plan activ</span>
            <Badge className={cn("text-[10px] font-semibold", planColor)}>
              {plan}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold flex-shrink-0">
            {session?.user?.name
              ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
              : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || session?.user?.email}</p>
            <p className="text-[10px] text-muted-foreground truncate">{(session?.user as any)?.role || "Admin"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-10 w-10 rounded-xl shadow-md bg-card"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-[280px] bg-card border-r shadow-2xl transform transition-transform duration-300 ease-out lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card">
        <SidebarContent />
      </div>
    </>
  );
}

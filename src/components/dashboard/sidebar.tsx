"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users, Mail, Zap, BarChart3,
  Shield, Settings, Home, Heart, LogOut, Menu, X, FileText,
  Globe, Briefcase, Share2, Sparkles, ChevronRight, CircleDollarSign,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navGroups = [
  {
    label: "Acasa",
    description: "Vedere generala",
    items: [
      {
        name: "Panou principal",
        desc: "Rezumat si indicatori cheie",
        href: "/dashboard",
        icon: Home,
      },
      {
        name: "Analitica",
        desc: "Rapoarte si grafice detaliate",
        href: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Donatori & Donatii",
    description: "Gestioneaza relatiile si finantele",
    items: [
      {
        name: "Donatori",
        desc: "Baza de date cu donatorii tai",
        href: "/dashboard/donors",
        icon: Users,
      },
      {
        name: "Donatii",
        desc: "Evidenta si istoricul donatiilor",
        href: "/dashboard/donations",
        icon: CircleDollarSign,
      },
      {
        name: "Formular 230",
        desc: "Redirectionare 3.5% din impozit",
        href: "/dashboard/formular-230",
        icon: FileText,
      },
    ],
  },
  {
    label: "Marketing",
    description: "Comunica si automatizeaza",
    items: [
      {
        name: "Campanii",
        desc: "Trimite email-uri si SMS-uri",
        href: "/dashboard/campaigns",
        icon: Mail,
      },
      {
        name: "Automatizari",
        desc: "Fluxuri automate de comunicare",
        href: "/dashboard/automations",
        icon: Zap,
      },
      {
        name: "AI & Social Media",
        desc: "Genereaza continut cu AI",
        href: "/dashboard/social-ai",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Legal & Conformitate",
    description: "Contracte si protectia datelor",
    items: [
      {
        name: "Contracte",
        desc: "Genereaza contracte de sponsorizare",
        href: "/dashboard/contracte",
        icon: Briefcase,
      },
      {
        name: "GDPR & Consimtamant",
        desc: "Gestioneaza consimtamintele",
        href: "/dashboard/privacy",
        icon: Shield,
      },
    ],
  },
  {
    label: "Prezenta Online",
    description: "Site-ul si reteaua ta",
    items: [
      {
        name: "Mini-Site",
        desc: "Construieste site-ul organizatiei",
        href: "/dashboard/minisite",
        icon: Globe,
      },
      {
        name: "Retea & Sponsori",
        desc: "Gaseste si contacteaza sponsori",
        href: "/dashboard/retea",
        icon: Share2,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const plan = (session?.user as any)?.plan || "BASIC";

  const planColor = plan === "ELITE"
    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
    : plan === "PRO"
    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0"
    : "";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <Heart className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight">NGO HUB</h1>
          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
            {(session?.user as any)?.ngoName || "Platforma CRM"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              {group.description && (
                <p className="text-[9px] text-muted-foreground/50 -mt-0.5">
                  {group.description}
                </p>
              )}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));
                const isExactDashboard = item.href === "/dashboard" && pathname === "/dashboard";
                const active = isActive || isExactDashboard;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.desc}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "")} />
                    <div className="min-w-0 flex-1">
                      <span className="truncate block text-sm">{item.name}</span>
                      {!active && (
                        <span className="truncate block text-[10px] text-muted-foreground/60 -mt-0.5 group-hover:text-muted-foreground/80">
                          {item.desc}
                        </span>
                      )}
                    </div>
                    {active && (
                      <ChevronRight className="h-3 w-3 ml-auto opacity-70 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link */}
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

      {/* Footer - User & Plan */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Plan activ</span>
          <Badge className={cn("text-[10px] font-semibold", planColor)}>
            {plan}
          </Badge>
        </div>
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

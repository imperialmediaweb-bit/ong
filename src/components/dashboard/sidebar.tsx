"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users, Mail, MessageSquare, Zap, BarChart3,
  Shield, Settings, Home, Heart, LogOut, Menu, X, FileText,
  Globe, Briefcase, Share2, Sparkles,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Panou principal", href: "/dashboard", icon: Home },
  { name: "Donatori", href: "/dashboard/donors", icon: Users },
  { name: "Campanii", href: "/dashboard/campaigns", icon: Mail },
  { name: "Mesaje", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Automatizari", href: "/dashboard/automations", icon: Zap },
  { name: "Social Media & AI", href: "/dashboard/social-ai", icon: Sparkles },
  { name: "Analitica", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Consimtamant & GDPR", href: "/dashboard/privacy", icon: Shield },
  { name: "Donatii", href: "/dashboard/donations", icon: Heart },
  { name: "Formular 230", href: "/dashboard/formular-230", icon: FileText },
  { name: "Contracte", href: "/dashboard/contracte", icon: Briefcase },
  { name: "Retea", href: "/dashboard/retea", icon: Share2 },
  { name: "Mini-Site", href: "/dashboard/minisite", icon: Globe },
  { name: "Setari", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const plan = (session?.user as any)?.plan || "BASIC";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Heart className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-lg font-bold">NGO HUB</h1>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
            {(session?.user as any)?.ngoName || "Platforma CRM"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Plan</span>
          <Badge variant={plan === "ELITE" ? "default" : plan === "PRO" ? "secondary" : "outline"}>
            {plan}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || session?.user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{(session?.user as any)?.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })}>
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
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform lg:hidden",
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

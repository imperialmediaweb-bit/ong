"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, ShieldCheck, Users,
  CreditCard, FileText, Globe, Settings, LogOut, Menu, X, Shield, Mail, Bell,
  Receipt, Landmark, Wallet, MessageSquare, FileCode,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Panou principal", href: "/admin", icon: LayoutDashboard },
  { name: "ONG-uri", href: "/admin/ngos", icon: Building2 },
  { name: "Verificari", href: "/admin/verifications", icon: ShieldCheck },
  { name: "Utilizatori", href: "/admin/users", icon: Users },
  { name: "Abonamente", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Email & Notificari", href: "/admin/email", icon: Mail },
  { name: "Configurare SMS", href: "/admin/sms", icon: MessageSquare },
  { name: "Template-uri", href: "/admin/templates", icon: FileCode },
  { name: "Centru Alerte", href: "/admin/notifications", icon: Bell },
  { name: "Date facturare", href: "/admin/billing", icon: Landmark },
  { name: "Facturi", href: "/admin/invoices", icon: Receipt },
  { name: "Procesatoare plati", href: "/admin/payments", icon: Wallet },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Pagini site", href: "/admin/pages", icon: Globe },
  { name: "Setari platforma", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <Shield className="h-7 w-7 text-blue-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Binevo</h1>
          <Badge className="bg-blue-600 text-white text-[10px] mt-0.5">
            Super Admin
          </Badge>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {(session?.user as any)?.role || "SUPER_ADMIN"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
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
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

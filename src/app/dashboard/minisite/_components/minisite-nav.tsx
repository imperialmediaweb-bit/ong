"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, FileText, Heart, LayoutGrid } from "lucide-react";

const navItems = [
  { href: "/dashboard/minisite", label: "Setari site", icon: Settings, exact: true },
  { href: "/dashboard/minisite/continut", label: "Continut", icon: FileText },
  { href: "/dashboard/minisite/campanii", label: "Campanii", icon: Heart },
  { href: "/dashboard/minisite/componente", label: "Componente", icon: LayoutGrid },
];

export function MinisiteSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border mb-6">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

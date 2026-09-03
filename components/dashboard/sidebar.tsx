"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  Calculator,
  BarChart3,
  Settings,
  Users,
  LandPlot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  exact?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard, exact: true },
  { href: "/documents/new", label: "Yangi ma'lumotnoma", icon: FilePlus2, exact: true },
  { href: "/documents", label: "Ma'lumotnomalar", icon: FolderOpen },
  { href: "/calculations", label: "Hisoblashlar", icon: Calculator },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings, adminOnly: true },
  { href: "/users", label: "Foydalanuvchilar", icon: Users, adminOnly: true },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LandPlot className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-slate-900">YerAuksion</p>
          <p className="text-[11px] text-slate-400">Hisoblash tizimi</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {ITEMS.filter((i) => !i.adminOnly || role === "ADMIN").map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} YerAuksion v1.0
        </p>
      </div>
    </aside>
  );
}

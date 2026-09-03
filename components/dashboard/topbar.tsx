"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import type { SessionUser } from "@/types";

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function logout() {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="md:hidden">
        <p className="font-bold text-primary">YerAuksion</p>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-700">{user.fullName}</p>
            <p className="flex items-center gap-1 text-[11px] text-slate-400">
              {user.role === "ADMIN" ? (
                <>
                  <ShieldCheck className="h-3 w-3" /> Administrator
                </>
              ) : (
                "Operator"
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} loading={loading}>
          <LogOut className="h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </header>
  );
}

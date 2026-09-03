"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LandPlot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <LandPlot className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">YerAuksion</h1>
          <p className="mt-1 text-sm text-slate-500">
            Yer auksioni boshlang&apos;ich narxini hisoblash tizimi
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">Tizimga kirish</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login yoki email</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin@yerauksion.uz"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Demo kirish ma&apos;lumotlari:</p>
            <p className="mt-1">Administrator: admin@yerauksion.uz / admin123</p>
            <p>Operator: operator@yerauksion.uz / operator123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

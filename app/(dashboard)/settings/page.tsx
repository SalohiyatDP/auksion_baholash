import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sozlamalar — Koeffitsiyentlar</h1>
        <p className="text-sm text-slate-500">Hisoblashda ishlatiladigan koeffitsiyentlarni boshqarish</p>
      </div>
      <SettingsClient />
    </div>
  );
}

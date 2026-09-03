import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MapsKeyProvider } from "@/components/providers/maps-provider";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const mapsKey =
    process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <MapsKeyProvider apiKey={mapsKey}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar role={user.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </MapsKeyProvider>
  );
}

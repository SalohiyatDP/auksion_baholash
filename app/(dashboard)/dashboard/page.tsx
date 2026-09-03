import Link from "next/link";
import {
  FileText,
  CalendarPlus,
  FileEdit,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatSom, formatDate } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSession();
  const scope: Prisma.DocumentWhereInput =
    user?.role === "ADMIN" ? {} : { createdById: user?.id };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, today, drafts, generated, recent] = await Promise.all([
    prisma.document.count({ where: scope }),
    prisma.document.count({ where: { ...scope, createdAt: { gte: startOfDay } } }),
    prisma.document.count({ where: { ...scope, status: "DRAFT" } }),
    prisma.document.count({ where: { ...scope, status: "GENERATED" } }),
    prisma.document.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { district: true },
    }),
  ]);

  const stats = [
    { label: "Jami ma'lumotnomalar", value: total, icon: FileText, color: "bg-blue-500" },
    { label: "Bugun yaratilgan", value: today, icon: CalendarPlus, color: "bg-emerald-500" },
    { label: "Qoralama hujjatlar", value: drafts, icon: FileEdit, color: "bg-amber-500" },
    { label: "Yakunlangan hujjatlar", value: generated, icon: CheckCircle2, color: "bg-violet-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bosh sahifa</h1>
          <p className="text-sm text-slate-500">
            Xush kelibsiz, {user?.fullName}. Tizim holati bilan tanishing.
          </p>
        </div>
        <Link href="/documents/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yangi ma&apos;lumotnoma
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>So&apos;nggi ma&apos;lumotnomalar</CardTitle>
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              Barchasi <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Hozircha ma&apos;lumotnomalar yo&apos;q.{" "}
              <Link href="/documents/new" className="text-primary hover:underline">
                Birinchisini yarating
              </Link>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raqam</TableHead>
                  <TableHead>Loyiha</TableHead>
                  <TableHead>Tuman</TableHead>
                  <TableHead>Boshlang&apos;ich narx</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/documents/${d.id}`} className="text-primary hover:underline">
                        {d.documentNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{d.projectName}</TableCell>
                    <TableCell className="text-slate-500">{d.district.name}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatSom(d.startingPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

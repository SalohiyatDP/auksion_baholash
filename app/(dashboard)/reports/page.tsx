import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSom } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getSession();
  const scope: Prisma.DocumentWhereInput = user?.role === "ADMIN" ? {} : { createdById: user?.id };

  const [byStatus, all, byDistrict] = await Promise.all([
    prisma.document.groupBy({ by: ["status"], where: scope, _count: true, _sum: { startingPrice: true } }),
    prisma.document.aggregate({ where: scope, _count: true, _sum: { startingPrice: true }, _avg: { startingPrice: true } }),
    prisma.document.groupBy({ by: ["districtId"], where: scope, _count: true, _sum: { startingPrice: true } }),
  ]);

  const districts = await prisma.district.findMany({
    where: { id: { in: byDistrict.map((d) => d.districtId) } },
  });
  const dName = (id: number) => districts.find((d) => d.id === id)?.name ?? "—";

  const statusLabels: Record<string, string> = {
    DRAFT: "Qoralama", GENERATED: "Yaratilgan", ARCHIVED: "Arxivlangan",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hisobotlar</h1>
        <p className="text-sm text-slate-500">Umumiy statistika va taqsimotlar</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Jami hujjatlar</p><p className="text-2xl font-bold">{all._count}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Umumiy boshlang&apos;ich narx</p><p className="text-xl font-bold">{formatSom(all._sum.startingPrice ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">O&apos;rtacha narx</p><p className="text-xl font-bold">{formatSom(Math.round(all._avg.startingPrice ?? 0))}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Holat bo&apos;yicha</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Holat</TableHead><TableHead>Soni</TableHead><TableHead>Summa</TableHead></TableRow></TableHeader>
              <TableBody>
                {byStatus.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell>{statusLabels[s.status] ?? s.status}</TableCell>
                    <TableCell>{s._count}</TableCell>
                    <TableCell>{formatSom(s._sum.startingPrice ?? 0)}</TableCell>
                  </TableRow>
                ))}
                {byStatus.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-400">Ma&apos;lumot yo&apos;q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tuman bo&apos;yicha</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Tuman</TableHead><TableHead>Soni</TableHead><TableHead>Summa</TableHead></TableRow></TableHeader>
              <TableBody>
                {byDistrict.map((s) => (
                  <TableRow key={s.districtId}>
                    <TableCell>{dName(s.districtId)}</TableCell>
                    <TableCell>{s._count}</TableCell>
                    <TableCell>{formatSom(s._sum.startingPrice ?? 0)}</TableCell>
                  </TableRow>
                ))}
                {byDistrict.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-400">Ma&apos;lumot yo&apos;q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

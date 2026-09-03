import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAllCoefficients } from "@/services/coefficient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInteger, formatDecimal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { territory, taxRates, landUsage, areas, engineering, legal } = await getAllCoefficients();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sozlamalar — Koeffitsiyentlar</h1>
        <p className="text-sm text-slate-500">Hisoblashda ishlatiladigan koeffitsiyentlar bazasi</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Koeffitsiyentlar Excel manba faylidan aynan olingan. Qiymatlar hujjat yaratilgan paytda
          <b> snapshot</b> sifatida saqlanadi — kelajakdagi o&apos;zgarishlar eski hujjatlarga ta&apos;sir
          qilmaydi. (v1 da tahrirlash to&apos;g&apos;ridan-to&apos;g&apos;ri bazada/seed orqali; UI-CRUD keyingi bosqichda.)
        </p>
      </div>

      {/* T */}
      <Card>
        <CardHeader><CardTitle className="text-base">Hudud toifa koeffitsiyenti (T)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Tuman</TableHead><TableHead>Toifa</TableHead><TableHead>T</TableHead></TableRow></TableHeader>
            <TableBody>
              {territory.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.district.name}</TableCell>
                  <TableCell>{t.category}-toifa</TableCell>
                  <TableCell className="font-medium">{formatInteger(t.coefficientT)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* B */}
      <Card>
        <CardHeader><CardTitle className="text-base">Yer solig&apos;i stavkasi (B)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tuman</TableHead><TableHead>Bazaviy</TableHead><TableHead>Koeff.</TableHead>
              <TableHead>Yillik stavka</TableHead><TableHead>B (so&apos;m/kv.m)</TableHead><TableHead>Yil</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {taxRates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.district.name}</TableCell>
                  <TableCell>{formatInteger(t.baseAmount)}</TableCell>
                  <TableCell>{formatDecimal(t.coefficient, 2)}</TableCell>
                  <TableCell>{formatInteger(t.annualRate)}</TableCell>
                  <TableCell className="font-medium">{formatInteger(t.rateB)}</TableCell>
                  <TableCell>{t.year}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* F */}
        <Card>
          <CardHeader><CardTitle className="text-base">Foydalanish turi (F)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Nomi</TableHead><TableHead>F</TableHead></TableRow></TableHeader>
              <TableBody>
                {landUsage.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.code}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell className="font-medium">{formatDecimal(u.coefficientF)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* M */}
        <Card>
          <CardHeader><CardTitle className="text-base">Maydon koeffitsiyenti (M)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Oraliq</TableHead><TableHead>M</TableHead></TableRow></TableHeader>
              <TableBody>
                {areas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{a.description}</TableCell>
                    <TableCell className="font-medium">{formatDecimal(a.coefficientM)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* G */}
      <Card>
        <CardHeader><CardTitle className="text-base">Muhandislik koeffitsiyenti (G)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nomi</TableHead><TableHead>G</TableHead><TableHead>Default</TableHead></TableRow></TableHeader>
            <TableBody>
              {engineering.map((en) => (
                <TableRow key={en.id}>
                  <TableCell>{en.name}</TableCell>
                  <TableCell className="font-medium">{formatDecimal(en.coefficientG)}</TableCell>
                  <TableCell>{en.isDefault ? "✓" : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader><CardTitle className="text-base">Huquqiy asos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {legal.map((l) => (
            <div key={l.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">{l.title}</p>
              <p className="mt-1 text-xs text-slate-500">{l.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

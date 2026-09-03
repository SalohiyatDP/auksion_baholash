"use client";

import * as React from "react";
import { Calculator, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { formatSom, formatHectare } from "@/lib/format";

interface Option { id: number; name: string }
interface UsageOption { id: number; code: string; name: string; coefficientF: number }

interface CalcResponse {
  coefficients: { s: number; t: number; b: number; g: number; f: number; m: number; e: number; tDescription: string; mDescription: string; fName: string; lotAreaHa: number };
  result: { startingPrice: number; formula: string };
}

export default function CalculationsPage() {
  const { error } = useToast();
  const [regions, setRegions] = React.useState<Option[]>([]);
  const [districts, setDistricts] = React.useState<Option[]>([]);
  const [usages, setUsages] = React.useState<UsageOption[]>([]);
  const [regionId, setRegionId] = React.useState("");
  const [districtId, setDistrictId] = React.useState("");
  const [area, setArea] = React.useState("7700");
  const [usage, setUsage] = React.useState("");
  const [g, setG] = React.useState("1.0");
  const [e, setE] = React.useState("0");
  const [calc, setCalc] = React.useState<CalcResponse | null>(null);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const [r, c] = await Promise.all([
          apiFetch<{ regions: Option[] }>("/api/regions"),
          apiFetch<{ landUsage: UsageOption[] }>("/api/coefficients"),
        ]);
        setRegions(r.regions);
        setUsages(c.landUsage);
        if (r.regions.length === 1) setRegionId(String(r.regions[0].id));
      } catch (err) {
        error(err instanceof Error ? err.message : "Xatolik");
      }
    })();
  }, [error]);

  React.useEffect(() => {
    if (!regionId) return;
    apiFetch<{ districts: Option[] }>(`/api/districts?regionId=${regionId}`).then((d) => setDistricts(d.districts));
  }, [regionId]);

  React.useEffect(() => {
    const dId = Number(districtId), a = Number(area), gv = Number(g);
    if (!dId || !a || !usage || !gv) { setCalc(null); return; }
    const t = setTimeout(async () => {
      try {
        setMsg("");
        const res = await apiFetch<CalcResponse>("/api/calculations", {
          method: "POST",
          body: JSON.stringify({ districtId: dId, lotAreaM2: a, landUsageCode: usage, g: gv, e: Number(e || 0) }),
        });
        setCalc(res);
      } catch (err) {
        setCalc(null);
        setMsg(err instanceof Error ? err.message : "Xatolik");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [districtId, area, usage, g, e]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tezkor hisoblash</h1>
        <p className="text-sm text-slate-500">Hujjat saqlamasdan boshlang&apos;ich narxni hisoblang.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-4 w-4 text-primary" /> Parametrlar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Viloyat</Label>
            <Select value={regionId} onChange={(ev) => { setRegionId(ev.target.value); setDistrictId(""); }}>
              <option value="">— tanlang —</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tuman</Label>
            <Select value={districtId} onChange={(ev) => setDistrictId(ev.target.value)} disabled={!regionId}>
              <option value="">— tanlang —</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Lot maydoni (kv.metr)</Label>
            <Input type="number" value={area} onChange={(ev) => setArea(ev.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Foydalanish turi (F)</Label>
            <Select value={usage} onChange={(ev) => setUsage(ev.target.value)}>
              <option value="">— tanlang —</option>
              {usages.map((u) => <option key={u.id} value={u.code}>{u.name} (F={u.coefficientF})</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Muhandislik (G)</Label>
            <Input type="number" step="0.1" value={g} onChange={(ev) => setG(ev.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Qo&apos;shimcha xarajat (E)</Label>
            <Input type="number" value={e} onChange={(ev) => setE(ev.target.value)} />
          </div>
        </CardContent>
      </Card>

      {msg && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</div>}

      {calc && (
        <Card className="border-primary/20">
          <CardContent className="space-y-4 p-6">
            <div className="rounded-lg bg-slate-50 p-3 text-center text-sm">{calc.result.formula}</div>
            <div className="rounded-xl bg-primary p-6 text-center text-primary-foreground">
              <p className="text-sm opacity-80">Boshlang&apos;ich narx ({formatHectare(calc.coefficients.lotAreaHa)} gektar uchun)</p>
              <p className="mt-1 text-3xl font-bold">{formatSom(calc.result.startingPrice)}</p>
            </div>
            <div className="flex justify-end">
              <Link href="/documents/new">
                <Button variant="outline" size="sm">Ushbu asosda hujjat yaratish <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

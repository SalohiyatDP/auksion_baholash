"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, FileText, Eye, EyeOff, Calculator, MapPin, Layers, Coins, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { MapUpload } from "./map-upload";
import { DocumentPreview, type PreviewData } from "./document-preview";
import { apiFetch } from "@/lib/client";
import { formatHectare, formatSom } from "@/lib/format";

interface Option { id: number; name: string }
interface UsageOption { id: number; code: string; name: string; coefficientF: number }
interface EngOption { id: number; name: string; coefficientG: number; isDefault: boolean }

export interface DocumentFormInitial {
  id?: string;
  regionId?: number;
  districtId?: number;
  mfy?: string;
  projectName?: string;
  organization?: string;
  projectPurpose?: string;
  totalAreaHa?: number;
  lotAreaM2?: number;
  landUsageCode?: string;
  g?: number;
  e?: number;
  hasMap?: boolean;
}

interface CalcResponse {
  coefficients: {
    s: number; t: number; b: number; g: number; f: number; m: number; e: number;
    tDescription: string; mDescription: string; fName: string; fCode: string; lotAreaHa: number;
  };
  result: { startingPrice: number; formattedPrice: string; formula: string; formulaTemplate: string };
}

export function DocumentForm({ initial }: { initial?: DocumentFormInitial }) {
  const router = useRouter();
  const { success, error } = useToast();
  const isEdit = Boolean(initial?.id);

  // Ma'lumotnomalar
  const [regions, setRegions] = React.useState<Option[]>([]);
  const [districts, setDistricts] = React.useState<Option[]>([]);
  const [mfys, setMfys] = React.useState<Option[]>([]);
  const [usages, setUsages] = React.useState<UsageOption[]>([]);
  const [engineering, setEngineering] = React.useState<EngOption[]>([]);
  const [legalText, setLegalText] = React.useState("");

  // Forma qiymatlari
  const [regionId, setRegionId] = React.useState<string>(initial?.regionId ? String(initial.regionId) : "");
  const [districtId, setDistrictId] = React.useState<string>(initial?.districtId ? String(initial.districtId) : "");
  const [mfy, setMfy] = React.useState(initial?.mfy ?? "");
  const [projectName, setProjectName] = React.useState(initial?.projectName ?? "");
  const [organization, setOrganization] = React.useState(initial?.organization ?? "");
  const [projectPurpose, setProjectPurpose] = React.useState(
    initial?.projectPurpose ?? "turistik-rekreatsion loyihani amalga oshirish"
  );
  const [totalAreaHa, setTotalAreaHa] = React.useState(initial?.totalAreaHa != null ? String(initial.totalAreaHa) : "");
  const [lotAreaM2, setLotAreaM2] = React.useState(initial?.lotAreaM2 != null ? String(initial.lotAreaM2) : "");
  const [landUsageCode, setLandUsageCode] = React.useState(initial?.landUsageCode ?? "");
  const [g, setG] = React.useState(initial?.g != null ? String(initial.g) : "1.0");
  const [e, setE] = React.useState(initial?.e != null ? String(initial.e) : "0");

  const [mapFile, setMapFile] = React.useState<File | null>(null);
  const [mapPreview, setMapPreview] = React.useState<string | null>(
    isEdit && initial?.hasMap ? `/api/documents/${initial!.id}/map` : null
  );
  const [removeMap, setRemoveMap] = React.useState(false);

  const [calc, setCalc] = React.useState<CalcResponse | null>(null);
  const [calcError, setCalcError] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(true);
  const [saving, setSaving] = React.useState<null | "draft" | "generate">(null);

  // Boshlang'ich ma'lumotlarni yuklash
  React.useEffect(() => {
    (async () => {
      try {
        const [r, c] = await Promise.all([
          apiFetch<{ regions: Option[] }>("/api/regions"),
          apiFetch<{ landUsage: UsageOption[]; engineering: EngOption[]; legal: { body: string }[] }>("/api/coefficients"),
        ]);
        setRegions(r.regions);
        setUsages(c.landUsage);
        setEngineering(c.engineering);
        setLegalText(c.legal[0]?.body ?? "");
        if (r.regions.length === 1 && !regionId) setRegionId(String(r.regions[0].id));
      } catch (err) {
        error(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tumanlar
  React.useEffect(() => {
    if (!regionId) { setDistricts([]); return; }
    apiFetch<{ districts: Option[] }>(`/api/districts?regionId=${regionId}`)
      .then((d) => setDistricts(d.districts))
      .catch(() => setDistricts([]));
  }, [regionId]);

  // MFY lar
  React.useEffect(() => {
    if (!districtId) { setMfys([]); return; }
    apiFetch<{ mfys: Option[] }>(`/api/mfys?districtId=${districtId}`)
      .then((d) => setMfys(d.mfys))
      .catch(() => setMfys([]));
  }, [districtId]);

  // Map preview URL (mahalliy fayl uchun)
  React.useEffect(() => {
    if (!mapFile) return;
    const url = URL.createObjectURL(mapFile);
    setMapPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mapFile]);

  // Jonli hisoblash (debounce)
  React.useEffect(() => {
    const dId = Number(districtId);
    const area = Number(lotAreaM2);
    const gVal = Number(g);
    const eVal = Number(e || 0);
    if (!dId || !area || area <= 0 || !landUsageCode || !gVal) {
      setCalc(null);
      return;
    }
    setCalcError("");
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<CalcResponse>("/api/calculations", {
          method: "POST",
          body: JSON.stringify({ districtId: dId, lotAreaM2: area, landUsageCode, g: gVal, e: eVal }),
        });
        setCalc(res);
      } catch (err) {
        setCalc(null);
        setCalcError(err instanceof Error ? err.message : "Hisoblashda xatolik");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [districtId, lotAreaM2, landUsageCode, g, e]);

  const lotHa = Number(lotAreaM2) > 0 ? Number(lotAreaM2) / 10000 : 0;

  const regionName = regions.find((r) => String(r.id) === regionId)?.name ?? "";
  const districtName = districts.find((d) => String(d.id) === districtId)?.name ?? "";

  const previewData: PreviewData | null = calc
    ? {
        regionName,
        districtName,
        mfy,
        projectName: projectName || "___",
        organization: organization || "___",
        projectPurpose,
        totalAreaHa: Number(totalAreaHa) || 0,
        lotAreaM2: calc.coefficients.s,
        lotAreaHa: calc.coefficients.lotAreaHa,
        s: calc.coefficients.s,
        t: calc.coefficients.t,
        b: calc.coefficients.b,
        g: calc.coefficients.g,
        f: calc.coefficients.f,
        m: calc.coefficients.m,
        e: calc.coefficients.e,
        startingPrice: calc.result.startingPrice,
        tDescription: calc.coefficients.tDescription,
        fDescription: `${calc.coefficients.fName} (kod ${calc.coefficients.fCode})`,
        legalReference: legalText,
        formula: calc.result.formula,
        mapUrl: mapPreview,
      }
    : null;

  function validate(): string | null {
    if (!regionId) return "Viloyatni tanlang";
    if (!districtId) return "Tumanni tanlang";
    if (!mfy.trim()) return "MFY kiriting";
    if (!projectName.trim()) return "Loyiha nomini kiriting";
    if (!(Number(totalAreaHa) > 0)) return "Jami maydon 0 dan katta bo'lishi kerak";
    if (!(Number(lotAreaM2) > 0)) return "Lot maydoni 0 dan katta bo'lishi kerak";
    if (!landUsageCode) return "Foydalanish turini tanlang";
    if (!(Number(g) >= 0.1)) return "G koeffitsiyentini kiriting";
    if (Number(e) < 0) return "Qo'shimcha xarajatlar manfiy bo'lmasligi kerak";
    return null;
  }

  async function handleSubmit(action: "draft" | "generate") {
    const v = validate();
    if (v) { error(v); return; }
    setSaving(action);
    try {
      const payload = {
        regionId: Number(regionId),
        districtId: Number(districtId),
        mfy,
        projectName,
        organization,
        projectPurpose,
        totalAreaHa: Number(totalAreaHa),
        lotAreaM2: Number(lotAreaM2),
        landUsageCode,
        g: Number(g),
        e: Number(e || 0),
        status: action === "generate" ? "GENERATED" : "DRAFT",
      };

      const saved = isEdit
        ? await apiFetch<{ document: { id: string } }>(`/api/documents/${initial!.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch<{ document: { id: string } }>("/api/documents", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const docId = saved.document.id;

      // Xarita
      if (mapFile) {
        const fd = new FormData();
        fd.append("file", mapFile);
        await apiFetch(`/api/documents/${docId}/map`, { method: "POST", body: fd });
      } else if (removeMap && isEdit) {
        await apiFetch(`/api/documents/${docId}/map`, { method: "DELETE" }).catch(() => {});
      }

      // Word generatsiya
      if (action === "generate") {
        await apiFetch(`/api/documents/${docId}/generate-word`, { method: "POST" });
        success("Hujjat saqlandi va Word fayli yaratildi");
      } else {
        success("Qoralama saqlandi");
      }

      router.push(`/documents/${docId}`);
      router.refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Chap: forma */}
      <div className="space-y-6">
        {/* A: Hudud */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" /> A. Hudud ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Viloyat *">
              <Select value={regionId} onChange={(e) => { setRegionId(e.target.value); setDistrictId(""); setMfy(""); }}>
                <option value="">— tanlang —</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Field label="Tuman *">
              <Select value={districtId} onChange={(e) => { setDistrictId(e.target.value); setMfy(""); }} disabled={!regionId}>
                <option value="">— tanlang —</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="MFY *">
              <Input list="mfy-list" value={mfy} onChange={(e) => setMfy(e.target.value)} placeholder="Guliston MFY" />
              <datalist id="mfy-list">
                {mfys.map((m) => <option key={m.id} value={m.name} />)}
              </datalist>
            </Field>
            <Field label="Balansdagi tashkilot">
              <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Namangan turistik-rekreatsion ... direksiyasi" />
            </Field>
          </CardContent>
        </Card>

        {/* B: Yer uchastkasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" /> B. Yer uchastkasi ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Loyiha / lot nomi *">
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Sharshara-1" />
            </Field>
            <Field label="Loyiha maqsadi">
              <Input value={projectPurpose} onChange={(e) => setProjectPurpose(e.target.value)} />
            </Field>
            <Field label="Jami ro'yxatdan o'tgan maydon (gektar) *">
              <Input type="number" step="0.01" min="0" value={totalAreaHa} onChange={(e) => setTotalAreaHa(e.target.value)} placeholder="4.92" />
            </Field>
            <Field label="Auksion lot maydoni (kv.metr) *">
              <Input type="number" step="1" min="0" value={lotAreaM2} onChange={(e) => setLotAreaM2(e.target.value)} placeholder="7700" />
              {Number(lotAreaM2) > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  = <span className="font-medium">{formatHectare(lotHa)} gektar</span> ({Number(lotAreaM2).toLocaleString("ru-RU")} kv.m)
                </p>
              )}
            </Field>
          </CardContent>
        </Card>

        {/* C-D-E */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-primary" /> C-D-E. Koeffitsiyentlar va xarajatlar
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Foydalanish turi (F) *">
              <Select value={landUsageCode} onChange={(e) => setLandUsageCode(e.target.value)}>
                <option value="">— tanlang —</option>
                {usages.map((u) => (
                  <option key={u.id} value={u.code}>{u.name} (F={u.coefficientF})</option>
                ))}
              </Select>
            </Field>
            <Field label="Muhandislik koeffitsiyenti (G) *">
              <Input type="number" step="0.1" min="0.1" max="3" value={g} onChange={(e) => setG(e.target.value)} list="eng-list" />
              <datalist id="eng-list">
                {engineering.map((en) => <option key={en.id} value={en.coefficientG}>{en.name}</option>)}
              </datalist>
            </Field>
            <Field label="Qo'shimcha xarajatlar (E), so'm">
              <Input type="number" step="1" min="0" value={e} onChange={(ev) => setE(ev.target.value)} placeholder="0" />
            </Field>
            <div className="flex items-end text-xs text-slate-500">
              <p>M koeffitsiyenti lot maydoniga qarab <b>avtomatik</b> aniqlanadi.</p>
            </div>
          </CardContent>
        </Card>

        {/* Xarita */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Xarita ko&apos;chirmasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapUpload
              previewUrl={mapPreview}
              onSelect={(f) => {
                setMapFile(f);
                if (!f) { setMapPreview(null); setRemoveMap(true); }
                else setRemoveMap(false);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* O'ng: hisoblash + preview */}
      <div className="space-y-6">
        {/* Hisoblash paneli */}
        <Card className="border-primary/20 bg-gradient-to-br from-white to-blue-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-primary" /> Hisoblash natijasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white p-4 text-center font-mono text-sm shadow-sm">
              C = S × T × B × G × F × M + E
            </div>
            {calcError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{calcError}</div>
            )}
            {calc ? (
              <>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Coef label="S" value={calc.coefficients.s} />
                  <Coef label="T" value={calc.coefficients.t} />
                  <Coef label="B" value={calc.coefficients.b} />
                  <Coef label="G" value={calc.coefficients.g} />
                  <Coef label="F" value={calc.coefficients.f} />
                  <Coef label="M" value={calc.coefficients.m} />
                  <Coef label="E" value={calc.coefficients.e} />
                </div>
                <div className="rounded-lg bg-white p-3 text-center text-xs text-slate-600 shadow-sm">
                  {calc.result.formula}
                </div>
                <div className="rounded-xl bg-primary p-5 text-center text-primary-foreground shadow">
                  <p className="text-xs opacity-80">Boshlang&apos;ich narx</p>
                  <p className="mt-1 text-2xl font-bold">{formatSom(calc.result.startingPrice)}</p>
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                Tuman, lot maydoni va foydalanish turini kiriting — hisob avtomatik chiqadi.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Amallar */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleSubmit("draft")} variant="outline" loading={saving === "draft"} disabled={saving !== null}>
            <Save className="h-4 w-4" /> Qoralama saqlash
          </Button>
          <Button onClick={() => handleSubmit("generate")} loading={saving === "generate"} disabled={saving !== null}>
            <FileText className="h-4 w-4" /> Saqlash va Word yaratish
          </Button>
          <Button variant="ghost" onClick={() => setShowPreview((s) => !s)} type="button">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Ko'rinishni yashirish" : "Ko'rinishni ko'rsatish"}
          </Button>
        </div>

        {/* Preview */}
        {showPreview && previewData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hujjat ko&apos;rinishi (preview)</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-100 p-4">
              <DocumentPreview data={previewData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Coef({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-2 shadow-sm">
      <p className="font-bold text-primary">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}

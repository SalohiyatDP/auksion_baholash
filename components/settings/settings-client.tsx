"use client";

import * as React from "react";
import { Info, Loader2 } from "lucide-react";
import { EditableTable, type FieldDef, type ColumnDef } from "./editable-table";
import { apiFetch } from "@/lib/client";
import { formatInteger, formatDecimal } from "@/lib/format";

interface Option { id: number; name: string }

export function SettingsClient() {
  const [regions, setRegions] = React.useState<Option[]>([]);
  const [districts, setDistricts] = React.useState<Option[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [r, d] = await Promise.all([
          apiFetch<{ regions: Option[] }>("/api/regions"),
          apiFetch<{ districts: Option[] }>("/api/districts"),
        ]);
        setRegions(r.regions);
        setDistricts(d.districts);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const regionOpts = regions.map((r) => ({ value: r.id, label: r.name }));
  const districtOpts = districts.map((d) => ({ value: d.id, label: d.name }));
  const defRegion = regions[0]?.id ?? "";

  if (!ready) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  // --- Field/Column ta'riflari ---
  const territoryFields: FieldDef[] = [
    { key: "regionId", label: "Viloyat", type: "select", options: regionOpts },
    { key: "districtId", label: "Tuman", type: "select", options: districtOpts },
    { key: "category", label: "Toifa (1-5)", type: "number", step: "1" },
    { key: "coefficientT", label: "T koeffitsiyenti", type: "number", step: "0.1" },
  ];
  const territoryCols: ColumnDef[] = [
    { key: "district", label: "Tuman", render: (r) => r.district?.name ?? "—" },
    { key: "category", label: "Toifa", render: (r) => `${r.category}-toifa` },
    { key: "coefficientT", label: "T", render: (r) => formatInteger(r.coefficientT) },
  ];

  const taxFields: FieldDef[] = [
    { key: "regionId", label: "Viloyat", type: "select", options: regionOpts },
    { key: "districtId", label: "Tuman", type: "select", options: districtOpts },
    { key: "baseAmount", label: "Bazaviy miqdor", type: "number", step: "1" },
    { key: "coefficient", label: "Koeffitsiyent", type: "number", step: "0.01" },
    { key: "year", label: "Yil", type: "number", step: "1" },
  ];
  const taxCols: ColumnDef[] = [
    { key: "district", label: "Tuman", render: (r) => r.district?.name ?? "—" },
    { key: "baseAmount", label: "Bazaviy", render: (r) => formatInteger(r.baseAmount) },
    { key: "coefficient", label: "Koeff.", render: (r) => formatDecimal(r.coefficient, 2) },
    { key: "rateB", label: "B (so'm/kv.m)", render: (r) => formatInteger(r.rateB) },
    { key: "year", label: "Yil" },
  ];

  const usageFields: FieldDef[] = [
    { key: "code", label: "Kod", type: "text" },
    { key: "name", label: "Nomi", type: "text" },
    { key: "coefficientF", label: "F koeffitsiyenti", type: "number", step: "0.1" },
    { key: "isActive", label: "Faol", type: "checkbox" },
  ];
  const usageCols: ColumnDef[] = [
    { key: "code", label: "Kod" },
    { key: "name", label: "Nomi" },
    { key: "coefficientF", label: "F", render: (r) => formatDecimal(r.coefficientF) },
  ];

  const areaFields: FieldDef[] = [
    { key: "minArea", label: "Minimal maydon (kv.m)", type: "number", step: "1" },
    { key: "maxArea", label: "Maksimal maydon (kv.m)", type: "number", step: "1", hint: "Bo'sh qoldirilsa — cheksiz" },
    { key: "coefficientM", label: "M koeffitsiyenti", type: "number", step: "0.1" },
    { key: "description", label: "Tavsif", type: "text" },
  ];
  const areaCols: ColumnDef[] = [
    { key: "description", label: "Oraliq" },
    { key: "minArea", label: "Min", render: (r) => formatInteger(r.minArea) },
    { key: "maxArea", label: "Max", render: (r) => (r.maxArea == null ? "∞" : formatInteger(r.maxArea)) },
    { key: "coefficientM", label: "M", render: (r) => formatDecimal(r.coefficientM) },
  ];

  const engFields: FieldDef[] = [
    { key: "name", label: "Nomi", type: "text" },
    { key: "coefficientG", label: "G koeffitsiyenti", type: "number", step: "0.1" },
    { key: "isDefault", label: "Standart (default)", type: "checkbox" },
  ];
  const engCols: ColumnDef[] = [
    { key: "name", label: "Nomi" },
    { key: "coefficientG", label: "G", render: (r) => formatDecimal(r.coefficientG) },
    { key: "isDefault", label: "Default", render: (r) => (r.isDefault ? "✓" : "") },
  ];

  const legalFields: FieldDef[] = [
    { key: "title", label: "Sarlavha", type: "text" },
    { key: "body", label: "Matn", type: "textarea" },
    { key: "isActive", label: "Faol", type: "checkbox" },
  ];
  const legalCols: ColumnDef[] = [
    { key: "title", label: "Sarlavha" },
    { key: "body", label: "Matn", render: (r) => <span className="text-xs text-slate-500">{String(r.body).slice(0, 90)}…</span> },
    { key: "isActive", label: "Faol", render: (r) => (r.isActive ? "✓" : "") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Koeffitsiyentlarni bu yerda tahrirlashingiz mumkin. O&apos;zgarishlar faqat yangi hujjatlarga
          ta&apos;sir qiladi — avval yaratilgan hujjatlarda qiymatlar <b>snapshot</b> sifatida saqlangan.
        </p>
      </div>

      <EditableTable title="Hudud toifa koeffitsiyenti (T)" entity="territory"
        fields={territoryFields} columns={territoryCols}
        makeEmpty={() => ({ regionId: defRegion, districtId: "", category: 3, coefficientT: 15 })} />

      <EditableTable title="Yer solig'i stavkasi (B)" entity="tax"
        fields={taxFields} columns={taxCols}
        makeEmpty={() => ({ regionId: defRegion, districtId: "", baseAmount: 51800000, coefficient: 1.1, year: new Date().getFullYear() })} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EditableTable title="Foydalanish turi (F)" entity="usage"
          fields={usageFields} columns={usageCols}
          makeEmpty={() => ({ code: "", name: "", coefficientF: 1.0, isActive: true })} />

        <EditableTable title="Maydon koeffitsiyenti (M)" entity="area"
          fields={areaFields} columns={areaCols}
          makeEmpty={() => ({ minArea: 0, maxArea: "", coefficientM: 1.0, description: "" })} />
      </div>

      <EditableTable title="Muhandislik koeffitsiyenti (G)" entity="engineering"
        fields={engFields} columns={engCols}
        makeEmpty={() => ({ name: "", coefficientG: 1.0, isDefault: false })} />

      <EditableTable title="Huquqiy asos" entity="legal"
        fields={legalFields} columns={legalCols}
        makeEmpty={() => ({ title: "", body: "", isActive: true })} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EditableTable title="Balansda saqlovchi tashkilotlar" entity="organization"
          fields={[{ key: "name", label: "Tashkilot nomi", type: "text" }]}
          columns={[{ key: "name", label: "Nomi" }]}
          makeEmpty={() => ({ name: "" })} />

        <EditableTable title="Loyiha maqsadlari" entity="purpose"
          fields={[{ key: "name", label: "Maqsad matni", type: "text" }]}
          columns={[{ key: "name", label: "Matn" }]}
          makeEmpty={() => ({ name: "" })} />
      </div>
    </div>
  );
}

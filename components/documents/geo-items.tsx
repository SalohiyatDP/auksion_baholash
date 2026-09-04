"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { GeoUpload } from "./geo-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  geojson: string | null;
  areaHa: string;
}

function rid() {
  return Math.random().toString(36).slice(2, 9);
}
function emptyItem(): Item {
  return { id: rid(), geojson: null, areaHa: "" };
}

/** Ro'yxatdagi yozuvlarni bitta FeatureCollection'ga birlashtiradi (har feature areaHa + __group bilan) */
export function itemsToFC(items: Item[]): string | null {
  const features: any[] = [];
  for (const it of items) {
    if (!it.geojson) continue;
    let gj: any;
    try {
      gj = JSON.parse(it.geojson);
    } catch {
      continue;
    }
    const feats =
      gj.type === "FeatureCollection"
        ? gj.features || []
        : gj.type === "Feature"
        ? [gj]
        : gj.type
        ? [{ type: "Feature", geometry: gj, properties: {} }]
        : [];
    const areaHa = it.areaHa !== "" && !Number.isNaN(Number(it.areaHa)) ? Number(it.areaHa) : null;
    feats.forEach((f: any, idx: number) => {
      features.push({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...(f.properties || {}), areaHa, __group: it.id, __fid: `${it.id}:${idx}` },
      });
    });
  }
  if (!features.length) return null;
  return JSON.stringify({ type: "FeatureCollection", features });
}

/** FeatureCollection'ni __group bo'yicha yozuvlarga qaytaradi (tahrirlash uchun) */
export function fcToItems(fc: string | null): Item[] {
  if (!fc) return [emptyItem()];
  try {
    const gj = JSON.parse(fc);
    const feats = gj.features || [];
    if (!feats.length) return [emptyItem()];
    const groups = new Map<string, any[]>();
    for (const f of feats) {
      const g = (f.properties && f.properties.__group) || rid();
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    const items: Item[] = [];
    for (const [g, fs] of groups) {
      const areaHa = fs[0]?.properties?.areaHa;
      items.push({
        id: g,
        geojson: JSON.stringify({ type: "FeatureCollection", features: fs }),
        areaHa: areaHa != null ? String(areaHa) : "",
      });
    }
    return items.length ? items : [emptyItem()];
  } catch {
    return [emptyItem()];
  }
}

interface GeoItemsProps {
  label: string;
  color: "red" | "blue";
  initialFC: string | null;
  onChange: (fc: string | null) => void;
}

export function GeoItems({ label, color, initialFC, onChange }: GeoItemsProps) {
  const [items, setItems] = React.useState<Item[]>(() => fcToItems(initialFC));

  const apply = (next: Item[]) => {
    setItems(next);
    onChange(itemsToFC(next));
  };

  const dotColor = color === "red" ? "bg-red-500" : "bg-blue-600";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className={cn("inline-block h-3 w-3 rounded-sm", dotColor)} />
        {label}
      </div>

      {items.map((it, i) => (
        <div key={it.id} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">#{i + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => apply(items.filter((x) => x.id !== it.id))}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <GeoUpload
            label={`${label} #${i + 1}`}
            color={color}
            geojson={it.geojson}
            onChange={(gj) => apply(items.map((x) => (x.id === it.id ? { ...x, geojson: gj } : x)))}
          />

          <div className="space-y-1.5">
            <Label>Maydoni (gektar)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={it.areaHa}
              onChange={(e) => apply(items.map((x) => (x.id === it.id ? { ...x, areaHa: e.target.value } : x)))}
              placeholder="masalan 4.92"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => apply([...items, emptyItem()])}
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-primary/60 hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Yana {label.toLowerCase()} qo&apos;shish
      </button>
    </div>
  );
}

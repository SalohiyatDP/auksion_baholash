"use client";

import * as React from "react";
import { UploadCloud, FileCheck2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { parseGeoFile, countFeatures } from "@/lib/geo/parse-client";

interface GeoUploadProps {
  label: string;
  color: "red" | "blue";
  geojson: string | null;
  onChange: (geojson: string | null, meta?: { name: string; count: number }) => void;
}

export function GeoUpload({ label, color, geojson, onChange }: GeoUploadProps) {
  const { error, success } = useToast();
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [info, setInfo] = React.useState<{ name: string; count: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const gj = await parseGeoFile(file);
      const count = countFeatures(gj);
      if (count === 0) throw new Error("Faylda geometriya topilmadi");
      const meta = { name: file.name, count };
      setInfo(meta);
      onChange(JSON.stringify(gj), meta);
      success(`${label}: ${count} ta obyekt yuklandi`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Faylni o'qishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  const dotColor = color === "red" ? "bg-red-500" : "bg-blue-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className={cn("inline-block h-3 w-3 rounded-sm", dotColor)} />
        {label}
      </div>

      {geojson && (info || true) ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileCheck2 className="h-4 w-4 text-green-600" />
            <span>{info ? `${info.name} — ${info.count} ta obyekt` : "Geometriya yuklangan"}</span>
          </div>
          <button
            type="button"
            onClick={() => { setInfo(null); onChange(null); }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-5 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-slate-300 hover:border-primary/60 hover:bg-slate-50"
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-5 w-5 text-slate-400" />
          )}
          <p className="text-xs font-medium text-slate-600">SHP (.zip), KMZ, KML yoki GeoJSON</p>
          <p className="text-[11px] text-slate-400">Tashlang yoki tanlang</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".zip,.shp,.kmz,.kml,.geojson,.json,application/zip,application/vnd.google-earth.kmz"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

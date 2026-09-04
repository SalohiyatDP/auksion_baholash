"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Maximize2, Download, X, Loader2 } from "lucide-react";
import { extractRings } from "@/lib/geo/geojson";
import { useToast } from "@/components/ui/toast";

interface GeoMapProps {
  totalGeoJson?: string | null;
  lotGeoJson?: string | null;
  height?: number;
  tileType?: string;
  center?: [number, number] | null; // [lat, lng]
  zoom?: number | null;
  lineWidth?: number;
  onViewChange?: (center: [number, number], zoom: number) => void;
}

function ViewCapture({ onViewChange }: { onViewChange: (c: [number, number], z: number) => void }) {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter();
      onViewChange([c.lat, c.lng], map.getZoom());
    },
  });
  return null;
}

const RED = "#D32F2F";
const BLUE = "#1E40AF";

function parse(str?: string | null): any | null {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

function FitBounds({ total, lot }: { total: any; lot: any }) {
  const map = useMap();
  React.useEffect(() => {
    let minLat = 90, minLng = 180, maxLat = -90, maxLng = -180;
    let has = false;
    for (const gj of [total, lot]) {
      if (!gj) continue;
      for (const ring of extractRings(gj)) {
        for (const [lat, lng] of ring) {
          minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
          has = true;
        }
      }
    }
    if (has) {
      try { map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [24, 24] }); } catch { /* ignore */ }
    }
  }, [total, lot, map]);
  return null;
}

const labelFeature = (f: any, layer: any) => {
  const a = f?.properties?.areaHa;
  if (a != null && a !== "") layer.bindTooltip(`${a} ga`, { permanent: true, direction: "center", className: "area-label" });
};

export function GeoMap({ totalGeoJson, lotGeoJson, height = 360, tileType = "google_satellite", center = null, zoom = null, lineWidth = 3, onViewChange }: GeoMapProps) {
  const [mounted, setMounted] = React.useState(false);
  const [fs, setFs] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const mapRef = React.useRef<any>(null);
  const toast = useToast();
  React.useEffect(() => { setMounted(true); }, []);
  const isChecked = (t: string) => tileType === t;

  const total = React.useMemo(() => parse(totalGeoJson), [totalGeoJson]);
  const lot = React.useMemo(() => parse(lotGeoJson), [lotGeoJson]);

  const hasGeo = total || lot;

  async function downloadPng() {
    if (!hasGeo) { toast.error("Avval SHP/KMZ yuklang"); return; }
    setDownloading(true);
    try {
      const m = mapRef.current;
      const view = m
        ? { lat: m.getCenter().lat, lng: m.getCenter().lng, zoom: m.getZoom() }
        : center && zoom != null ? { lat: center[0], lng: center[1], zoom } : null;
      const res = await fetch("/api/map-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalGeoJson, lotGeoJson, tileType, lineWidth, view }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error((j && j.error) || "Rasm olinmadi");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "xarita.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yuklab olishda xatolik");
    } finally {
      setDownloading(false);
    }
  }

  const mapEl = (h: number | string) => (
    <MapContainer
      key={`${tileType}-${fs}`}
      ref={mapRef}
      center={center ?? [41.0, 71.6]}
      zoom={zoom ?? 12}
      style={{ height: h, width: "100%" }}
      scrollWheelZoom
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked={isChecked("osm")} name="Ko'cha xaritasi">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={isChecked("esri")} name="Sun'iy yo'ldosh (Esri)">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={isChecked("google_satellite")} name="Google sun'iy yo'ldosh">
          <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} attribution="&copy; Google" maxZoom={21} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={isChecked("google_hybrid")} name="Google gibrid">
          <TileLayer url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} attribution="&copy; Google" maxZoom={21} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={isChecked("google_streets")} name="Google ko'cha">
          <TileLayer url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} attribution="&copy; Google" maxZoom={21} />
        </LayersControl.BaseLayer>
      </LayersControl>

      {total && (
        <GeoJSON key={`t-${totalGeoJson?.length ?? 0}-${lineWidth}`} data={total} style={{ color: RED, weight: lineWidth, fillColor: RED, fillOpacity: 0.12 }} onEachFeature={labelFeature} />
      )}
      {lot && (
        <GeoJSON key={`l-${lotGeoJson?.length ?? 0}-${lineWidth}`} data={lot} style={{ color: BLUE, weight: lineWidth, fillColor: BLUE, fillOpacity: 0.15 }} onEachFeature={labelFeature} />
      )}

      {zoom == null && <FitBounds total={total} lot={lot} />}
      {onViewChange && <ViewCapture onViewChange={onViewChange} />}
    </MapContainer>
  );

  const Toolbar = () => (
    <div className="mb-2 flex items-center justify-end gap-2">
      <button type="button" onClick={() => setFs(true)} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
        <Maximize2 className="h-3.5 w-3.5" /> Kattalashtirish
      </button>
      <button type="button" onClick={downloadPng} disabled={downloading} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PNG yuklab olish
      </button>
    </div>
  );

  const Legend = () => (
    <div className="mt-2 flex gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: RED }} /> Umumiy maydon (qizil)</span>
      <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} /> Lotlar (ko'k)</span>
    </div>
  );

  if (!hasGeo) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400" style={{ minHeight: height }}>
        <MapPin className="h-6 w-6" />
        <p>SHP yoki KMZ fayl yuklang — xarita shu yerda ko&apos;rinadi.</p>
      </div>
    );
  }

  if (!mounted) {
    return <div className="w-full animate-pulse rounded-lg bg-slate-100" style={{ height }} />;
  }

  return (
    <div>
      <Toolbar />
      <div className="overflow-hidden rounded-lg border">
        {!fs ? mapEl(height) : (
          <div className="flex items-center justify-center bg-slate-50 text-sm text-slate-400" style={{ height }}>
            Xarita to&apos;liq ekranda ochilgan
          </div>
        )}
      </div>
      <Legend />

      {fs && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={downloadPng} disabled={downloading} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PNG yuklab olish
            </button>
            <button type="button" onClick={() => setFs(false)} className="flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <X className="h-4 w-4" /> Yopish
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg bg-white">{mapEl("100%")}</div>
          <div className="mt-2 flex gap-4 text-xs text-white/80">
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: RED }} /> Umumiy maydon (qizil)</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} /> Lotlar (ko&apos;k)</span>
          </div>
        </div>
      )}
    </div>
  );
}

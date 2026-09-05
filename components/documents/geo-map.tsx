"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, LayersControl, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Maximize2, X } from "lucide-react";
import { extractRings, ringCentroid } from "@/lib/geo/geojson";
import { defaultLeader, type Leader, type LabelStyle, DEFAULT_LABEL_STYLE, type Pt } from "@/lib/geo/leader";

interface GeoMapProps {
  totalGeoJson?: string | null;
  lotGeoJson?: string | null;
  height?: number;
  tileType?: string;
  center?: [number, number] | null;
  zoom?: number | null;
  lineWidth?: number;
  leaders?: Record<string, Leader>;
  labelStyle?: LabelStyle;
  onViewChange?: (center: [number, number], zoom: number) => void;
  onLeaderChange?: (fid: string, leader: Leader) => void;
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

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 2px #000;cursor:move"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}
// O'rta nuqta — ko'rinmas, lekin ushlab siljitiladigan handle
function invisibleIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;background:transparent;cursor:move"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
// Gektar matni — tag chiziq ustida (chiziqning o'zi alohida Polyline)
function textIcon(text: string, s: LabelStyle) {
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-block;transform:translate(-50%,-135%);white-space:nowrap;color:${s.textColor};font-weight:700;font-size:${s.textSize}px;line-height:1.1;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;cursor:move">${text}</span>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

interface LabelInfo { fid: string; areaHa: any; centroid: Pt; bboxH: number; bboxW: number }

function buildLabels(gj: any): LabelInfo[] {
  if (!gj) return [];
  const feats = gj.type === "FeatureCollection" ? gj.features || [] : gj.type === "Feature" ? [gj] : [];
  const out: LabelInfo[] = [];
  feats.forEach((f: any, i: number) => {
    const a = f?.properties?.areaHa;
    if (a == null || a === "") return;
    const rings = extractRings({ type: "Feature", geometry: f.geometry });
    if (!rings.length) return;
    let biggest: any = null;
    let minLat = 90, minLng = 180, maxLat = -90, maxLng = -180;
    for (const r of rings) {
      if (!biggest || r.length > biggest.length) biggest = r;
      for (const [la, ln] of r) {
        minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
        minLng = Math.min(minLng, ln); maxLng = Math.max(maxLng, ln);
      }
    }
    const c = ringCentroid(biggest);
    if (!c) return;
    out.push({ fid: f?.properties?.__fid || `f${i}`, areaHa: a, centroid: c, bboxH: maxLat - minLat, bboxW: maxLng - minLng });
  });
  return out;
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
      try { map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40] }); } catch { /* ignore */ }
    }
  }, [total, lot, map]);
  return null;
}

export function GeoMap({ totalGeoJson, lotGeoJson, height = 360, tileType = "google_satellite", center = null, zoom = null, lineWidth = 3, leaders = {}, labelStyle = DEFAULT_LABEL_STYLE, onViewChange, onLeaderChange }: GeoMapProps) {
  const [mounted, setMounted] = React.useState(false);
  const [fs, setFs] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const isChecked = (t: string) => tileType === t;

  const total = React.useMemo(() => parse(totalGeoJson), [totalGeoJson]);
  const lot = React.useMemo(() => parse(lotGeoJson), [lotGeoJson]);
  const hasGeo = total || lot;
  const labels = React.useMemo(() => [...buildLabels(total), ...buildLabels(lot)], [total, lot]);
  const s = labelStyle;

  const leaderFor = (l: LabelInfo): Leader => leaders[l.fid] ?? defaultLeader(l.centroid, l.bboxH, l.bboxW);

  const styleKey = `${s.lineColor}-${s.lineWidth}-${s.textColor}-${s.textSize}`;

  const mapEl = (h: number | string) => (
    <MapContainer
      key={`${tileType}-${fs}`}
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
        <GeoJSON key={`t-${totalGeoJson?.length ?? 0}-${lineWidth}`} data={total} style={{ color: RED, weight: lineWidth, fillColor: RED, fillOpacity: 0.12 }} />
      )}
      {lot && (
        <GeoJSON key={`l-${lotGeoJson?.length ?? 0}-${lineWidth}`} data={lot} style={{ color: BLUE, weight: lineWidth, fillColor: BLUE, fillOpacity: 0.15 }} />
      )}

      {/* Gektar leader-chizmalari: uchi -> o'rtasi -> tepasi (matn) */}
      {labels.map((l) => {
        const lead = leaderFor(l);
        const editable = !!onLeaderChange;
        const upd = (key: "tip" | "bend" | "top", ll: any) => onLeaderChange && onLeaderChange(l.fid, { ...lead, [key]: [ll.lat, ll.lng] });
        const barHalf = Math.max(l.bboxW * 0.05, 0.00012);
        const barLeft: Pt = [lead.top[0], lead.top[1] - barHalf];
        const barRight: Pt = [lead.top[0], lead.top[1] + barHalf];
        return (
          <React.Fragment key={l.fid}>
            {/* Ko'rsatkich chizig'i: uchi -> o'rtasi -> tag chiziq markazi (bir nuqtada tutashadi) */}
            <Polyline positions={[lead.tip, lead.bend, lead.top]} pathOptions={{ color: s.lineColor, weight: s.lineWidth }} />
            {/* Gorizontal tag chiziq (gektar tagida) */}
            <Polyline positions={[barLeft, barRight]} pathOptions={{ color: s.lineColor, weight: s.lineWidth }} />
            <Marker position={lead.tip} draggable={editable} icon={dotIcon(s.lineColor)} eventHandlers={editable ? { dragend: (e: any) => upd("tip", e.target.getLatLng()) } : undefined} />
            <Marker position={lead.bend} draggable={editable} icon={invisibleIcon()} eventHandlers={editable ? { dragend: (e: any) => upd("bend", e.target.getLatLng()) } : undefined} />
            <Marker key={`top-${l.fid}-${styleKey}`} position={lead.top} draggable={editable} icon={textIcon(`${l.areaHa}`, s)} eventHandlers={editable ? { dragend: (e: any) => upd("top", e.target.getLatLng()) } : undefined} />
          </React.Fragment>
        );
      })}

      {zoom == null && <FitBounds total={total} lot={lot} />}
      {onViewChange && <ViewCapture onViewChange={onViewChange} />}
    </MapContainer>
  );

  const Legend = ({ dark }: { dark?: boolean }) => (
    <div className={`mt-2 flex gap-4 text-xs ${dark ? "text-white/80" : "text-slate-500"}`}>
      <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: RED }} /> Umumiy maydon (qizil)</span>
      <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} /> Lotlar (ko&apos;k)</span>
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
      <div className="mb-2 flex items-center justify-between">
        {onLeaderChange ? <span className="text-xs text-slate-400">Uch, o&apos;rta va gektar yozuvini ushlab siljiting</span> : <span />}
        <button type="button" onClick={() => setFs(true)} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Maximize2 className="h-3.5 w-3.5" /> Kattalashtirish
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        {!fs ? mapEl(height) : (
          <div className="flex items-center justify-center bg-slate-50 text-sm text-slate-400" style={{ height }}>
            Xarita to&apos;liq ekranda ochilgan
          </div>
        )}
      </div>
      <Legend />

      {fs && (
        <div className="fixed inset-0 flex flex-col bg-black/90 p-3" style={{ zIndex: 9999 }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-white/80">{onLeaderChange ? "Uch, o'rta va gektar yozuvini ushlab siljiting" : ""}</span>
            <button type="button" onClick={() => setFs(false)} className="flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <X className="h-4 w-4" /> Yopish
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg bg-white">{mapEl("100%")}</div>
          <Legend dark />
        </div>
      )}
    </div>
  );
}

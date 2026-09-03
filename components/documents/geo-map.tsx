"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from "react-leaflet";
import { MapPin } from "lucide-react";
import { extractRings } from "@/lib/geo/geojson";

interface GeoMapProps {
  totalGeoJson?: string | null;
  lotGeoJson?: string | null;
  height?: number;
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
      try {
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [24, 24] });
      } catch { /* ignore */ }
    }
  }, [total, lot, map]);
  return null;
}

export function GeoMap({ totalGeoJson, lotGeoJson, height = 360 }: GeoMapProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const total = parse(totalGeoJson);
  const lot = parse(lotGeoJson);

  if (!total && !lot) {
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
      <div className="overflow-hidden rounded-lg border">
        <MapContainer center={[41.0, 71.6]} zoom={12} style={{ height, width: "100%" }} scrollWheelZoom>
          <LayersControl position="topright">
            <LayersControl.BaseLayer name="Ko'cha xaritasi">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Sun'iy yo'ldosh">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google gibrid">
              <TileLayer
                url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                subdomains={["mt0", "mt1", "mt2", "mt3"]}
                attribution="&copy; Google"
                maxZoom={21}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {total && (
            <GeoJSON data={total} style={{ color: RED, weight: 3, fillColor: RED, fillOpacity: 0.12 }} />
          )}
          {lot && (
            <GeoJSON data={lot} style={{ color: BLUE, weight: 3, fillColor: BLUE, fillOpacity: 0.15 }} />
          )}

          <FitBounds total={total} lot={lot} />
        </MapContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: RED }} /> Umumiy maydon (qizil)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} /> Lotlar (ko&apos;k)</span>
      </div>
    </div>
  );
}

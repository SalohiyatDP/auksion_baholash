"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { MapPin, AlertTriangle } from "lucide-react";
import { loadGoogleMaps } from "@/lib/geo/google-loader";
import { extractRings } from "@/lib/geo/geojson";
import { useMapsKey } from "@/components/providers/maps-provider";

interface GeoMapProps {
  totalGeoJson?: string | null;
  lotGeoJson?: string | null;
  height?: number;
}

const RED = "#D32F2F";
const BLUE = "#1E40AF";

export function GeoMap({ totalGeoJson, lotGeoJson, height = 360 }: GeoMapProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState("");
  const key = useMapsKey();

  React.useEffect(() => {
    if (!key || !ref.current) return;
    let cancelled = false;

    loadGoogleMaps(key)
      .then((google) => {
        if (cancelled || !ref.current) return;
        const map = new google.maps.Map(ref.current, {
          center: { lat: 41.0, lng: 71.6 },
          zoom: 12,
          mapTypeId: "hybrid",
          streetViewControl: false,
        });
        const bounds = new google.maps.LatLngBounds();

        const addLayer = (geojsonStr: string | null | undefined, color: string) => {
          if (!geojsonStr) return;
          let parsed: any;
          try { parsed = JSON.parse(geojsonStr); } catch { return; }
          const layer = new google.maps.Data();
          try { layer.addGeoJson(parsed); } catch { return; }
          layer.setStyle({
            strokeColor: color,
            strokeWeight: 3,
            fillColor: color,
            fillOpacity: 0.12,
          });
          layer.setMap(map);
          for (const ring of extractRings(parsed)) {
            for (const [lat, lng] of ring) bounds.extend({ lat, lng });
          }
        };

        addLayer(totalGeoJson, RED);
        addLayer(lotGeoJson, BLUE);

        if (!bounds.isEmpty()) map.fitBounds(bounds);
      })
      .catch((e) => setError(e.message || "Xarita yuklanmadi"));

    return () => { cancelled = true; };
  }, [key, totalGeoJson, lotGeoJson]);

  if (!key) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-700" style={{ minHeight: height }}>
        <AlertTriangle className="h-6 w-6" />
        <p>Google Maps kaliti sozlanmagan.</p>
        <p className="text-xs">
          <code>GOOGLE_MAPS_API_KEY</code> ni <code>.env</code> yoki docker-compose&apos;ga qo&apos;shing va qayta ishga tushiring.
        </p>
      </div>
    );
  }

  if (!totalGeoJson && !lotGeoJson) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400" style={{ minHeight: height }}>
        <MapPin className="h-6 w-6" />
        <p>SHP yoki KMZ fayl yuklang — xarita shu yerda ko&apos;rinadi.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div ref={ref} className="w-full overflow-hidden rounded-lg border" style={{ height }} />
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: RED }} /> Umumiy maydon (qizil)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} /> Lotlar (ko&apos;k)</span>
      </div>
    </div>
  );
}

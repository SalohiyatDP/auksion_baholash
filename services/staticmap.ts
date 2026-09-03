import { extractRings, simplifyRing, type Ring } from "@/lib/geo/geojson";
import { encodePolyline } from "@/lib/geo/polyline";

// Google Static Maps API orqali xarita rasmini shakllantiradi.
// Umumiy maydon — QIZIL, lotlar — KO'K chiziq bilan.

const RED = "0xD32F2Fff";
const RED_FILL = "0xD32F2F22";
const BLUE = "0x1E40AFff";
const BLUE_FILL = "0x1E40AF22";

function ringsToPaths(rings: Ring[], color: string, fill: string): string[] {
  const paths: string[] = [];
  for (const ring of rings) {
    if (ring.length < 2) continue;
    const simplified = simplifyRing(ring, 70);
    const enc = encodePolyline(simplified);
    paths.push(`path=color:${color}|weight:3|fillcolor:${fill}|enc:${enc}`);
  }
  return paths;
}

export interface StaticMapResult {
  buffer: Buffer;
  mime: string;
}

/**
 * total/lot GeoJSON matnlaridan Google Static Map rasmini yuklab oladi.
 * Kalit yoki geometriya bo'lmasa null qaytaradi.
 */
export async function generateStaticMap(
  totalGeoJson?: string | null,
  lotGeoJson?: string | null
): Promise<StaticMapResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const paths: string[] = [];
  try {
    if (totalGeoJson) {
      const rings = extractRings(JSON.parse(totalGeoJson));
      paths.push(...ringsToPaths(rings, RED, RED_FILL));
    }
    if (lotGeoJson) {
      const rings = extractRings(JSON.parse(lotGeoJson));
      paths.push(...ringsToPaths(rings, BLUE, BLUE_FILL));
    }
  } catch {
    return null;
  }

  if (paths.length === 0) return null;

  // Static Maps paths mavjud bo'lganda markaz/zoom avtomatik moslashtiriladi.
  const base = "https://maps.googleapis.com/maps/api/staticmap";
  let url = `${base}?size=640x600&scale=2&maptype=hybrid&${paths.join("&")}&key=${key}`;

  // URL juda uzun bo'lsa, nuqtalarni yanada kamaytiramiz
  if (url.length > 8000) {
    const reduced: string[] = [];
    if (totalGeoJson) reduced.push(...ringsToPaths(extractRings(JSON.parse(totalGeoJson)).map((r) => simplifyRing(r, 30)), RED, RED_FILL));
    if (lotGeoJson) reduced.push(...ringsToPaths(extractRings(JSON.parse(lotGeoJson)).map((r) => simplifyRing(r, 30)), BLUE, BLUE_FILL));
    url = `${base}?size=640x600&scale=2&maptype=hybrid&${reduced.join("&")}&key=${key}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mime: "image/png" };
  } catch {
    return null;
  }
}

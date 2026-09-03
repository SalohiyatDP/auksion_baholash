import { extractRings, simplifyRing, type Ring } from "@/lib/geo/geojson";

// Hujjat uchun xarita rasmini KALITSIZ shakllantiradi.
// `staticmaps` kutubxonasi OpenStreetMap/Esri tayllarini serverda yig'ib PNG chiqaradi.
// Umumiy maydon — QIZIL, lotlar — KO'K poligon bilan.

// Esri World Imagery (sun'iy yo'ldosh) — kalitsiz
const ESRI_SATELLITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const RED_STROKE = "#D32F2FEE";
const RED_FILL = "#D32F2F33";
const BLUE_STROKE = "#1E40AFEE";
const BLUE_FILL = "#1E40AF44";

export interface StaticMapResult {
  buffer: Buffer;
  mime: string;
}

function collectRings(geojsonStr?: string | null): Ring[] {
  if (!geojsonStr) return [];
  try {
    return extractRings(JSON.parse(geojsonStr));
  } catch {
    return [];
  }
}

/**
 * total/lot GeoJSON dan kalitsiz xarita rasmini shakllantiradi.
 * Geometriya bo'lmasa yoki xatolik bo'lsa null qaytaradi.
 */
export async function generateStaticMap(
  totalGeoJson?: string | null,
  lotGeoJson?: string | null
): Promise<StaticMapResult | null> {
  const totalRings = collectRings(totalGeoJson);
  const lotRings = collectRings(lotGeoJson);
  if (totalRings.length === 0 && lotRings.length === 0) return null;

  try {
    // Dinamik import — faqat serverda yuklanadi (sharp asosida)
    const mod: any = await import("staticmaps");
    const StaticMaps = mod.default || mod;

    // Keng (2:1) format — interaktiv preview'ga o'xshash kadr (uchastkalar kattaroq ko'rinadi).
    // paddingX/Y — poligonlar chetga yopishmasligi uchun kichik hoshiya.
    const map = new StaticMaps({
      width: 1280,
      height: 640,
      paddingX: 48,
      paddingY: 48,
      tileUrl: ESRI_SATELLITE,
      tileSize: 256,
    });

    const addRings = (rings: Ring[], stroke: string, fill: string) => {
      for (const ring of rings) {
        if (ring.length < 3) continue;
        const simplified = simplifyRing(ring, 400);
        // staticmaps koordinatalari [lon, lat] tartibida
        const coords = simplified.map(([lat, lng]) => [lng, lat] as [number, number]);
        // poligonni yopamiz
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
        map.addPolygon({ coords, color: stroke, fill, width: 5 });
      }
    };

    addRings(totalRings, RED_STROKE, RED_FILL);
    addRings(lotRings, BLUE_STROKE, BLUE_FILL);

    await map.render(); // markaz/zoom avtomatik moslashadi
    const buffer: Buffer = await map.image.buffer("image/png");
    return { buffer, mime: "image/png" };
  } catch (e) {
    console.error("Static map xatosi:", e);
    return null;
  }
}

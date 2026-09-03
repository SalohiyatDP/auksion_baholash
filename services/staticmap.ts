import { extractRings, simplifyRing, type Ring } from "@/lib/geo/geojson";

// Hujjat uchun xarita rasmini KALITSIZ shakllantiradi (`staticmaps` + tayl serverlar).
// Umumiy maydon — QIZIL, lotlar — KO'K. Qatlam turi foydalanuvchi tanloviga mos.

export type MapTileType =
  | "google_satellite"
  | "google_hybrid"
  | "google_streets"
  | "esri"
  | "osm";

const TILE_URLS: Record<MapTileType, string> = {
  google_satellite: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  google_hybrid: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  google_streets: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  esri: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  osm: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

const RED_STROKE = "#D32F2FEE";
const RED_FILL = "#D32F2F33";
const BLUE_STROKE = "#1E40AFEE";
const BLUE_FILL = "#1E40AF55";

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
 * tileType — foydalanuvchi tanlagan qatlam (Google sun'iy yo'ldosh, Esri, va h.k.).
 * Tanlangan qatlam ishlamasa — Esri ga qaytadi (rasm baribir chiqadi).
 */
export async function generateStaticMap(
  totalGeoJson?: string | null,
  lotGeoJson?: string | null,
  tileType: MapTileType = "google_satellite"
): Promise<StaticMapResult | null> {
  const totalRings = collectRings(totalGeoJson);
  const lotRings = collectRings(lotGeoJson);
  if (totalRings.length === 0 && lotRings.length === 0) return null;

  const mod: any = await import("staticmaps");
  const StaticMaps = mod.default || mod;

  const renderWith = async (tileUrl: string): Promise<Buffer> => {
    // Yuqori sifat, 3:2 nisbat — A4 sahifasiga muvozanatli va to'liq joylashadi.
    const map = new StaticMaps({
      width: 1500,
      height: 1000,
      paddingX: 30,
      paddingY: 30,
      tileUrl,
      tileSize: 256,
      tileRequestHeader: {
        "User-Agent": "Mozilla/5.0 (compatible; YerAuksion/1.0)",
        Referer: "https://localhost/",
      },
    });

    const addRings = (rings: Ring[], stroke: string, fill: string) => {
      for (const ring of rings) {
        if (ring.length < 3) continue;
        const simplified = simplifyRing(ring, 400);
        const coords = simplified.map(([lat, lng]) => [lng, lat] as [number, number]);
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
        map.addPolygon({ coords, color: stroke, fill, width: 6 });
      }
    };

    // Umumiy maydon (qizil) — xarita shunga nisbatan yaqinlashtiriladi (avval qo'shiladi)
    addRings(totalRings, RED_STROKE, RED_FILL);
    addRings(lotRings, BLUE_STROKE, BLUE_FILL);

    await map.render(); // markaz/zoom qo'shilgan poligonlarga avtomatik moslashadi
    return map.image.buffer("image/png");
  };

  try {
    const buffer = await renderWith(TILE_URLS[tileType] || TILE_URLS.esri);
    return { buffer, mime: "image/png" };
  } catch (e) {
    console.error("Static map (tanlangan qatlam) xatosi:", e);
    // Zaxira: Esri
    if (tileType !== "esri") {
      try {
        const buffer = await renderWith(TILE_URLS.esri);
        return { buffer, mime: "image/png" };
      } catch (e2) {
        console.error("Static map (Esri zaxira) xatosi:", e2);
      }
    }
    return null;
  }
}

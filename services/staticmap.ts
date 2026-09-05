import { extractFeatures, simplifyRing, ringCentroid, type Ring, type GeoFeatureInfo } from "@/lib/geo/geojson";
import { defaultLeader, DEFAULT_LABEL_STYLE, type Leader, type LabelStyle } from "@/lib/geo/leader";

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

function collectFeatures(geojsonStr?: string | null): GeoFeatureInfo[] {
  if (!geojsonStr) return [];
  try {
    return extractFeatures(JSON.parse(geojsonStr));
  } catch {
    return [];
  }
}

/**
 * total/lot GeoJSON dan kalitsiz xarita rasmini shakllantiradi.
 * tileType — foydalanuvchi tanlagan qatlam (Google sun'iy yo'ldosh, Esri, va h.k.).
 * Tanlangan qatlam ishlamasa — Esri ga qaytadi (rasm baribir chiqadi).
 */
export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

export async function generateStaticMap(
  totalGeoJson?: string | null,
  lotGeoJson?: string | null,
  tileType: MapTileType = "google_satellite",
  view?: MapView | null,
  lineWidth = 3,
  leaders?: Record<string, Leader> | null,
  style?: LabelStyle
): Promise<StaticMapResult | null> {
  // Static rasm yuqori aniqlikda (1500px) — chiziqni ko'rinarli qilish uchun 2x
  const strokeW = Math.max(1, Math.round(lineWidth * 2));
  const st = style || DEFAULT_LABEL_STYLE;
  const totalFeatures = collectFeatures(totalGeoJson);
  const lotFeatures = collectFeatures(lotGeoJson);
  if (totalFeatures.length === 0 && lotFeatures.length === 0) return null;

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

    const lw = Math.max(2, Math.round(st.lineWidth * 2));
    const textSizePx = Math.max(14, Math.round(st.textSize * 2.2));

    const drawFeatures = (features: GeoFeatureInfo[], stroke: string, fill: string) => {
      for (const feat of features) {
        let biggest: Ring | null = null;
        let minLat = 90, minLng = 180, maxLat = -90, maxLng = -180;
        for (const ring of feat.rings) {
          if (ring.length < 3) continue;
          const simplified = simplifyRing(ring, 400);
          const coords = simplified.map(([lat, lng]) => [lng, lat] as [number, number]);
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
          map.addPolygon({ coords, color: stroke, fill, width: strokeW });
          if (!biggest || ring.length > biggest.length) biggest = ring;
          for (const [la, ln] of ring) {
            minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
            minLng = Math.min(minLng, ln); maxLng = Math.max(maxLng, ln);
          }
        }
        if (feat.areaHa == null || !biggest) continue;
        const centroid = ringCentroid(biggest);
        if (!centroid) continue;
        const lead: Leader =
          feat.fid && leaders && leaders[feat.fid]
            ? leaders[feat.fid]
            : defaultLeader(centroid, maxLat - minLat, maxLng - minLng);
        const barHalf = Math.max((maxLng - minLng) * 0.06, 0.00015);
        try {
          // Leader chizig'i: uchi -> o'rtasi -> tepasi ([lng, lat])
          map.addLine({ coords: [[lead.tip[1], lead.tip[0]], [lead.bend[1], lead.bend[0]], [lead.top[1], lead.top[0]]], color: st.lineColor, width: lw });
          // Tag (gorizontal) chiziq
          map.addLine({ coords: [[lead.top[1] - barHalf, lead.top[0]], [lead.top[1] + barHalf, lead.top[0]]], color: st.lineColor, width: lw });
          // Gektar matni — tag chiziq ustida
          map.addText({
            coord: [lead.top[1], lead.top[0] + barHalf * 0.25],
            text: `${feat.areaHa}`,
            size: textSizePx,
            color: "#ffffff", // oq kontur (o'qilishi uchun)
            width: 4,
            fill: st.textColor, // foydalanuvchi tanlagan rang
            font: "bold sans-serif",
            anchor: "middle",
          });
        } catch {
          /* addLine/addText qo'llab-quvvatlanmasa — o'tkazib yuboramiz */
        }
      }
    };

    // Umumiy maydon (qizil) — xarita shunga nisbatan yaqinlashtiriladi (avval qo'shiladi)
    drawFeatures(totalFeatures, RED_STROKE, RED_FILL);
    drawFeatures(lotFeatures, BLUE_STROKE, BLUE_FILL);

    if (view && Number.isFinite(view.lat) && Number.isFinite(view.lng) && Number.isFinite(view.zoom)) {
      // Preview'dan saqlangan markaz va masshtab (staticmaps: [lon, lat], integer zoom)
      await map.render([view.lng, view.lat], Math.round(view.zoom));
    } else {
      await map.render(); // markaz/zoom poligonlarga avtomatik moslashadi
    }
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

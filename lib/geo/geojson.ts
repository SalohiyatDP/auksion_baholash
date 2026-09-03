// GeoJSON yordamchilari: halqalar (rings) ni ajratib olish va nuqtalarni kamaytirish.
// GeoJSON koordinatalari [lng, lat] tartibida; biz [lat, lng] ga o'giramiz.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Ring = Array<[number, number]>; // [lat, lng]

function ringFromCoords(coords: any[]): Ring {
  return coords
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map((c) => [Number(c[1]), Number(c[0])] as [number, number]);
}

/** GeoJSON (Feature/FeatureCollection/Geometry) dan barcha tashqi halqalarni ajratadi */
export function extractRings(geojson: any): Ring[] {
  const rings: Ring[] = [];
  if (!geojson) return rings;

  const handleGeometry = (geom: any) => {
    if (!geom) return;
    switch (geom.type) {
      case "Polygon":
        for (const ring of geom.coordinates || []) rings.push(ringFromCoords(ring));
        break;
      case "MultiPolygon":
        for (const poly of geom.coordinates || [])
          for (const ring of poly || []) rings.push(ringFromCoords(ring));
        break;
      case "LineString":
        rings.push(ringFromCoords(geom.coordinates || []));
        break;
      case "MultiLineString":
        for (const line of geom.coordinates || []) rings.push(ringFromCoords(line));
        break;
      case "GeometryCollection":
        for (const g of geom.geometries || []) handleGeometry(g);
        break;
      default:
        break;
    }
  };

  if (geojson.type === "FeatureCollection") {
    for (const f of geojson.features || []) handleGeometry(f.geometry);
  } else if (geojson.type === "Feature") {
    handleGeometry(geojson.geometry);
  } else {
    handleGeometry(geojson);
  }
  return rings.filter((r) => r.length >= 2);
}

/** Halqadagi nuqtalarni maksimal songacha kamaytiradi (URL uzunligini cheklash uchun) */
export function simplifyRing(ring: Ring, maxPoints = 80): Ring {
  if (ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const out: Ring = [];
  for (let i = 0; i < ring.length; i += step) out.push(ring[i]);
  // halqani yopish uchun oxirgi nuqtani qo'shamiz
  const last = ring[ring.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/** Barcha halqalar bo'yicha markaziy nuqta (fallback) */
export function ringsCenter(rings: Ring[]): [number, number] | null {
  let sumLat = 0;
  let sumLng = 0;
  let n = 0;
  for (const ring of rings)
    for (const [lat, lng] of ring) {
      sumLat += lat;
      sumLng += lng;
      n++;
    }
  if (n === 0) return null;
  return [sumLat / n, sumLng / n];
}

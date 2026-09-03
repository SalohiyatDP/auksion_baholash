// Klient tomonida geografik fayllarni GeoJSON ga o'giradi.
// Qo'llab-quvvatlanadi: .shp/.zip (shapefile), .kmz, .kml, .geojson/.json
// Kutubxonalar dinamik import qilinadi (faqat brauzerda yuklanadi).

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function parseGeoFile(file: File): Promise<any> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".geojson") || name.endsWith(".json")) {
    return JSON.parse(new TextDecoder().decode(buffer));
  }

  if (name.endsWith(".kml")) {
    const { kml } = await import("@tmcw/togeojson");
    const text = new TextDecoder().decode(buffer);
    const dom = new DOMParser().parseFromString(text, "text/xml");
    return kml(dom);
  }

  if (name.endsWith(".kmz")) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const kmlName = Object.keys(zip.files).find((f) => f.toLowerCase().endsWith(".kml"));
    if (!kmlName) throw new Error("KMZ ichida .kml fayl topilmadi");
    const kmlText = await zip.files[kmlName].async("text");
    const { kml } = await import("@tmcw/togeojson");
    const dom = new DOMParser().parseFromString(kmlText, "text/xml");
    return kml(dom);
  }

  if (name.endsWith(".zip") || name.endsWith(".shp")) {
    const mod: any = await import("shpjs");
    const shp = mod.default || mod;
    return await shp(buffer);
  }

  throw new Error("Qo'llab-quvvatlanmaydigan format. SHP(.zip), KMZ, KML yoki GeoJSON yuklang.");
}

/** GeoJSON dagi geometriyalar sonini sanaydi */
export function countFeatures(geojson: any): number {
  if (!geojson) return 0;
  if (geojson.type === "FeatureCollection") return (geojson.features || []).length;
  if (geojson.type === "Feature") return 1;
  return geojson.type ? 1 : 0;
}

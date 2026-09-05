import { prisma } from "@/lib/prisma";

export interface AreaRow {
  minArea: number;
  maxArea: number | null;
  coefficientM: number;
  description: string;
}

/**
 * Maydon (kv.m) bo'yicha M koeffitsiyentini tanlaydi.
 * Excel mantig'iga AYNAN mos:
 *   IF(S<1000, 1, IF(S<10000, 0.9, IF(S<=50000, 0.8, 0.7)))
 * Ya'ni: quyi chegara inklyuziv; eng yuqori CHEKLI band yuqori chegarasi inklyuziv,
 * qolgan bandlarda yuqori chegara eksklyuziv.
 * Bu SOF funksiya — testlanadi.
 */
export function pickAreaCoefficient(area: number, rows: AreaRow[]): AreaRow | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => a.minArea - b.minArea);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.maxArea == null) return r; // cheksiz band
    const isLastFinite = i === sorted.length - 2;
    const matches = isLastFinite ? area <= r.maxArea : area < r.maxArea;
    if (matches) return r;
  }
  return sorted[sorted.length - 1];
}

/** T — hudud toifa koeffitsiyenti (tuman bo'yicha) */
export async function resolveTerritory(districtId: number) {
  const tc = await prisma.territoryCategory.findUnique({
    where: { districtId },
    include: { district: true },
  });
  if (!tc) return null;
  return {
    t: tc.coefficientT,
    category: tc.category,
    description: `${tc.district.name} — ${tc.category}-toifa hudud`,
  };
}

/** B — yer solig'i stavkasi (so'm/kv.m), yil bo'yicha faol stavka */
export async function resolveTaxRate(districtId: number, year?: number) {
  const where = year ? { districtId, year } : { districtId };
  const tr = await prisma.taxRate.findFirst({
    where,
    orderBy: { year: "desc" },
  });
  if (!tr) return null;
  return {
    b: tr.rateB,
    annualRate: tr.annualRate,
    year: tr.year,
  };
}

/** M — maydon koeffitsiyenti (DB dan) */
export async function resolveAreaCoefficient(area: number) {
  const rows = await prisma.areaCoefficient.findMany();
  const picked = pickAreaCoefficient(
    area,
    rows.map((r) => ({
      minArea: r.minArea,
      maxArea: r.maxArea,
      coefficientM: r.coefficientM,
      description: r.description,
    }))
  );
  if (!picked) return null;
  return { m: picked.coefficientM, description: picked.description };
}

/** F — foydalanish turi koeffitsiyenti */
export async function resolveLandUsage(code: string) {
  const u = await prisma.landUsageCoefficient.findUnique({ where: { code } });
  if (!u) return null;
  return { f: u.coefficientF, name: u.name, code: u.code };
}

/** Barcha koeffitsiyent jadvallarini birga qaytaradi (UI uchun) */
export async function getAllCoefficients() {
  const [territory, taxRates, landUsage, areas, engineering, legal, organizations, purposes] =
    await Promise.all([
      prisma.territoryCategory.findMany({ include: { district: true } }),
      prisma.taxRate.findMany({ include: { district: true } }),
      prisma.landUsageCoefficient.findMany({ orderBy: { code: "asc" } }),
      prisma.areaCoefficient.findMany({ orderBy: { minArea: "asc" } }),
      prisma.engineeringCoefficient.findMany(),
      prisma.legalReference.findMany(),
      prisma.organization.findMany({ orderBy: { name: "asc" } }),
      prisma.projectPurpose.findMany({ orderBy: { name: "asc" } }),
    ]);
  return { territory, taxRates, landUsage, areas, engineering, legal, organizations, purposes };
}

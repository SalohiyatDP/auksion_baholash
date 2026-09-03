import { prisma } from "@/lib/prisma";
import {
  resolveTerritory,
  resolveTaxRate,
  resolveAreaCoefficient,
  resolveLandUsage,
} from "./coefficient";
import { calculateStartingPrice } from "./calculation";
import type { DocumentInput } from "@/lib/validations";

export interface BuiltDocument {
  regionId: number;
  districtId: number;
  mfy: string;
  projectName: string;
  organization: string;
  projectPurpose: string;
  totalAreaHa: number;
  lotAreaM2: number;
  lotAreaHa: number;
  landUsageCode: string;
  landUsageName: string;
  s: number;
  t: number;
  b: number;
  g: number;
  f: number;
  m: number;
  e: number;
  startingPrice: number;
  tDescription: string;
  fDescription: string;
  legalReference: string;
  formula: string;
}

/**
 * Kirish ma'lumotlaridan koeffitsiyentlarni DB dan yechadi va narxni hisoblaydi.
 * Koeffitsiyentlar SNAPSHOT sifatida qaytariladi (kelajakdagi o'zgarishlar
 * tarixiy hujjatlarga ta'sir qilmaydi).
 */
export async function buildDocumentData(input: DocumentInput): Promise<BuiltDocument> {
  const territory = await resolveTerritory(input.districtId);
  if (!territory) {
    throw new Error("Ushbu tuman uchun hudud toifa koeffitsiyenti (T) topilmadi.");
  }

  const tax = await resolveTaxRate(input.districtId);
  if (!tax || tax.b <= 0) {
    throw new Error("Ushbu tuman uchun yer solig'i stavkasi (B) topilmadi yoki 0 ga teng.");
  }

  const area = await resolveAreaCoefficient(input.lotAreaM2);
  if (!area) {
    throw new Error("Maydon koeffitsiyenti (M) topilmadi.");
  }

  const usage = await resolveLandUsage(input.landUsageCode);
  if (!usage) {
    throw new Error("Foydalanish turi koeffitsiyenti (F) topilmadi.");
  }

  const legal = await prisma.legalReference.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const s = input.lotAreaM2;
  const t = territory.t;
  const b = tax.b;
  const g = input.g;
  const f = usage.f;
  const m = area.m;
  const e = input.e ?? 0;

  const calc = calculateStartingPrice({ s, t, b, g, f, m, e });

  return {
    regionId: input.regionId,
    districtId: input.districtId,
    mfy: input.mfy,
    projectName: input.projectName,
    organization: input.organization ?? "",
    projectPurpose: input.projectPurpose ?? "turistik-rekreatsion loyihani amalga oshirish",
    totalAreaHa: input.totalAreaHa,
    lotAreaM2: s,
    lotAreaHa: s / 10000,
    landUsageCode: usage.code,
    landUsageName: usage.name,
    s, t, b, g, f, m, e,
    startingPrice: calc.startingPrice,
    tDescription: territory.description,
    fDescription: `${usage.name} (kod ${usage.code})`,
    legalReference: legal?.body ?? "",
    formula: calc.formula,
  };
}

/** Keyingi hujjat raqamini generatsiya qiladi: YA-YYYY-NNNN */
export async function nextDocumentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `YA-${year}-`;
  const last = await prisma.document.findFirst({
    where: { documentNumber: { startsWith: prefix } },
    orderBy: { documentNumber: "desc" },
    select: { documentNumber: true },
  });
  let seq = 1;
  if (last) {
    const n = parseInt(last.documentNumber.slice(prefix.length), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

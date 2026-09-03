import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Koeffitsiyent jadvallarini boshqarish uchun umumiy konfiguratsiya.
// Har bir "entity" uchun: prisma delegate, zod sxema, ma'lumotni tayyorlash va GET sozlamalari.

export type EntityKey =
  | "territory"
  | "tax"
  | "usage"
  | "area"
  | "engineering"
  | "legal";

interface EntityConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: any;
  schema: z.ZodTypeAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toData: (input: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findManyArgs?: any;
}

const territorySchema = z.object({
  regionId: z.coerce.number().int().positive(),
  districtId: z.coerce.number().int().positive(),
  category: z.coerce.number().int().min(1).max(5),
  coefficientT: z.coerce.number().positive(),
});

const taxSchema = z.object({
  regionId: z.coerce.number().int().positive(),
  districtId: z.coerce.number().int().positive(),
  baseAmount: z.coerce.number().min(0),
  coefficient: z.coerce.number().min(0),
  year: z.coerce.number().int().min(2000).max(2100),
});

const usageSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  coefficientF: z.coerce.number().positive(),
  isActive: z.boolean().optional().default(true),
});

const areaSchema = z.object({
  minArea: z.coerce.number().min(0),
  maxArea: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
    z.number().nullable()
  ),
  coefficientM: z.coerce.number().positive(),
  description: z.string().min(1),
});

const engineeringSchema = z.object({
  name: z.string().min(1),
  coefficientG: z.coerce.number().positive(),
  isDefault: z.boolean().optional().default(false),
});

const legalSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  territory: {
    delegate: prisma.territoryCategory,
    schema: territorySchema,
    toData: (i) => ({
      regionId: i.regionId,
      districtId: i.districtId,
      category: i.category,
      coefficientT: i.coefficientT,
    }),
    findManyArgs: { include: { district: true }, orderBy: { category: "asc" } },
  },
  tax: {
    delegate: prisma.taxRate,
    schema: taxSchema,
    toData: (i) => {
      const annualRate = i.baseAmount * i.coefficient;
      return {
        regionId: i.regionId,
        districtId: i.districtId,
        baseAmount: i.baseAmount,
        coefficient: i.coefficient,
        annualRate,
        rateB: annualRate / 10000,
        year: i.year,
        effectiveFrom: new Date(`${i.year}-01-01`),
        effectiveTo: new Date(`${i.year}-12-31`),
      };
    },
    findManyArgs: { include: { district: true }, orderBy: { id: "asc" } },
  },
  usage: {
    delegate: prisma.landUsageCoefficient,
    schema: usageSchema,
    toData: (i) => ({
      code: i.code,
      name: i.name,
      coefficientF: i.coefficientF,
      isActive: i.isActive ?? true,
    }),
    findManyArgs: { orderBy: { code: "asc" } },
  },
  area: {
    delegate: prisma.areaCoefficient,
    schema: areaSchema,
    toData: (i) => ({
      minArea: i.minArea,
      maxArea: i.maxArea === undefined ? null : i.maxArea,
      coefficientM: i.coefficientM,
      description: i.description,
    }),
    findManyArgs: { orderBy: { minArea: "asc" } },
  },
  engineering: {
    delegate: prisma.engineeringCoefficient,
    schema: engineeringSchema,
    toData: (i) => ({
      name: i.name,
      coefficientG: i.coefficientG,
      isDefault: i.isDefault ?? false,
    }),
    findManyArgs: { orderBy: { id: "asc" } },
  },
  legal: {
    delegate: prisma.legalReference,
    schema: legalSchema,
    toData: (i) => ({ title: i.title, body: i.body, isActive: i.isActive ?? true }),
    findManyArgs: { orderBy: { id: "asc" } },
  },
};

export function getEntity(key: string): EntityConfig | null {
  return (ENTITIES as Record<string, EntityConfig>)[key] ?? null;
}

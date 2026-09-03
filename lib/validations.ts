import { z } from "zod";

export const documentInputSchema = z.object({
  regionId: z.coerce.number().int().positive({ message: "Viloyatni tanlang" }),
  districtId: z.coerce.number().int().positive({ message: "Tumanni tanlang" }),
  mfy: z.string().min(1, { message: "MFY kiritilishi shart" }),
  projectName: z.string().min(1, { message: "Loyiha nomi kiritilishi shart" }),
  organization: z.string().optional().default(""),
  projectPurpose: z.string().optional().default("turistik-rekreatsion loyihani amalga oshirish"),
  totalAreaHa: z.coerce
    .number()
    .positive({ message: "Jami maydon 0 dan katta bo'lishi kerak" }),
  lotAreaM2: z.coerce
    .number()
    .positive({ message: "Lot maydoni 0 dan katta bo'lishi kerak" }),
  landUsageCode: z.string().min(1, { message: "Foydalanish turini tanlang" }),
  g: z.coerce
    .number()
    .min(0.1, { message: "G koeffitsiyenti juda kichik" })
    .max(3, { message: "G koeffitsiyenti 3 dan katta bo'lmasligi kerak" }),
  e: z.coerce
    .number()
    .min(0, { message: "Qo'shimcha xarajatlar manfiy bo'lmasligi kerak" })
    .default(0),
  scriptMode: z.enum(["LATIN", "CYRILLIC", "BOTH"]).optional().default("LATIN"),
  fontFamily: z.string().optional().default("Times New Roman"),
  totalGeoJson: z.string().optional().nullable(),
  lotGeoJson: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "GENERATED"]).optional().default("DRAFT"),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

export const loginSchema = z.object({
  login: z.string().min(1, { message: "Login yoki email kiriting" }),
  password: z.string().min(1, { message: "Parolni kiriting" }),
});

export const calculationInputSchema = z.object({
  districtId: z.coerce.number().int().positive(),
  lotAreaM2: z.coerce.number().positive(),
  landUsageCode: z.string().min(1),
  g: z.coerce.number().min(0.1).max(3),
  e: z.coerce.number().min(0).default(0),
});

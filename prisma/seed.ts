import { PrismaClient, Role, DocumentStatus, FileType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Namangan viloyati tumanlari — Excel `Т` va `B` varaqlaridan aynan olingan
const DISTRICTS: Array<{
  name: string;
  category: number;
  t: number;
  base: number;
  coeff: number;
  annual: number;
}> = [
  { name: "Namangan shahri", category: 1, t: 25, base: 51800000, coeff: 1.65, annual: 85470000 },
  { name: "Yangi Namangan tumani", category: 1, t: 25, base: 51800000, coeff: 0, annual: 0 },
  { name: "Davlatobod tumani", category: 1, t: 25, base: 51800000, coeff: 0, annual: 0 },
  { name: "To'raqo'rg'on tumani", category: 2, t: 20, base: 51800000, coeff: 1.2, annual: 62160000 },
  { name: "Uychi tumani", category: 2, t: 20, base: 51800000, coeff: 1.2, annual: 62160000 },
  { name: "Uchqo'rg'on tumani", category: 2, t: 20, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Kosonsoy tumani", category: 3, t: 15, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Namangan tumani", category: 3, t: 15, base: 51800000, coeff: 1.2, annual: 62160000 },
  { name: "Pop tumani", category: 3, t: 15, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Chortoq tumani", category: 3, t: 15, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Chust tumani", category: 3, t: 15, base: 51800000, coeff: 1.2, annual: 62160000 },
  { name: "Yangiqo'rg'on tumani", category: 3, t: 15, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Norin tumani", category: 4, t: 10, base: 51800000, coeff: 1.1, annual: 56980000 },
  { name: "Mingbuloq tumani", category: 5, t: 5, base: 51800000, coeff: 1.1, annual: 56980000 },
];

const LAND_USAGE = [
  { code: "7.0", name: "Tabiatni muhofaza qilish, sog'lomlashtirish va rekreatsiya", f: 1.1 },
  { code: "6.0", name: "Turizm", f: 1.0 },
  { code: "5.0", name: "Savdo", f: 1.0 },
  { code: "4.0", name: "Xizmat ko'rsatish", f: 1.0 },
  { code: "1.0", name: "Boshqa", f: 1.0 },
];

const AREA_COEFFS = [
  { minArea: 0, maxArea: 1000, m: 1.0, desc: "Umumiy maydoni 1 000 kv.metrgacha (0,1 gektargacha)" },
  { minArea: 1000, maxArea: 10000, m: 0.9, desc: "1 000 – 10 000 kv.metr (0,1 ga – 1 ga)" },
  { minArea: 10000, maxArea: 50000, m: 0.8, desc: "10 000 – 50 000 kv.metr (1 ga – 5 ga)" },
  { minArea: 50000, maxArea: null as number | null, m: 0.7, desc: "50 000 kv.metrdan ortiq (5 gektardan ortiq)" },
];

async function main() {
  console.log("Seed boshlandi...");

  // ---- Viloyat ----
  const region = await prisma.region.upsert({
    where: { name: "Namangan viloyati" },
    update: {},
    create: { name: "Namangan viloyati" },
  });

  // ---- Tumanlar + T + B ----
  let popDistrictId = 0;
  for (const d of DISTRICTS) {
    const district = await prisma.district.upsert({
      where: { regionId_name: { regionId: region.id, name: d.name } },
      update: {},
      create: { regionId: region.id, name: d.name },
    });
    if (d.name === "Pop tumani") popDistrictId = district.id;

    // T
    await prisma.territoryCategory.upsert({
      where: { districtId: district.id },
      update: { category: d.category, coefficientT: d.t, regionId: region.id },
      create: {
        regionId: region.id,
        districtId: district.id,
        category: d.category,
        coefficientT: d.t,
      },
    });

    // B (yillik stavka / 10000)
    const existingTax = await prisma.taxRate.findFirst({
      where: { districtId: district.id, year: 2026 },
    });
    if (!existingTax) {
      await prisma.taxRate.create({
        data: {
          regionId: region.id,
          districtId: district.id,
          baseAmount: d.base,
          coefficient: d.coeff,
          annualRate: d.annual,
          rateB: d.annual / 10000,
          year: 2026,
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: new Date("2026-12-31"),
        },
      });
    }
  }

  // ---- MFY ----
  await prisma.mfy.upsert({
    where: { districtId_name: { districtId: popDistrictId, name: "Guliston MFY" } },
    update: {},
    create: { districtId: popDistrictId, name: "Guliston MFY" },
  });

  // ---- Foydalanish turlari (F) ----
  for (const u of LAND_USAGE) {
    await prisma.landUsageCoefficient.upsert({
      where: { code: u.code },
      update: { name: u.name, coefficientF: u.f },
      create: { code: u.code, name: u.name, coefficientF: u.f },
    });
  }

  // ---- Maydon koeffitsiyentlari (M) ----
  if ((await prisma.areaCoefficient.count()) === 0) {
    for (const a of AREA_COEFFS) {
      await prisma.areaCoefficient.create({
        data: { minArea: a.minArea, maxArea: a.maxArea, coefficientM: a.m, description: a.desc },
      });
    }
  }

  // ---- Muhandislik koeffitsiyenti (G) ----
  if ((await prisma.engineeringCoefficient.count()) === 0) {
    await prisma.engineeringCoefficient.createMany({
      data: [
        { name: "Standart (mavjud tarmoqlar)", coefficientG: 1.0, isDefault: true },
        { name: "Kamaytiruvchi (uzoq masofa)", coefficientG: 0.5, isDefault: false },
        { name: "Oshiruvchi (to'liq ta'minlangan)", coefficientG: 2.0, isDefault: false },
      ],
    });
  }

  // ---- Huquqiy asos ----
  if ((await prisma.legalReference.count()) === 0) {
    await prisma.legalReference.create({
      data: {
        title: "VM 71-son qarori (14.02.2022) — 2-ilova, Nizom 22-band",
        body:
          "O'zbekiston Respublikasi Vazirlar Mahkamasining 2022 yil 14 fevraldagi 71-son qarori " +
          "2-ilovasi bilan tasdiqlangan Nizomning 22-bandiga muvofiq, yer uchastkasiga ijara huquqini " +
          "elektron onlayn-auksion savdolariga chiqarishda boshlang'ich narx quyidagi formula asosida aniqlanadi:",
        isActive: true,
      },
    });
  }

  // ---- Foydalanuvchilar ----
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@yerauksion.uz";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const opEmail = process.env.SEED_OPERATOR_EMAIL || "operator@yerauksion.uz";
  const opPass = process.env.SEED_OPERATOR_PASSWORD || "operator123";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "Tizim administratori",
      email: adminEmail,
      username: "admin",
      passwordHash: await bcrypt.hash(adminPass, 10),
      role: Role.ADMIN,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: opEmail },
    update: {},
    create: {
      fullName: "Operator Foydalanuvchi",
      email: opEmail,
      username: "operator",
      passwordHash: await bcrypt.hash(opPass, 10),
      role: Role.OPERATOR,
    },
  });

  // ---- Namunaviy hujjat (Sharshara-1) ----
  if ((await prisma.document.count()) === 0 && popDistrictId) {
    const s = 7700, t = 15, b = 5698, g = 1.0, f = 1.1, m = 0.9, e = 0;
    const startingPrice = s * t * b * g * f * m + e; // 651 537 810
    const doc = await prisma.document.create({
      data: {
        documentNumber: "YA-2026-0001",
        regionId: region.id,
        districtId: popDistrictId,
        mfy: "Guliston MFY",
        projectName: "Sharshara-1",
        organization:
          "Namangan turistik-rekreatsion hududlarini rivojlantirish direksiyasi",
        projectPurpose: "turistik-rekreatsion loyihani amalga oshirish",
        totalAreaHa: 4.92,
        lotAreaM2: s,
        lotAreaHa: s / 10000,
        landUsageCode: "7.0",
        landUsageName: "Tabiatni muhofaza qilish, sog'lomlashtirish va rekreatsiya",
        s, t, b, g, f, m, e,
        startingPrice,
        tDescription: "Pop tumani — 3-toifa hudud",
        fDescription:
          "Tabiatni muhofaza qilish, sog'lomlashtirish va rekreatsiya (kod 7.0)",
        legalReference:
          "O'zbekiston Respublikasi Vazirlar Mahkamasining 2022 yil 14 fevraldagi 71-son qarori " +
          "2-ilovasi bilan tasdiqlangan Nizomning 22-bandiga muvofiq, yer uchastkasiga ijara huquqini " +
          "elektron onlayn-auksion savdolariga chiqarishda boshlang'ich narx quyidagi formula asosida aniqlanadi:",
        status: DocumentStatus.GENERATED,
        createdById: operator.id,
        calculation: {
          create: {
            formulaString:
              "C = 7 700 × 15 × 5 698 × 1,0 × 1,1 × 0,9 + 0 = 651 537 810 so'm",
            result: startingPrice,
            breakdownJson: JSON.stringify({ s, t, b, g, f, m, e, startingPrice }),
          },
        },
      },
    });
    console.log("Namunaviy hujjat yaratildi:", doc.documentNumber);
  }

  console.log("Seed yakunlandi.");
  console.log(`Admin: ${adminEmail} / ${adminPass}`);
  console.log(`Operator: ${opEmail} / ${opPass}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

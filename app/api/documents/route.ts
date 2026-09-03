import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { documentInputSchema } from "@/lib/validations";
import { buildDocumentData, nextDocumentNumber } from "@/services/document-record";
import { ok, handleError } from "@/lib/api";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const districtId = sp.get("districtId");
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") || 10)));

    const where: Prisma.DocumentWhereInput = {};
    // Operator faqat o'z hujjatlarini ko'radi
    if (session.role !== "ADMIN") where.createdById = session.id;
    if (status) where.status = status as Prisma.DocumentWhereInput["status"];
    if (districtId) where.districtId = Number(districtId);
    if (q) {
      where.OR = [
        { projectName: { contains: q, mode: "insensitive" } },
        { documentNumber: { contains: q, mode: "insensitive" } },
        { mfy: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          region: true,
          district: true,
          createdBy: { select: { fullName: true } },
          files: true,
        },
      }),
    ]);

    return ok({ documents, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const input = documentInputSchema.parse(body);

    const built = await buildDocumentData(input);
    const documentNumber = await nextDocumentNumber();

    const document = await prisma.document.create({
      data: {
        documentNumber,
        regionId: built.regionId,
        districtId: built.districtId,
        mfy: built.mfy,
        projectName: built.projectName,
        organization: built.organization,
        projectPurpose: built.projectPurpose,
        totalAreaHa: built.totalAreaHa,
        lotAreaM2: built.lotAreaM2,
        lotAreaHa: built.lotAreaHa,
        landUsageCode: built.landUsageCode,
        landUsageName: built.landUsageName,
        s: built.s, t: built.t, b: built.b, g: built.g,
        f: built.f, m: built.m, e: built.e,
        startingPrice: built.startingPrice,
        tDescription: built.tDescription,
        fDescription: built.fDescription,
        legalReference: built.legalReference,
        scriptMode: built.scriptMode,
        fontFamily: built.fontFamily,
        mapTileType: built.mapTileType,
        mapCenterLat: built.mapCenterLat,
        mapCenterLng: built.mapCenterLng,
        mapZoom: built.mapZoom,
        totalGeoJson: built.totalGeoJson,
        lotGeoJson: built.lotGeoJson,
        status: input.status ?? "DRAFT",
        createdById: session.id,
        calculation: {
          create: {
            formulaString: built.formula,
            result: built.startingPrice,
            breakdownJson: JSON.stringify({
              s: built.s, t: built.t, b: built.b, g: built.g,
              f: built.f, m: built.m, e: built.e,
              startingPrice: built.startingPrice,
            }),
          },
        },
      },
    });

    return ok({ document }, 201);
  } catch (e) {
    return handleError(e);
  }
}

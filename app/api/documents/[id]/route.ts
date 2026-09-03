import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { documentInputSchema } from "@/lib/validations";
import { buildDocumentData } from "@/services/document-record";
import { ok, fail, handleError } from "@/lib/api";
import { storage } from "@/services/storage";

async function loadOwned(id: string, userId: string, role: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      region: true,
      district: true,
      createdBy: { select: { fullName: true } },
      calculation: true,
      files: true,
    },
  });
  if (!doc) return { doc: null, forbidden: false };
  if (role !== "ADMIN" && doc.createdById !== userId) {
    return { doc: null, forbidden: true };
  }
  return { doc, forbidden: false };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const { doc, forbidden } = await loadOwned(id, session.id, session.role);
    if (forbidden) return fail("Ruxsat yo'q", 403);
    if (!doc) return fail("Hujjat topilmadi", 404);
    return ok({ document: doc });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const { doc, forbidden } = await loadOwned(id, session.id, session.role);
    if (forbidden) return fail("Ruxsat yo'q", 403);
    if (!doc) return fail("Hujjat topilmadi", 404);

    const body = await req.json();
    const input = documentInputSchema.parse(body);
    const built = await buildDocumentData(input);

    const updated = await prisma.document.update({
      where: { id },
      data: {
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
        totalGeoJson: built.totalGeoJson,
        lotGeoJson: built.lotGeoJson,
        status: input.status ?? doc.status,
        calculation: {
          upsert: {
            create: {
              formulaString: built.formula,
              result: built.startingPrice,
              breakdownJson: JSON.stringify(built),
            },
            update: {
              formulaString: built.formula,
              result: built.startingPrice,
              breakdownJson: JSON.stringify(built),
            },
          },
        },
      },
    });

    return ok({ document: updated });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const { doc, forbidden } = await loadOwned(id, session.id, session.role);
    if (forbidden) return fail("Ruxsat yo'q", 403);
    if (!doc) return fail("Hujjat topilmadi", 404);

    // Bog'liq fayllarni o'chiramiz
    for (const f of doc.files) {
      await storage.delete(f.path);
    }
    await prisma.document.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

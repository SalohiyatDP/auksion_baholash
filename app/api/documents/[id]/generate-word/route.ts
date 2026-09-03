import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateDocx, type DocxData, type MapImage } from "@/services/document";
import { generateStaticMap } from "@/services/staticmap";
import { storage } from "@/services/storage";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { region: true, district: true, files: true },
    });
    if (!doc) return fail("Hujjat topilmadi", 404);
    if (session.role !== "ADMIN" && doc.createdById !== session.id) {
      return fail("Ruxsat yo'q", 403);
    }

    // Xarita: avval SHP/KMZ geometriyasidan Google Static Map, aks holda yuklangan rasm
    let map: MapImage | undefined;
    const view =
      doc.mapZoom != null && doc.mapCenterLat != null && doc.mapCenterLng != null
        ? { lat: doc.mapCenterLat, lng: doc.mapCenterLng, zoom: doc.mapZoom }
        : null;
    const staticMap = await generateStaticMap(
      doc.totalGeoJson,
      doc.lotGeoJson,
      doc.mapTileType as any,
      view
    );
    if (staticMap) {
      map = staticMap;
    } else {
      const mapFile = doc.files.find((f) => f.type === "MAP_IMAGE");
      if (mapFile) {
        try {
          const buffer = await storage.read(mapFile.path);
          map = { buffer, mime: mapFile.mime };
        } catch {
          /* rasmsiz davom etamiz */
        }
      }
    }

    const data: DocxData = {
      regionName: doc.region.name,
      districtName: doc.district.name,
      mfy: doc.mfy,
      projectName: doc.projectName,
      organization: doc.organization,
      projectPurpose: doc.projectPurpose,
      totalAreaHa: doc.totalAreaHa,
      lotAreaM2: doc.lotAreaM2,
      lotAreaHa: doc.lotAreaHa,
      s: doc.s, t: doc.t, b: doc.b, g: doc.g, f: doc.f, m: doc.m, e: doc.e,
      startingPrice: doc.startingPrice,
      tDescription: doc.tDescription,
      fDescription: doc.fDescription,
      legalReference: doc.legalReference,
      scriptMode: doc.scriptMode,
      fontFamily: doc.fontFamily,
      documentNumber: doc.documentNumber,
    };

    const buffer = await generateDocx(data, map);
    const relPath = `docs/${doc.id}.docx`;
    await storage.save(relPath, buffer);

    const originalName = `${doc.documentNumber}_${doc.projectName}.docx`;
    const mime =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const existing = doc.files.find((f) => f.type === "GENERATED_DOCX");
    if (existing) {
      await prisma.documentFile.update({
        where: { id: existing.id },
        data: { path: relPath, originalName, size: buffer.length, mime },
      });
    } else {
      await prisma.documentFile.create({
        data: {
          documentId: doc.id,
          type: "GENERATED_DOCX",
          path: relPath,
          originalName,
          size: buffer.length,
          mime,
        },
      });
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "GENERATED" },
    });

    return ok({ success: true, fileName: originalName });
  } catch (e) {
    return handleError(e);
  }
}

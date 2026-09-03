import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateDocx, type DocxData, type MapImage } from "@/services/document";
import { generateStaticMap } from "@/services/staticmap";
import { storage } from "@/services/storage";
import { fail, handleError } from "@/lib/api";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

    let buffer: Buffer;
    const existing = doc.files.find((f) => f.type === "GENERATED_DOCX");
    if (existing && (await storage.exists(existing.path))) {
      buffer = await storage.read(existing.path);
    } else {
      // Fayl yo'q bo'lsa — darhol generatsiya qilamiz
      let map: MapImage | undefined;
      const staticMap = await generateStaticMap(doc.totalGeoJson, doc.lotGeoJson);
      if (staticMap) {
        map = staticMap;
      } else {
        const mapFile = doc.files.find((f) => f.type === "MAP_IMAGE");
        if (mapFile) {
          try {
            map = { buffer: await storage.read(mapFile.path), mime: mapFile.mime };
          } catch {
            /* rasmsiz */
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
      buffer = await generateDocx(data, map);
      await storage.save(`docs/${doc.id}.docx`, buffer);
    }

    const fileName = `${doc.documentNumber}_${doc.projectName}.docx`;
    const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

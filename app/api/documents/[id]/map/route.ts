import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { storage } from "@/services/storage";
import { ok, fail, handleError } from "@/lib/api";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;

    const doc = await prisma.document.findUnique({ where: { id }, include: { files: true } });
    if (!doc) return fail("Hujjat topilmadi", 404);
    if (session.role !== "ADMIN" && doc.createdById !== session.id) {
      return fail("Ruxsat yo'q", 403);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Fayl topilmadi", 400);

    if (!ALLOWED.includes(file.type)) {
      return fail("Faqat JPG, JPEG yoki PNG formatidagi rasm yuklang", 415);
    }
    if (file.size > MAX_SIZE) {
      return fail("Rasm hajmi 20 MB dan oshmasligi kerak", 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.includes("png") ? "png" : "jpg";
    const relPath = `maps/${doc.id}.${ext}`;
    await storage.save(relPath, buffer);

    const existing = doc.files.find((f) => f.type === "MAP_IMAGE");
    if (existing) {
      if (existing.path !== relPath) await storage.delete(existing.path);
      await prisma.documentFile.update({
        where: { id: existing.id },
        data: { path: relPath, originalName: file.name, size: file.size, mime: file.type },
      });
    } else {
      await prisma.documentFile.create({
        data: {
          documentId: doc.id,
          type: "MAP_IMAGE",
          path: relPath,
          originalName: file.name,
          size: file.size,
          mime: file.type,
        },
      });
    }

    return ok({ success: true, path: relPath });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const doc = await prisma.document.findUnique({ where: { id }, include: { files: true } });
    if (!doc) return fail("Hujjat topilmadi", 404);
    if (session.role !== "ADMIN" && doc.createdById !== session.id) {
      return fail("Ruxsat yo'q", 403);
    }
    const existing = doc.files.find((f) => f.type === "MAP_IMAGE");
    if (existing) {
      await storage.delete(existing.path);
      await prisma.documentFile.delete({ where: { id: existing.id } });
    }
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

// Rasmni ko'rish uchun (preview)
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const doc = await prisma.document.findUnique({ where: { id }, include: { files: true } });
    if (!doc) return fail("Hujjat topilmadi", 404);
    if (session.role !== "ADMIN" && doc.createdById !== session.id) {
      return fail("Ruxsat yo'q", 403);
    }
    const mapFile = doc.files.find((f) => f.type === "MAP_IMAGE");
    if (!mapFile || !(await storage.exists(mapFile.path))) {
      return fail("Rasm topilmadi", 404);
    }
    const buffer = await storage.read(mapFile.path);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": mapFile.mime, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return handleError(e);
  }
}

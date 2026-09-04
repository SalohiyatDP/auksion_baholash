import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { generateStaticMap } from "@/services/staticmap";
import { fail, handleError } from "@/lib/api";

// Joriy xarita ko'rinishini (qatlam, masshtab, poligonlar, gektar yozuvlari) PNG qilib qaytaradi.
export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const { totalGeoJson, lotGeoJson, tileType, lineWidth, view } = body || {};

    const result = await generateStaticMap(
      totalGeoJson ?? null,
      lotGeoJson ?? null,
      (tileType || "google_satellite") as any,
      view && Number.isFinite(view.lat) ? view : null,
      Number(lineWidth) || 3
    );

    if (!result) {
      return fail("Xarita rasmini yaratib bo'lmadi (geometriya yo'q yoki tayl serveriga ulanmadi)", 400);
    }

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="xarita.png"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

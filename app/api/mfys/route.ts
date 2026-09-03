import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const districtId = req.nextUrl.searchParams.get("districtId");
    const mfys = await prisma.mfy.findMany({
      where: districtId ? { districtId: Number(districtId) } : undefined,
      orderBy: { name: "asc" },
    });
    return ok({ mfys });
  } catch (e) {
    return handleError(e);
  }
}

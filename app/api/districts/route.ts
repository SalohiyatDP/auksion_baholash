import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const regionId = req.nextUrl.searchParams.get("regionId");
    const districts = await prisma.district.findMany({
      where: regionId ? { regionId: Number(regionId) } : undefined,
      orderBy: { name: "asc" },
      include: { territoryCategories: true },
    });
    return ok({ districts });
  } catch (e) {
    return handleError(e);
  }
}

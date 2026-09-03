import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();
    const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
    return ok({ regions });
  } catch (e) {
    return handleError(e);
  }
}

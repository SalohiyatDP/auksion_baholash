import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getEntity } from "@/lib/settings-entities";
import { ok, fail, handleError } from "@/lib/api";

export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> }) {
  try {
    await requireRole("ADMIN");
    const { entity } = await ctx.params;
    const cfg = getEntity(entity);
    if (!cfg) return fail("Noma'lum bo'lim", 404);
    const items = await cfg.delegate.findMany(cfg.findManyArgs ?? {});
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ entity: string }> }) {
  try {
    await requireRole("ADMIN");
    const { entity } = await ctx.params;
    const cfg = getEntity(entity);
    if (!cfg) return fail("Noma'lum bo'lim", 404);
    const body = await req.json();
    const parsed = cfg.schema.parse(body);
    const item = await cfg.delegate.create({ data: cfg.toData(parsed) });
    return ok({ item }, 201);
  } catch (e) {
    return handleError(e);
  }
}

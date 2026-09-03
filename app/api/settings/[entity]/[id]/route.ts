import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getEntity } from "@/lib/settings-entities";
import { ok, fail, handleError } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { entity, id } = await ctx.params;
    const cfg = getEntity(entity);
    if (!cfg) return fail("Noma'lum bo'lim", 404);
    const body = await req.json();
    const parsed = cfg.schema.parse(body);
    const item = await cfg.delegate.update({
      where: { id: Number(id) },
      data: cfg.toData(parsed),
    });
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { entity, id } = await ctx.params;
    const cfg = getEntity(entity);
    if (!cfg) return fail("Noma'lum bo'lim", 404);
    await cfg.delegate.delete({ where: { id: Number(id) } });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

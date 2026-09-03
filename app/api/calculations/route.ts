import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { calculationInputSchema } from "@/lib/validations";
import {
  resolveTerritory,
  resolveTaxRate,
  resolveAreaCoefficient,
  resolveLandUsage,
} from "@/services/coefficient";
import { calculateStartingPrice } from "@/services/calculation";
import { ok, fail, handleError } from "@/lib/api";

/** Jonli hisoblash (preview) — hujjatni saqlamaydi */
export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json();
    const input = calculationInputSchema.parse(body);

    const territory = await resolveTerritory(input.districtId);
    if (!territory) return fail("Tuman uchun T koeffitsiyenti topilmadi", 400);

    const tax = await resolveTaxRate(input.districtId);
    if (!tax || tax.b <= 0) return fail("Tuman uchun B stavkasi topilmadi yoki 0", 400);

    const area = await resolveAreaCoefficient(input.lotAreaM2);
    if (!area) return fail("M koeffitsiyenti topilmadi", 400);

    const usage = await resolveLandUsage(input.landUsageCode);
    if (!usage) return fail("F koeffitsiyenti topilmadi", 400);

    const s = input.lotAreaM2;
    const t = territory.t;
    const b = tax.b;
    const g = input.g;
    const f = usage.f;
    const m = area.m;
    const e = input.e ?? 0;

    const calc = calculateStartingPrice({ s, t, b, g, f, m, e });

    return ok({
      coefficients: {
        s, t, b, g, f, m, e,
        tDescription: territory.description,
        mDescription: area.description,
        fName: usage.name,
        fCode: usage.code,
        lotAreaHa: s / 10000,
      },
      result: calc,
    });
  } catch (e) {
    return handleError(e);
  }
}

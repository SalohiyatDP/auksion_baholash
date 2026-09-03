import { requireSession } from "@/lib/auth";
import { getAllCoefficients } from "@/services/coefficient";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();
    const data = await getAllCoefficients();
    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}

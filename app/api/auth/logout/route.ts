import { clearSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    await clearSession();
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

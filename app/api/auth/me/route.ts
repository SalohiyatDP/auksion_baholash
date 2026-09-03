import { getSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    return ok({ user: session });
  } catch (e) {
    return handleError(e);
  }
}

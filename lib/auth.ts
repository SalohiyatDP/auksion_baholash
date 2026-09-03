import { cookies } from "next/headers";
import type { SessionUser, Role } from "@/types";
import { signSession, verifySession, SESSION_COOKIE } from "@/lib/jwt";

export { SESSION_COOKIE, verifySession, signSession };

const MAX_AGE = 60 * 60 * 24 * 7; // 7 kun

/** Server komponent / route handler ichida joriy sessiyani oladi */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Ruxsatni tekshiradi, aks holda xatolik tashlaydi */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Avtorizatsiya talab qilinadi", 401);
  return session;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new AuthError("Ushbu amal uchun ruxsat yo'q", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

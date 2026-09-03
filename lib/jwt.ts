import { SignJWT, jwtVerify } from "jose";
import type { SessionUser, Role } from "@/types";

// Faqat jose ishlatiladi — Edge (middleware) muhitiga mos.
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export const SESSION_COOKIE = "ya_session";

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      fullName: payload.fullName as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

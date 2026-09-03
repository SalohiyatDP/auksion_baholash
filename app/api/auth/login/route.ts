import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = loginSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user || !user.isActive) {
      return fail("Login yoki parol noto'g'ri", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return fail("Login yoki parol noto'g'ri", 401);
    }

    const sessionUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    await setSession(sessionUser);

    return ok({ user: sessionUser });
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

const createUserSchema = z.object({
  fullName: z.string().min(1, { message: "F.I.O kiriting" }),
  email: z.string().email({ message: "Email noto'g'ri" }),
  username: z.string().min(3, { message: "Login kamida 3 belgi" }),
  password: z.string().min(6, { message: "Parol kamida 6 belgi" }),
  role: z.enum(["ADMIN", "OPERATOR"]),
});

export async function GET() {
  try {
    await requireRole("ADMIN");
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, fullName: true, email: true, username: true,
        role: true, isActive: true, createdAt: true,
        _count: { select: { documents: true } },
      },
    });
    return ok({ users });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const input = createUserSchema.parse(body);
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        username: input.username,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
      },
      select: { id: true, fullName: true, email: true, username: true, role: true },
    });
    return ok({ user }, 201);
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateUserSchema.parse(body);

    const data: Record<string, unknown> = {};
    if (input.fullName) data.fullName = input.fullName;
    if (input.email) data.email = input.email;
    if (input.role) data.role = input.role;
    if (typeof input.isActive === "boolean") data.isActive = input.isActive;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, fullName: true, email: true, username: true, role: true, isActive: true },
    });
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;
    if (id === session.id) return fail("O'zingizni o'chira olmaysiz", 400);
    await prisma.user.delete({ where: { id } });
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    const first = e.errors[0]?.message ?? "Validatsiya xatosi";
    return NextResponse.json({ error: first, issues: e.errors }, { status: 422 });
  }
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Ichki server xatosi";
  console.error("API xatosi:", e);
  return NextResponse.json({ error: message }, { status: 500 });
}

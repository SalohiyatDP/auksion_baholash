import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statik va API auth yo'llarini o'tkazib yuboramiz
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Tizimga kirmagan foydalanuvchini /login ga yo'naltiramiz
  if (!session && !isPublic && !pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Kirgan foydalanuvchi /login ga kirsa — dashboardga
  if (session && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // API uchun ham himoya (auth dan tashqari)
  if (!session && pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "Avtorizatsiya talab qilinadi" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

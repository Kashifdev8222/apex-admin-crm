import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_crm_session";

/** Lightweight gate: presence of session cookie. Full verify happens in server pages. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith("/login");
  const isAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  if (isAsset) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (isLogin) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

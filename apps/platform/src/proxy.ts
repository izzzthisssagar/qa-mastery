import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Optimistic auth checks only (per Next 16 auth guidance): redirect obviously
 * unauthenticated users away from app pages and signed-in users away from
 * auth pages. Real authorization happens server-side in layouts/actions —
 * the proxy is a convenience, not the security boundary.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/review", "/portfolio/me", "/settings"];
const AUTH_PATHS = ["/login", "/signup"];

export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PATHS.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

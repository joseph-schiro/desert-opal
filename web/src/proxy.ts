/**
 * Proxy (this Next version's renamed Middleware, running on the Node.js
 * runtime). Optimistic auth gate: any /admin route except the login page
 * requires a valid signed session cookie, otherwise we redirect to login.
 *
 * This is the redirect gate; pages/actions still call the DAL (`requireAdmin`)
 * as defense in depth.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page and its assets are public.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = pathname === "/admin" ? "" : `?from=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run only on admin routes.
  matcher: ["/admin", "/admin/:path*"],
};

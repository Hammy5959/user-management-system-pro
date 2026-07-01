import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface JWTPayload {
  id: number;
  role: string;
  permissions: string[];
  exp: number;
}

/**
 * Decode and validate a JWT from its cookie string without using any
 * browser-only APIs (localStorage, window, etc.). Runs in the Edge runtime.
 */
function decodeTokenFromCookie(token: string): JWTPayload | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload)) as JWTPayload;

    // Reject expired tokens
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

const protectedRoutes = ["/dashboard", "/users", "/permissions", "/roles"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/") ||
    pathname === "/verify-otp" || pathname.startsWith("/verify-otp/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process routes we care about — everything else passes through
  if (!isProtectedRoute(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value;
  const pendingOtp = request.cookies.get("pending-otp")?.value;

  const hasValidToken = authToken ? decodeTokenFromCookie(authToken) !== null : false;
  const hasPendingOtp = !!pendingOtp;

  // ── Rule 1: Fully authenticated user on login/verify-otp → dashboard
  if (hasValidToken && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Rule 2: Protected route without a valid auth cookie → login
  if (!hasValidToken && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Rule 3: /verify-otp reached out of context (no auth, no pending-otp) → login
  if (!hasValidToken && !hasPendingOtp && pathname === "/verify-otp") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── All other cases: allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/verify-otp",
    "/dashboard/:path*",
    "/users/:path*",
    "/permissions/:path*",
    "/roles/:path*",
  ],
};

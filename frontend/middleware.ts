import { NextResponse, type NextRequest } from "next/server";

// Public and reachable without a session; authenticated visitors are bounced
// away from these into the app (they're pre-session entry points only).
const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

// Public regardless of session state (no redirect either direction).
const PUBLIC_ROUTES = ["/"];

// Presence-only check: the Edge runtime can't verify the JWT signature without
// duplicating the backend's secret. Real authorization always happens server-side
// against the API; this only redirects for UX so signed-out users don't see a
// flash of protected content.
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("access_token")?.value);
  const { pathname } = request.nextUrl;

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // The landing page resolves the role and forwards to that role's home; the
  // Edge runtime can't decode the JWT to do it here.
  if (hasSession && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!hasSession && !isGuestOnlyRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

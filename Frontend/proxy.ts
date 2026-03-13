import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Public-only routes ────────────────────────────────────────────────────────
// Authenticated users should NOT be able to land here (redirect → /dashboard).
const AUTH_ONLY_ROUTES = ['/login', '/register'];

// ── Protected routes ──────────────────────────────────────────────────────────
// Unauthenticated users hitting any of these are redirected → /login.
// Determined by checking for the httpOnly `access_token` cookie set by the backend.
// Full JWT validation is handled server-side; cookie presence is sufficient for
// edge routing (any invalid/expired token is caught by the backend + axios interceptor).
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/onboard',
  '/register/personal-details',
  '/register/identity-verification',
  '/register/subscription',
  '/register/verify-email',
  '/register/dashboard',
  '/forgot-password/pin-code',
  '/forgot-password/new-password',
  '/forgot-password/success',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('access_token');

  // ── Guard: unauthenticated → protected route ─────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Guard: authenticated → public-only route ─────────────────────────────
  if (AUTH_ONLY_ROUTES.includes(pathname) && hasSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *  - _next/static  (Next.js static assets)
     *  - _next/image   (Next.js image optimizer)
     *  - favicon.ico
     *  - /api/*        (backend proxy — auth handled by Express)
     *  - public files with extensions (images, fonts, videos, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?|ttf|otf|eot)$).*)',
  ],
};

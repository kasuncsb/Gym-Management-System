import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Public-only routes ─────────────────────────────────────────────────────────
// Authenticated users are redirected to their role dashboard.
const AUTH_ONLY_ROUTES = ['/login'];

// ── Routes where authenticated users are bounced to dashboard ───────────────────
// Only login + register + forgot/reset. Do NOT include /member/verify-email or
// /member/onboard — members must be able to complete verify → onboard flow.
const BOUNCE_AUTHED_TO_DASHBOARD = [
  '/login',
  '/member/register',
  '/member/forgot-password',
  '/member/reset-password',
];

// ── Protected prefixes (all must be authenticated) ────────────────────────────
const MEMBER_PROTECTED = [
  '/member/onboard',
  '/member/dashboard',
  '/member/subscription',
  '/member/workouts',
  '/member/appointments',
  '/member/progress',
  '/member/checkin',
  '/member/profile',
];

const STAFF_PROTECTED = ['/trainer', '/manager', '/admin'];

const PROTECTED_PREFIXES = [...MEMBER_PROTECTED, ...STAFF_PROTECTED];

// ── Role → portal mapping ────────────────────────────────────────────────────
function homeForRole(role: string): string {
  switch (role) {
    case 'trainer': return '/trainer/dashboard';
    case 'manager': return '/manager/dashboard';
    case 'admin':   return '/admin/dashboard';
    default:        return '/member/dashboard';
  }
}

function portalForRole(role: string): string {
  switch (role) {
    case 'trainer': return '/trainer';
    case 'manager': return '/manager';
    case 'admin':   return '/admin';
    default:        return '/member';
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession  = request.cookies.has('access_token');
  const role        = request.cookies.get('user_role')?.value ?? 'member';

  // Helper: is this path under a given prefix?
  const under = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + '/');

  // ── /dashboard — permanent redirect to the correct role portal ───────────
  // Handles old bookmarks and any hard-coded links that still use /dashboard.
  if (pathname === '/dashboard') {
    const url = request.nextUrl.clone();
    url.search   = '';
    url.pathname = hasSession ? homeForRole(role) : '/login';
    return NextResponse.redirect(url);
  }

  // ── Guard: unauthenticated → protected route ─────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(under);
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // ── Guard: authenticated → bounce to dashboard only for login/register/forgot/reset ──
  // /member/verify-email and /member/onboard are allowed so members can complete the flow.
  const bouncePath = BOUNCE_AUTHED_TO_DASHBOARD.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (hasSession && bouncePath) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search   = '';
    return NextResponse.redirect(url);
  }

  // ── Guard: authenticated → wrong role portal ──────────────────────────────
  if (hasSession && isProtected) {
    const myPortal = portalForRole(role);
    // Check if user is trying to access another role's portal
    const wrongPortal = STAFF_PROTECTED
      .filter(p => p !== myPortal)
      .some(under);
    // Also check member trying to access /trainer|/manager|/admin vice-versa
    const memberOnStaffPortal = role === 'member' && STAFF_PROTECTED.some(under);
    const nonMemberOnMemberPortal = role !== 'member' && MEMBER_PROTECTED.some(under);
    if (wrongPortal || memberOnStaffPortal || nonMemberOnMemberPortal) {
      const url = request.nextUrl.clone();
      url.pathname = homeForRole(role);
      url.search   = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|public/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?|ttf|otf|eot)$).*)',
  ],
};

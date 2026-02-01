import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

const PUBLIC_ROUTES = [
  '/',
  '/auth/sign-in',
  '/auth/callback',
  '/terms',
  '/privacy',
];

const PROTECTED_ROUTES = [
  '/units',
  '/assignments',
  '/exams',
  '/timetable',
  '/grades',
  '/announcements',
  '/calendar',
  '/planner',
  '/resources',
  '/integrations',
  '/notifications',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { response, hasUser } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/og') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots') ||
    pathname.includes('.');

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isStatic || isPublic) {
    return response;
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !hasUser) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(signInUrl);
    // Copy cookies from proxy response so refresh state is preserved
    response.cookies.getAll().forEach(({ name, value, ...opts }) => {
      redirect.cookies.set(name, value, opts);
    });
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

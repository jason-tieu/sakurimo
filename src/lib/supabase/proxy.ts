/**
 * Proxy / middleware session refresh for Supabase SSR.
 * Refreshes JWT via getClaims(), keeps server and browser cookies in sync.
 * Do not trust getSession() in server middleware; use getClaims() or getUser().
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  hasUser: boolean;
  userId: string | undefined;
  userEmail: string | undefined;
}> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh/validate JWT; do not use getSession() in server middleware
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const hasUser = !!claims?.sub;
  const userId = claims?.sub;
  const userEmail = typeof claims?.email === 'string' ? claims.email : undefined;

  if (process.env.NODE_ENV === 'development') {
    console.log('[supabase proxy]', {
      path: request.nextUrl.pathname,
      hasUser,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
    });
  }

  return {
    response: supabaseResponse,
    hasUser,
    userId,
    userEmail,
  };
}

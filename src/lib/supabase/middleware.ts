import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Creates a Supabase server client bound to the incoming request cookies.
 * Validates the current user session via supabase.auth.getUser() and enforces
 * route protection across the store:
 *  - Unauthenticated requests to protected pages are redirected to /login.
 *  - Authenticated requests to /login are redirected to /.
 *  - Refreshed session cookies are preserved and forwarded in responses.
 */
export const createClient = async (request: NextRequest): Promise<NextResponse> => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // If Supabase keys are completely missing, block access to protected routes
  if (!supabaseUrl || !supabaseKey) {
    if (pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options } as any);
        });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validates the current session via Supabase server and triggers a silent refresh if needed.
  // Note: We use getUser() instead of getSession() because getUser() cryptographically
  // validates the JWT against Supabase Auth servers.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route Protection:
  // 1. Unauthenticated users trying to access any protected route get redirected to /login
  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    // Copy any cookies set by Supabase to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // 2. Authenticated users attempting to visit /login get redirected to store dashboard /
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
};

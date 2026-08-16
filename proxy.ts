import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Route protection proxy using NextAuth.
 * - Protects /dashboard/* – redirects unauthenticated users to /sign-in.
 * - Protects /sign-in and /register – redirects authenticated users to /dashboard.
 */
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const pathname = nextUrl.pathname;

  // If accessing a protected dashboard route and not logged in → redirect to sign-in
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', nextUrl);
    // Preserve the original URL as callback so user can return after login
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If already logged in and trying to access sign-in or register → redirect to dashboard
  if (isAuthenticated && (pathname === '/sign-in' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Allow all other requests
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/register'],
};
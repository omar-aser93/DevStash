import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; 

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const isAdmin = req.auth?.user?.isAdmin ?? false;
  const pathname = nextUrl.pathname;

  // Protect /admin/* – require auth and admin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/sign-in', nextUrl);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  // If accessing a protected dashboard route and not logged in → redirect to sign-in
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', nextUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If already logged in and trying to access sign-in or register → redirect to dashboard
  if (isAuthenticated && (pathname === '/sign-in' || pathname === '/register' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Allow all other requests
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/sign-in', '/register', '/'],
};
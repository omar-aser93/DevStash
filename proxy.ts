import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  if (!request.auth) {
    return NextResponse.redirect(new URL('/api/auth/signin', request.nextUrl));
  }
});

export const config = {
  matcher: ['/dashboard/:path*'],
};

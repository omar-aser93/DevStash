import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

// @auth/prisma-adapter's public types currently target Prisma 6, while this project uses Prisma 7 with a Neon driver adapter. Their runtime APIs match.
const authPrisma = prisma as unknown as Parameters<typeof PrismaAdapter>[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(authPrisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});

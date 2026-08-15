import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

/**
 * Retrieves the currently authenticated user's ID from NextAuth session.
 * If unauthenticated, redirects to the custom /sign-in page.
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  redirect("/sign-in");
}

/**
 * Retrieves the user's profile information from the database or active session.
 */
export async function getCurrentUser(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (user) {
    return {
      id: user.id,
      name: user.name ?? "User",
      email: user.email,
      image: user.image,
    };
  }

  const session = await auth();
  if (session?.user?.id === userId) {
    return {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      image: session.user.image ?? null,
    };
  }

  throw new Error("User not found");
}
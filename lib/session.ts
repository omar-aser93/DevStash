import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
  hasPassword: boolean;
  isAdmin: boolean;
  editorPreferences: {
    fontSize?: number;
    tabSize?: number;
    wordWrap?: boolean;
    minimap?: boolean;
    theme?: string;
  } | null;
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
      createdAt: true,
      password: true,
      isAdmin: true,
      editorPreferences: true,
    },
  });

  if (user) {
    return {
      id: user.id,
      name: user.name ?? "User",
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      hasPassword: !!user.password,
      isAdmin: user.isAdmin,
      editorPreferences: user.editorPreferences as SessionUser['editorPreferences'],
    };
  }

  const session = await auth();
  if (session?.user?.id === userId) {
    return {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      image: session.user.image ?? null,
      createdAt: new Date(), // fallback, but shouldn't happen
      hasPassword: false,
      isAdmin: session.user.isAdmin ?? false,
      editorPreferences: null,
    };
  }

  throw new Error("User not found");
}
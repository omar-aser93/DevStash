
// placeholder that resolves to the seeded demo user by email; swap for real session lookup once auth is wired up
import { prisma } from "@/lib/prisma";

/**
 * TODO: replace with a real session lookup (e.g. NextAuth's `auth()`)
 * once authentication is wired up. For now this resolves to the seeded
 * demo user so the dashboard can be driven by real DB data.
 */
export async function getCurrentUserId(): Promise<string> {
  const demoUser = await prisma.user.findUniqueOrThrow({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });
  return demoUser.id;
}



export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) throw new Error("User not found");
  return {
    name: user.name ?? "User",
    email: user.email,
  };
}
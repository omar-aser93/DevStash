"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { changePasswordSchema, editorPreferencesSchema } from "@/lib/validators";



export async function changePassword(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { currentPassword, newPassword } = result.data;
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user || !user.password) {
    return { success: false, error: "User does not have a password set (OAuth user)" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}



export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Delete user – Prisma onDelete Cascade will remove all related data
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}



export async function updateEditorPreferences(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = editorPreferencesSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: result.data },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
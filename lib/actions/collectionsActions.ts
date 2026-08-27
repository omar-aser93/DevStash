"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validators";
import { canCreateCollection } from "@/lib/stripe/usage";


export async function createCollection(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = createCollectionSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, description, defaultTypeId } = result.data;
  const userId = session.user.id;
  const isPro = session.user.isPro ?? false;

  const allowed = await canCreateCollection(userId, isPro);
  if (!allowed) {
    return {
      success: false,
      error: "You have reached the free tier limit of 3 collections. Upgrade to Pro for unlimited collections.",
    };
  }

  try {
    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
        defaultTypeId: defaultTypeId || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: collection };
  } catch (error) {
    console.error("Create collection error:", error);
    return { success: false, error: "Failed to create collection" };
  }
}



/**
 * Update a collection (name, description, favorite, defaultTypeId)
 */
export async function updateCollection(collectionId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const result = updateCollectionSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, description, isFavorite, defaultTypeId } = result.data;

  try {
    // Verify ownership
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Collection not found" };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (defaultTypeId !== undefined) updateData.defaultTypeId = defaultTypeId || null;

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: updateData,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/collections`);
    revalidatePath(`/dashboard/collections/${collectionId}`);
    revalidatePath(`/dashboard/favorites`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Update collection error:", error);
    return { success: false, error: "Failed to update collection" };
  }
}



/**
 * Delete a collection (cascades to ItemCollection join records)
 */
export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  try {
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Collection not found" };
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete collection error:", error);
    return { success: false, error: "Failed to delete collection" };
  }
}


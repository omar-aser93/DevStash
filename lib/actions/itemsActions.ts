"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createItemSchema, updateItemSchema } from "@/lib/validators";
import { Prisma } from "@/prisma/generated/prisma/client";
import { deleteFileFromR2 } from "@/lib/r2";


// Helper to resolve item type from name (system or user-owned)
async function resolveItemType(userId: string, typeName: string) {
  const itemType = await prisma.itemType.findFirst({
    where: {
      name: typeName,
      OR: [{ isSystem: true }, { userId }],
    },
  });
  if (!itemType) throw new Error("Item type not found");
  return itemType;
}



export async function createItem(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const result = createItemSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { typeName, title, description, tags, content, url, language, fileUrl, fileName, fileSize, fileKey, collectionIds } = result.data;
  const userId = session.user.id;

  try {
    // 1. Resolve item type
    const itemType = await resolveItemType(userId, typeName);

    // 2. Determine contentType based on type (or we could store contentType in the itemType)
    const contentType = typeName.toLowerCase() === "link" ? "URL": typeName.toLowerCase() === "file" || typeName.toLowerCase() === "image" ? "FILE" : "TEXT";

    // 3. Prepare data
    const cleanedContent = content?.trim() || null;
    const cleanedUrl = url?.trim() || null;
    const cleanedLanguage = language?.trim() || null;

    // 4. Create item
    const item = await prisma.item.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        contentType: contentType,
        content: cleanedContent,
        url: cleanedUrl,
        language: cleanedLanguage,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize ?? null,
        fileKey: fileKey || null,
        userId,
        itemTypeId: itemType.id,
      },
    }); 

    // 5. Handle tags
    if (tags && tags.length > 0) {
      const tagOperations = tags.map((tagName) => ({
        where: { userId_name: { userId, name: tagName } },
        create: { name: tagName, userId },
      }));
      await prisma.item.update({
        where: { id: item.id },
        data: { tags: { connectOrCreate: tagOperations } },
      });
    }

    // 6. Handle collections
    if (collectionIds && collectionIds.length > 0) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          collections: {
            create: collectionIds.map((collectionId) => ({
              collection: { connect: { id: collectionId } },
            })),
          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (error) {
    console.error("Create item error:", error);
    return { success: false, error: "Failed to create item" };
  }
}



export async function updateItem(itemId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const userId = session.user.id;

  const result = updateItemSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { title, description, tags, content, url, language, fileUrl, fileName, fileSize, isFavorite, isPinned, collectionIds } = result.data;

  try {
    // Get existing item + file info
    const existing = await prisma.item.findFirst({
      where: {
        id: itemId,
        userId,
      },
      select: {
        fileUrl: true,
        fileKey: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Item not found" };
    }

    if (fileUrl !== undefined && fileUrl !== existing.fileUrl && existing.fileKey) {
      await deleteFileFromR2(existing.fileKey);
    }

    // Build update data
    const updateData: Partial<Prisma.ItemUpdateInput> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) { updateData.description = description?.trim() || null; }
    if (content !== undefined) { updateData.content = content?.trim() || null; }
    if (url !== undefined) { updateData.url = url?.trim() || null; }
    if (language !== undefined) { updateData.language = language?.trim() || null; }
    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl || null;
      updateData.fileName = fileName || null;
      updateData.fileSize = fileSize ?? null;      
      // File was removed
      if (fileUrl === null && existing.fileKey) {
        await deleteFileFromR2(existing.fileKey);
        updateData.fileKey = null;
      }
    }
    if (isFavorite !== undefined) { updateData.isFavorite = isFavorite; }
    if (isPinned !== undefined) { updateData.isPinned = isPinned; }

    // Handle tags
    if (tags !== undefined) {
      // First, disconnect all existing tags
      await prisma.item.update({
        where: { id: itemId },
        data: { tags: { set: [] } },
      });
      // Then connect the new tags (if any)
      if (tags.length > 0) {
        const tagOperations = tags.map((tagName) => ({
          where: { userId_name: { userId, name: tagName } },
          create: { name: tagName, userId },
        }));
        await prisma.item.update({
          where: { id: itemId },
          data: { tags: { connectOrCreate: tagOperations } },
        });
      }
    }

    // Handle collections
    if (collectionIds !== undefined) {
      // Disconnect all existing
      await prisma.item.update({
        where: { id: itemId },
        data: { collections: { deleteMany: {} } },
      });
      // Connect new ones
      if (collectionIds.length > 0) {
        await prisma.item.update({
          where: { id: itemId },
          data: {
            collections: {
              create: collectionIds.map((collectionId) => ({
                collection: { connect: { id: collectionId } },
              })),
            },
          },
        });
      }
    }

    await prisma.item.update({
      where: { id: itemId },
      data: updateData,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update item error:", error);
    return { success: false, error: "Failed to update item" };
  }
}



export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const item = await prisma.item.findFirst({ where: { id: itemId, userId } });
    if (!item) return { success: false, error: "Item not found" };

    if (item.fileKey) {
      await deleteFileFromR2(item.fileKey);
    }

    await prisma.item.delete({ where: { id: itemId } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete item error:", error);
    return { success: false, error: "Failed to delete item" };
  }
}




// Convenience toggles (optional, but we can just call updateItem)
export async function toggleFavorite(itemId: string, isFavorite: boolean) {
  return updateItem(itemId, { isFavorite });
}

export async function togglePin(itemId: string, isPinned: boolean) {
  return updateItem(itemId, { isPinned });
}
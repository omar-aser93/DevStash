"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createItemSchema, updateItemSchema } from "@/lib/validators";
import { Prisma } from "@/prisma/generated/prisma/client";


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

  const { typeName, title, description, tags, content, url, language } = result.data;
  const userId = session.user.id;

  try {
    // 1. Resolve item type
    const itemType = await resolveItemType(userId, typeName);

    // 2. Determine contentType based on type (or we could store contentType in the itemType)
    const contentType = itemType.name.toLowerCase() === "link" ? "URL" : "TEXT";

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

    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (error) {
    console.error("Create item error:", error);
    return { success: false, error: "Failed to create item" };
  }
}



// export async function updateItem(itemId: string, data: unknown) {
//   const session = await auth();
//   if (!session?.user?.id) return { success: false, error: "Unauthorized" };
//   const userId = session.user.id;

//   const result = updateItemSchema.safeParse(data);
//   if (!result.success) {
//     return { success: false, error: result.error.issues[0].message };
//   }

//   const { title, description, tags, content, url, language, isFavorite, isPinned } = result.data;

//   try {
//     // Verify ownership
//     const existing = await prisma.item.findFirst({
//       where: { id: itemId, userId },
//       include: { tags: true },
//     });
//     if (!existing) return { success: false, error: "Item not found" };

//     // Build update data
//     const updateData: Partial<Prisma.ItemUpdateInput> = {};
//     if (title !== undefined) updateData.title = title.trim();
//     if (description !== undefined) updateData.description = description?.trim() || null;
//     if (content !== undefined) updateData.content = content?.trim() || null;
//     if (url !== undefined) updateData.url = url?.trim() || null;
//     if (language !== undefined) updateData.language = language?.trim() || null;
//     if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
//     if (isPinned !== undefined) updateData.isPinned = isPinned;

//     // Handle tags
//     if (tags !== undefined) {
//       // Disconnect all existing tags, then connect new ones
//       await prisma.item.update({
//         where: { id: itemId },
//         data: { tags: { set: [] } },
//       });
//       if (tags.length > 0) {
//         const tagRecords = await upsertTags(userId, tags);
//         updateData.tags = { connect: tagRecords.map((t) => ({ id: t.id })) };
//       }
//     }

//     await prisma.item.update({
//       where: { id: itemId },
//       data: updateData,
//     });

//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     console.error("Update item error:", error);
//     return { success: false, error: "Failed to update item" };
//   }
// }
export async function updateItem(itemId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const result = updateItemSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { title, description, tags, content, url, language, isFavorite, isPinned } = result.data;

  try {
    // Verify ownership in a single query
    const existing = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: "Item not found" };
    }

    // Build update data
    const updateData: Partial<Prisma.ItemUpdateInput> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (content !== undefined) updateData.content = content?.trim() || null;
    if (url !== undefined) updateData.url = url?.trim() || null;
    if (language !== undefined) updateData.language = language?.trim() || null;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    // Handle tags efficiently
    if (tags !== undefined) {
      if (tags.length === 0) {
        // Disconnect all tags
        updateData.tags = { set: [] };
      } else {
        // Prepare connectOrCreate for each tag
        const tagOperations = tags.map((tagName) => ({
          where: { userId_name: { userId, name: tagName } },
          create: { name: tagName, userId },
        }));
        // Connect or create each tag
        updateData.tags = {
          connectOrCreate: tagOperations,
        };
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
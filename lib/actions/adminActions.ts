"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client"; 

// ---------- Users ----------
export async function getUsers(page = 1, limit = 10, search = "") {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  const skip = (page - 1) * limit;
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAdmin: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, totalPages: Math.ceil(total / limit) };
}


export async function updateUser(userId: string, data: { name?: string | null; isAdmin?: boolean }) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? undefined,
        isAdmin: data.isAdmin,
      },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return { success: false, error: message };
  }
}


export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  if (userId === session.user.id) return { success: false, error: "Cannot delete yourself" };

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, error: message };
  }
}



// ---------- Blog ----------
export async function getBlogPosts(page = 1, limit = 10, search = "") {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  const skip = (page - 1) * limit;
  const where: Prisma.BlogPostWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        published: true,
        createdAt: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, totalPages: Math.ceil(total / limit) };
}


export async function createBlogPost(data: {
  slug: string;
  title: string;
  content: string;
  excerpt?: string | null;
  published?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  try {
    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) return { success: false, error: "Slug already exists" };

    await prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt ?? undefined,
        published: data.published ?? true,
        authorId: session.user.id,
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return { success: false, error: message };
  }
}


export async function updateBlogPost(
  id: string,
  data: {
    slug?: string;
    title?: string;
    content?: string;
    excerpt?: string | null;
    published?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  try {
    if (data.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (existing) return { success: false, error: "Slug already exists" };
    }

    await prisma.blogPost.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt ?? undefined,
        published: data.published,
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath(`/blog/${data.slug || ""}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    return { success: false, error: message };
  }
}


export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  try {
    await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    return { success: false, error: message };
  }
}
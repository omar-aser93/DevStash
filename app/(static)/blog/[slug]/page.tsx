import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.excerpt || "Read this post on DevStash",
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: {
      title: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <article>
          <h1 className="text-4xl font-extrabold mb-2">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-[#55556a] mb-6">
            <span>By {post.author.name || "Admin"}</span>
            <span>•</span>
            <time>
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
            {/* Render Markdown content – you can use react-markdown here */}
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
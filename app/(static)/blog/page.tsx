import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | DevStash",
  description: "News, updates, and tips from the DevStash team.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Blog</h1>
        <p className="text-[#8888a4] mb-10 leading-relaxed">Latest news, updates, and tips from the DevStash team.</p>

        {posts.length === 0 ? (
          <p className="text-[#8888a4] mt-4">Coming soon – stay tuned!</p>
        ) : (
          <div className="space-y-6 mt-6">
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-[#1e1e2e] pb-4">
                <h2 className="text-xl font-bold">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-400 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-[#8888a4]">{post.excerpt}</p>
                <time className="text-sm text-[#55556a]">
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
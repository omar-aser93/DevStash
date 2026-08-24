import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | DevStash",
  description: "News, updates, and tips from the DevStash team.",
};

// Hardcoded sample posts – you can later fetch from a CMS or markdown
const POSTS = [
  {
    slug: "welcome-to-devstash",
    title: "Welcome to DevStash",
    excerpt: "Introducing your new developer knowledge hub.",
    date: "2026-08-24",
  },
  {
    slug: "why-organize-knowledge",
    title: "Why Organizing Developer Knowledge Matters",
    excerpt: "Stop losing your best snippets and commands.",
    date: "2026-08-20",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-10">
      <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-2">Blog</h1>
      <p className="text-[#8888a4] mb-10 leading-relaxed">Latest news, updates, and tips from the DevStash team.</p>

      {POSTS.length === 0 ? (
        <p className="text-[#8888a4] mt-4">Coming soon – stay tuned!</p>
      ) : (
        <div className="space-y-6 mt-6">
          {POSTS.map((post) => (
            <article key={post.slug} className="border-b border-[#1e1e2e] pb-4">
              <h2 className="text-xl font-bold">
                <Link href={`/blog/${post.slug}`} className="hover:text-blue-400 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-[#8888a4]">{post.excerpt}</p>
              <time className="text-sm text-[#55556a]">
                {new Date(post.date).toLocaleDateString("en-US", {
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
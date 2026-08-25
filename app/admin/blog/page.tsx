import { getBlogPosts } from "@/lib/actions/adminActions";
import { BlogTable } from "@/components/admin/BlogTable";
import { CustomPagination } from "@/components/CustomPagination";

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminBlogPage({ searchParams }: PageProps) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 10;

  const { posts, totalPages } = await getBlogPosts(page, limit, q || "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <p className="text-sm text-muted-foreground">Manage blog posts.</p>
      </div>
      <BlogTable posts={posts} />
      <CustomPagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/blog"
        queryParams={q ? { q } : {}}
      />
    </div>
  );
}
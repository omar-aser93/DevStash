import { getCurrentUserId, getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, Folder, Database, FileText } from "lucide-react";
import { AdminChart } from "@/components/admin/AdminChart";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin | DevStash",
    description: "Admin dashboard for DevStash.",
};


export default async function AdminPage() {
  const userId = await getCurrentUserId();
  const user = await getCurrentUser(userId);
  if (!user.isAdmin) return <div>Access Denied</div>;

  const [totalUsers, totalItems, totalCollections, totalBlogPosts] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.blogPost.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Users" value={totalUsers} icon={Users} iconColorClass="text-blue-400" iconBgClass="bg-blue-500/10" />
        <StatsCard label="Items" value={totalItems} icon={Database} iconColorClass="text-indigo-400" iconBgClass="bg-indigo-500/10" />
        <StatsCard label="Collections" value={totalCollections} icon={Folder} iconColorClass="text-amber-400" iconBgClass="bg-amber-500/10" />
        <StatsCard label="Blog Posts" value={totalBlogPosts} icon={FileText} iconColorClass="text-emerald-400" iconBgClass="bg-emerald-500/10" />
      </div>

      <div className="rounded-xl border border-[#1e1e2e] bg-card/30 p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">User Growth (Last 7 Days)</h2>
        <AdminChart />
      </div>
    </div>
  );
}
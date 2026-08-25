import { getUsers } from "@/lib/actions/adminActions";
import { UsersTable } from "@/components/admin/UsersTable";
import { CustomPagination } from "@/components/CustomPagination";

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 10;

  const { users, totalPages } = await getUsers(page, limit, q || "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage user accounts.</p>
      </div>
      <UsersTable users={users} />
      <CustomPagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/users"
        queryParams={q ? { q } : {}}
      />
    </div>
  );
}
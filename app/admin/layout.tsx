import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef]">
      <AdminNavbar />
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
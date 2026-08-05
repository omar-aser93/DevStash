import { Navbar } from "@/components/navbars/Navbar";
import { Sidebar } from "@/components/navbars/Sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1"> {children} </main>
      </div>
    </div>
  );
}

import { Navbar } from "@/components/navbars/Navbar";
import { Sidebar } from "@/components/navbars/Sidebar";
import { getSidebarCollections } from "@/lib/queries/collections";
import { getItemTypesWithCounts } from "@/lib/queries/items";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await getCurrentUserId();

  const [user, { favorites, recent }, itemTypes] = await Promise.all([
    getCurrentUser(userId),
    getSidebarCollections(userId),
    getItemTypesWithCounts(userId),
  ]);

  const sidebarProps = { currentUser: user, itemTypes, favoriteCollections: favorites, recentCollections: recent };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar {...sidebarProps}/>
      <div className="flex">
        <Sidebar {...sidebarProps} />        
        <main className="min-w-0 flex-1"> {children} </main>
      </div>
    </div>
  );
}

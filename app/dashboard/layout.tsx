import { Navbar } from "@/components/navbars/Navbar";
import { Sidebar } from "@/components/navbars/Sidebar";
import { getAllCollectionsWithCount, getSidebarCollections, getUserCollections } from "@/lib/queries/collections";
import { getAllItemsForSearch, getItemTypesWithCounts } from "@/lib/queries/items";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { ItemDrawerProvider } from "@/components/item-drawer/ItemDrawerProvider";
import { SearchProvider } from "@/components/search/SearchProvider";
import { CommandPalette } from "@/components/search/CommandPalette";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";


export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await getCurrentUserId();

  const [user, { favorites, recent }, itemTypes, allCollections, searchItems, searchCollections] = await Promise.all([
    getCurrentUser(userId),
    getSidebarCollections(userId),
    getItemTypesWithCounts(userId),
    getUserCollections(userId),
    getAllItemsForSearch(userId),
    getAllCollectionsWithCount(userId)
  ]);

  const sidebarProps = { currentUser: user, itemTypes, favoriteCollections: favorites, recentCollections: recent };
  
  return (
    <div className="min-h-screen bg-background">
      <SearchProvider> 
        <EditorPreferencesProvider initialPreferences={user.editorPreferences}>
         <ItemDrawerProvider collections={allCollections}>          
            <Navbar {...sidebarProps} collections={allCollections}/>
            <div className="flex">
              <Sidebar {...sidebarProps} />        
              <main className="min-w-0 flex-1"> {children} </main>
            </div>
            <CommandPalette items={searchItems} collections={searchCollections} /> 
          </ItemDrawerProvider>
        </EditorPreferencesProvider>        
      </SearchProvider>
    </div>
  );
}

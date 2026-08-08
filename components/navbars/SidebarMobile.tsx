import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { getSidebarCollections } from "@/lib/queries/collections";
import { getItemTypesWithCounts } from "@/lib/queries/items";

export async function SidebarMobile() {
    const userId = await getCurrentUserId();
  
    const [user, { favorites, recent }, itemTypes] = await Promise.all([
      getCurrentUser(userId),
      getSidebarCollections(userId),
      getItemTypesWithCounts(userId),
    ]);
  
    const sidebarProps = { currentUser: user, itemTypes, favoriteCollections: favorites, recentCollections: recent };

  return (
    <Sheet>
      <SheetTrigger className="md:hidden" render={ <Button aria-label="Open sidebar" size="icon" variant="ghost" /> } >
        <Menu />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0 bg-black" showCloseButton={false} >
        <SidebarContent mobile {...sidebarProps} />
      </SheetContent>
    </Sheet>
  );
}
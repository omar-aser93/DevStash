import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";
import { SidebarContentProps } from "./SidebarContent";

export function SidebarMobile(sidebarProps: Omit<SidebarContentProps, "collapsed" | "setCollapsed" | "mobile">) {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden" render={ <Button aria-label="Open sidebar" size="icon" variant="ghost" /> } >
        <Menu /> 
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-black" showCloseButton={false}>
        <SidebarContent mobile {...sidebarProps} />
      </SheetContent>
    </Sheet>
  );
}
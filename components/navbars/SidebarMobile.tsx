"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";

export function SidebarMobile() {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden" render={ <Button aria-label="Open sidebar" size="icon" variant="ghost" /> } >
        <Menu />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0" showCloseButton={false} >
        <SidebarContent mobile />
      </SheetContent>
    </Sheet>
  );
}
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarContent, SidebarContentProps } from "./SidebarContent";

export function Sidebar(props: Omit<SidebarContentProps, "collapsed" | "setCollapsed" | "mobile">) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={cn("hidden md:block sticky top-16 h-[calc(100vh-4rem)] border-r bg-background transition-[width] duration-200", collapsed ? "w-16" : "w-72" )} >
      <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} {...props} />
    </aside>
  );
}



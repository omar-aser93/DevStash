"use client";

import { LogOut, User, Settings, ChevronsUpDown } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,  
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SidebarUser } from "./SidebarContent";

export interface UserNavMenuProps {
  user: SidebarUser;
  collapsed?: boolean;
}

export function UserNavMenu({ user, collapsed }: UserNavMenuProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          collapsed ? "justify-center px-0" : "justify-between"
        )}
        aria-label="User account menu"
      >
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            size="sm"
          />
          {!collapsed && (
            <div className="sidebar-text min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronsUpDown className="sidebar-text size-4 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align={collapsed ? "center" : "start"}
        sideOffset={8}
        className="w-56 bg-black"
      >
        <DropdownMenuGroup>
  <DropdownMenuGroupLabel>

          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuGroupLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/profile" className="flex w-full items-center gap-2" />}>
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" className="flex w-full items-center gap-2" />}>
          <Settings className="size-4 shrink-0 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>
         </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

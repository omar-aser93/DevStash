"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SidebarUser } from "./SidebarContent";

export interface UserNavMenuProps {
  user: SidebarUser;
  collapsed?: boolean;
}


export function UserNavMenu({ user, collapsed }: UserNavMenuProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/sign-in" });
    // No need to reset state – the page will redirect
  };

  return (
    <>
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
            <DropdownMenuItem render={<Link href="/dashboard/settings" className="flex w-full items-center gap-2" />}>
              <Settings className="size-4 shrink-0 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowSignOutDialog(true)}
            className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your stash.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignOutDialog(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
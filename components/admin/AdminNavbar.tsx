// "use client";

// import Link from "next/link";
// import { FolderOpen, Home, Users, PenSquare } from "lucide-react";
// import { AdminSearch } from "./AdminSearch";

// export function AdminNavbar() {
//   return (
//     <nav className="border-b border-[#1e1e2e] bg-[#12121a] px-6 py-3 flex items-center gap-6">
//       <Link href="/admin" className="flex items-center gap-2 font-semibold text-lg">
//         <FolderOpen className="size-6" />
//         <span className="hidden sm:inline">Admin</span>
//       </Link>
//       <div className="flex items-center gap-4 ml-6">
//         <Link href="/admin" className="text-sm text-[#8888a4] hover:text-[#e4e4ef] transition-colors flex items-center gap-1">
//           <Home className="size-4" />
//           <span>Dashboard</span>
//         </Link>
//         <Link href="/admin/users" className="text-sm text-[#8888a4] hover:text-[#e4e4ef] transition-colors flex items-center gap-1">
//           <Users className="size-4" />
//           <span>Users</span>
//         </Link>
//         <Link href="/admin/blog" className="text-sm text-[#8888a4] hover:text-[#e4e4ef] transition-colors flex items-center gap-1">
//           <PenSquare className="size-4" />
//           <span>Blog</span>
//         </Link>
//       </div>
//       <div className="flex-1 flex items-center justify-end gap-4">
//         <AdminSearch />
//       </div>
//     </nav>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen, Home, Users, PenSquare, Menu, X, Search } from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function AdminNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/blog", label: "Blog", icon: PenSquare },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="border-b border-[#1e1e2e] bg-[#12121a] px-4 py-3 flex items-center gap-2 sm:gap-6 flex-wrap">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-lg shrink-0">
          <FolderOpen className="size-6" />
          <span className="hidden sm:inline">Admin</span>
        </Link>

        {/* Desktop Nav Links (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-4 ml-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors flex items-center gap-1 ${
                isActive(link.href)
                  ? "text-[#e4e4ef]"
                  : "text-[#8888a4] hover:text-[#e4e4ef]"
              }`}
            >
              <link.icon className="size-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side: Search + Mobile Menu */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search – desktop full, mobile icon toggle */}
          <div className="hidden sm:block">
            <AdminSearch />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-[#8888a4] hover:text-[#e4e4ef]"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
          >
            <Search className="size-5" />
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-[#8888a4] hover:text-[#e4e4ef]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Search (expanded) */}
      {searchOpen && (
        <div className="sm:hidden border-b border-[#1e1e2e] bg-[#12121a] px-4 py-2">
          <AdminSearch />
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#1e1e2e] bg-[#12121a] px-4 py-2 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                isActive(link.href)
                  ? "bg-muted/20 text-[#e4e4ef]"
                  : "text-[#8888a4] hover:text-[#e4e4ef] hover:bg-muted/10"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
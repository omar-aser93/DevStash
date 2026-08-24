import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication | DevStash",
  description: "Sign in or create an account for DevStash.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background subtle radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,oklch(0.922_0_0/0.04),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand identity header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-[#e4e4ef]">
            <FolderOpen className="size-7" />
            DevStash
          </Link>
        </div>

        {/* Auth form card */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

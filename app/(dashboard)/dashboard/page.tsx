import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | DevStash",
  description: "Browse and organize your developer knowledge in DevStash.",
};

export default function DashboardPage() {
  return (
    <main className="h-full p-6">
      <h2 className="text-sm font-semibold">Main</h2>
    </main>
  );
}

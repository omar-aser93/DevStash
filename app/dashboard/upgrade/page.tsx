import { Metadata } from "next";
import { UpgradePricing } from "@/components/upgrade/UpgradePricing";

export const metadata: Metadata = {
  title: "Upgrade to Pro | DevStash",
  description: "Get unlimited items, collections, and file uploads.",
};

export default async function UpgradePage() {
  return (
    <div className="text-[#e4e4ef] min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upgrade to <span className="bg-linear-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent">DevStash Pro</span>
          </h1>
          <p className="text-[#8888a4] max-w-2xl mx-auto">
            Get unlimited items, collections, and file uploads. Unlock AI features and data export.
          </p>
        </div>
        <UpgradePricing />
      </div>
    </div>
  );
}

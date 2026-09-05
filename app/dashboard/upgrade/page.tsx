import { Metadata } from "next";
import { UpgradePricing } from "@/components/upgrade/UpgradePricing";
import { STRIPE_SUPPORTED_COUNTRIES } from "@/lib/utils";
import { getUserCountry } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Upgrade to Pro | DevStash",
  description: "Get unlimited items, collections, and file uploads.",
};

export default async function UpgradePage({ searchParams }: {searchParams: Promise<{ [key: string]: string | undefined }>;}) { 

  // 2 ways to get user country (either from DB (user set it on register/setting) or from IP address (Vercel/netlify/...) 
  // we use the IP method (we set it up in lib/geo.ts utility) but we also use searchParams for testing manually (?country=US)
  const params = await searchParams;
  const country = (params.country || await getUserCountry()).toUpperCase();

  // we got it from the docs & AI, we import it from the lib/utils.ts
  const stripeSupported = STRIPE_SUPPORTED_COUNTRIES.includes(country);

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
        <UpgradePricing stripeSupported={stripeSupported} />
      </div>
    </div>
  );
}

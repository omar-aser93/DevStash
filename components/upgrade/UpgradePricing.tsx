"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "All item types including Files & Images",
  "AI auto-tagging & summaries",
  "“Explain This Code”",
  "AI Prompt Optimizer",
  "Data export (JSON/ZIP)",
];

export function UpgradePricing({ stripeSupported }: { stripeSupported: boolean }) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"monthly" | "yearly" | "paymob-monthly" | "paymob-yearly" | null>(null);

  // Determine pricing based on Stripe support
  // If Stripe is supported, use USD. Otherwise, use EGP.
  const useUSD = stripeSupported;
  const monthlyPrice = useUSD ? "8" : "408";
  const yearlyPrice = useUSD ? "72" : "3669";
  const currency = useUSD ? "$" : "EGP";
  const yearlySave = useUSD ? "25%" : "10%";

  const handleStripeUpgrade = async (plan: "monthly" | "yearly") => {
    setLoadingAction(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate upgrade";
      toast.error(message);
      setLoadingAction(null);
    }
  };

  const handlePaymobUpgrade = async (plan: "monthly" | "yearly") => {
    setLoadingAction(plan === "monthly" ? "paymob-monthly" : "paymob-yearly");
    try {
      const res = await fetch("/api/paymob/intention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
      if (data.url) window.location.href = data.url;
      else throw new Error("No redirect URL received");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate payment";
      toast.error(message);
      setLoadingAction(null);
    }
  };

  const handleUpgrade = () => {
    const plan = isYearly ? "yearly" : "monthly";
    if (stripeSupported) {
      handleStripeUpgrade(plan);
    } else {
      handlePaymobUpgrade(plan);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${!isYearly ? "text-[#e4e4ef]" : "text-[#8888a4]"}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-12 h-7 bg-[#1a1a28] border border-[#1e1e2e] rounded-full relative cursor-pointer transition-colors"
          role="switch"
          aria-checked={isYearly}
        >
          <span
            className={`absolute top-0.75 left-0.75 w-5 h-5 rounded-full transition-all duration-200 ${
              isYearly ? "translate-x-5 bg-[#22c55e]" : "translate-x-0 bg-[#8888a4]"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isYearly ? "text-[#e4e4ef]" : "text-[#8888a4]"}`}>
          Yearly{" "}
          <span className="inline-block bg-linear-to-r from-[#22c55e] to-[#15803d] text-black text-[0.7rem] font-bold px-2 py-0.5 rounded-lg ml-1">
            Save {yearlySave}
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free (non-interactive) */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 text-left opacity-60">
          <h3 className="text-xl font-bold mb-2 text-[#e4e4ef]">Free</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-[#e4e4ef]">$0</span>
            <span className="text-sm text-[#8888a4]">/month</span>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-[#8888a4]">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-[#22c55e]" />
              50 items
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-[#22c55e]" />
              3 collections
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-[#22c55e]" />
              Basic search
            </li>
            <li className="flex items-center gap-2 text-[#55556a]">
              <X className="size-4" />
              File & Image uploads
            </li>
            <li className="flex items-center gap-2 text-[#55556a]">
              <X className="size-4" />
              AI features
            </li>
          </ul>
        </div>

        {/* Pro card */}
        <div className="bg-linear-to-b from-blue-500/6 to-[#12121a] border border-blue-500 rounded-xl p-8 text-left relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-700 via-blue-600 to-blue-400 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
            Most Popular
          </span>
          <h3 className="text-xl font-bold mb-2 text-[#e4e4ef]">Pro</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-[#e4e4ef]">
              {isYearly ? yearlyPrice : monthlyPrice}
            </span>
            <span className="text-sm text-[#8888a4]">
              {isYearly
                ? `${currency}/year (billed ${yearlyPrice}${currency}/yr)`
                : `${currency}/month`}
            </span>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-[#8888a4]">
            {PRO_FEATURES.map((text) => (
              <li key={text} className="flex items-center gap-2">
                <Check className="size-4 text-[#22c55e]" />
                {text}
              </li>
            ))}
          </ul>
          <Button
            className="w-full mt-6 bg-linear-to-r from-blue-700 via-blue-600 to-blue-400 text-white border-0 hover:opacity-90"
            onClick={handleUpgrade}
            disabled={loadingAction !== null}
          >
            {loadingAction && <Loader2 className="size-4 animate-spin mr-2" />}
            {loadingAction ? "Processing..." : "Upgrade Now"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {stripeSupported ? "🔒 Secured via Stripe" : "🔒 Secured via Paymob"}
          </p>
        </div>
      </div>
    </div>
  );
}
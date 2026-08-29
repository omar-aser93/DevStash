"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BillingSettingsProps {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
  maxItems: number;
  maxCollections: number;
}


export function BillingSettings({
  isPro,
  itemCount,
  collectionCount,
  maxItems,
  maxCollections,
}: BillingSettingsProps) {
  const searchParams = useSearchParams();
  const [loadingAction, setLoadingAction] = useState<
    "monthly" | "yearly" | "portal" | null
  >(null);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to DevStash Pro!");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    setLoadingAction(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate upgrade";
      toast.error(message);
      setLoadingAction(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingAction("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open customer billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to open billing portal";
      toast.error(message);
      setLoadingAction(null);
    }
  };

  const itemPercentage = Math.min(Math.round((itemCount / maxItems ) * 100), 100);
  const collectionPercentage = Math.min( Math.round((collectionCount / maxCollections) * 100), 100 );

  return (
    <section className="rounded-xl border bg-card/40 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <CreditCard className="size-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Billing</h2>
              {isPro ? (
                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                  Pro Plan
                </Badge>
              ) : (
                <Badge variant="secondary">Free Plan</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isPro
                ? "Manage your DevStash Pro subscription and invoices."
                : "Upgrade to DevStash Pro for unlimited items, collections, and file uploads."}
            </p>
          </div>
        </div>

        {isPro && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={loadingAction !== null}
            className="self-start sm:self-auto"
          >
            {loadingAction === "portal" && (
              <Loader2 className="size-4 animate-spin mr-2" />
            )}
            Manage Billing
          </Button>
        )}
      </div>

      {isPro ? (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            <span>DevStash Pro Active Benefits</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-primary shrink-0" />
              <span>Unlimited snippets, notes, & links</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-primary shrink-0" />
              <span>Unlimited collections</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-primary shrink-0" />
              <span>Direct file & image uploads (R2 storage)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-primary shrink-0" />
              <span>Self-service billing & receipt portal</span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Usage Display */}
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Free Tier Usage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Items</span>
                  <span>
                    {itemCount} / {maxItems} items
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      itemCount >= maxItems ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${itemPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Collections</span>
                  <span>
                    {collectionCount} / {maxCollections} collections
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${
                      collectionCount >= maxCollections ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${collectionPercentage}%` }}
                  />
                </div>      
              </div>
            </div>
          </div>

          {/* Upgrade Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button className="w-full sm:w-auto"
              onClick={() => handleUpgrade("monthly")}
              disabled={loadingAction !== null}
            >
              {loadingAction === "monthly" && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Upgrade $8/mo
            </Button>
            <Button className="w-full sm:w-auto"
              variant="outline"
              onClick={() => handleUpgrade("yearly")}
              disabled={loadingAction !== null}
            >
              {loadingAction === "yearly" && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Upgrade $72/yr (save 25%)
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

import { Metadata } from "next";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { ChangePassword } from "@/components/settings/ChangePassword";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { EditorPreferences } from "@/components/settings/EditorPreferences";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { getUserUsage } from "@/lib/stripe/usage";
import { MAX_ITEMS, MAX_COLLECTIONS } from "@/lib/stripe/usage";
import { STRIPE_SUPPORTED_COUNTRIES } from "@/lib/utils";
import { getUserCountry } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Settings | DevStash",
  description: "Manage your account settings and preferences.",
};


export default async function SettingsPage({ searchParams }: {searchParams: Promise<{ [key: string]: string | undefined }>;}) {  
  const userId = await getCurrentUserId();
  const user = await getCurrentUser(userId);
  const usage = await getUserUsage(user.id, user.isPro);

  // 2 ways to get user country (either from DB (user set it on register/setting) or from IP address (Vercel/netlify/...) 
  // we use the IP method (we set it up in lib/geo.ts utility) but we also use searchParams for testing manually (?country=US)
  const params = await searchParams;
  const country = (params.country || await getUserCountry()).toUpperCase();

  // we got it from the docs & AI, we import it from the lib/utils.ts
  const stripeSupported = STRIPE_SUPPORTED_COUNTRIES.includes(country);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Change Password */}
      {user.hasPassword && (
        <section className="rounded-xl border bg-card/40 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure.
          </p>
          <ChangePassword />
          <span id="billing"></span>
        </section>
      )}
           
      {/* Billing & Subscription */}
      <BillingSettings
        isPro={user.isPro}
        itemCount={usage.itemCount}
        collectionCount={usage.collectionCount}
        maxItems={MAX_ITEMS}
        maxCollections={MAX_COLLECTIONS}
        stripeSupported={stripeSupported}
        country={country}
      />

      {/* Editor Preferences */}
      <section className="rounded-xl border bg-card/40 p-6 space-y-4 ">
        <h2 className="text-lg font-semibold">Editor Preferences</h2>
        <p className="text-sm text-muted-foreground">
          These settings apply to the Monaco code editor across the app.
        </p>
        <EditorPreferences />
      </section>

      {/* Delete Account */}
      <section className="rounded-xl border border-destructive/30 bg-card/40 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive ">Delete Account</h2>
        <p className="text-sm text-muted-foreground">
          This action is permanent and cannot be undone.
        </p>
        <DeleteAccount />
      </section>
      
    </div>
  );
}
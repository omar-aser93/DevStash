import { Metadata } from "next";


export const metadata: Metadata = {
  title: "User Profile | DevStash",
  description: "View and manage your DevStash user profile.",
};

export default async function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
    </div>
  );
}
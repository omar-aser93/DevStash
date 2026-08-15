import { Metadata } from "next";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Mail, User } from "lucide-react";

export const metadata: Metadata = {
  title: "User Profile | DevStash",
  description: "View and manage your DevStash user profile.",
};

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  const user = await getCurrentUser(userId);

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal account details and preferences.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border bg-card/40 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            size="lg"
            className="size-16 text-xl"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5" />
                Full Name
              </label>
              <p className="text-sm font-medium text-foreground bg-muted/30 border rounded-lg px-3 py-2">
                {user.name}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                Email Address
              </label>
              <p className="text-sm font-medium text-foreground bg-muted/30 border rounded-lg px-3 py-2">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

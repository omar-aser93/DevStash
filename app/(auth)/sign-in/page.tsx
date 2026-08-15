"use client";

import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const isRegistered = searchParams.get("registered") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError ? "An error occurred during authentication. Please try again." : null
  );
  const [isGitHubPending, startGitHubTransition] = useTransition();
  const [isCredentialsPending, setIsCredentialsPending] = useState(false);

  const handleGitHubSignIn = () => {
    setError(null);
    startGitHubTransition(async () => {
      await signIn("github", { callbackUrl });
    });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsCredentialsPending(true);
    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.");
        setIsCredentialsPending(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsCredentialsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your developer knowledge stash
        </p>
      </div>

      {/* Success banner if redirected from registration */}
      {isRegistered && !error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Account created successfully! You can now sign in.</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GitHub OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 gap-2 font-medium cursor-pointer border-border hover:bg-muted"
        onClick={handleGitHubSignIn}
        disabled={isGitHubPending || isCredentialsPending}
      >
        {isGitHubPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GithubIcon className="size-4" />
        )}
        Sign in with GitHub
      </Button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-border" />
        <span className="absolute bg-card px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Or continue with
        </span>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium text-muted-foreground"
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isGitHubPending || isCredentialsPending}
            required
            autoComplete="email"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium text-muted-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isGitHubPending || isCredentialsPending}
            required
            autoComplete="current-password"
            className="h-10"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 font-medium cursor-pointer"
          disabled={isGitHubPending || isCredentialsPending}
        >
          {isCredentialsPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign in with Email"
          )}
        </Button>
      </form>

      {/* Footer link to Register */}
      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

import { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to access your developer knowledge stash.",
};

interface SearchParams {
  registered?: string;
  callbackUrl?: string;
  error?: string;
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <SignInForm searchParams={searchParams} />;
}
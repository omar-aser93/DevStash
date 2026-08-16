import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up to organize your snippets, prompts, commands and notes.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
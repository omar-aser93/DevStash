import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") {
    return "DS";
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "DS";
  }

  // If email passed, take first letters of the user part
  if (trimmed.includes("@") && !trimmed.includes(" ")) {
    const userPart = trimmed.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    return (userPart.slice(0, 2) || "DS").toUpperCase();
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
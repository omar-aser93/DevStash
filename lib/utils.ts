import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// utility function to get initials
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



// utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}


// utility function to get env as number
export function getEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value < 0) {
    return fallback;
  }

  return value;
}
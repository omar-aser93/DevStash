"use client";

import * as React from "react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-base",
};

export function UserAvatar({
  name,
  email,
  image,
  className,
  size = "sm",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name || email);

  if (image && !imageError) {
    return (
      <img
        src={image}
        alt={name || email || "User avatar"}
        onError={() => setImageError(true)}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-border/50",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground ring-1 ring-border/50 select-none",
        sizeClasses[size],
        className
      )}
      aria-label={name || email || "User"}
    >
      {initials}
    </span>
  );
}

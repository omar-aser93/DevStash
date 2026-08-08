import { icons, type LucideProps } from "lucide-react";
import type { CSSProperties } from "react";

const DEFAULT_COLOR = "#6b7280";

export interface ItemTypeIconProps extends Omit<LucideProps, "ref" | "name"> {
  /** Lucide icon component name as stored on ItemType.icon, e.g. "Code" */
  name?: string | null; 
}

/**
 * Renders the Lucide icon named by `name`. Falls back to Code if the name
 * doesn't match a known icon (e.g. bad data).
 */
export function ItemTypeIcon({ name, ...props }: ItemTypeIconProps) {
  const Icon = (name && icons[name as keyof typeof icons]) || icons.Code;
  return <Icon {...props} />;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface ColorStyles {
  bg: CSSProperties;
  text: CSSProperties;
  borderLeft: CSSProperties;
  badge: CSSProperties;
}

/**
 * Derives the tinted background / text / border styles used throughout the
 * dashboard from a raw hex color (ItemType.color). Uses inline styles rather
 * than Tailwind classes since these colors come from the database and can't
 * be known at build time.
 */
export function getColorStyles(color?: string | null): ColorStyles {
  const c = color || DEFAULT_COLOR;
  return {
    bg: { backgroundColor: hexToRgba(c, 0.1) },
    text: { color: c },
    borderLeft: { borderLeftColor: c },
    badge: {
      backgroundColor: hexToRgba(c, 0.1),
      color: c,
      borderColor: hexToRgba(c, 0.2),
    },
  };
}


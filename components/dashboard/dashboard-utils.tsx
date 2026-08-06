import { 
  Code, 
  Sparkles, 
  Terminal, 
  StickyNote, 
  File, 
  Image as ImageIcon, 
  Link as LinkIcon,
  LucideIcon
} from "lucide-react";
import { MockItem, MockItemType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Map item type slug to Lucide icon component
export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  snippets: Code,
  prompts: Sparkles,
  commands: Terminal,
  notes: StickyNote,
  files: File,
  images: ImageIcon,
  links: LinkIcon,
};

export interface ItemTypeStyle {
  text: string;
  border: string;
  bg: string;
  badge: string;
  color: string;
  borderLeft: string;
}

// Map item type slug to styles
export const ITEM_TYPE_STYLES: Record<string, ItemTypeStyle> = {
  snippets: {
    text: "text-blue-500",
    border: "border-blue-500/30 hover:border-blue-500/50",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    color: "#3b82f6",
    borderLeft: "border-l-blue-500",
  },
  prompts: {
    text: "text-violet-500",
    border: "border-violet-500/30 hover:border-violet-500/50",
    bg: "bg-violet-500/10",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    color: "#8b5cf6",
    borderLeft: "border-l-violet-500",
  },
  commands: {
    text: "text-orange-500",
    border: "border-orange-500/30 hover:border-orange-500/50",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    color: "#f97316",
    borderLeft: "border-l-orange-500",
  },
  notes: {
    text: "text-yellow-400",
    border: "border-yellow-400/30 hover:border-yellow-400/50",
    bg: "bg-yellow-400/10",
    badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    color: "#fde047",
    borderLeft: "border-l-yellow-400",
  },
  files: {
    text: "text-slate-400",
    border: "border-slate-400/30 hover:border-slate-400/50",
    bg: "bg-slate-400/10",
    badge: "bg-slate-400/10 text-slate-400 border-slate-400/20",
    color: "#6b7280",
    borderLeft: "border-l-slate-400",
  },
  images: {
    text: "text-pink-500",
    border: "border-pink-500/30 hover:border-pink-500/50",
    bg: "bg-pink-500/10",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    color: "#ec4899",
    borderLeft: "border-l-pink-500",
  },
  links: {
    text: "text-emerald-500",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    color: "#10b981",
    borderLeft: "border-l-emerald-500",
  },
};

export const DEFAULT_ITEM_TYPE_STYLE: ItemTypeStyle = {
  text: "text-muted-foreground",
  border: "border-muted/30 hover:border-muted/50",
  bg: "bg-muted/10",
  badge: "bg-muted text-muted-foreground border-transparent",
  color: "#6b7280",
  borderLeft: "border-l-muted",
};

export interface ItemTypeIconProps {
  slug?: string;
  className?: string;
}

/**
 * Component to safely render item type icon dynamically.
 */
export function ItemTypeIcon({ slug, className }: ItemTypeIconProps) {
  const Icon = slug && ITEM_TYPE_ICONS[slug] ? ITEM_TYPE_ICONS[slug] : Code;
  return <Icon className={className} />;
}

/**
 * Gets styling rules associated with an item type slug.
 */
export function getItemTypeStyle(slug?: string): ItemTypeStyle {
  if (!slug) return DEFAULT_ITEM_TYPE_STYLE;
  return ITEM_TYPE_STYLES[slug] || DEFAULT_ITEM_TYPE_STYLE;
}

/**
 * Helper to determine the dominant item type style in a collection
 */
export function getDominantTypeStyles(
  collectionId: string,
  items: MockItem[],
  itemTypes: MockItemType[]
): ItemTypeStyle {
  const collectionItems = items.filter((item) => item.collectionIds.includes(collectionId));
  if (collectionItems.length === 0) {
    return {
      bg: "bg-card hover:bg-card/80 border-muted",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground border-transparent",
      border: "border-muted",
      color: "#6b7280",
      borderLeft: "border-l-muted",
    };
  }

  // Count occurrences
  const counts: Record<string, number> = {};
  collectionItems.forEach((item) => {
    counts[item.itemTypeId] = (counts[item.itemTypeId] || 0) + 1;
  });

  // Find max type id
  let dominantTypeId = "";
  let maxCount = 0;
  Object.entries(counts).forEach(([typeId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantTypeId = typeId;
    }
  });

  // Match to itemType slug
  const type = itemTypes.find((t) => t.id === dominantTypeId);
  if (type && ITEM_TYPE_STYLES[type.slug]) {
    const style = ITEM_TYPE_STYLES[type.slug];
    return {
      // Subtle background tint for the dominant item type
      bg: cn("border-muted/50 transition-all hover:shadow-md", {
        "bg-blue-950/20 hover:bg-blue-950/30 border-blue-500/20": type.slug === "snippets",
        "bg-violet-950/20 hover:bg-violet-950/30 border-violet-500/20": type.slug === "prompts",
        "bg-orange-950/20 hover:bg-orange-950/30 border-orange-500/20": type.slug === "commands",
        "bg-amber-950/10 hover:bg-amber-950/20 border-yellow-500/20": type.slug === "notes",
        "bg-slate-900/30 hover:bg-slate-900/40 border-slate-500/20": type.slug === "files",
        "bg-pink-950/10 hover:bg-pink-950/20 border-pink-500/20": type.slug === "images",
        "bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-500/20": type.slug === "links",
      }),
      text: style.text,
      badge: style.badge,
      border: style.border,
      color: type.color || style.color,
      borderLeft: style.borderLeft,
    };
  }

  return {
    bg: "bg-card hover:bg-card/80 border-muted",
    text: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-transparent",
    border: "border-muted",
    color: "#6b7280",
    borderLeft: "border-l-muted",
  };
}

/**
 * Helper to get all distinct item types contained in a collection
 */
export function getCollectionItemTypes(
  collectionId: string,
  items: MockItem[],
  itemTypes: MockItemType[]
): MockItemType[] {
  const collectionItems = items.filter((item) => item.collectionIds.includes(collectionId));
  const uniqueTypeIds = Array.from(new Set(collectionItems.map((item) => item.itemTypeId)));
  return itemTypes.filter((type) => uniqueTypeIds.includes(type.id));
}

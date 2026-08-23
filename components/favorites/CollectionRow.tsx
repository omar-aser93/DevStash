"use client";

import { Folder } from "lucide-react";
import Link from "next/link";

export function CollectionRow({ collection }: { collection: { id: string; name: string } }) {
  return (
    <Link
      href={`/dashboard/collections/${collection.id}`}
      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors"
    >
      <Folder className="size-4 text-muted-foreground" />
      <span className="font-mono text-sm">{collection.name}</span>
      <span className="ml-auto text-xs text-muted-foreground font-mono">collection</span>
    </Link>
  );
}
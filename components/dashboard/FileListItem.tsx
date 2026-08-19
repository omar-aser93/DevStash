"use client";

import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItemDrawer } from "@/components/item-drawer/useItemDrawer";
import type { ItemWithType } from "@/lib/queries/items";
import { formatFileSize } from "@/lib/utils";

interface FileListItemProps {
  item: ItemWithType;
}

export function FileListItem({ item }: FileListItemProps) {
  const { openDrawer } = useItemDrawer();

  const handleRowClick = () => openDrawer(item.id);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.fileKey) {
      window.open(`/api/download/${item.fileKey}`, "_blank");
    }
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Determine file extension for icon
  const ext = item.fileName?.split(".").pop()?.toLowerCase() || "file";

  return (
    <div
      onClick={handleRowClick}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-muted/50 hover:bg-muted/10 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-md bg-muted/30 text-muted-foreground">
          <File className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.fileName || item.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{ext.toUpperCase()}</span>
            {item.fileSize && <span>• {formatFileSize(item.fileSize)}</span>}
            <span>• {formattedDate}</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 gap-1.5 text-xs"
        onClick={handleDownload}
        disabled={!item.fileKey}
      >
        <Download className="size-4" />
        Download
      </Button>
    </div>
  );
}
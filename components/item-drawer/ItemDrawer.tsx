"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import { Star, Pin, Copy, Pencil, Trash2, Calendar, Tag, Folder, X, Check, Download, File,} from "lucide-react";
import { ItemTypeIcon, getColorStyles } from "@/components/dashboard/dashboard-utils";
import { useItemDrawer } from "./useItemDrawer";
import { updateItem, deleteItem } from "@/lib/actions/itemsActions";
import type { FullItem } from "@/lib/queries/items";
import { CodeEditor } from "@/components/CodeEditor";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { FileUpload } from "@/components/FileUpload";
import Image from "next/image";
import { formatFileSize } from "@/lib/utils";


export function ItemDrawer() {
  const router = useRouter();        // Navigation hook
  // Item drawer states
  const { isOpen, itemId, closeDrawer } = useItemDrawer();
  const [item, setItem] = useState<FullItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<FullItem>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch item when opened
  useEffect(() => {
    let isMounted = true;
    if (isOpen && itemId) {
      startTransition(() => setLoading(true));
      fetch(`/api/items/${itemId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            startTransition(() => {
              setItem(data);
              setIsEditing(false);
            });
          }
        })
        .catch(() => {
          if (isMounted) startTransition(() => setItem(null));
        })
        .finally(() => {
          if (isMounted) startTransition(() => setLoading(false));
        });
    } else {
      startTransition(() => {
        setItem(null);
        setIsEditing(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, itemId, startTransition]);

  // When entering edit mode, copy current item values
  useEffect(() => {
    if (isEditing && item) {
      startTransition(() => {
        setFormData({
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          language: item.language,
          tags: item.tags,
        });
      });
    }
  }, [isEditing, item, startTransition]);

  const styles = item?.itemType ? getColorStyles(item.itemType.color) : null;

  // Helper to update form field
  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save handler
  const handleSave = async () => {
    if (!itemId) return;
    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const result = await updateItem(itemId, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        url: formData.url,
        language: formData.language,
        tags: formData.tags,
        fileUrl: formData.fileUrl,
        fileKey: formData.fileKey,
        fileName: formData.fileName,
        fileSize: formData.fileSize,
      });
      if (result.success) {
        toast.success("Item updated");
        // Refresh the page data
        router.refresh();
        // Re‑fetch item to reflect changes in drawer
        const res = await fetch(`/api/items/${itemId}`);
        if (res.ok) {
          const updated = await res.json();
          setItem(updated);
        }
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update item");
      }
    });
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!itemId) return;
    startTransition(async () => {
      const result = await updateItem(itemId, { isFavorite: !item?.isFavorite });
      if (result.success) {
        toast.success("Favorite toggled");
        router.refresh();
        // Update local state optimistically
        setItem((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  // Toggle pin
  const handleTogglePin = async () => {
    if (!itemId) return;
    startTransition(async () => {
      const result = await updateItem(itemId, { isPinned: !item?.isPinned });
      if (result.success) {
        toast.success("Pin toggled");
        router.refresh();
        setItem((prev) => prev ? { ...prev, isPinned: !prev.isPinned } : null);
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  // Copy content
  const handleCopy = () => {
    const text = item?.content || item?.url || "";
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } else {
      toast.info("Nothing to copy");
    }
  };

  // Download file handler
  const handleDownload = async () => {
    if (!item?.fileUrl) return;
    if (!item.fileKey) return;
    // Open the download proxy
    window.open(`/api/download/${item.fileKey}`, '_blank');    
  };

  // Delete handler: opens the confirmation dialog
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  // Actual deletion after confirmation
  const confirmDelete = async () => {
    if (!itemId) return;
    setDeleting(true);
    const result = await deleteItem(itemId);
    setDeleting(false);
    if (result.success) {
      toast.success("Item deleted");
      router.refresh();
      closeDrawer();
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleteDialogOpen(false);
  };


  // Cancel edit
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  // Render content based on mode
  const renderContent = () => {
    if (loading) {
      return (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (!item) {
      return <div className="mt-6 text-center text-sm text-muted-foreground">Item not found</div>;
    }

    if (isEditing) {
      // Edit mode form
      return (
        <div className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input
              value={formData.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Enter title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e: { target: { value: unknown; }; }) => updateField("description", e.target.value)}
              placeholder="Add a description"
              rows={2}
            />
          </div>

          {/* Type-specific fields */}
          {(item.contentType === "TEXT" && (item.itemType.name.toLowerCase() === "snippet" || item.itemType.name.toLowerCase() === "command")) ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <CodeEditor
                value={formData.content || ""}
                onChange={(val) => updateField("content", val)}
                language={formData.language || "plaintext"}
                height={300}
              />
            </div>
          ) : (item.contentType === "TEXT" && (item.itemType.name.toLowerCase() === "prompt" || item.itemType.name.toLowerCase() === "note")) ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <MarkdownEditor
                value={formData.content || ""}
                onChange={(val) => updateField("content", val)}
                height={300}
              />
            </div>
          ) : null}
          {/* Language input – only for snippet/command */}
          {(item.contentType === "TEXT" && (item.itemType.name.toLowerCase() === "snippet" || item.itemType.name.toLowerCase() === "command")) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Language</label>
              <Input
                value={formData.language || ""}
                onChange={(e) => updateField("language", e.target.value)}
                placeholder="e.g. javascript, bash"
              />
            </div>
          )}
          {/* URL input – only for link type */}
          {item.contentType === "URL" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL</label>
              <Input
                value={formData.url || ""}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          {/* File upload – only for file/image types */}
          {item.contentType === "FILE" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">File</label>
              <FileUpload
                type={item.itemType.name.toLowerCase() === "image" ? "image" : "file"}
                onUpload={(data) => {
                  // Update formData with new file info
                  updateField("fileUrl", data.url);
                  updateField("fileKey", data.key);
                  updateField("fileName", data.fileName);
                  updateField("fileSize", data.fileSize);
                }}
                onRemove={() => {
                  // Remove file from formData
                  updateField("fileUrl", null);
                  updateField("fileKey", null);
                  updateField("fileName", null);
                  updateField("fileSize", null);
                }}
                value={formData.fileUrl || undefined}
                existingFileName={formData.fileName || undefined}
                existingFileSize={formData.fileSize || undefined}
                existingMimeType={undefined} // not needed
              />
            </div>
          )}
                    
          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
            <Input
              value={formData.tags ? formData.tags.join(", ") : ""}
              onChange={(e) => {
                const raw = e.target.value;
                const tags = raw.split(",").map(s => s.trim()).filter(Boolean);
                updateField("tags", tags);
              }}
              placeholder="react, hooks, frontend"
            />
          </div>

          {/* Non-editable info */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>Type: {item.itemType.name}</p>
            <p>Created: {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-2 size-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!formData.title?.trim()}>
              <Check className="mr-2 size-4" />  Save
            </Button>
          </div>
        </div>
      );
    }

    // View mode
    return (
      <div className="mt-6 space-y-6">
        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Tag className="size-4 text-muted-foreground mr-1" />
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Collections */}
        {item.collections.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Folder className="size-4 text-muted-foreground mr-1" />
            {item.collections.map((coll) => (
              <Badge key={coll.id} variant="outline">
                {coll.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Content preview */}
        {item.contentType === "TEXT" && (
          (item.itemType.name.toLowerCase() === "snippet" || item.itemType.name.toLowerCase() === "command") ? (
            <div className="rounded-md overflow-hidden border">
              <CodeEditor
                value={item.content || ""}
                readOnly
                language={item.language || "plaintext"}
                height={300}
              />
            </div>
          ) : (item.itemType.name.toLowerCase() === "prompt" || item.itemType.name.toLowerCase() === "note") ? (
            <div className="rounded-md overflow-hidden border">
              <MarkdownEditor
                value={item.content || ""}
                readOnly
                height={300}
              />
            </div>
          ) : (
            // Fallback for other text types (shouldn't happen)
            <div className="rounded-md bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto border">
              {item.content}
            </div>
          )
        )}
        {item.contentType === "URL" && item.url && (
          <div className="rounded-md bg-muted/30 p-3 text-sm overflow-y-auto border">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {item.url}
            </a>
          </div>
        )}
        {/* File/Image preview */}
        {item.contentType === "FILE" && (
          <div className="space-y-2">
            {item.fileUrl && item.fileName && (
              <div className="rounded-md border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <File className="size-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.fileSize ? formatFileSize(item.fileSize) : "Unknown size"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <Download className="size-4" />
                  </Button>
                </div>
                {item.fileUrl && (item.fileName?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) && (
                  <div className="mt-2 rounded-md overflow-hidden border max-h-80">
                    <Image
                      src={item.fileUrl}
                      alt={item.fileName}
                      width={400}
                      height={300}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{item.itemType.name}</span>
          </div>
        </div>

        {/* Action Bar (view mode) */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleToggleFavorite}>
              <Star className={`size-4 ${item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              Favorite
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleTogglePin}>
              <Pin className={`size-4 ${item.isPinned ? "text-blue-400" : ""}`} />
              Pin
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="size-4" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
          <div className="py-4 border-t flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={handleDelete} className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-500/10 py-2" >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent side="right" className="px-4 w-full sm:w-135 overflow-y-auto bg-black">
        <SheetHeader className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </>
          ) : item ? (
            <div className="flex items-start gap-3 flex-col md:flex-row">
              <span className="p-2 rounded-md shrink-0" style={{ ...styles?.bg, ...styles?.text }}>
                <ItemTypeIcon name={item.itemType.icon} className="size-5" />
              </span>
              <div>
                <SheetTitle className="text-xl">{item.title}</SheetTitle>
                <SheetDescription className="text-sm mt-1">
                  {item.description || "No description"}
                </SheetDescription>
              </div>
            </div>
          ) : null}
        </SheetHeader>

        {renderContent()}
      </SheetContent>
    </Sheet>
    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
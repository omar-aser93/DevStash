"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCollection, updateCollection } from "@/lib/actions/collectionsActions";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: {
    id: string;
    name: string;
    description: string | null;
    isFavorite?: boolean;
  } | null;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
}: CollectionFormDialogProps) {
  const router = useRouter();
  const isEditing = !!collection?.id;

  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [isPending, startTransition] = useTransition();

  // Reset form when dialog opens with a new collection (or null for create)
  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      setName(collection?.name || "");
      setDescription(collection?.description || "");
    }, 0);
    return () => clearTimeout(timeoutId);    
  }, [open, collection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
      };

      let result;
      if (isEditing) {
        result = await updateCollection(collection.id, data);
      } else {
        result = await createCollection(data);
      }

      if (result.success) {
        toast.success(isEditing ? "Collection updated" : "Collection created");
        router.refresh();
        onOpenChange(false);
        if (!isEditing) {
          setName("");
          setDescription("");
        }
      } else {
        toast.error(result.error || (isEditing ? "Failed to update" : "Failed to create"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit collection" : "New collection"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the collection details."
              : "Create a collection to organize your items."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Patterns"
              disabled={isPending}
              required
              autoFocus={!isEditing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
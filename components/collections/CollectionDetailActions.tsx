"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateCollection, deleteCollection } from "@/lib/actions/collectionsActions";
import { CollectionFormDialog } from "@/components/collections/CollectionFormDialog";

interface CollectionDetailActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleFavorite = () => {
    startTransition(async () => {
      const result = await updateCollection(collection.id, { isFavorite: !isFavorite });
      if (result.success) {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      if (result.success) {
        toast.success("Collection deleted");
        router.refresh();
        router.push("/dashboard/collections");
      } else {
        toast.error(result.error || "Failed to delete");
      }
      setDeleteOpen(false);
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleFavorite}
          disabled={isPending}
          className="gap-1.5"
        >
          <Star className={`size-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {isFavorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
          disabled={isPending}
        >
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <CollectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? The items themselves will not be deleted, only the collection grouping.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
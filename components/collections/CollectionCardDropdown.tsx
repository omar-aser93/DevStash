"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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


interface CollectionCardDropdownProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export function CollectionCardDropdown({ collection }: CollectionCardDropdownProps) {
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
      } else {
        toast.error(result.error || "Failed to delete");
      }
      setDeleteOpen(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
        render={
            <Button variant="ghost" size="icon" className="h-8 w-8 border-0">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
            </Button>
        }
        />
        <DropdownMenuContent align="end" className="w-48 bg-black">
          <DropdownMenuItem onClick={handleToggleFavorite} disabled={isPending}>
            <Star className={`mr-2 size-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)} disabled={isPending}>
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            disabled={isPending}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
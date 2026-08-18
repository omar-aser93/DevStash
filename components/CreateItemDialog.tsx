"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createItem } from "@/lib/actions/itemsActions";

type ItemTypeName = "snippet" | "prompt" | "command" | "note" | "link";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateItemDialog({ open, onOpenChange }: CreateItemDialogProps) {
  const router = useRouter();
  const [type, setType] = useState<ItemTypeName>("snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setType("snippet");
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTags("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const tagArray = tags.split(",").map(s => s.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await createItem({
        typeName: type,
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        url: url.trim() || null,
        language: language.trim() || null,
        tags: tagArray,
      });

      if (result.success) {
        toast.success("Item created");
        router.refresh();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to create item");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 bg-black">
        <DialogHeader>
          <DialogTitle>Create new item</DialogTitle>
          <DialogDescription>Add a new item to your stash.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(val) => setType(val as ItemTypeName)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#131313]">
                <SelectItem value="snippet">Snippet</SelectItem>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="command">Command</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={2}
            />
          </div>

          {/* Conditional fields based on type */}
          {type !== "link" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content"
                rows={4}
              />
            </div>
          )}
          {type === "link" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL *</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
          )}
          {(type === "snippet" || type === "command") && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Language</label>
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. javascript, bash"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, hooks, frontend"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
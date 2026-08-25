"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createBlogPost, updateBlogPost } from "@/lib/actions/adminActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string | null;
  published: boolean;
}

interface BlogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BlogPost | null;
}

export function BlogFormDialog({ open, onOpenChange, initialData }: BlogFormDialogProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [, startTransition] = useTransition();

  const [slug, setSlug] = useState(initialData?.slug || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [isPending, startTransitionSave] = useTransition();

  // Populate form when dialog opens with new data
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setSlug(initialData?.slug || "");
        setTitle(initialData?.title || "");
        setContent(initialData?.content || "");
        setExcerpt(initialData?.excerpt || "");
        setPublished(initialData?.published ?? true);
      });
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!slug.trim() || !title.trim() || !content.trim()) {
      toast.error("Slug, title, and content are required");
      return;
    }
    startTransitionSave(async () => {
      try {
        if (isEdit) {
          await updateBlogPost(initialData.id!, {
            slug: slug.trim(),
            title: title.trim(),
            content,
            excerpt: excerpt.trim() || null,
            published,
          });
          toast.success("Post updated");
        } else {
          await createBlogPost({
            slug: slug.trim(),
            title: title.trim(),
            content,
            excerpt: excerpt.trim() || null,
            published,
          });
          toast.success("Post created");
        }
        router.refresh();
        onOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast.error(message || "Failed to save");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Post" : "Create Post"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-awesome-post" />
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Post" />
          </div>
          <div>
            <label className="text-sm font-medium">Content (Markdown)</label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Write your post in Markdown..." />
          </div>
          <div>
            <label className="text-sm font-medium">Excerpt</label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Short summary..." />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="published" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
            <label htmlFor="published" className="text-sm font-medium">Published</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
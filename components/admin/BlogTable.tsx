"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { BlogFormDialog } from "./BlogFormDialog";
import { deleteBlogPost } from "@/lib/actions/adminActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string | null;
  published: boolean;
  createdAt: Date;
}

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteBlogPost(deleteId);
        toast.success("Post deleted");
        router.refresh();
        setDeleteId(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast.error(message || "Failed to delete");
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Manage blog posts.</p>
        <Button onClick={() => { setEditingPost(null); setFormOpen(true); }}>
          <Plus className="size-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="rounded-md border border-[#1e1e2e] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#1e1e2e]">
              <TableHead>#</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post, idx) => (
              <TableRow key={post.id} className="border-b border-[#1e1e2e]">
                <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                <TableCell>{post.slug}</TableCell>
                <TableCell className="max-w-50 truncate">{post.title}</TableCell>
                <TableCell>{post.published ? "Published" : "Draft"}</TableCell>
                <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(post.id)} className="text-red-500">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BlogFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editingPost} />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action is permanent. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
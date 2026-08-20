"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { createItem } from "@/lib/actions/itemsActions";
import { CodeEditor } from "@/components/CodeEditor";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { FileUpload } from "@/components/FileUpload";
import { CollectionSelect } from "@/components/CollectionSelect";

type ItemTypeName = "snippet" | "prompt" | "command" | "note" | "link" | "file" | "image";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: { id: string; name: string }[];
}

export function CreateItemDialog({ open, onOpenChange, collections }: CreateItemDialogProps) {
  const router = useRouter();           // navigation hook
  // form states
  const [type, setType] = useState<ItemTypeName>("snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [fileData, setFileData] = useState<{ url: string; key: string; fileName: string; fileSize: number; mimeType: string;} | null>(null);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // reset form handler
  const resetForm = () => {
    setType("snippet");
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTags("");
    setFileData(null);
    setCollectionIds([]);
  };

  // form submit handler
  const handleSubmit = async (e: React.SubmitEvent) => {
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
        fileUrl: fileData?.url || null,
        fileName: fileData?.fileName || null,
        fileSize: fileData?.fileSize || null,
        fileKey: fileData?.key || null,
        collectionIds,
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
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-scroll bg-black flex flex-col">
        <DialogHeader>
          <DialogTitle>Create new item</DialogTitle>
          <DialogDescription>Add a new item to your stash.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 ">
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
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" autoFocus/>
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
          {(type === "snippet" || type === "command") ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <CodeEditor
                value={content}
                onChange={(val) => setContent(val)}
                language={language || "plaintext"}
                height={250}
              />
            </div>
          ) : (type === "prompt" || type === "note") ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <MarkdownEditor
                value={content}
                onChange={(val) => setContent(val)}
                height={250}
              />
            </div>
          ) : type === "link" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL *</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
          ) : (type === "file" || type === "image") ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Upload {type}</label>
              <FileUpload
                type={type === "image" ? "image" : "file"}
                onUpload={(data) => {
                  // Store the file info in state
                  setFileData(data);
                }}
                onRemove={() => setFileData(null)}
              />
            </div>
          ) : null}

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

          {/* Collections */}
          {collections.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Collections
              </label>
              <CollectionSelect
                value={collectionIds}
                onChange={setCollectionIds}
                options={collections}
                placeholder="Select collections..."
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
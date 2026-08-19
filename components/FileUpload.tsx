"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, File, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

interface FileUploadProps {
  type: "image" | "file";
  onUpload: (data: { url: string; key: string; fileName: string; fileSize: number; mimeType: string }) => void;
  onRemove?: () => void;
  className?: string;
  value?: string; // URL of uploaded file
  existingFileName?: string; // for display
  existingFileSize?: number;
  existingMimeType?: string;
}

export function FileUpload({
  type,
  onUpload,
  onRemove,
  className,
  value,
  existingFileName,
  existingFileSize,
  existingMimeType,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileData, setFileData] = useState<{
    url: string;
    key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

 
  const displayName = fileData?.fileName || existingFileName || "";
  const displaySize = fileData?.fileSize || existingFileSize || 0;
  const displayMime = fileData?.mimeType || existingMimeType || "";

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length === 1) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    // Simulate progress (actual upload uses fetch with stream, but we can't track progress with fetch easily)
    // We'll just use an interval to simulate.
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await res.json();
      setFileData(data);
      onUpload(data);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message)
    } finally {
      setUploading(false);
      clearInterval(interval);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length === 1) { handleFile(files[0]); }
  };
  
  const handleRemove = () => {
    setFileData(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImage = displayMime?.startsWith("image/") || type === "image";

  // If file is uploaded, show preview/display
  if (fileData || (value && displayName)) {
    const fileUrl = fileData?.url || value;
    return (
      <div className={cn("rounded-md border bg-muted/20 p-4", className)}>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="size-5 text-muted-foreground" />
              ) : (
                <File className="size-5 text-muted-foreground" />
              )}
              <span className="truncate text-sm font-medium">{displayName}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {(displaySize / 1024).toFixed(1)} KB
              </span>
              {!isImage && fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline" >
                  Preview 
                </a>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="size-4" />
          </Button>
        </div>
        {fileUrl && (
          <div className="mt-2 max-h-60 overflow-hidden rounded-md border">
            {isImage ? (
              <Image src={fileUrl} alt={displayName} width={200} height={200} className="h-auto w-full object-contain" />
            ) : displayMime === "application/pdf" ? (
              <iframe src={fileUrl} className="h-60 w-full" title={displayName} />
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // Upload area
  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading {Math.round(progress)}%</p>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">
              Drop your {type} here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {type === "image" ? "Max 5MB (PNG, JPG, GIF, WebP, SVG)" : "Max 10MB (PDF, TXT, MD, JSON, etc.)"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={type === "image" ? "image/*" : "*/*"}
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </>
        )}
      </div>
    </div>
  );
}
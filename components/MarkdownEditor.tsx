"use client";

import { useState, useRef } from "react";
import { Copy, Check, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string | number;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
  height = 400,
}: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false);
  // State for user‑selected tab (only used when readOnly is false)
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compute the effective tab based on readOnly
  const currentTab = readOnly ? "preview" : activeTab;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn("rounded-md border bg-[#1e1e1e] overflow-hidden", className )} >
      {/* Header with macOS dots */}
      <div className="flex items-center justify-between bg-[#2d2d2d] px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            {readOnly ? "Preview" : "Markdown"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <div className="flex rounded-md overflow-hidden border border-border/50">
              <button
                onClick={() => setActiveTab("write")}
                className={cn(
                  "px-2 py-1 text-xs transition-colors flex items-center gap-1",
                  activeTab === "write"
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Edit3 className="size-3" />
                Write
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-2 py-1 text-xs transition-colors flex items-center gap-1",
                  activeTab === "preview"
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Eye className="size-3" />
                Preview
              </button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ height: typeof height === "number" ? height : height }}>
        {readOnly ? (
          // Preview only
          <div className="h-full overflow-y-auto p-4 markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || "*Empty*"}
            </ReactMarkdown>
          </div>
        ) : (
          // Write/Preview tabs – use currentTab
          <>
            {currentTab === "write" && (
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder="Write your markdown content..."
                className="h-full w-full resize-none border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-4"
              />
            )}
            {currentTab === "preview" && (
              <div className="h-full overflow-y-auto p-4 markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value || "*Empty*"}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
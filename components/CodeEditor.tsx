"use client";

import { useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  height?: string | number;
}

export function CodeEditor({ value, onChange, language = "plaintext", readOnly = false, className, height = 400,}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
   

  const handleCopy = async () => {
    if (!editorRef.current) return;
    const text = editorRef.current.getValue();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Map common language names to Monaco's supported identifiers
  const monacoLanguage = (() => {
    const map: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      sh: "shell",
      bash: "shell",
      zsh: "shell",
      html: "html",
      css: "css",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      xml: "xml",
      sql: "sql",
      dockerfile: "dockerfile",
      md: "markdown",
    };
    return map[language?.toLowerCase()] || language || "plaintext";
  })();

  
  return (
    <div className={cn("rounded-md border bg-muted/20 overflow-hidden", className)}>
      {/* macOS‑style header */}
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          {/* Window dots */}
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            {language || "plaintext"}
          </span>
        </div>
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

      {/* Monaco Editor */}
      <div style={{ height: typeof height === "number" ? height : height }}>
        <Editor
          height="100%"
          defaultLanguage={monacoLanguage}
          language={monacoLanguage}
          value={value}
          onChange={(val) => onChange?.(val || "")}
          options={{
            readOnly,
            minimap: { enabled: preferences.minimap },
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            fontSize: preferences.fontSize,
            fontFamily: "var(--font-mono), monospace",
            lineNumbers: "on",
            renderWhitespace: "selection",
            tabSize: preferences.tabSize,
            wordWrap: preferences.wordWrap ? "on" : "off",
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
          onMount={handleEditorMount}
          theme={preferences.theme}
        />
      </div>
  
    </div>
  );
}
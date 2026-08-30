// "use client";

// import { useRef, useState } from "react";
// import Editor, { OnMount } from "@monaco-editor/react";
// import { Copy, Check } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
// import type { editor } from "monaco-editor";

// interface CodeEditorProps {
//   value: string;
//   onChange?: (value: string) => void;
//   language?: string;
//   readOnly?: boolean;
//   className?: string;
//   height?: string | number;
// }

// export function CodeEditor({ value, onChange, language = "plaintext", readOnly = false, className, height = 400,}: CodeEditorProps) {
//   const { preferences } = useEditorPreferences();
//   const [copied, setCopied] = useState(false);
//   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
   

//   const handleCopy = async () => {
//     if (!editorRef.current) return;
//     const text = editorRef.current.getValue();
//     await navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleEditorMount: OnMount = (editor) => {
//     editorRef.current = editor;
//   };

//   // Map common language names to Monaco's supported identifiers
//   const monacoLanguage = (() => {
//     const map: Record<string, string> = {
//       js: "javascript",
//       jsx: "javascript",
//       ts: "typescript",
//       tsx: "typescript",
//       py: "python",
//       rb: "ruby",
//       go: "go",
//       rs: "rust",
//       sh: "shell",
//       bash: "shell",
//       zsh: "shell",
//       html: "html",
//       css: "css",
//       json: "json",
//       yaml: "yaml",
//       yml: "yaml",
//       xml: "xml",
//       sql: "sql",
//       dockerfile: "dockerfile",
//       md: "markdown",
//     };
//     return map[language?.toLowerCase()] || language || "plaintext";
//   })();

  
//   return (
//     <div className={cn("rounded-md border bg-muted/20 overflow-hidden", className)}>
//       {/* macOS‑style header */}
//       <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b">
//         <div className="flex items-center gap-2">
//           {/* Window dots */}
//           <div className="flex gap-1.5">
//             <div className="size-3 rounded-full bg-red-500/80" />
//             <div className="size-3 rounded-full bg-yellow-500/80" />
//             <div className="size-3 rounded-full bg-green-500/80" />
//           </div>
//           <span className="ml-2 text-xs font-medium text-muted-foreground">
//             {language || "plaintext"}
//           </span>
//         </div>
//         <Button
//           variant="ghost"
//           size="sm"
//           className="h-7 gap-1 text-xs"
//           onClick={handleCopy}
//         >
//           {copied ? (
//             <>
//               <Check className="size-3.5" />
//               Copied
//             </>
//           ) : (
//             <>
//               <Copy className="size-3.5" />
//               Copy
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Monaco Editor */}
//       <div style={{ height: typeof height === "number" ? height : height }}>
//         <Editor
//           height="100%"
//           defaultLanguage={monacoLanguage}
//           language={monacoLanguage}
//           value={value}
//           onChange={(val) => onChange?.(val || "")}
//           options={{
//             readOnly,
//             minimap: { enabled: preferences.minimap },
//             scrollbar: {
//               vertical: "visible",
//               horizontal: "visible",
//               verticalScrollbarSize: 8,
//               horizontalScrollbarSize: 8,
//             },
//             fontSize: preferences.fontSize,
//             fontFamily: "var(--font-mono), monospace",
//             lineNumbers: "on",
//             renderWhitespace: "selection",
//             tabSize: preferences.tabSize,
//             wordWrap: preferences.wordWrap ? "on" : "off",
//             automaticLayout: true,
//             scrollBeyondLastLine: false,
//           }}
//           onMount={handleEditorMount}
//           theme={preferences.theme}
//         />
//       </div>
  
//     </div>
//   );
// }

"use client";

import { useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Copy, Check, Sparkles, Loader2, Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { explainCode } from "@/lib/actions/aiActions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  height?: string | number;
  isPro?: boolean;
  itemType?: string; // 'snippet' or 'command'
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  className,
  height = 400,
  isPro = false,
  itemType = "",
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
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

  const handleExplain = async () => {
    if (!value.trim()) {
      toast.info("Nothing to explain.");
      return;
    }
    setIsExplaining(true);
    const result = await explainCode({ content: value, language: language || "plaintext" });
    setIsExplaining(false);
    if (result.success && result.data) {
      setExplanation(result.data);
      setShowExplanation(true);
    } else {
      toast.error(result.error || "Failed to explain code");
    }
  };

  // Show Explain button only in read‑only view for snippet/command
  const showExplain = readOnly && (itemType === "snippet" || itemType === "command");

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
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            {language || "plaintext"}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Explain Button */}
          {showExplain && (
            isPro ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleExplain}
                disabled={isExplaining}
              >
                {isExplaining ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {isExplaining ? "Explaining..." : "Explain"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs opacity-50"
                disabled
                title="AI features require Pro"
              >
                <Sparkles className="size-3.5" />
                Explain (Pro)
              </Button>
            )
          )}

          {/* Code/Explain Tabs */}
          {explanation && showExplanation && (
            <div className="flex rounded-md overflow-hidden border border-border/50 ml-1">
              <button
                onClick={() => setShowExplanation(false)}
                className={cn(
                  "px-2 py-1 text-xs transition-colors flex items-center gap-1",
                  !showExplanation
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Code className="size-3" /> Code
              </button>
              <button
                onClick={() => setShowExplanation(true)}
                className={cn(
                  "px-2 py-1 text-xs transition-colors flex items-center gap-1",
                  showExplanation
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="size-3" /> Explain
              </button>
            </div>
          )}

          {/* Copy Button */}
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
        {showExplanation && explanation ? (
          <div className="h-full overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
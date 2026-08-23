"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function EditorPreferences() {
  const { preferences, updatePreferences, isLoading } = useEditorPreferences();

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(val) => updatePreferences({ fontSize: parseInt(val!, 10) })}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Font Size" />
          </SelectTrigger>
          <SelectContent className="bg-black">
            {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="tabSize">Tab Size</Label>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(val) => updatePreferences({ tabSize: parseInt(val!, 10) })}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Tab Size" />
          </SelectTrigger>
          <SelectContent className="bg-black">
            {[1, 2, 3, 4, 6, 8].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="wordWrap">Word Wrap</Label>
        <Switch
          id="wordWrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => updatePreferences({ wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="minimap">Minimap</Label>
        <Switch
          id="minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => updatePreferences({ minimap: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={preferences.theme}
          onValueChange={(val) => updatePreferences({ theme: val! })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent className="bg-black">
            <SelectItem value="vs-dark">vs-dark</SelectItem>
            <SelectItem value="monokai">Monokai</SelectItem>
            <SelectItem value="github-dark">GitHub Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
"use client";

import { createContext, useContext, useState, ReactNode} from "react";
import { updateEditorPreferences } from "@/lib/actions/userActions";
import { toast } from "sonner";

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: string;
}

interface EditorPreferencesContextType {
  preferences: EditorPreferences;
  updatePreferences: (newPrefs: Partial<EditorPreferences>) => void;
  isLoading: boolean;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextType | undefined>(undefined);

const DEFAULT_PREFS: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export function EditorPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: ReactNode;
  initialPreferences: Partial<EditorPreferences> | null;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>({
    ...DEFAULT_PREFS,
    ...initialPreferences,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updatePreferences = (newPrefs: Partial<EditorPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    // Auto-save to database
    setIsLoading(true);
    updateEditorPreferences(updated)
      .then((result) => {
        if (result.success) {
          toast.success("Preferences updated");
        } else {
          toast.error(result.error || "Failed to update preferences");
          // Revert to previous state on error (optional)
          setPreferences(preferences);
        }
      })
      .catch(() => {
        toast.error("Failed to update preferences");
        setPreferences(preferences);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  return context;
}
'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { suggestTags } from '@/lib/actions/aiActions';

interface SuggestTagsButtonProps {
  title: string;
  content: string;
  typeName: string;
  onTagAdd: (tag: string) => void;
  isPro: boolean;
}

export function SuggestTagsButton({
  title,
  content,
  typeName,
  onTagAdd,
  isPro,
}: SuggestTagsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  const handleSuggest = async () => {
    if (!title.trim() && !content.trim()) {
      toast.info('Add some content first to get tag suggestions.');
      return;
    }

    setIsLoading(true);
    const result = await suggestTags({ title, content, typeName });
    setIsLoading(false);

    if (result.success && result.data) {
      setSuggestions(result.data);
    } else {
      toast.error(result.error || 'Failed to get tag suggestions');
    }
  };

  const acceptTag = (tag: string) => {
    onTagAdd(tag);
    setSuggestions(suggestions?.filter((t) => t !== tag) || null);
  };

  const rejectTag = (tag: string) => {
    setSuggestions(suggestions?.filter((t) => t !== tag) || null);
  };

  if (!isPro) {
    return (
      <Button variant="ghost" size="sm" disabled title="AI features require Pro">
        <Sparkles className="size-3.5 mr-1" />
        Suggest Tags
        <span className="ml-1 text-[10px] text-muted-foreground">(Pro)</span>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSuggest}
        disabled={isLoading}
        className="gap-1"
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Suggest Tags
      </Button>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {suggestions.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 px-2 py-0.5 text-xs"
            >
              {tag}
              <button
                onClick={() => acceptTag(tag)}
                className="text-green-500 hover:text-green-400"
              >
                <Check className="size-3" />
              </button>
              <button
                onClick={() => rejectTag(tag)}
                className="text-red-500 hover:text-red-400"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
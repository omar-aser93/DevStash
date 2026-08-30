'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { optimizePrompt } from '@/lib/actions/aiActions';

export function OptimizePromptButton({
  content,
  onAccept,
  isPro,
}: {
  content: string;
  onAccept: (optimized: string) => void;
  isPro: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!content.trim()) {
      toast.info('Add a prompt first.');
      return;
    }
    setIsLoading(true);
    const result = await optimizePrompt({ content });
    setIsLoading(false);
    if (result.success && result.data) {
      setOptimized(result.data);
    } else {
      toast.error(result.error || 'Failed to optimize prompt');
    }
  };

  const accept = () => {
    if (optimized) onAccept(optimized);
    setOptimized(null);
  };

  const dismiss = () => setOptimized(null);

  if (!isPro) {
    return (
      <Button variant="ghost" size="sm" disabled title="AI features require Pro">
        <Sparkles className="size-3.5 mr-1" />
        Optimize Prompt (Pro)
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOptimize}
        disabled={isLoading}
        className="gap-1"
      >
        {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        Optimize Prompt
      </Button>

      {optimized && (
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{optimized}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={accept}>
              <Check className="size-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              <X className="size-3.5 mr-1" /> Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
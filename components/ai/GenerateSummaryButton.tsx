'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateSummary } from '@/lib/actions/aiActions';

export function GenerateSummaryButton({
  title,
  content,
  typeName,
  onAccept,
  isPro,
}: {
  title: string;
  content: string;
  typeName: string;
  onAccept: (summary: string) => void;
  isPro: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.info('Add some content first.');
      return;
    }
    setIsLoading(true);
    const result = await generateSummary({ title, content, typeName });
    setIsLoading(false);
    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      toast.error(result.error || 'Failed to generate summary');
    }
  };

  const accept = () => {
    if (summary) onAccept(summary);
    setSummary(null);
  };

  const dismiss = () => setSummary(null);

  if (!isPro) {
    return (
      <Button variant="ghost" size="sm" disabled title="AI features require Pro">
        <Sparkles className="size-3.5 mr-1" />
        Generate Summary (Pro)
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerate}
        disabled={isLoading}
        className="gap-1"
      >
        {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        Generate Summary
      </Button>

      {summary && (
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-sm text-muted-foreground">{summary}</p>
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
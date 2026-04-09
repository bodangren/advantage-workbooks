'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LessonFromSourceModalProps {
  projectId: string;
  onSuccess?: () => void;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export function LessonFromSourceModal({ projectId, onSuccess }: LessonFromSourceModalProps) {
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [cefrLevel, setCefrLevel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isValid = inputMode === 'text' 
    ? sourceText.trim().length >= 50 && cefrLevel !== ''
    : sourceUrl.trim().length > 0 && cefrLevel !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValid) {
      setError('Please provide source content and select a CEFR level');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: inputMode,
          source: inputMode === 'text' ? sourceText : sourceUrl,
          cefr_level: cefrLevel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOpen(false);
        setSourceText('');
        setSourceUrl('');
        setCefrLevel('');
        onSuccess?.();
        router.push(`/projects/${projectId}/lessons/${encodeURIComponent(data.lesson_id)}`);
      } else {
        setError(data.error || 'Failed to generate lesson');
      }
    } catch (err) {
      console.error('Failed to generate lesson:', err);
      setError('An error occurred while generating the lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSourceText('');
      setSourceUrl('');
      setCefrLevel('');
      setError('');
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Sparkles className="mr-2 h-4 w-4" />
        New Lesson from Source
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Generate Lesson from Source</DialogTitle>
            <DialogDescription>
              Paste an article or enter a URL to generate a complete lesson with vocabulary,
              comprehension questions, and activities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={inputMode === 'text' ? 'secondary' : 'outline'}
                onClick={() => setInputMode('text')}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste Text
              </Button>
              <Button
                type="button"
                variant={inputMode === 'url' ? 'secondary' : 'outline'}
                onClick={() => setInputMode('url')}
                className="flex-1"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                URL
              </Button>
            </div>

            {inputMode === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="source-text">Article Text</Label>
                <textarea
                  id="source-text"
                  placeholder="Paste your article text here (minimum 50 characters)..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  {sourceText.length < 50 
                    ? `${sourceText.length}/50 characters minimum`
                    : `${sourceText.length} characters`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="source-url">Article URL</Label>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a publicly accessible article URL
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cefr-level">CEFR Level</Label>
              <Select value={cefrLevel} onValueChange={setCefrLevel}>
                <SelectTrigger id="cefr-level">
                  <SelectValue placeholder="Select CEFR level" />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating lesson...
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isValid}>
                {loading ? 'Generating...' : 'Generate Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/image-upload';
import { Loader2, Sparkles } from 'lucide-react';
import type { WritingPromptEditorProps } from './types';

/**
 * Edits the writing prompt section of a lesson: the prompt, the plan prompts
 * and sentence frames (as JSON arrays), plus the visual break image workflow
 * (prompt editing, AI image generation, and image upload).
 *
 * @param props - Field values, image workflow state/callbacks, and an onChange
 * callback; see WritingPromptEditorProps.
 * @returns The Writing Prompt card.
 */
export function WritingPromptEditor({
  writing_prompt,
  writing_plan_prompts,
  writing_sentence_frames,
  projectId,
  imagePrompt,
  generatingImage,
  augmenting,
  currentVisualBreakImageUrl,
  onChange,
  onImagePromptChange,
  onGenerateImagePrompt,
  onGenerateImage,
  onVisualBreakImageUpload,
}: WritingPromptEditorProps) {
  const handlePlanPromptsChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange('writing_plan_prompts', parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  const handleSentenceFramesChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange('writing_sentence_frames', parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Writing Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="writing_prompt">Writing Prompt</Label>
          <Textarea
            id="writing_prompt"
            value={writing_prompt || ''}
            onChange={(e) => onChange('writing_prompt', e.target.value)}
            rows={4}
            placeholder="Writing prompt for students..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="writing_plan_prompts">Writing Plan Prompts</Label>
          <Textarea
            id="writing_plan_prompts"
            value={JSON.stringify(writing_plan_prompts || [])}
            onChange={(e) => handlePlanPromptsChange(e.target.value)}
            rows={3}
            className="font-mono text-sm"
            placeholder='["Main idea / discovery:","Key details to include:","Vocabulary I will use:","Why this discovery matters:"]'
          />
          <p className="text-xs text-muted-foreground">
            Enter as JSON array of strings
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="writing_sentence_frames">Writing Sentence Frames</Label>
          <Textarea
            id="writing_sentence_frames"
            value={JSON.stringify(writing_sentence_frames || [])}
            onChange={(e) => handleSentenceFramesChange(e.target.value)}
            rows={3}
            className="font-mono text-sm"
            placeholder='["First, I will...", "Then, I will..."]'
          />
          <p className="text-xs text-muted-foreground">
            Sentence starters to scaffold student writing (JSON array)
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Visual Break Image</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateImagePrompt}
                disabled={generatingImage || augmenting}
              >
                Generate Prompt
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onGenerateImage}
                disabled={!imagePrompt || generatingImage || augmenting}
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Image
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_prompt">AI Image Prompt (Editable)</Label>
            <Textarea
              id="image_prompt"
              value={imagePrompt}
              onChange={(e) => onImagePromptChange(e.target.value)}
              rows={6}
              className="font-mono text-sm"
              placeholder="Click 'Generate Prompt' to create a context-aware image prompt, or write your own..."
            />
            <p className="text-xs text-muted-foreground">
              Edit the prompt as needed, then click &quot;Create Image&quot; to generate
            </p>
          </div>
        </div>

        <ImageUpload
          projectId={projectId}
          currentUrl={currentVisualBreakImageUrl}
          onUploadSuccess={onVisualBreakImageUpload}
          label="Visual Break Image"
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LessonReflectionEditorProps } from './types';

/**
 * Edits the lesson reflection section: the reflection focus prompt shown to
 * students at the end of the lesson.
 *
 * @param props - The current reflection focus value plus an onChange callback;
 * see LessonReflectionEditorProps.
 * @returns The Lesson Reflection card.
 */
export function LessonReflectionEditor({
  reflection_focus,
  onChange,
}: LessonReflectionEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Reflection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="reflection_focus">Reflection Focus</Label>
        <Textarea
          id="reflection_focus"
          value={reflection_focus || ''}
          onChange={(e) => onChange('reflection_focus', e.target.value)}
          rows={3}
          placeholder="Today I learned:"
        />
      </CardContent>
    </Card>
  );
}

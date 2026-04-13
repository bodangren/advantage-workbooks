'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BasicInfoEditorProps } from './types';

export function BasicInfoEditor({
  lesson_number,
  lesson_title,
  level_name,
  cefr_level,
  genre,
  onChange,
}: BasicInfoEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lesson_number">Lesson Number</Label>
            <Input
              id="lesson_number"
              value={lesson_number || ''}
              onChange={(e) => onChange('lesson_number', e.target.value)}
              placeholder="e.g., Lesson 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson_title">Lesson Title</Label>
            <Input
              id="lesson_title"
              value={lesson_title || ''}
              onChange={(e) => onChange('lesson_title', e.target.value)}
              placeholder="e.g., The Library Map"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="level_name">Level Name</Label>
            <Input
              id="level_name"
              value={level_name || ''}
              onChange={(e) => onChange('level_name', e.target.value)}
              placeholder="e.g., Origins"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cefr_level">CEFR Level</Label>
            <Input
              id="cefr_level"
              value={cefr_level || ''}
              onChange={(e) => onChange('cefr_level', e.target.value)}
              placeholder="e.g., A1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre || ''}
              onChange={(e) => onChange('genre', e.target.value)}
              placeholder="e.g., Adventure"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
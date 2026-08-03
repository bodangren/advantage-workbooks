'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ComprehensionQuestionsEditorProps } from './types';

/**
 * Edits the comprehension questions section of a lesson: the multiple-choice
 * questions (as a JSON array), the short-answer question, and its hint.
 *
 * @param props - Field values plus an onChange callback; see ComprehensionQuestionsEditorProps.
 * @returns The Comprehension Questions card.
 */
export function ComprehensionQuestionsEditor({
  comprehension_questions,
  short_answer_question,
  short_answer_hint,
  onChange,
}: ComprehensionQuestionsEditorProps) {
  const handleQuestionsChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange('comprehension_questions', parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprehension Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comprehension_questions">Questions</Label>
          <Textarea
            id="comprehension_questions"
            value={JSON.stringify(comprehension_questions || [])}
            onChange={(e) => handleQuestionsChange(e.target.value)}
            rows={8}
            className="font-mono text-sm"
            placeholder='[{"number": 1, "question": "...", "options": ["A", "B", "C"]}]'
          />
          <p className="text-xs text-muted-foreground">
            Enter as JSON array
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_answer_question">Short Answer Question</Label>
          <Textarea
            id="short_answer_question"
            value={short_answer_question || ''}
            onChange={(e) => onChange('short_answer_question', e.target.value)}
            rows={3}
            placeholder="Short answer question prompt..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_answer_hint">Short Answer Hint</Label>
          <Input
            id="short_answer_hint"
            value={short_answer_hint || ''}
            onChange={(e) => onChange('short_answer_hint', e.target.value)}
            placeholder="Try to use at least two complete sentences in your answer."
          />
        </div>
      </CardContent>
    </Card>
  );
}

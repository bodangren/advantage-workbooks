'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PedagogicalConnectorsEditorProps } from './types';

export function PedagogicalConnectorsEditor({
  connection_question,
  grammar_search_term,
  discussion_question,
  onChange,
}: PedagogicalConnectorsEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedagogical Connectors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="connection_question">Connection Question</Label>
          <Textarea
            id="connection_question"
            value={connection_question || ''}
            onChange={(e) => onChange('connection_question', e.target.value)}
            rows={2}
            placeholder="Question connecting article to student's life or experience..."
          />
          <p className="text-xs text-muted-foreground">
            Helps students connect the article content to their own experiences
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grammar_search_term">Grammar Search Term</Label>
          <Input
            id="grammar_search_term"
            value={grammar_search_term || ''}
            onChange={(e) => onChange('grammar_search_term', e.target.value)}
            placeholder="e.g., simple past, present perfect..."
          />
          <p className="text-xs text-muted-foreground">
            Grammar pattern for students to identify in the article (CEFR-aware)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discussion_question">Discussion Question</Label>
          <Textarea
            id="discussion_question"
            value={discussion_question || ''}
            onChange={(e) => onChange('discussion_question', e.target.value)}
            rows={2}
            placeholder="Open-ended question for class discussion..."
          />
          <p className="text-xs text-muted-foreground">
            Thought-provoking question for deeper engagement with the topic
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { VocabularyEditorProps } from './types';

export function VocabularyEditor({
  vocabulary,
  onChange,
}: VocabularyEditorProps) {
  const handleChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange('vocabulary', parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  const itemCount = vocabulary?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vocabulary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="vocabulary">Vocabulary Items</Label>
        <Textarea
          id="vocabulary"
          value={JSON.stringify(vocabulary || [], null, 2)}
          onChange={(e) => handleChange(e.target.value)}
          rows={8}
          className="font-mono text-sm"
          placeholder='[{"word": "example", "definition": "..."}]'
        />
        <p className="text-xs text-muted-foreground">
          Enter as JSON array {itemCount > 0 && `(${itemCount} items)`}
        </p>
      </CardContent>
    </Card>
  );
}
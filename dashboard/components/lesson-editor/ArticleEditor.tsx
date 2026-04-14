import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import type { ArticleEditorProps } from './types';

export function ArticleEditor({
  article_url,
  article_caption,
  article_image_url,
  article_images,
  article_paragraphs,
  projectId,
  onChange,
}: ArticleEditorProps) {
  const handleParagraphsChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onChange('article_paragraphs', parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  const handleAddImage = () => {
    const newImages = [...(article_images || [])];
    newImages.push({ url: '', caption: '', position: 'inline-para-1' });
    onChange('article_images', newImages);
  };

  const handleUpdateImage = (index: number, field: 'url' | 'caption' | 'position', value: string) => {
    const newImages = [...(article_images || [])];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange('article_images', newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = article_images?.filter((_, i) => i !== index);
    onChange('article_images', newImages || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article_url">Article URL</Label>
            <Input
              id="article_url"
              type="url"
              value={article_url || ''}
              onChange={(e) => onChange('article_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <ImageUpload
            projectId={projectId}
            currentUrl={article_image_url || ''}
            onUploadSuccess={(url) => onChange('article_image_url', url)}
            label="Article Image"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article_caption">Image Caption</Label>
          <Input
            id="article_caption"
            value={article_caption || ''}
            onChange={(e) => onChange('article_caption', e.target.value)}
            placeholder="Image description"
          />
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Additional Article Images</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImage}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </div>

          {(article_images || []).map((img, index) => (
            <Card key={index} className="bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <ImageUpload
                      projectId={projectId}
                      currentUrl={img.url}
                      onUploadSuccess={(url) => handleUpdateImage(index, 'url', url)}
                      label={`Image #${index + 1}`}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={img.position}
                          onChange={(e) => handleUpdateImage(index, 'position', e.target.value)}
                          placeholder="e.g., hero, inline-para-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Caption</Label>
                        <Input
                          value={img.caption}
                          onChange={(e) => handleUpdateImage(index, 'caption', e.target.value)}
                          placeholder="Image caption"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article_paragraphs">Article Paragraphs</Label>
          <Textarea
            id="article_paragraphs"
            value={JSON.stringify(article_paragraphs || [], null, 2)}
            onChange={(e) => handleParagraphsChange(e.target.value)}
            rows={8}
            className="font-mono text-sm"
            placeholder='[{"number": 1, "text": "..."}]'
          />
          <p className="text-xs text-muted-foreground">
            Enter as JSON array
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
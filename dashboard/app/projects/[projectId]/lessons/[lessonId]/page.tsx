'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import type { WorkbookLesson } from '@/lib/workbook-schema';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';

interface LessonEditorProps {
  params: Promise<{ projectId: string; lessonId: string }>;
}

export default function LessonEditor({ params }: LessonEditorProps) {
  const { projectId, lessonId } = use(params);
  const decodedProjectId = decodeURIComponent(projectId);
  const decodedLessonId = decodeURIComponent(lessonId);

  const [lesson, setLesson] = useState<Partial<WorkbookLesson>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const placeholder = {
    paragraphs: '[{"number": 1, "text": "..."}]',
    vocabulary: '[{"word": "example", "definition": "..."}]',
    questions: '[{"number": 1, "question": "...", "options": ["A", "B", "C"]}]'
  };

  const fetchLesson = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}`);
      if (response.ok) {
        const data = await response.json();
        setLesson(data);
      }
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      setErrors({ _form: 'Failed to load lesson data' });
    } finally {
      setLoading(false);
    }
  }, [projectId, lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const validateAndSave = async () => {
    setErrors({});
    setSaveSuccess(false);

    const validationResult = WorkbookLessonSchema.safeParse(lesson);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationResult.data),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        setErrors({ _form: data.error || 'Failed to save lesson' });
      }
    } catch (error) {
      console.error('Failed to save lesson:', error);
      setErrors({ _form: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading lesson...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${encodeURIComponent(projectId)}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{decodedLessonId}</h1>
            <p className="text-muted-foreground mt-2">
              Project: {decodedProjectId}
            </p>
          </div>
        </div>
        <Button onClick={validateAndSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {errors._form && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">
            {errors._form}
          </CardContent>
        </Card>
      )}

      {saveSuccess && (
        <Card className="border-green-600 bg-green-50 dark:bg-green-950">
          <CardContent className="py-4 text-green-700 dark:text-green-400">
            Lesson saved successfully!
          </CardContent>
        </Card>
      )}

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
                value={lesson.lesson_number || ''}
                onChange={(e) => setLesson({ ...lesson, lesson_number: e.target.value })}
                placeholder="e.g., Lesson 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson_title">Lesson Title</Label>
              <Input
                id="lesson_title"
                value={lesson.lesson_title || ''}
                onChange={(e) => setLesson({ ...lesson, lesson_title: e.target.value })}
                placeholder="e.g., The Library Map"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="level_name">Level Name</Label>
              <Input
                id="level_name"
                value={lesson.level_name || ''}
                onChange={(e) => setLesson({ ...lesson, level_name: e.target.value })}
                placeholder="e.g., Origins"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cefr_level">CEFR Level</Label>
              <Input
                id="cefr_level"
                value={lesson.cefr_level || ''}
                onChange={(e) => setLesson({ ...lesson, cefr_level: e.target.value })}
                placeholder="e.g., A1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={lesson.genre || ''}
                onChange={(e) => setLesson({ ...lesson, genre: e.target.value })}
                placeholder="e.g., Adventure"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="article_url">Article URL</Label>
              <Input
                id="article_url"
                type="url"
                value={lesson.article_url || ''}
                onChange={(e) => setLesson({ ...lesson, article_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="article_image_url">Image URL</Label>
              <Input
                id="article_image_url"
                type="url"
                value={lesson.article_image_url || ''}
                onChange={(e) => setLesson({ ...lesson, article_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article_caption">Image Caption</Label>
            <Input
              id="article_caption"
              value={lesson.article_caption || ''}
              onChange={(e) => setLesson({ ...lesson, article_caption: e.target.value })}
              placeholder="Image description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article_paragraphs">Article Paragraphs</Label>
            <Textarea
              id="article_paragraphs"
              value={JSON.stringify(lesson.article_paragraphs || [])}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setLesson({ ...lesson, article_paragraphs: parsed });
                } catch (err) {
                  console.error('Invalid JSON:', err);
                }
              }}
              rows={8}
              className="font-mono text-sm"
              placeholder={placeholder.paragraphs}
            />
            <p className="text-xs text-muted-foreground">
              Enter as JSON array
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="vocabulary">Vocabulary Items</Label>
          <Textarea
            id="vocabulary"
            value={JSON.stringify(lesson.vocabulary || [])}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setLesson({ ...lesson, vocabulary: parsed });
              } catch (err) {
                console.error('Invalid JSON:', err);
              }
            }}
            rows={8}
            className="font-mono text-sm"
            placeholder={placeholder.vocabulary}
          />
          <p className="text-xs text-muted-foreground">
            Enter as JSON array
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comprehension Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comprehension_questions">Questions</Label>
            <Textarea
              id="comprehension_questions"
              value={JSON.stringify(lesson.comprehension_questions || [])}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setLesson({ ...lesson, comprehension_questions: parsed });
                } catch (err) {
                  console.error('Invalid JSON:', err);
                }
              }}
              rows={8}
              className="font-mono text-sm"
              placeholder={placeholder.questions}
            />
            <p className="text-xs text-muted-foreground">
              Enter as JSON array
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_answer_question">Short Answer Question</Label>
            <Textarea
              id="short_answer_question"
              value={lesson.short_answer_question || ''}
              onChange={(e) => setLesson({ ...lesson, short_answer_question: e.target.value })}
              rows={3}
              placeholder="Short answer question prompt..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Writing Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="writing_prompt">Writing Prompt</Label>
          <Textarea
            id="writing_prompt"
            value={lesson.writing_prompt || ''}
            onChange={(e) => setLesson({ ...lesson, writing_prompt: e.target.value })}
            rows={4}
            placeholder="Writing prompt for students..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

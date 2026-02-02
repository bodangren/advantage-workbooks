'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import type { WorkbookLesson, ArticleImage } from '@/lib/workbook-schema';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';
import LessonPreview from '@/components/lesson-preview';
import { ImageUpload } from '@/components/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LessonEditorProps {
  params: Promise<{ projectId: string; lessonId: string }>;
}

// Move defaults outside component to prevent recreating on every render
const DEFAULTS = {
  short_answer_hint: "Try to use at least two complete sentences in your answer.",
  writing_plan_prompts: [
    "Main idea / discovery:",
    "Key details to include:",
    "Vocabulary I will use:",
    "Why this discovery matters:"
  ],
  reflection_focus: "Today I learned:"
} as const;

const PLACEHOLDERS = {
  paragraphs: '[{"number": 1, "text": "..."}]',
  vocabulary: '[{"word": "example", "definition": "..."}]',
  questions: '[{"number": 1, "question": "...", "options": ["A", "B", "C"]}]',
  writing_plan_prompts: JSON.stringify(DEFAULTS.writing_plan_prompts),
  short_answer_hint: DEFAULTS.short_answer_hint,
  reflection_focus: DEFAULTS.reflection_focus
} as const;

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
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
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Use ref instead of state to prevent dependency issues
  const renderingPreviewRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updatePreview = useCallback(async (currentLesson: Partial<WorkbookLesson>) => {
    if (renderingPreviewRef.current) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Merge defaults for preview if missing
    const lessonForPreview = {
      ...currentLesson,
      short_answer_hint: currentLesson.short_answer_hint || DEFAULTS.short_answer_hint,
      writing_plan_prompts: currentLesson.writing_plan_prompts || DEFAULTS.writing_plan_prompts,
      reflection_focus: currentLesson.reflection_focus || DEFAULTS.reflection_focus,
    };

    renderingPreviewRef.current = true;
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: lessonForPreview, projectId }),
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const { html } = await response.json();
        setPreviewHtml(html);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Failed to generate preview:', error);
    } finally {
      renderingPreviewRef.current = false;
    }
  }, []); // No dependencies needed!

  // Debounced version - only updates after user stops typing for 500ms
  const debouncedUpdatePreview = useDebounce(updatePreview, 500);

  useEffect(() => {
    if (showPreview) {
      debouncedUpdatePreview(lesson);
    }

    // Cleanup: cancel pending requests when modal closes or component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [lesson, showPreview, debouncedUpdatePreview]);

  const fetchLesson = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}`);
      if (response.ok) {
        const data = await response.json();
        // Merge defaults into loaded data if fields are missing
        setLesson({
          ...data,
          short_answer_hint: data.short_answer_hint || DEFAULTS.short_answer_hint,
          writing_plan_prompts: data.writing_plan_prompts || DEFAULTS.writing_plan_prompts,
          reflection_focus: data.reflection_focus || DEFAULTS.reflection_focus,
        });
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
         <Button
           onClick={() => setShowPreview(!showPreview)}
           variant={showPreview ? 'default' : 'outline'}
         >
           {showPreview ? 'Hide Preview' : 'Show Preview'}
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
          <div className="space-y-4">
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

            <ImageUpload
              projectId={decodedProjectId}
              currentUrl={lesson.article_image_url || ''}
              onUploadSuccess={(url) => setLesson({ ...lesson, article_image_url: url })}
              label="Article Image"
            />
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

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Additional Article Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newImages = [...(lesson.article_images || [])];
                  newImages.push({ url: '', caption: '', position: 'inline-para-1' });
                  setLesson({ ...lesson, article_images: newImages });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Image
              </Button>
            </div>

            {(lesson.article_images || []).map((img, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <ImageUpload
                        projectId={decodedProjectId}
                        currentUrl={img.url}
                        onUploadSuccess={(url) => {
                          const newImages = [...(lesson.article_images || [])];
                          newImages[index].url = url;
                          setLesson({ ...lesson, article_images: newImages });
                        }}
                        label={`Image #${index + 1}`}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Select
                            value={img.position}
                            onValueChange={(value: ArticleImage['position']) => {
                              const newImages = [...(lesson.article_images || [])];
                              newImages[index].position = value;
                              setLesson({ ...lesson, article_images: newImages });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hero">Hero (Top)</SelectItem>
                              <SelectItem value="vocabulary">Vocabulary Section</SelectItem>
                              <SelectItem value="inline-para-1">After Paragraph 1</SelectItem>
                              <SelectItem value="inline-para-2">After Paragraph 2</SelectItem>
                              <SelectItem value="inline-para-3">After Paragraph 3</SelectItem>
                              <SelectItem value="inline-para-4">After Paragraph 4</SelectItem>
                              <SelectItem value="inline-para-5">After Paragraph 5</SelectItem>
                              <SelectItem value="writing-prompt">Writing Prompt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Caption</Label>
                          <Input
                            value={img.caption}
                            onChange={(e) => {
                              const newImages = [...(lesson.article_images || [])];
                              newImages[index].caption = e.target.value;
                              setLesson({ ...lesson, article_images: newImages });
                            }}
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
                      onClick={() => {
                        const newImages = lesson.article_images?.filter((_, i) => i !== index);
                        setLesson({ ...lesson, article_images: newImages });
                      }}
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
              placeholder={PLACEHOLDERS.paragraphs}
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
            placeholder={PLACEHOLDERS.vocabulary}
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
              placeholder={PLACEHOLDERS.questions}
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

          <div className="space-y-2">
            <Label htmlFor="short_answer_hint">Short Answer Hint</Label>
            <Input
              id="short_answer_hint"
              value={lesson.short_answer_hint || ''}
              onChange={(e) => setLesson({ ...lesson, short_answer_hint: e.target.value })}
              placeholder={PLACEHOLDERS.short_answer_hint}
            />
          </div>
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
           <CardTitle>Writing Prompt</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="writing_prompt">Writing Prompt</Label>
             <Textarea
               id="writing_prompt"
               value={lesson.writing_prompt || ''}
               onChange={(e) => setLesson({ ...lesson, writing_prompt: e.target.value })}
               rows={4}
               placeholder="Writing prompt for students..."
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="writing_plan_prompts">Writing Plan Prompts</Label>
             <Textarea
               id="writing_plan_prompts"
               value={JSON.stringify(lesson.writing_plan_prompts || [])}
               onChange={(e) => {
                 try {
                   const parsed = JSON.parse(e.target.value);
                   setLesson({ ...lesson, writing_plan_prompts: parsed });
                 } catch (err) {
                   console.error('Invalid JSON:', err);
                 }
               }}
               rows={3}
               className="font-mono text-sm"
               placeholder={PLACEHOLDERS.writing_plan_prompts}
             />
             <p className="text-xs text-muted-foreground">
               Enter as JSON array of strings
             </p>
           </div>
         </CardContent>
       </Card>

       <Card>
         <CardHeader>
           <CardTitle>Lesson Reflection</CardTitle>
         </CardHeader>
         <CardContent className="space-y-2">
           <Label htmlFor="reflection_focus">Reflection Focus</Label>
           <Textarea
             id="reflection_focus"
             value={lesson.reflection_focus || ''}
             onChange={(e) => setLesson({ ...lesson, reflection_focus: e.target.value })}
             rows={3}
             placeholder={PLACEHOLDERS.reflection_focus}
           />
         </CardContent>
       </Card>

       {showPreview && previewHtml && (
         <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-hidden">
           <div className="h-full bg-white rounded-lg shadow-2xl flex flex-col">
             <div className="flex items-center justify-between border-b px-4 py-3">
               <h2 className="text-xl font-bold">Lesson Preview</h2>
               <Button
                 onClick={() => setShowPreview(false)}
                 variant="ghost"
                 className="h-9 w-9 p-0"
               >
                 ×
               </Button>
             </div>
             <div className="flex-1 overflow-hidden">
               <LessonPreview htmlContent={previewHtml} className="h-full" />
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

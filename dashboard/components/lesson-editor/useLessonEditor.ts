'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { WorkbookLesson, ArticleImage } from '@/lib/workbook-schema';
import { WorkbookLessonSchema } from '@/lib/workbook-schema';

const DEFAULTS = {
  short_answer_hint: 'Try to use at least two complete sentences in your answer.',
  writing_plan_prompts: [
    'Main idea / discovery:',
    'Key details to include:',
    'Vocabulary I will use:',
    'Why this discovery matters:'
  ],
  reflection_focus: 'Today I learned:'
} as const;

function useDebounce<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export interface UseLessonEditorParams {
  /** Raw (URL-encoded) project id used in API request paths. */
  projectId: string;
  /** Raw (URL-encoded) lesson id used in API request paths. */
  lessonId: string;
  /** Decoded project id used for display. */
  decodedProjectId: string;
  /** Decoded lesson id used for display and generated-lesson detection. */
  decodedLessonId: string;
}

export interface UseLessonEditorResult {
  lesson: Partial<WorkbookLesson>;
  loading: boolean;
  saving: boolean;
  augmenting: boolean;
  generatingImage: boolean;
  imagePrompt: string;
  errors: Record<string, string>;
  saveSuccess: boolean;
  augmentSuccess: boolean;
  sourceGeneratedSuccess: boolean;
  imageGenSuccess: boolean;
  previewHtml: string;
  showPreview: boolean;
  currentVisualBreakImageUrl: string;
  setLessonField: <K extends keyof WorkbookLesson>(field: K, value: WorkbookLesson[K]) => void;
  setImagePrompt: (value: string) => void;
  setShowPreview: (show: boolean) => void;
  updateVisualBreakImage: (url: string) => void;
  validateAndSave: () => void;
  augmentWithAI: () => void;
  generateImagePrompt: () => void;
  generateImage: () => void;
}

/**
 * Owns all state and data-fetching logic for the lesson editor page.
 *
 * Handles lesson loading (with preview-default merging), debounced preview
 * rendering to /api/render with request aborting, schema validation and saving,
 * AI pedagogy augmentation, and the visual-break-image generation workflow.
 *
 * @param params - Raw API ids plus decoded display ids; see UseLessonEditorParams.
 * @returns Editor state and the handlers that mutate it; see UseLessonEditorResult.
 */
export function useLessonEditor({
  projectId,
  lessonId,
  decodedLessonId,
}: UseLessonEditorParams): UseLessonEditorResult {
  const [lesson, setLesson] = useState<Partial<WorkbookLesson>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [augmenting, setAugmenting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [augmentSuccess, setAugmentSuccess] = useState(false);
  const [sourceGeneratedSuccess, setSourceGeneratedSuccess] = useState(false);
  const [imageGenSuccess, setImageGenSuccess] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const renderingPreviewRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updatePreview = useCallback(async (currentLesson: Partial<WorkbookLesson>) => {
    if (renderingPreviewRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
        return;
      }
      console.error('Failed to generate preview:', error);
    } finally {
      renderingPreviewRef.current = false;
    }
  }, [projectId]);

  const debouncedUpdatePreview = useDebounce(updatePreview, 500);

  useEffect(() => {
    if (showPreview) {
      debouncedUpdatePreview(lesson);
    }

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

  useEffect(() => {
    if (decodedLessonId.startsWith('generated-lesson-')) {
      setSourceGeneratedSuccess(true);
      const timer = setTimeout(() => setSourceGeneratedSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [decodedLessonId]);

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

  const augmentWithAI = async () => {
    setErrors({});
    setAugmentSuccess(false);
    setAugmenting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}/augment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setLesson(data.lesson);
        setAugmentSuccess(true);
        setTimeout(() => setAugmentSuccess(false), 5000);
      } else {
        const data = await response.json();
        setErrors({ _form: data.error || 'Failed to auto-fill pedagogy' });
      }
    } catch (error) {
      console.error('Failed to augment lesson:', error);
      setErrors({ _form: 'An error occurred while auto-filling pedagogy' });
    } finally {
      setAugmenting(false);
    }
  };

  const generateImagePrompt = () => {
    const articleText = lesson.article_paragraphs?.map(p => p.text).join(' ') || '';
    const prompt = `Create a photorealistic educational illustration for a CEFR ${lesson.cefr_level || 'B1'} level ESL lesson.

Lesson Topic: ${lesson.lesson_title}
Context: ${articleText.substring(0, 500)}${articleText.length > 500 ? '...' : ''}

The image should:
- Be appropriate for ${lesson.cefr_level || 'B1'} level students (ages 12-16)
- Support the writing prompt: "${lesson.writing_prompt}"
- Be clear, engaging, and educational
- Use vibrant but not overwhelming colors
- Be suitable for classroom display
- Avoid text or words in the image

Style: Photorealistic educational illustration with clear focus and good lighting`;

    setImagePrompt(prompt);
  };

  const generateImage = async () => {
    setErrors({});
    setImageGenSuccess(false);
    setGeneratingImage(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/lessons/${lessonId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (response.ok) {
        await fetchLesson();
        setImageGenSuccess(true);
        setTimeout(() => setImageGenSuccess(false), 5000);
      } else {
        const data = await response.json();
        setErrors({ _form: data.error || 'Failed to generate image' });
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      setErrors({ _form: 'An error occurred while generating image' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const setLessonField = useCallback(<K extends keyof WorkbookLesson>(field: K, value: WorkbookLesson[K]) => {
    setLesson({ ...lesson, [field]: value });
  }, [lesson]);

  const updateVisualBreakImage = useCallback((url: string) => {
    const existingImages = lesson.article_images || [];
    const writingPromptImageIndex = existingImages.findIndex(img => img.position === 'writing-prompt');

    if (url === '') {
      const newImages = existingImages.filter(img => img.position !== 'writing-prompt');
      setLesson({ ...lesson, article_images: newImages });
    } else if (writingPromptImageIndex >= 0) {
      const newImages = [...existingImages];
      newImages[writingPromptImageIndex].url = url;
      setLesson({ ...lesson, article_images: newImages });
    } else {
      const newImages: ArticleImage[] = [...existingImages, { url, caption: '', position: 'writing-prompt' }];
      setLesson({ ...lesson, article_images: newImages });
    }
  }, [lesson]);

  const currentVisualBreakImageUrl =
    lesson.article_images?.find(img => img.position === 'writing-prompt')?.url || '';

  return {
    lesson,
    loading,
    saving,
    augmenting,
    generatingImage,
    imagePrompt,
    errors,
    saveSuccess,
    augmentSuccess,
    sourceGeneratedSuccess,
    imageGenSuccess,
    previewHtml,
    showPreview,
    currentVisualBreakImageUrl,
    setLessonField,
    setImagePrompt,
    setShowPreview,
    updateVisualBreakImage,
    validateAndSave,
    augmentWithAI,
    generateImagePrompt,
    generateImage,
  };
}

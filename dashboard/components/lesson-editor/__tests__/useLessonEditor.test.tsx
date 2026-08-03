import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonEditor, type UseLessonEditorParams } from '../useLessonEditor';

const params: UseLessonEditorParams = {
  projectId: 'proj%201',
  lessonId: 'less%201',
  decodedProjectId: 'proj 1',
  decodedLessonId: 'less 1',
};

const baseLesson = {
  lesson_title: 'The Library Map',
  vocabulary: [{ word: 'map', definition: 'a drawing of a place' }],
  article_paragraphs: [{ number: 1, text: 'The map shows the library.' }],
  comprehension_questions: [
    { number: 1, question: 'What does the map show?', options: ['A', 'B'] },
  ],
  short_answer_question: 'Describe the map.',
  writing_prompt: 'Write about a map.',
};

const defaults = {
  short_answer_hint: 'Try to use at least two complete sentences in your answer.',
  writing_plan_prompts: [
    'Main idea / discovery:',
    'Key details to include:',
    'Vocabulary I will use:',
    'Why this discovery matters:',
  ],
  reflection_focus: 'Today I learned:',
};

function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flush() {
  await act(async () => {});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function mountLoadedLesson(overrides: Record<string, unknown> = {}) {
  const { promise, resolve } = deferred();
  fetchMock.mockReturnValueOnce(promise);
  const rendered = renderHook(() => useLessonEditor(params));
  await act(async () => {
    resolve({ ok: true, json: async () => ({ ...baseLesson, ...overrides }) });
  });
  return rendered;
}

describe('useLessonEditor', () => {
  it('loads the lesson on mount and merges preview defaults', async () => {
    const { promise, resolve } = deferred();
    fetchMock.mockReturnValueOnce(promise);
    const { result } = renderHook(() => useLessonEditor(params));

    expect(result.current.loading).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/proj%201/lessons/less%201');

    await act(async () => {
      resolve({ ok: true, json: async () => ({ ...baseLesson }) });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.lesson.lesson_title).toBe('The Library Map');
    expect(result.current.lesson.short_answer_hint).toBe(defaults.short_answer_hint);
    expect(result.current.lesson.writing_plan_prompts).toEqual(defaults.writing_plan_prompts);
    expect(result.current.lesson.reflection_focus).toBe(defaults.reflection_focus);
  });

  it('sets a form error when loading the lesson fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => useLessonEditor(params));

    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.errors._form).toBe('Failed to load lesson data');
    errorSpy.mockRestore();
  });

  it('updates a single field on the lesson', async () => {
    const { result } = await mountLoadedLesson();

    act(() => {
      result.current.setLessonField('lesson_title', 'New Title');
    });

    expect(result.current.lesson.lesson_title).toBe('New Title');
  });

  it('debounces preview rendering for 500ms when the preview is open', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ html: '<div>preview</div>' }) });

    act(() => {
      result.current.setShowPreview(true);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/render',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      })
    );

    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body.projectId).toBe('proj%201');
    expect(body.lesson.short_answer_hint).toBe(defaults.short_answer_hint);
    expect(result.current.previewHtml).toBe('<div>preview</div>');
  });

  it('resets the debounce timer when the lesson changes quickly', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ html: '<div>preview</div>' }) });

    act(() => {
      result.current.setShowPreview(true);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    act(() => {
      result.current.setLessonField('lesson_title', 'Edited');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts pending preview requests when the preview closes', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_input: unknown, init?: { signal?: AbortSignal }) => {
      if (init?.signal) {
        capturedSignal = init.signal;
      }
      return new Promise(() => {});
    });

    act(() => {
      result.current.setShowPreview(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(capturedSignal).toBeDefined();

    act(() => {
      result.current.setShowPreview(false);
    });
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('saves a valid lesson via PUT and clears the success banner after 3s', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    act(() => {
      result.current.validateAndSave();
    });
    expect(result.current.saving).toBe(true);

    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/proj%201/lessons/less%201',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(result.current.saving).toBe(false);
    expect(result.current.saveSuccess).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.saveSuccess).toBe(false);
  });

  it('maps validation errors to field paths without calling the API', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    act(() => {
      (result.current.setLessonField as (field: string, value: unknown) => void)(
        'lesson_title',
        undefined
      );
    });
    act(() => {
      result.current.validateAndSave();
    });

    expect(result.current.errors.lesson_title).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces server save errors under the form error key', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid payload' }) });

    act(() => {
      result.current.validateAndSave();
    });
    await flush();

    expect(result.current.errors._form).toBe('Invalid payload');
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('augments the lesson with AI content and clears the banner after 5s', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    const augmented = { ...baseLesson, lesson_title: 'Augmented Title' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ lesson: augmented }) });

    act(() => {
      result.current.augmentWithAI();
    });
    expect(result.current.augmenting).toBe(true);

    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/proj%201/lessons/less%201/augment',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.current.lesson.lesson_title).toBe('Augmented Title');
    expect(result.current.augmentSuccess).toBe(true);
    expect(result.current.augmenting).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.augmentSuccess).toBe(false);
  });

  it('generates a context-aware image prompt from lesson content', async () => {
    const { result } = await mountLoadedLesson({
      lesson_title: 'Volcanoes',
      cefr_level: 'B1',
    });

    act(() => {
      result.current.generateImagePrompt();
    });

    expect(result.current.imagePrompt).toContain('Volcanoes');
    expect(result.current.imagePrompt).toContain('CEFR B1');
  });

  it('generates an image, refreshes the lesson, and clears the banner after 5s', async () => {
    const { result } = await mountLoadedLesson();

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...baseLesson, article_image_url: 'https://example.com/img.jpg' }),
    });

    act(() => {
      result.current.setImagePrompt('A volcano scene');
    });
    act(() => {
      result.current.generateImage();
    });
    expect(result.current.generatingImage).toBe(true);

    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/proj%201/lessons/less%201/generate-image',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.current.lesson.article_image_url).toBe('https://example.com/img.jpg');
    expect(result.current.imageGenSuccess).toBe(true);
    expect(result.current.generatingImage).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.imageGenSuccess).toBe(false);
  });

  it('adds a visual break image at the writing-prompt position', async () => {
    const { result } = await mountLoadedLesson({
      article_images: [{ url: 'a.jpg', caption: '', position: 'hero' }],
    });

    act(() => {
      result.current.updateVisualBreakImage('https://example.com/break.jpg');
    });

    expect(result.current.lesson.article_images).toEqual([
      { url: 'a.jpg', caption: '', position: 'hero' },
      { url: 'https://example.com/break.jpg', caption: '', position: 'writing-prompt' },
    ]);
    expect(result.current.currentVisualBreakImageUrl).toBe('https://example.com/break.jpg');
  });

  it('updates an existing visual break image in place', async () => {
    const { result } = await mountLoadedLesson({
      article_images: [
        { url: 'old.jpg', caption: '', position: 'writing-prompt' },
        { url: 'hero.jpg', caption: '', position: 'hero' },
      ],
    });

    act(() => {
      result.current.updateVisualBreakImage('https://example.com/new.jpg');
    });

    expect(result.current.lesson.article_images).toEqual([
      { url: 'https://example.com/new.jpg', caption: '', position: 'writing-prompt' },
      { url: 'hero.jpg', caption: '', position: 'hero' },
    ]);
  });

  it('removes the visual break image when cleared with an empty url', async () => {
    const { result } = await mountLoadedLesson({
      article_images: [
        { url: 'break.jpg', caption: '', position: 'writing-prompt' },
        { url: 'hero.jpg', caption: '', position: 'hero' },
      ],
    });

    act(() => {
      result.current.updateVisualBreakImage('');
    });

    expect(result.current.lesson.article_images).toEqual([
      { url: 'hero.jpg', caption: '', position: 'hero' },
    ]);
  });

  it('shows the generated-lesson banner for generated-lesson ids for 4s', async () => {
    const { promise, resolve } = deferred();
    fetchMock.mockReturnValueOnce(promise);
    const { result } = renderHook(() =>
      useLessonEditor({ ...params, decodedLessonId: 'generated-lesson-abc' })
    );
    await act(async () => {
      resolve({ ok: true, json: async () => ({ ...baseLesson }) });
    });

    expect(result.current.sourceGeneratedSuccess).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(result.current.sourceGeneratedSuccess).toBe(false);
  });
});

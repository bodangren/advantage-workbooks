import { describe, it, expect, vi, beforeEach } from 'vitest';
import { augmentLesson } from '../lib/ai-augmentor';
import { WorkbookLesson } from '../lib/workbook-schema';
import { GoogleGenAI } from '@google/genai';

// Mock the module
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn(),
    };
});

describe('augmentLesson', () => {
  const mockLesson: WorkbookLesson = {
    lesson_title: 'Test Lesson',
    article_paragraphs: [
      { number: 1, text: 'This is paragraph 1.' },
      { number: 2, text: 'This is paragraph 2.' },
    ],
    vocabulary: [],
    comprehension_questions: [],
    short_answer_question: 'What is the main idea?',
    writing_prompt: 'Write about the topic.',
    // Missing new fields
  } as any; // Cast to any to avoid full type compliance for test

  const mockGenerateContent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the constructor of GoogleGenAI
    (GoogleGenAI as unknown as any).mockImplementation(function(this: any) {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    });
  });

  it('should generate missing fields using AI', async () => {
    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Focus on the first paragraph.',
      writing_plan_prompts: ['Plan 1', 'Plan 2', 'Plan 3'],
      reflection_focus: 'Think about the characters.',
      connection_question: 'What do you know?',
      grammar_search_term: 'Find a verb',
      discussion_question: 'Discuss the topic',
      writing_sentence_frames: ['I think...', 'Another point...'],
      article_images: [],
    });

    mockGenerateContent.mockResolvedValue({
      text: mockResponseText,
    });

    const augmented = await augmentLesson(mockLesson, 'fake-api-key');

    expect(GoogleGenAI).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();

    expect(augmented.short_answer_hint).toBe('Focus on the first paragraph.');
    expect(augmented.writing_plan_prompts).toHaveLength(3);
    expect(augmented.reflection_focus).toBe('Think about the characters.');
  });

  it('should generate article_images with prompts', async () => {
    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Hint',
      writing_plan_prompts: ['A', 'B', 'C'],
      reflection_focus: 'Focus',
      connection_question: 'Connect?',
      grammar_search_term: 'Find verb',
      discussion_question: 'Discuss?',
      writing_sentence_frames: ['Start 1', 'Start 2'],
      article_images: [
        {
          position: 'hero',
          caption: 'Hero Image',
          image_prompt: 'A beautiful hero image'
        },
        {
          position: 'inline-para-1',
          caption: 'Inline Image',
          image_prompt: 'An inline image'
        }
      ]
    });

    mockGenerateContent.mockResolvedValue({
      text: mockResponseText,
    });

    const augmented = await augmentLesson(mockLesson, 'fake-api-key');

    expect(augmented.article_images).toBeDefined();
    expect(augmented.article_images).toHaveLength(2);
    expect(augmented.article_images![0].image_prompt).toBe('A beautiful hero image');
    expect(augmented.article_images![0].position).toBe('hero');
    // Ensure URL is handled (empty string default if not provided by AI, or handled by augmentLesson)
    expect(augmented.article_images![0].url).toBe('');
  });

  it('should generate pedagogical connectors', async () => {
    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Hint',
      writing_plan_prompts: ['A', 'B', 'C'],
      reflection_focus: 'Focus',
      connection_question: 'Connect?',
      grammar_search_term: 'Find verb',
      discussion_question: 'Discuss?',
      writing_sentence_frames: ['Start 1', 'Start 2'],
      article_images: [],
    });

    mockGenerateContent.mockResolvedValue({
      text: mockResponseText,
    });

    const augmented = await augmentLesson(mockLesson, 'fake-api-key');

    expect(augmented.connection_question).toBe('Connect?');
    expect(augmented.grammar_search_term).toBe('Find verb');
    expect(augmented.discussion_question).toBe('Discuss?');
    expect(augmented.writing_sentence_frames).toEqual(['Start 1', 'Start 2']);
  });

  it('should use model from environment variable if set', async () => {
    process.env.GEMINI_TEXT_MODEL = 'gemini-3-custom';

    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Hint',
      writing_plan_prompts: ['A', 'B', 'C'],
      reflection_focus: 'Focus',
      connection_question: 'Connect?',
      grammar_search_term: 'Find verb',
      discussion_question: 'Discuss?',
      writing_sentence_frames: ['Start 1', 'Start 2'],
      article_images: [],
    });

    mockGenerateContent.mockResolvedValue({ text: mockResponseText });

    await augmentLesson(mockLesson, 'fake-api-key');

    // Check that the generateContent was called with the custom model
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-custom',
      })
    );

    delete process.env.GEMINI_TEXT_MODEL; // Cleanup
  });

  it('should handle invalid JSON response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Invalid JSON',
    });

    await expect(augmentLesson(mockLesson, 'fake-api-key')).rejects.toThrow();
  });

  it('should log Content QA issues if found', async () => {
    const lessonWithActivities: WorkbookLesson = {
      ...mockLesson,
      vocab_match: [
        { number: 1, word: 'test', letter: 'A', definition: 'a test' },
      ],
    };

    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Hint',
      writing_plan_prompts: ['A', 'B', 'C'],
      reflection_focus: 'Focus',
      connection_question: 'Connect?',
      grammar_search_term: 'Find verb',
      discussion_question: 'Discuss?',
      writing_sentence_frames: ['Start 1', 'Start 2'],
      article_images: [],
      content_qa: {
        vocab_match_issues: ['Definition for "test" is too vague'],
      },
    });

    mockGenerateContent.mockResolvedValue({ text: mockResponseText });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await augmentLesson(lessonWithActivities, 'fake-api-key');

    expect(consoleWarnSpy).toHaveBeenCalledWith('Content QA Issues Found:');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Vocab Match:', ['Definition for "test" is too vague']);

    consoleWarnSpy.mockRestore();
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { augmentLesson } from '../lib/ai-augmentor';
import { WorkbookLesson } from '../lib/workbook-schema';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the module
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn(),
        SchemaType: { STRING: 'STRING', ARRAY: 'ARRAY', OBJECT: 'OBJECT' }
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
  const mockGetGenerativeModel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the constructor of GoogleGenerativeAI
    (GoogleGenerativeAI as unknown as any).mockImplementation(function(this: any) {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    });
    
    // Mock getGenerativeModel to return an object with generateContent
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
  });

  it('should generate missing fields using AI', async () => {
    const mockResponseText = JSON.stringify({
      short_answer_hint: 'Focus on the first paragraph.',
      writing_plan_prompts: ['Plan 1', 'Plan 2', 'Plan 3'],
      reflection_focus: 'Think about the characters.',
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockResponseText,
      },
    });

    const augmented = await augmentLesson(mockLesson, 'fake-api-key');

    expect(GoogleGenerativeAI).toHaveBeenCalledWith('fake-api-key');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.0-flash',
    }));
    expect(mockGenerateContent).toHaveBeenCalled();
    
    expect(augmented.short_answer_hint).toBe('Focus on the first paragraph.');
    expect(augmented.writing_plan_prompts).toHaveLength(3);
    expect(augmented.reflection_focus).toBe('Think about the characters.');
  });
});
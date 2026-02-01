import { describe, it, expect } from 'vitest';
import { WorkbookLessonSchema, type WorkbookLesson } from '@/lib/workbook-schema';

describe('Enhanced Schema Fields', () => {
  describe('New Metadata Fields', () => {
    it('should accept short_answer_hint as optional string', () => {
      const lessonWithHint: Partial<WorkbookLesson> = {
        lesson_title: 'Test Lesson',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'What happened?',
        short_answer_hint: 'Think about the main character\'s actions.',
        writing_prompt: 'Write about...',
      };

      const result = WorkbookLessonSchema.safeParse(lessonWithHint);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.short_answer_hint).toBe('Think about the main character\'s actions.');
      }
    });

    it('should accept writing_plan_prompts as optional array of strings', () => {
      const lessonWithPrompts: Partial<WorkbookLesson> = {
        lesson_title: 'Test Lesson',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'What happened?',
        writing_prompt: 'Write about...',
        writing_plan_prompts: [
          'Who are the main characters?',
          'What is the setting?',
          'What happens in the story?'
        ],
      };

      const result = WorkbookLessonSchema.safeParse(lessonWithPrompts);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.writing_plan_prompts).toHaveLength(3);
        expect(result.data.writing_plan_prompts?.[0]).toBe('Who are the main characters?');
      }
    });

    it('should accept reflection_focus as optional string', () => {
      const lessonWithReflection: Partial<WorkbookLesson> = {
        lesson_title: 'Test Lesson',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'What happened?',
        writing_prompt: 'Write about...',
        reflection_focus: 'How did this lesson change your understanding of the topic?',
      };

      const result = WorkbookLessonSchema.safeParse(lessonWithReflection);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reflection_focus).toBe('How did this lesson change your understanding of the topic?');
      }
    });

    it('should validate lesson with all new fields together', () => {
      const fullLesson: Partial<WorkbookLesson> = {
        lesson_title: 'Complete Test Lesson',
        vocabulary: [{ word: 'example', definition: 'a sample' }],
        article_paragraphs: [{ number: 1, text: 'This is a test.' }],
        comprehension_questions: [
          { number: 1, question: 'What is this?', options: ['A', 'B', 'C'] }
        ],
        short_answer_question: 'Explain the concept.',
        short_answer_hint: 'Consider the definition and usage.',
        writing_prompt: 'Write a paragraph about...',
        writing_plan_prompts: [
          'What is your main idea?',
          'What examples will you use?',
          'How will you conclude?'
        ],
        reflection_focus: 'What did you learn from this lesson?',
      };

      const result = WorkbookLessonSchema.safeParse(fullLesson);
      expect(result.success).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should validate lesson without new fields (backward compatibility)', () => {
      const oldLesson: Partial<WorkbookLesson> = {
        lesson_title: 'Old Format Lesson',
        vocabulary: [{ word: 'test', definition: 'a trial' }],
        article_paragraphs: [{ number: 1, text: 'Old content.' }],
        comprehension_questions: [
          { number: 1, question: 'Old question?', options: ['A', 'B'] }
        ],
        short_answer_question: 'Old short answer?',
        writing_prompt: 'Old writing prompt',
      };

      const result = WorkbookLessonSchema.safeParse(oldLesson);
      expect(result.success).toBe(true);
    });

    it('should have undefined values for new fields when not provided', () => {
      const oldLesson: Partial<WorkbookLesson> = {
        lesson_title: 'Old Format Lesson',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'Test?',
        writing_prompt: 'Write...',
      };

      const result = WorkbookLessonSchema.safeParse(oldLesson);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.short_answer_hint).toBeUndefined();
        expect(result.data.writing_plan_prompts).toBeUndefined();
        expect(result.data.reflection_focus).toBeUndefined();
      }
    });
  });

  describe('Type Safety', () => {
    it('should reject non-string value for short_answer_hint', () => {
      const invalidLesson = {
        lesson_title: 'Test',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'Test?',
        writing_prompt: 'Write...',
        short_answer_hint: 123, // Invalid: number instead of string
      };

      const result = WorkbookLessonSchema.safeParse(invalidLesson);
      expect(result.success).toBe(false);
    });

    it('should reject non-array value for writing_plan_prompts', () => {
      const invalidLesson = {
        lesson_title: 'Test',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'Test?',
        writing_prompt: 'Write...',
        writing_plan_prompts: 'not an array', // Invalid: string instead of array
      };

      const result = WorkbookLessonSchema.safeParse(invalidLesson);
      expect(result.success).toBe(false);
    });

    it('should reject non-string elements in writing_plan_prompts array', () => {
      const invalidLesson = {
        lesson_title: 'Test',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: 'Test?',
        writing_prompt: 'Write...',
        writing_plan_prompts: ['Valid prompt', 123, 'Another prompt'], // Invalid: number in array
      };

      const result = WorkbookLessonSchema.safeParse(invalidLesson);
      expect(result.success).toBe(false);
    });
  });
});

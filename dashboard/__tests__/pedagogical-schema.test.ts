import { describe, it, expect } from 'vitest';
import { WorkbookLessonSchema, type WorkbookLesson } from '@/lib/workbook-schema';

describe('Pedagogical Connectors Schema', () => {
  it('should accept connection_question as optional string', () => {
    const lesson: Partial<WorkbookLesson> = {
      lesson_title: 'Pedagogy Test',
      vocabulary: [],
      article_paragraphs: [],
      comprehension_questions: [],
      short_answer_question: 'Q',
      writing_prompt: 'Prompt',
      // @ts-expect-error - Field not yet mapped - Field not yet in schema
      connection_question: 'What do you know about this topic?',
    };

    const result = WorkbookLessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
    if (result.success) {
      // @ts-expect-error - Field not yet mapped - Field not yet in schema type
      expect(result.data.connection_question).toBe('What do you know about this topic?');
    }
  });

  it('should accept grammar_search_term as optional string', () => {
    const lesson: Partial<WorkbookLesson> = {
      lesson_title: 'Pedagogy Test',
      vocabulary: [],
      article_paragraphs: [],
      comprehension_questions: [],
      short_answer_question: 'Q',
      writing_prompt: 'Prompt',
      // @ts-expect-error - Field not yet mapped - Field not yet in schema
      grammar_search_term: 'Find a past tense verb.',
    };

    const result = WorkbookLessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
    if (result.success) {
      // @ts-expect-error - Field not yet mapped
      expect(result.data.grammar_search_term).toBe('Find a past tense verb.');
    }
  });

  it('should accept discussion_question as optional string', () => {
    const lesson: Partial<WorkbookLesson> = {
      lesson_title: 'Pedagogy Test',
      vocabulary: [],
      article_paragraphs: [],
      comprehension_questions: [],
      short_answer_question: 'Q',
      writing_prompt: 'Prompt',
      // @ts-expect-error - Field not yet mapped
      discussion_question: 'Discuss with a partner.',
    };

    const result = WorkbookLessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
    if (result.success) {
      // @ts-expect-error - Field not yet mapped
      expect(result.data.discussion_question).toBe('Discuss with a partner.');
    }
  });

  it('should accept writing_sentence_frames as optional array of strings', () => {
    const lesson: Partial<WorkbookLesson> = {
      lesson_title: 'Pedagogy Test',
      vocabulary: [],
      article_paragraphs: [],
      comprehension_questions: [],
      short_answer_question: 'Q',
      writing_prompt: 'Prompt',
      // @ts-expect-error - Field not yet mapped
      writing_sentence_frames: ['I think that...', 'Another reason is...'],
    };

    const result = WorkbookLessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
    if (result.success) {
      // @ts-expect-error - Field not yet mapped
      expect(result.data.writing_sentence_frames).toHaveLength(2);
      // @ts-expect-error - Field not yet mapped
      expect(result.data.writing_sentence_frames[0]).toBe('I think that...');
    }
  });
});

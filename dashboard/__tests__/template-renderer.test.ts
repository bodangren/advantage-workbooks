import { describe, it, expect, beforeEach } from 'vitest';
import { renderLessonTemplate, renderMultipleLessons } from '@/lib/template-renderer';
import type { WorkbookLesson } from '@/lib/workbook-schema';

describe('Template Renderer Tests', () => {
  const mockLesson: WorkbookLesson = {
    lesson_title: 'Test Lesson',
    lesson_number: 'Lesson 1',
    level_name: 'Origins',
    cefr_level: 'A1',
    article_type: 'Article',
    genre: 'Fiction',
    vocabulary: [
      { word: 'test', phonetic: '/tɛst/', definition: 'a trial' }
    ],
    article_paragraphs: [
      { number: 1, text: 'This is a test paragraph.' }
    ],
    comprehension_questions: [
      { number: 1, question: 'What is this?', options: ['A', 'B', 'C'] }
    ],
    short_answer_question: 'Why is this important?',
    writing_prompt: 'Write about testing.',
    sentence_starters: ['I think that...', 'In my opinion...'],
    vocab_match: [
      { number: 1, word: 'test', letter: 'A', definition: 'a trial' }
    ],
    vocab_fill: [
      { number: 1, sentence: 'This is a _____.' }
    ],
    vocab_word_bank: ['test', 'example', 'sample'],
    sentence_order_questions: [
      { words: ['The', 'test', 'is', 'good'] }
    ],
    sentence_completion_prompts: [
      { number: 1, prompt: 'Complete this...' }
    ],
    mc_answers: [
      { number: 1, letter: 'A', text: 'Test' }
    ],
    vocab_match_answer_string: '1-A',
    vocab_fill_answer_string: 'test',
    sentence_order_answers: [
      { number: 1, sentence: 'The test is good' }
    ],
    translation_paragraphs: [
      { label: 'English', text: 'Hello' },
      { label: 'Thai', text: 'สวัสดี' }
    ]
  };

  describe('renderLessonTemplate', () => {
    it('should render a single lesson as HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('Test Lesson');
      expect(html).toContain('Lesson 1');
    });

    it('should include lesson title in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('Test Lesson');
    });

    it('should include article paragraphs in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('This is a test paragraph');
    });

    it('should include vocabulary in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('test');
    });

    it('should include comprehension questions in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('What is this?');
    });

    it('should include writing prompt in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('Write about testing');
    });

    it('should include lesson metadata (CEFR level) in rendered HTML', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('A1');
    });

    it('should handle lesson with minimal required fields', async () => {
      const minimalLesson: WorkbookLesson = {
        lesson_title: 'Minimal',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: '',
        writing_prompt: ''
      };

      const html = await renderLessonTemplate(minimalLesson);
      expect(html).toContain('Minimal');
    });

    it('should include sentence starters if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('I think that');
      expect(html).toContain('In my opinion');
    });

    it('should include vocabulary match items if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('test');
      expect(html).toContain('a trial');
    });

    it('should include vocabulary fill items if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('This is a');
    });

    it('should include word bank if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('test');
      expect(html).toContain('example');
      expect(html).toContain('sample');
    });

    it('should include sentence order questions if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('The');
      expect(html).toContain('test');
      expect(html).toContain('is');
      expect(html).toContain('good');
    });

    it('should include translation paragraphs if provided', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('Hello');
      expect(html).toContain('สวัสดี');
    });
  });

  describe('renderMultipleLessons', () => {
    it('should render multiple lessons as concatenated HTML', async () => {
      const lessons: WorkbookLesson[] = [
        { ...mockLesson, lesson_title: 'Lesson 1' },
        { ...mockLesson, lesson_title: 'Lesson 2' }
      ];

      const html = await renderMultipleLessons(lessons);
      expect(html).toContain('Lesson 1');
      expect(html).toContain('Lesson 2');
    });

    it('should preserve sequential numbering across multiple lessons', async () => {
      const lessons: WorkbookLesson[] = [
        { ...mockLesson, lesson_title: 'Lesson 1' },
        { ...mockLesson, lesson_title: 'Lesson 2' }
      ];

      const html = await renderMultipleLessons(lessons);
      expect(html).toContain('Lesson 1');
      expect(html).toContain('Lesson 2');
    });

    it('should handle empty array of lessons', async () => {
      const html = await renderMultipleLessons([]);
      expect(html).toBeDefined();
    });

    it('should inject series metadata into all lessons', async () => {
      const lessons: WorkbookLesson[] = [
        { ...mockLesson, lesson_title: 'Lesson 1' }
      ];

      const html = await renderMultipleLessons(lessons, {
        seriesName: 'Test Series',
        seriesLevel: 'A1',
        seriesTagline: 'Learning Made Fun'
      });

      expect(html).toContain('Test Series');
      expect(html).toContain('A1');
    });
  });
});

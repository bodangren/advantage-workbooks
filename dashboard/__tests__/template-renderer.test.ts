import { describe, it, expect, beforeEach } from 'vitest';
import { renderLessonTemplate, renderMultipleLessons, clearTemplateCache } from '@/lib/template-renderer';
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

    it('should render article images by position buckets', async () => {
      const lessonWithImages: WorkbookLesson = {
        ...mockLesson,
        article_images: [
          { url: 'https://example.com/hero.jpg', caption: 'Hero image', position: 'hero' },
          { url: 'https://example.com/vocab.jpg', caption: 'Vocab image', position: 'vocabulary' },
          { url: 'https://example.com/inline.jpg', caption: 'Inline image', position: 'inline-para-1' },
          { url: 'https://example.com/writing.jpg', caption: 'Writing image', position: 'writing-prompt' },
        ],
      };

      const html = await renderLessonTemplate(lessonWithImages);
      expect(html).toContain('https://example.com/hero.jpg');
      expect(html).toContain('https://example.com/vocab.jpg');
      expect(html).toContain('https://example.com/inline.jpg');
      expect(html).toContain('https://example.com/writing.jpg');
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

  describe('template selection by workbook type', () => {
    beforeEach(() => {
      clearTemplateCache();
    });

    it('loads secondary template when type is secondary', async () => {
      const html = await renderLessonTemplate(mockLesson, { type: 'secondary' });
      expect(html).toContain('template-variant-secondary');
    });

    it('loads primary template when type is primary', async () => {
      const html = await renderLessonTemplate(mockLesson, { type: 'primary' });
      expect(html).toContain('template-variant-primary');
    });

    it('defaults to secondary template when type is omitted', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).toContain('template-variant-secondary');
    });
  });

  describe('phonics_focus field', () => {
    beforeEach(() => {
      clearTemplateCache();
    });

    it('renders phonics_focus in primary template when present', async () => {
      const lessonWithPhonics: WorkbookLesson = {
        ...mockLesson,
        phonics_focus: 'Long vowel oo sound',
      };
      const html = await renderLessonTemplate(lessonWithPhonics, { type: 'primary' });
      expect(html).toContain('Phonics Focus');
      expect(html).toContain('Long vowel oo sound');
    });

    it('does not render phonics_focus block when field is absent in primary', async () => {
      const html = await renderLessonTemplate(mockLesson, { type: 'primary' });
      expect(html).not.toContain('Phonics Focus');
    });

    it('does not render phonics_focus in secondary template', async () => {
      const lessonWithPhonics: WorkbookLesson = {
        ...mockLesson,
        phonics_focus: 'Long vowel oo sound',
      };
      const html = await renderLessonTemplate(lessonWithPhonics, { type: 'secondary' });
      expect(html).not.toContain('Phonics Focus');
    });
  });

  describe('QR code integration', () => {
    it('should auto-generate QR code when article_url exists but qr_code_url is not set', async () => {
      const lessonWithArticleUrl: WorkbookLesson = {
        ...mockLesson,
        article_url: 'https://example.com/article/123'
      };

      const html = await renderLessonTemplate(lessonWithArticleUrl);
      expect(html).toContain('data:image/svg+xml;base64,');
    });

    it('should preserve manual qr_code_url over auto-generation', async () => {
      const lessonWithManualQR: WorkbookLesson = {
        ...mockLesson,
        article_url: 'https://example.com/article/123',
        qr_code_url: 'https://example.com/manual-qr.png'
      } as WorkbookLesson & { qr_code_url: string };

      const html = await renderLessonTemplate(lessonWithManualQR);
      expect(html).toContain('https://example.com/manual-qr.png');
      expect(html).not.toContain('data:image/svg+xml;base64,');
    });

    it('should not generate QR code when article_url is missing', async () => {
      const html = await renderLessonTemplate(mockLesson);
      expect(html).not.toContain('data:image/svg+xml;base64,');
    });

    it('should generate QR codes in multiple lessons', async () => {
      const lessons: WorkbookLesson[] = [
        { ...mockLesson, lesson_title: 'Lesson 1', article_url: 'https://example.com/1' },
        { ...mockLesson, lesson_title: 'Lesson 2', article_url: 'https://example.com/2' }
      ];

      const html = await renderMultipleLessons(lessons);
      const qrCount = (html.match(/data:image\/svg\+xml;base64,/g) || []).length;
      expect(qrCount).toBe(2);
    });
  });
});

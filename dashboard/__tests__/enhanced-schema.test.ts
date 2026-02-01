import { describe, it, expect } from 'vitest';
import { WorkbookLessonSchema, ArticleImageSchema, type WorkbookLesson, type ArticleImage } from '@/lib/workbook-schema';

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

  describe('Multi-Image Support', () => {
    describe('ArticleImageSchema', () => {
      it('should validate image object with all required fields', () => {
        const image: ArticleImage = {
          url: 'images/test-image.jpg',
          caption: 'A test image',
          position: 'hero',
        };

        const result = ArticleImageSchema.safeParse(image);
        expect(result.success).toBe(true);
      });

      it('should accept valid position values', () => {
        const positions = ['hero', 'inline-para-1', 'inline-para-2', 'inline-para-3'];

        positions.forEach(position => {
          const image = {
            url: 'images/test.jpg',
            caption: 'Test',
            position,
          };
          const result = ArticleImageSchema.safeParse(image);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid position values', () => {
        const image = {
          url: 'images/test.jpg',
          caption: 'Test',
          position: 'invalid-position',
        };

        const result = ArticleImageSchema.safeParse(image);
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const invalidImages = [
          { caption: 'No URL', position: 'hero' },
          { url: 'images/test.jpg', position: 'hero' }, // Missing caption
          { url: 'images/test.jpg', caption: 'No position' },
        ];

        invalidImages.forEach(image => {
          const result = ArticleImageSchema.safeParse(image);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('WorkbookLesson with article_images', () => {
      it('should accept article_images array with valid images', () => {
        const lesson: Partial<WorkbookLesson> = {
          lesson_title: 'Multi-Image Lesson',
          vocabulary: [],
          article_paragraphs: [],
          comprehension_questions: [],
          short_answer_question: 'Test?',
          writing_prompt: 'Write...',
          article_images: [
            { url: 'images/hero.jpg', caption: 'Main image', position: 'hero' },
            { url: 'images/inline1.jpg', caption: 'First inline', position: 'inline-para-1' },
            { url: 'images/inline2.jpg', caption: 'Second inline', position: 'inline-para-2' },
          ],
        };

        const result = WorkbookLessonSchema.safeParse(lesson);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.article_images).toHaveLength(3);
          expect(result.data.article_images?.[0].position).toBe('hero');
        }
      });

      it('should maintain backward compatibility with article_image_url', () => {
        const oldLesson: Partial<WorkbookLesson> = {
          lesson_title: 'Old Format',
          vocabulary: [],
          article_paragraphs: [],
          comprehension_questions: [],
          short_answer_question: 'Test?',
          writing_prompt: 'Write...',
          article_image_url: 'images/old-single-image.jpg',
          article_caption: 'Old single image caption',
        };

        const result = WorkbookLessonSchema.safeParse(oldLesson);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.article_image_url).toBe('images/old-single-image.jpg');
        }
      });

      it('should accept lesson with both old and new image fields', () => {
        const mixedLesson: Partial<WorkbookLesson> = {
          lesson_title: 'Mixed Format',
          vocabulary: [],
          article_paragraphs: [],
          comprehension_questions: [],
          short_answer_question: 'Test?',
          writing_prompt: 'Write...',
          article_image_url: 'images/old-image.jpg',
          article_images: [
            { url: 'images/new-hero.jpg', caption: 'New hero', position: 'hero' },
          ],
        };

        const result = WorkbookLessonSchema.safeParse(mixedLesson);
        expect(result.success).toBe(true);
      });

      it('should accept lesson without any image fields', () => {
        const noImageLesson: Partial<WorkbookLesson> = {
          lesson_title: 'No Images',
          vocabulary: [],
          article_paragraphs: [],
          comprehension_questions: [],
          short_answer_question: 'Test?',
          writing_prompt: 'Write...',
        };

        const result = WorkbookLessonSchema.safeParse(noImageLesson);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.article_images).toBeUndefined();
        }
      });

      it('should reject invalid image objects in article_images array', () => {
        const invalidLesson = {
          lesson_title: 'Invalid Images',
          vocabulary: [],
          article_paragraphs: [],
          comprehension_questions: [],
          short_answer_question: 'Test?',
          writing_prompt: 'Write...',
          article_images: [
            { url: 'images/valid.jpg', caption: 'Valid', position: 'hero' },
            { url: 'images/invalid.jpg', caption: 'Invalid', position: 'bad-position' },
          ],
        };

        const result = WorkbookLessonSchema.safeParse(invalidLesson);
        expect(result.success).toBe(false);
      });
    });
  });
});

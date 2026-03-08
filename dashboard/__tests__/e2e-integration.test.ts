import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createProject, listProjects, writeLesson, readLesson, listLessons } from '@/lib/filesystem';
import { uploadImage, listImages } from '@/lib/image-handler';
import { renderMultipleLessons } from '@/lib/template-renderer';
import { wrapWorkbookDocument, type TocEntry } from '@/lib/workbook-document-wrapper';
import { getPrefaceByCefrLevel } from '@/lib/preface-loader';
import type { WorkbookLesson } from '@/lib/workbook-schema';

describe('End-to-End Integration Tests', () => {
  let testWorkbooksRoot: string;
  let testProjectName: string;

  beforeEach(async () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    testProjectName = `test-e2e-${timestamp}-${random}`;
    testWorkbooksRoot = path.join(os.tmpdir(), `test-workbooks-${timestamp}-${random}`);

    process.env.WORKBOOKS_ROOT = testWorkbooksRoot;

    await fs.mkdir(testWorkbooksRoot, { recursive: true });
    await fs.mkdir(path.join(testWorkbooksRoot, 'secondary'), { recursive: true });
    await fs.mkdir(path.join(testWorkbooksRoot, 'primary'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testWorkbooksRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should use os.tmpdir() for test directories', () => {
    expect(testWorkbooksRoot.startsWith(os.tmpdir())).toBe(true);
    expect(testWorkbooksRoot).not.toContain('Workbooks');
  });

  describe('Full Workflow: Project Creation to PDF Export', () => {
    it('should complete full workflow from project creation to batch compilation', async () => {
      // Step 1: Create a new project
      const project = await createProject(testProjectName);
      expect(project.id).toBe(testProjectName.toLowerCase().replace(/\s+/g, '-'));
      expect(project.name).toBe(testProjectName);

      // Verify project exists
      const projects = await listProjects();
      const createdProject = projects.find(p => p.id === project.id);
      expect(createdProject).toBeDefined();

      // Step 2: Upload an image for the lesson
      const imageBuffer = Buffer.from('fake-image-data-for-article');
      const uploadResult = await uploadImage(project.id, imageBuffer, 'article-image.jpg');
      expect(uploadResult.url).toMatch(/^images\/article-image-\d+\.jpg$/);

      // Verify image was uploaded
      const images = await listImages(project.id);
      expect(images).toHaveLength(1);
      expect(images[0].filename).toBe(uploadResult.filename);

      // Step 3: Create a lesson with all required fields
      const lesson1: WorkbookLesson = {
        lesson_number: 'Lesson 1',
        lesson_title: 'Test Lesson',
        level_name: 'Origins',
        cefr_level: 'A1',
        article_type: 'Informational',
        genre: 'Science',
        vocabulary: [
          { word: 'test', definition: 'a procedure to assess knowledge', phonetic: '/test/' },
          { word: 'learn', definition: 'to acquire knowledge', phonetic: '/lɜːrn/' },
        ],
        article_image_url: uploadResult.url,
        article_caption: 'Test image caption',
        article_url: 'https://example.com/article',
        article_paragraphs: [
          { number: 1, text: 'This is the first paragraph of the test article.' },
          { number: 2, text: 'This is the second paragraph with more content.' },
        ],
        comprehension_questions: [
          {
            number: 1,
            question: 'What is this article about?',
            options: ['Testing', 'Learning', 'Both', 'Neither'],
          },
          {
            number: 2,
            question: 'How many paragraphs are there?',
            options: ['One', 'Two', 'Three', 'Four'],
          },
        ],
        short_answer_question: 'What did you learn from this article?',
        sentence_starters: ['I learned that...', 'The article explains...'],
        writing_prompt: 'Write about what you learned in this lesson.',
      };

      await writeLesson(project.id, 'content_lesson_1', lesson1);

      // Step 4: Create a second lesson
      const lesson2: WorkbookLesson = {
        ...lesson1,
        lesson_number: 'Lesson 2',
        lesson_title: 'Second Test Lesson',
        article_paragraphs: [
          { number: 1, text: 'This is lesson 2, paragraph 1.' },
          { number: 2, text: 'This is lesson 2, paragraph 2.' },
        ],
      };

      await writeLesson(project.id, 'content_lesson_2', lesson2);

      // Step 5: Verify lessons were created
      const lessons = await listLessons(project.id);
      expect(lessons).toHaveLength(2);
      expect(lessons.map(l => l.id).sort()).toEqual(['content_lesson_1', 'content_lesson_2']);

      // Step 6: Read back a lesson to verify data integrity
      const readLesson1 = await readLesson(project.id, 'content_lesson_1');
      expect(readLesson1.lesson_title).toBe('Test Lesson');
      expect(readLesson1.article_image_url).toBe(uploadResult.url);
      expect(readLesson1.vocabulary).toHaveLength(2);

      // Step 7: Perform batch compilation
      const loadedLessons = [];
      for (const lessonFile of lessons) {
        const lesson = await readLesson(project.id, lessonFile.id);
        loadedLessons.push(lesson as WorkbookLesson);
      }

      const compiledHtml = await renderMultipleLessons(loadedLessons);

      // Verify compilation output
      expect(compiledHtml).toContain('Test Lesson');
      expect(compiledHtml).toContain('Second Test Lesson');
      expect(compiledHtml).toContain('This is the first paragraph');
      expect(compiledHtml).toContain('This is lesson 2, paragraph 1');
      expect(compiledHtml).toContain('test'); // vocabulary word
      expect(compiledHtml).toContain('learn'); // vocabulary word

      // Step 8: Verify image reference in compiled HTML
      expect(compiledHtml).toContain(uploadResult.url);
    });

    it('should handle project with no lessons gracefully', async () => {
      const project = await createProject(testProjectName);
      const lessons = await listLessons(project.id);
      expect(lessons).toEqual([]);
    });

    it('should maintain data integrity after multiple read/write cycles', async () => {
      const project = await createProject(testProjectName);

      const originalLesson: WorkbookLesson = {
        lesson_title: 'Integrity Test',
        vocabulary: [{ word: 'integrity', definition: 'the quality of being honest' }],
        article_paragraphs: [{ number: 1, text: 'Testing data integrity.' }],
        comprehension_questions: [
          {
            number: 1,
            question: 'What are we testing?',
            options: ['Integrity', 'Speed', 'Design', 'None'],
          },
        ],
        short_answer_question: 'Explain integrity.',
        writing_prompt: 'Write about integrity.',
      };

      // Write lesson
      await writeLesson(project.id, 'integrity_test', originalLesson);

      // Read it back multiple times
      for (let i = 0; i < 3; i++) {
        const readBack = await readLesson(project.id, 'integrity_test');
        expect(readBack.lesson_title).toBe(i === 0 ? 'Integrity Test' : `Integrity Test ${i}`);
        expect(readBack.vocabulary).toHaveLength(1);
        expect(readBack.article_paragraphs).toHaveLength(1);

        // Modify and write back
        readBack.lesson_title = `Integrity Test ${i + 1}`;
        await writeLesson(project.id, 'integrity_test', readBack);

        // Read again to verify
        const modified = await readLesson(project.id, 'integrity_test');
        expect(modified.lesson_title).toBe(`Integrity Test ${i + 1}`);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle compilation with invalid lesson data gracefully', async () => {
      const project = await createProject(testProjectName);

      // Create a lesson with minimal valid data
      const minimalLesson: WorkbookLesson = {
        lesson_title: 'Minimal Lesson',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: '',
        writing_prompt: '',
      };

      await writeLesson(project.id, 'minimal', minimalLesson);

      const lessons = await listLessons(project.id);
      const loadedLessons = [];
      for (const lessonFile of lessons) {
        const lesson = await readLesson(project.id, lessonFile.id);
        loadedLessons.push(lesson as WorkbookLesson);
      }

      // Should not throw, even with minimal data
      const compiledHtml = await renderMultipleLessons(loadedLessons);
      // With minimal data, the HTML might be empty or minimal
      expect(compiledHtml).toBeDefined();
      expect(typeof compiledHtml).toBe('string');
    });

    it('should handle special characters in project names', async () => {
      const specialName = 'Test Project 2024';
      const project = await createProject(specialName);

      // Project ID should be lowercase with spaces replaced by hyphens
      expect(project.id).toBe('test-project-2024');

      // Should be able to create and read lessons
      const lesson: WorkbookLesson = {
        lesson_title: 'Special Chars Test',
        vocabulary: [],
        article_paragraphs: [],
        comprehension_questions: [],
        short_answer_question: '',
        writing_prompt: '',
      };

      await writeLesson(project.id, 'test', lesson);
      const readBack = await readLesson(project.id, 'test');
      expect(readBack.lesson_title).toBe('Special Chars Test');
    });
  });

  describe('Full Document Compilation with Title Page and TOC', () => {
    it('should generate complete workbook document with all sections', async () => {
      const project = await createProject(testProjectName);

      const lesson1: WorkbookLesson = {
        lesson_number: 'Lesson 1',
        lesson_title: 'First Article',
        level_name: 'Origins',
        cefr_level: 'A1',
        article_type: 'Informational',
        genre: 'Science',
        article_url: 'https://example.com/article/1',
        vocabulary: [{ word: 'test', definition: 'a test', phonetic: '/test/' }],
        article_paragraphs: [{ number: 1, text: 'Content for lesson 1.' }],
        comprehension_questions: [{ number: 1, question: 'Test?', options: ['A', 'B'] }],
        short_answer_question: 'Answer?',
        writing_prompt: 'Write!',
      };

      const lesson2: WorkbookLesson = {
        ...lesson1,
        lesson_number: 'Lesson 2',
        lesson_title: 'Second Article',
        article_url: 'https://example.com/article/2',
        article_paragraphs: [{ number: 1, text: 'Content for lesson 2.' }],
      };

      await writeLesson(project.id, 'content_1', lesson1);
      await writeLesson(project.id, 'content_2', lesson2);

      const lessons = await listLessons(project.id);
      const loadedLessons = [];
      for (const lessonFile of lessons) {
        const lesson = await readLesson(project.id, lessonFile.id);
        loadedLessons.push(lesson as WorkbookLesson);
      }

      const lessonsHtml = await renderMultipleLessons(loadedLessons);

      const tocEntries: TocEntry[] = loadedLessons.map((lesson, i) => ({
        id: `lesson-${i}`,
        title: `${(lesson as WorkbookLesson).lesson_number}: ${(lesson as WorkbookLesson).lesson_title}`,
        genre: (lesson as WorkbookLesson).genre,
        articleType: (lesson as WorkbookLesson).article_type,
      }));

      const fullHtml = wrapWorkbookDocument(lessonsHtml, tocEntries, {
        seriesName: 'Origins 3.1',
        seriesLevel: 'A1',
        seriesTagline: 'Learning Made Fun',
        prefaceText: getPrefaceByCefrLevel('A1')?.text,
      });

      expect(fullHtml).toContain('<!DOCTYPE html>');
      expect(fullHtml).toContain('cover-page');
      expect(fullHtml).toContain('Origins 3.1');
      expect(fullHtml).toContain('Level A1');
      expect(fullHtml).toContain('section-preface');
      expect(fullHtml).toContain('section-toc');
      expect(fullHtml).toContain('Table of Contents');
      expect(fullHtml).toContain('lesson-0');
      expect(fullHtml).toContain('First Article');
      expect(fullHtml).toContain('Second Article');
      expect(fullHtml).toContain('paged.polyfill.js');
      expect(fullHtml).toContain('@page');
    });

    it('should include QR codes in compiled output when article_url exists', async () => {
      const lesson: WorkbookLesson = {
        lesson_title: 'QR Test',
        article_url: 'https://example.com/test-article',
        vocabulary: [],
        article_paragraphs: [{ number: 1, text: 'Test content' }],
        comprehension_questions: [],
        short_answer_question: '',
        writing_prompt: '',
      };

      const compiledHtml = await renderMultipleLessons([lesson]);

      expect(compiledHtml).toContain('data:image/svg+xml;base64,');
    });

    it('should generate TOC with correct number of entries', async () => {
      const loadedLessons: WorkbookLesson[] = [];
      for (let i = 1; i <= 5; i++) {
        loadedLessons.push({
          lesson_number: `Lesson ${i}`,
          lesson_title: `Article ${i}`,
          genre: 'Fiction',
          article_type: 'Story',
          vocabulary: [],
          article_paragraphs: [{ number: 1, text: `Content ${i}` }],
          comprehension_questions: [],
          short_answer_question: '',
          writing_prompt: '',
        });
      }

      const lessonsHtml = await renderMultipleLessons(loadedLessons);
      const tocEntries: TocEntry[] = loadedLessons.map((lesson, i) => ({
        id: `lesson-${i}`,
        title: `${lesson.lesson_number}: ${lesson.lesson_title}`,
      }));

      const fullHtml = wrapWorkbookDocument(lessonsHtml, tocEntries, {
        seriesName: 'Test',
        seriesLevel: 'A1',
        seriesTagline: 'Test',
      });

      const tocMatches = fullHtml.match(/<li class="toc-item">/g);
      expect(tocMatches).toHaveLength(5);

      for (let i = 1; i <= 5; i++) {
        expect(fullHtml).toContain(`Article ${i}`);
      }
    });

    it('should include Paged.js target-counter for TOC page numbers', () => {
      const lessonsHtml = '<div id="lesson-0">Test content</div>';
      const fullHtml = wrapWorkbookDocument(lessonsHtml, [{ id: 'lesson-0', title: 'Test' }], {
        seriesName: 'Test',
        seriesLevel: 'A1',
        seriesTagline: 'Test',
      });

      expect(fullHtml).toContain('target-counter');
      expect(fullHtml).toContain("content: target-counter(attr(href), page)");
    });
  });
});

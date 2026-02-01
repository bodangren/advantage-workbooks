import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs/promises';
import { listProjects, listLessons, readLesson, writeLesson, createProject } from '@/lib/filesystem';

describe('File System API Tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('listProjects', () => {
    it('should return list of workbook projects', async () => {
      const projects = await listProjects();
      expect(Array.isArray(projects)).toBe(true);
    });

    it('should exclude hidden directories and node_modules', async () => {
      const projects = await listProjects();
      projects.forEach(project => {
        expect(project.name.startsWith('.')).toBe(false);
        expect(project.name).not.toBe('node_modules');
      });
    });
  });

  describe('listLessons', () => {
    it('should return array of lesson files', async () => {
      const lessons = await listLessons('Origins 3.1');
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent project', async () => {
      await expect(listLessons('nonexistent-project')).rejects.toThrow('not found');
    });
  });

  describe('readLesson', () => {
    it('should return lesson data for valid lesson', async () => {
      const lesson = await readLesson('Origins 3.1', '01-The_Library_Map_workbook');
      expect(lesson).toHaveProperty('lesson_title');
      expect(lesson).toHaveProperty('cefr_level');
    });

    it('should return 404 for non-existent lesson', async () => {
      await expect(readLesson('Origins 3.1', 'nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('writeLesson', () => {
    it('should write lesson data successfully', async () => {
      const testLesson = {
        lesson_title: 'Test Lesson',
        cefr_level: 'A1',
        article_paragraphs: [
          { number: 1, text: 'Test paragraph' }
        ],
        vocabulary: [
          { word: 'test', definition: 'a trial or examination' }
        ],
        comprehension_questions: [
          { number: 1, question: 'What is this?', options: ['A', 'B', 'C'] }
        ],
        writing_prompt: 'Write about testing.'
      };

      await writeLesson('Origins 3.1', 'test_lesson', testLesson);
      const readBack = await readLesson('Origins 3.1', 'test_lesson');
      expect(readBack.lesson_title).toBe('Test Lesson');

      await fs.unlink('/home/daniel-bo/Downloads/Workbooks/Origins 3.1/test_lesson.json');
    });
  });

  describe('createProject', () => {
    it('should create new project directory', async () => {
      const project = await createProject('Test Project');
      expect(project.id).toBe('test-project');
      expect(project.name).toBe('Test Project');
      expect(project.path).toContain('test-project');

      await fs.rmdir('/home/daniel-bo/Downloads/Workbooks/test-project');
    });
  });
});

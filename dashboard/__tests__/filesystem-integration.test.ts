import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { listProjects, listLessons, readLesson, writeLesson, createProject } from '@/lib/filesystem';

describe('File System API Tests', () => {
  let testRoot: string;
  let testProjectId: string;

  beforeEach(async () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    testRoot = path.join(os.tmpdir(), `test-fs-integration-${timestamp}-${random}`);
    process.env.WORKBOOKS_ROOT = testRoot;

    // Create required subdirectories
    await fs.mkdir(path.join(testRoot, 'secondary'), { recursive: true });
    await fs.mkdir(path.join(testRoot, 'primary'), { recursive: true });

    // Create a test project with lesson data
    testProjectId = 'origins-3.1-a1';
    const projectPath = path.join(testRoot, 'secondary', testProjectId);
    await fs.mkdir(projectPath, { recursive: true });
    await fs.writeFile(
      path.join(projectPath, 'project.json'),
      JSON.stringify({ seriesName: 'Origins', levelNumber: '3.1', cefrLevel: 'A1', type: 'secondary' })
    );
    await fs.writeFile(
      path.join(projectPath, 'content_01_test_workbook.json'),
      JSON.stringify({
        lesson_title: 'Test Lesson',
        cefr_level: 'A1',
        article_paragraphs: [{ number: 1, text: 'Test paragraph' }],
        vocabulary: [{ word: 'test', definition: 'a trial' }],
        comprehension_questions: [{ number: 1, question: 'What?', options: ['A', 'B', 'C'] }],
        writing_prompt: 'Write about testing.',
      })
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testRoot, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('listProjects', () => {
    it('should return list of workbook projects', async () => {
      const projects = await listProjects();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
    });

    it('should exclude hidden directories and node_modules', async () => {
      // Create some directories that should be excluded
      await fs.mkdir(path.join(testRoot, 'secondary', '.hidden-dir'), { recursive: true });
      await fs.mkdir(path.join(testRoot, 'secondary', 'node_modules'), { recursive: true });

      const projects = await listProjects();
      projects.forEach(project => {
        expect(project.name.startsWith('.')).toBe(false);
        expect(project.name).not.toBe('node_modules');
      });
    });
  });

  describe('listLessons', () => {
    it('should return array of lesson files', async () => {
      const lessons = await listLessons(testProjectId);
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent project', async () => {
      await expect(listLessons('nonexistent-project')).rejects.toThrow('not found');
    });
  });

  describe('readLesson', () => {
    it('should return lesson data for valid lesson', async () => {
      const lesson = await readLesson(testProjectId, 'content_01_test_workbook');
      expect(lesson).toHaveProperty('lesson_title');
      expect(lesson).toHaveProperty('cefr_level');
    });

    it('should return 404 for non-existent lesson', async () => {
      await expect(readLesson(testProjectId, 'nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('writeLesson', () => {
    it('should write lesson data successfully', async () => {
      const testLesson = {
        lesson_title: 'Test Lesson Write',
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

      await writeLesson(testProjectId, 'content_test_lesson', testLesson as any);
      const readBack = await readLesson(testProjectId, 'content_test_lesson');
      expect(readBack.lesson_title).toBe('Test Lesson Write');
    });
  });

  describe('createProject', () => {
    it('should create new project directory', async () => {
      const project = await createProject('Test Project');
      expect(project.id).toBe('test-project');
      expect(project.name).toBe('Test Project');
      expect(project.path).toContain('secondary');
      expect(project.type).toBe('secondary');
    });

    it('should create project with metadata options', async () => {
      const project = await createProject({
        type: 'primary',
        seriesName: 'Phonics',
        levelNumber: '1.1',
        cefrLevel: 'Pre-A1',
      });
      expect(project.id).toBe('phonics-1.1-pre-a1');
      expect(project.type).toBe('primary');
      expect(project.path).toContain('primary');
    });
  });
});

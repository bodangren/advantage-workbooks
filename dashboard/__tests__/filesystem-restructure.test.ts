import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  listProjects,
  createProject,
  listLessons,
  readLesson,
  writeLesson,
  readProjectMetadata,
  writeProjectMetadata,
  generateProjectId,
} from '@/lib/filesystem';
import type { ProjectMetadata } from '@/lib/filesystem';

describe('Filesystem Restructure: Multi-Series Support', () => {
  let testRoot: string;

  beforeEach(async () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    testRoot = path.join(os.tmpdir(), `test-restructure-${timestamp}-${random}`);
    process.env.WORKBOOKS_ROOT = testRoot;
    await fs.mkdir(testRoot, { recursive: true });
    // Create the required subdirectories
    await fs.mkdir(path.join(testRoot, 'secondary'), { recursive: true });
    await fs.mkdir(path.join(testRoot, 'primary'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testRoot, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('ProjectMetadata type field', () => {
    it('should accept type field in ProjectMetadata', async () => {
      const metadata: ProjectMetadata = {
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
        type: 'secondary',
      };
      expect(metadata.type).toBe('secondary');
    });

    it('should accept primary type', async () => {
      const metadata: ProjectMetadata = {
        seriesName: 'Phonics',
        levelNumber: '1.1',
        cefrLevel: 'Pre-A1',
        type: 'primary',
      };
      expect(metadata.type).toBe('primary');
    });
  });

  describe('generateProjectId', () => {
    it('should generate correct project ID from metadata', () => {
      const id = generateProjectId({
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
      });
      expect(id).toBe('origins-3.1-a1');
    });

    it('should handle multi-word series names', () => {
      const id = generateProjectId({
        seriesName: 'Reading Quest',
        levelNumber: '4.2',
        cefrLevel: 'A2',
      });
      expect(id).toBe('reading-quest-4.2-a2');
    });

    it('should lowercase everything', () => {
      const id = generateProjectId({
        seriesName: 'ADVENTURE',
        levelNumber: '5.1',
        cefrLevel: 'B1',
      });
      expect(id).toBe('adventure-5.1-b1');
    });
  });

  describe('createProject with type and metadata', () => {
    it('should create a secondary project in the secondary/ subdirectory', async () => {
      const project = await createProject({
        type: 'secondary',
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
      });

      expect(project.id).toBe('origins-3.1-a1');
      expect(project.type).toBe('secondary');
      expect(project.path).toContain(path.join('secondary', 'origins-3.1-a1'));

      // Verify directory exists
      const stat = await fs.stat(project.path);
      expect(stat.isDirectory()).toBe(true);

      // Verify metadata was written with type
      const metadata = await readProjectMetadata(project.id);
      expect(metadata).not.toBeNull();
      expect(metadata!.type).toBe('secondary');
      expect(metadata!.seriesName).toBe('Origins');
    });

    it('should create a primary project in the primary/ subdirectory', async () => {
      const project = await createProject({
        type: 'primary',
        seriesName: 'Phonics',
        levelNumber: '1.1',
        cefrLevel: 'Pre-A1',
      });

      expect(project.id).toBe('phonics-1.1-pre-a1');
      expect(project.type).toBe('primary');
      expect(project.path).toContain(path.join('primary', 'phonics-1.1-pre-a1'));
    });
  });

  describe('listProjects with type filtering', () => {
    beforeEach(async () => {
      // Create test projects in both subdirectories
      await createProject({
        type: 'secondary',
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
      });
      await createProject({
        type: 'secondary',
        seriesName: 'Quest',
        levelNumber: '4.1',
        cefrLevel: 'A2',
      });
      await createProject({
        type: 'primary',
        seriesName: 'Phonics',
        levelNumber: '1.1',
        cefrLevel: 'Pre-A1',
      });
    });

    it('should list all projects with type field', async () => {
      const projects = await listProjects();
      expect(projects).toHaveLength(3);
      projects.forEach(p => {
        expect(p.type).toBeDefined();
        expect(['primary', 'secondary']).toContain(p.type);
      });
    });

    it('should filter by secondary type', async () => {
      const projects = await listProjects('secondary');
      expect(projects).toHaveLength(2);
      projects.forEach(p => expect(p.type).toBe('secondary'));
    });

    it('should filter by primary type', async () => {
      const projects = await listProjects('primary');
      expect(projects).toHaveLength(1);
      expect(projects[0].type).toBe('primary');
      expect(projects[0].id).toBe('phonics-1.1-pre-a1');
    });

    it('should ignore non-project directories', async () => {
      // Create some non-project directories
      await fs.mkdir(path.join(testRoot, 'secondary', '.git'), { recursive: true });
      await fs.mkdir(path.join(testRoot, 'secondary', 'node_modules'), { recursive: true });

      const projects = await listProjects('secondary');
      expect(projects).toHaveLength(2);
      projects.forEach(p => {
        expect(p.id).not.toBe('.git');
        expect(p.id).not.toBe('node_modules');
      });
    });
  });

  describe('Path resolution in filesystem functions', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await createProject({
        type: 'secondary',
        seriesName: 'Origins',
        levelNumber: '3.1',
        cefrLevel: 'A1',
      });
      projectId = project.id;
    });

    it('should resolve listLessons() path under secondary/', async () => {
      // Write a lesson file directly
      const projectPath = path.join(testRoot, 'secondary', projectId);
      await fs.writeFile(
        path.join(projectPath, 'content_test.json'),
        JSON.stringify({ lesson_title: 'Test' })
      );

      const lessons = await listLessons(projectId);
      expect(lessons).toHaveLength(1);
      expect(lessons[0].id).toBe('content_test');
    });

    it('should resolve readLesson() path under secondary/', async () => {
      const lessonData = { lesson_title: 'Read Test', vocabulary: [] };
      await writeLesson(projectId, 'content_read_test', lessonData as any);

      const lesson = await readLesson(projectId, 'content_read_test');
      expect(lesson.lesson_title).toBe('Read Test');
    });

    it('should resolve writeLesson() path under secondary/', async () => {
      const lessonData = { lesson_title: 'Write Test', vocabulary: [] };
      await writeLesson(projectId, 'content_write_test', lessonData as any);

      // Verify the file exists in the correct location
      const filePath = path.join(testRoot, 'secondary', projectId, 'content_write_test.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.lesson_title).toBe('Write Test');
    });

    it('should resolve readProjectMetadata() for projects in subdirectories', async () => {
      const metadata = await readProjectMetadata(projectId);
      expect(metadata).not.toBeNull();
      expect(metadata!.seriesName).toBe('Origins');
      expect(metadata!.type).toBe('secondary');
    });

    it('should resolve writeProjectMetadata() for projects in subdirectories', async () => {
      await writeProjectMetadata(projectId, {
        seriesName: 'Origins Updated',
        levelNumber: '3.1',
        cefrLevel: 'A1',
        type: 'secondary',
      });

      const metadata = await readProjectMetadata(projectId);
      expect(metadata!.seriesName).toBe('Origins Updated');
    });

    it('should resolve paths for primary projects too', async () => {
      const primaryProject = await createProject({
        type: 'primary',
        seriesName: 'Phonics',
        levelNumber: '1.1',
        cefrLevel: 'Pre-A1',
      });

      await writeLesson(primaryProject.id, 'content_p1', { lesson_title: 'Primary Lesson' } as any);
      const lesson = await readLesson(primaryProject.id, 'content_p1');
      expect(lesson.lesson_title).toBe('Primary Lesson');
    });
  });
});

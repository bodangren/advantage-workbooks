import fs from 'fs/promises';
import path from 'path';

export interface ProjectMetadata {
  seriesName: string; // e.g., "Origins", "Quest", "Adventure", "Hero", "Legend"
  levelNumber: string; // e.g., "3.1", "4.2", "5.3"
  cefrLevel: string; // e.g., "A1", "A2", "B1", "B2", "C1"
}

export interface WorkbookProject {
  id: string;
  name: string;
  path: string;
  metadata?: ProjectMetadata;
}

export interface LessonFile {
  id: string;
  name: string;
  path: string;
}

export interface WorkbookLesson {
  lesson_title: string;
  cefr_level?: string;
  article_paragraphs: Array<{ number: number; text: string }>;
  vocabulary: Array<{ word: string; definition: string }>;
  comprehension_questions: Array<{ number: number; question: string; options: string[] }>;
  writing_prompt: string;
}

const WORKBOOKS_ROOT = process.env.WORKBOOKS_ROOT || path.resolve(process.cwd(), '..');

export async function listProjects(): Promise<WorkbookProject[]> {
  try {
    const entries = await fs.readdir(WORKBOOKS_ROOT, { withFileTypes: true });
    const projectDirs = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules');

    const projects = await Promise.all(
      projectDirs.map(async (dir) => {
        const metadata = await readProjectMetadata(dir.name);
        return {
          id: dir.name,
          name: dir.name,
          path: path.join(WORKBOOKS_ROOT, dir.name),
          metadata: metadata || undefined,
        };
      })
    );

    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

export async function listLessons(projectId: string): Promise<LessonFile[]> {
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);

  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    const lessons = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .filter(entry => entry.name.startsWith('content_') || entry.name.endsWith('_workbook.json'))
      .map(file => ({
        id: file.name.replace('.json', ''),
        name: file.name,
        path: path.join(projectPath, file.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return lessons;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Project '${projectId}' not found`);
    }
    throw error;
  }
}

export async function readLesson(projectId: string, lessonId: string): Promise<WorkbookLesson> {
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);
  const lessonPath = path.join(projectPath, `${lessonId}.json`);

  try {
    const content = await fs.readFile(lessonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Lesson '${lessonId}' not found in project '${projectId}'`);
    }
    throw error;
  }
}

export async function writeLesson(projectId: string, lessonId: string, data: WorkbookLesson): Promise<void> {
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);
  const lessonPath = path.join(projectPath, `${lessonId}.json`);

  await fs.writeFile(lessonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readProjectMetadata(projectId: string): Promise<ProjectMetadata | null> {
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);
  const metadataPath = path.join(projectPath, 'project.json');

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // No metadata file exists
    }
    throw error;
  }
}

export async function writeProjectMetadata(projectId: string, metadata: ProjectMetadata): Promise<void> {
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);
  const metadataPath = path.join(projectPath, 'project.json');

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

export async function createProject(name: string): Promise<WorkbookProject> {
  const projectId = name.toLowerCase().replace(/\s+/g, '-');
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);

  await fs.mkdir(projectPath, { recursive: true });

  // Create default metadata
  const defaultMetadata: ProjectMetadata = {
    seriesName: 'Origins',
    levelNumber: '3.1',
    cefrLevel: 'A1',
  };
  await writeProjectMetadata(projectId, defaultMetadata);

  return {
    id: projectId,
    name,
    path: projectPath,
    metadata: defaultMetadata,
  };
}

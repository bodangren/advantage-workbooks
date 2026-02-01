import fs from 'fs/promises';
import path from 'path';

export interface WorkbookProject {
  id: string;
  name: string;
  path: string;
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
    const projects = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map(dir => ({
        id: dir.name,
        name: dir.name,
        path: path.join(WORKBOOKS_ROOT, dir.name)
      }));
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
      .filter(entry => entry.name.startsWith('content_'))
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

export async function createProject(name: string): Promise<WorkbookProject> {
  const projectId = name.toLowerCase().replace(/\s+/g, '-');
  const projectPath = path.join(WORKBOOKS_ROOT, projectId);

  await fs.mkdir(projectPath, { recursive: true });

  return {
    id: projectId,
    name,
    path: projectPath
  };
}

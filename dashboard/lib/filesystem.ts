import fs from 'fs/promises';
import path from 'path';

export type ProjectType = 'primary' | 'secondary';

export interface ProjectMetadata {
  seriesName: string; // e.g., "Origins", "Quest", "Adventure", "Hero", "Legend"
  levelNumber: string; // e.g., "3.1", "4.2", "5.3"
  cefrLevel: string; // e.g., "A1", "A2", "B1", "B2", "C1"
  type?: ProjectType;
}

export interface WorkbookProject {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  metadata?: ProjectMetadata;
}

import type { WorkbookLesson } from './workbook-schema';

export interface LessonFile {
  id: string;
  name: string;
  path: string;
}

export interface CreateProjectOptions {
  type: ProjectType;
  seriesName: string;
  levelNumber: string;
  cefrLevel: string;
}

function getWorkbooksRoot(): string {
  return process.env.WORKBOOKS_ROOT || path.resolve(process.cwd(), '..');
}

const SERIES_SUBDIRS: ProjectType[] = ['secondary', 'primary'];
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dashboard', 'conductor', 'v1-legacy', 'screenshots', 'Teacher guide']);

/**
 * Generates a project ID from metadata fields.
 * Example: { seriesName: 'Origins', levelNumber: '3.1', cefrLevel: 'A1' } → 'origins-3.1-a1'
 */
export function generateProjectId(metadata: { seriesName: string; levelNumber: string; cefrLevel: string }): string {
  const series = metadata.seriesName.toLowerCase().replace(/\s+/g, '-');
  const level = metadata.levelNumber.toLowerCase();
  const cefr = metadata.cefrLevel.toLowerCase();
  return `${series}-${level}-${cefr}`;
}

/**
 * Resolves the absolute filesystem path for a project by searching both
 * primary/ and secondary/ subdirectories.
 */
async function resolveProjectPath(projectId: string): Promise<{ fullPath: string; type: ProjectType }> {
  for (const subdir of SERIES_SUBDIRS) {
    const candidate = path.join(getWorkbooksRoot(), subdir, projectId);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return { fullPath: candidate, type: subdir };
      }
    } catch {
      // Directory doesn't exist in this subdir, continue
    }
  }
  throw new Error(`Project '${projectId}' not found in primary/ or secondary/`);
}

export async function listProjects(type?: ProjectType): Promise<WorkbookProject[]> {
  try {
    const subdirs = type ? [type] : SERIES_SUBDIRS;
    const allProjects: WorkbookProject[] = [];

    for (const subdir of subdirs) {
      const subdirPath = path.join(getWorkbooksRoot(), subdir);
      try {
        const entries = await fs.readdir(subdirPath, { withFileTypes: true });
        const projectDirs = entries
          .filter(entry => entry.isDirectory())
          .filter(entry => !entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name));

        const projects = await Promise.all(
          projectDirs.map(async (dir) => {
            const metadata = await readProjectMetadata(dir.name);
            return {
              id: dir.name,
              name: dir.name,
              path: path.join(subdirPath, dir.name),
              type: subdir,
              metadata: metadata || undefined,
            };
          })
        );

        allProjects.push(...projects);
      } catch {
        // Subdirectory doesn't exist yet, skip
      }
    }

    return allProjects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

export async function listLessons(projectId: string): Promise<LessonFile[]> {
  const { fullPath } = await resolveProjectPath(projectId);

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const lessons = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .filter(entry => entry.name.startsWith('content_') || entry.name.endsWith('_workbook.json'))
      .map(file => ({
        id: file.name.replace('.json', ''),
        name: file.name,
        path: path.join(fullPath, file.name)
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
  const { fullPath } = await resolveProjectPath(projectId);
  const lessonPath = path.join(fullPath, `${lessonId}.json`);

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
  const { fullPath } = await resolveProjectPath(projectId);
  const lessonPath = path.join(fullPath, `${lessonId}.json`);

  await fs.writeFile(lessonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readProjectMetadata(projectId: string): Promise<ProjectMetadata | null> {
  // Try to find the project in subdirectories
  for (const subdir of SERIES_SUBDIRS) {
    const metadataPath = path.join(getWorkbooksRoot(), subdir, projectId, 'project.json');
    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Not found in this subdir, continue
    }
  }
  return null;
}

export async function writeProjectMetadata(projectId: string, metadata: ProjectMetadata): Promise<void> {
  const { fullPath } = await resolveProjectPath(projectId);
  const metadataPath = path.join(fullPath, 'project.json');

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

export async function createProject(options: CreateProjectOptions): Promise<WorkbookProject>;
/** @deprecated Use the object-based signature with type and metadata fields */
export async function createProject(name: string): Promise<WorkbookProject>;
export async function createProject(nameOrOptions: string | CreateProjectOptions): Promise<WorkbookProject> {
  if (typeof nameOrOptions === 'string') {
    // Legacy signature: createProject(name) — defaults to secondary
    const name = nameOrOptions;
    const projectId = name.toLowerCase().replace(/\s+/g, '-');
    const projectPath = path.join(getWorkbooksRoot(), 'secondary', projectId);

    await fs.mkdir(projectPath, { recursive: true });

    const defaultMetadata: ProjectMetadata = {
      seriesName: 'Origins',
      levelNumber: '3.1',
      cefrLevel: 'A1',
      type: 'secondary',
    };
    const metadataPath = path.join(projectPath, 'project.json');
    await fs.writeFile(metadataPath, JSON.stringify(defaultMetadata, null, 2), 'utf-8');

    return {
      id: projectId,
      name,
      path: projectPath,
      type: 'secondary',
      metadata: defaultMetadata,
    };
  }

  // New signature: createProject({ type, seriesName, levelNumber, cefrLevel })
  const { type, seriesName, levelNumber, cefrLevel } = nameOrOptions;
  const projectId = generateProjectId({ seriesName, levelNumber, cefrLevel });
  const projectPath = path.join(getWorkbooksRoot(), type, projectId);

  await fs.mkdir(projectPath, { recursive: true });

  const metadata: ProjectMetadata = {
    seriesName,
    levelNumber,
    cefrLevel,
    type,
  };
  const metadataPath = path.join(projectPath, 'project.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  return {
    id: projectId,
    name: projectId,
    path: projectPath,
    type,
    metadata,
  };
}

import fs from 'fs/promises';
import path from 'path';
import { assertWritable } from './cutover';
import type { WorkbookLook } from './document-wrapper/types';

export type ProjectType = 'primary' | 'secondary';

export interface ProjectMetadata {
  seriesName: string; // e.g., "Origins", "Quest", "Adventure", "Hero", "Legend"
  levelNumber: string; // e.g., "3.1", "4.2", "5.3"
  cefrLevel: string; // e.g., "A1", "A2", "B1", "B2", "C1"
  type?: ProjectType;
  /** The print look ("classic" or "chibi-quest"); when absent, a new Primary edition takes `chibi-quest` (`projectLook` in lib/look.ts). */
  look?: WorkbookLook;
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
 * Ensures that a target path is securely contained within a base path,
 * preventing path traversal vulnerabilities (LFI).
 */
function assertSafePath(base: string, target: string): void {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  
  const baseWithSep = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;
  
  if (!resolvedTarget.startsWith(baseWithSep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected: ${target} attempts to escape ${base}`);
  }
}

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
    const rootPath = path.join(getWorkbooksRoot(), subdir);
    const candidate = path.join(rootPath, projectId);
    
    try {
      assertSafePath(rootPath, candidate);
    } catch {
      continue; // Skip if traversal detected, check next or eventually fail
    }

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
      .map(file => {
        const id = file.name.replace('.json', '');
        // Generate a nice name: replace underscores/dashes with spaces and capitalize
        const name = id
          .replace(/_workbook$/, '')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        return {
          id,
          name,
          path: path.join(fullPath, file.name)
        };
      })
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

  assertSafePath(fullPath, lessonPath);

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
  assertWritable('writeLesson');
  const { fullPath } = await resolveProjectPath(projectId);
  const lessonPath = path.join(fullPath, `${lessonId}.json`);

  assertSafePath(fullPath, lessonPath);

  await fs.writeFile(lessonPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readProjectMetadata(projectId: string): Promise<ProjectMetadata | null> {
  // Try to find the project in subdirectories
  for (const subdir of SERIES_SUBDIRS) {
    const rootPath = path.join(getWorkbooksRoot(), subdir);
    const metadataPath = path.join(rootPath, projectId, 'project.json');
    
    try {
      assertSafePath(rootPath, metadataPath);
    } catch {
      continue;
    }

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
  assertWritable('writeProjectMetadata');
  const { fullPath } = await resolveProjectPath(projectId);
  const metadataPath = path.join(fullPath, 'project.json');

  assertSafePath(fullPath, metadataPath);

  // A write with no look keeps the look of the project. A shipped edition states its look.
  // A look of null counts as no look.
  const stored = await readProjectLook(metadataPath);
  const merged: ProjectMetadata = metadata.look === undefined || metadata.look === null
    ? { ...metadata, look: stored.look }
    : metadata;

  await writeFileAtomic(metadataPath, JSON.stringify(merged, null, 2));
}

/**
 * Writes a file in one step: a temporary file in the same folder, then a rename. A reader
 * sees the old file or the new file, never a truncated file.
 * @param target The path of the file to write.
 * @param data The content of the file.
 */
async function writeFileAtomic(target: string, data: string): Promise<void> {
  const temp = `${target}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    await fs.writeFile(temp, data, 'utf-8');
    await fs.rename(temp, target);
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * Thrown when the project.json of a project exists but cannot be read or parsed. The write is
 * refused, so that the look of the project stays.
 */
export class ProjectMetadataUnreadableError extends Error {
  constructor() {
    super('The project.json of this project cannot be read. The write was refused so that the look of the project stays.');
    this.name = 'ProjectMetadataUnreadableError';
  }
}

/**
 * Reads the look of a project.json file. A file that is missing has no look. A file that
 * exists and cannot be read or parsed fails the write, so that the look of the project stays.
 * @param metadataPath The path of the project.json file.
 * @returns The look of the file, or an empty object when the file has none.
 * @throws ProjectMetadataUnreadableError When the file exists and cannot be read or parsed.
 */
async function readProjectLook(metadataPath: string): Promise<Pick<ProjectMetadata, 'look'>> {
  let content: string;
  try {
    content = await fs.readFile(metadataPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw new ProjectMetadataUnreadableError();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ProjectMetadataUnreadableError();
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const look = (parsed as ProjectMetadata).look;
  return look === undefined ? {} : { look };
}

/**
 * Thrown when a create would overwrite an existing project folder.
 */
export class ProjectExistsError extends Error {
  readonly projectId: string;

  constructor(projectId: string) {
    super(`Project '${projectId}' already exists. Choose another name, or edit the existing project.`);
    this.name = 'ProjectExistsError';
    this.projectId = projectId;
  }
}

/**
 * Whether a project folder already exists under a series folder.
 * @param rootPath The series folder, for example `primary`.
 * @param projectId The project folder name.
 * @returns True when the folder exists.
 */
async function projectFolderExists(rootPath: string, projectId: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(rootPath, projectId));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Whether a project id is taken in either series folder. A Primary project and a Reading
 * Advantage project may not share an id, because the lookup finds the first folder only.
 * @param projectId The project folder name.
 * @returns True when a folder with that id exists in primary/ or in secondary/.
 */
async function projectIdExists(projectId: string): Promise<boolean> {
  for (const subdir of SERIES_SUBDIRS) {
    const rootPath = path.join(getWorkbooksRoot(), subdir);
    try {
      assertSafePath(rootPath, path.join(rootPath, projectId));
    } catch {
      continue;
    }
    if (await projectFolderExists(rootPath, projectId)) return true;
  }
  return false;
}

/**
 * Makes a project folder in one step. The folder is made without the recursive flag, so that
 * an existing folder fails at once.
 * @param rootPath The series folder, for example `primary`.
 * @param projectPath The path of the project folder.
 * @param projectId The project folder name.
 * @throws ProjectExistsError When the project folder exists.
 */
async function makeProjectFolder(rootPath: string, projectPath: string, projectId: string): Promise<void> {
  await fs.mkdir(rootPath, { recursive: true });
  try {
    await fs.mkdir(projectPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ProjectExistsError(projectId);
    throw error;
  }
}

export async function createProject(options: CreateProjectOptions): Promise<WorkbookProject>;
/** @deprecated Use the object-based signature with type and metadata fields */
export async function createProject(name: string): Promise<WorkbookProject>;
export async function createProject(nameOrOptions: string | CreateProjectOptions): Promise<WorkbookProject> {
  assertWritable('createProject');
  if (typeof nameOrOptions === 'string') {
    // Legacy signature: createProject(name) — defaults to secondary
    const name = nameOrOptions;
    const projectId = name.toLowerCase().replace(/\s+/g, '-');
    const rootPath = path.join(getWorkbooksRoot(), 'secondary');
    const projectPath = path.join(rootPath, projectId);

    assertSafePath(rootPath, projectPath);

    if (await projectIdExists(projectId)) throw new ProjectExistsError(projectId);

    await makeProjectFolder(rootPath, projectPath, projectId);

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
  const rootPath = path.join(getWorkbooksRoot(), type);
  const projectPath = path.join(rootPath, projectId);

  assertSafePath(rootPath, projectPath);

  if (await projectIdExists(projectId)) throw new ProjectExistsError(projectId);

  await makeProjectFolder(rootPath, projectPath, projectId);

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

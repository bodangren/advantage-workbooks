import fs from 'fs';
import path from 'path';
import { LessonPackageSchema, type LessonPackage } from '../lesson-package/schema';
import { buildWorkbookLesson } from '../lesson-package/build';
import { listLessons, readLesson, readProjectMetadata } from '../filesystem';
import type { WorkbookLesson } from '../workbook-schema';

/**
 * The printed Primary books. A book with a dashboard project (primary/<project>) prints the
 * project's lesson files, the same as the compile page; Origins 1 has none and prints its packages.
 */
export const PRINT_BOOKS: Record<string, { project?: string; name?: string }> = {
    'origins-1': { name: 'Origins 1' },
    'origins-2': { project: 'origins-2-a0' },
    'origins-3.1': { project: 'origins-3.1-a0' },
    'origins-3.2': { project: 'origins-3.2-a0' },
    'quest-4': { project: 'quest-4-a1' },
};

export interface BookLessons {
    name: string;
    level: string;
    lessons: { number: number; lesson: WorkbookLesson }[];
}

/**
 * The workbook lesson packages of a book folder (l01.json, p05.json, e12.json; no inject log).
 * @param contentDir The content/primary folder.
 * @param book A book folder, for example `origins-3.2`.
 * @returns The file name and the parsed package, in lesson order.
 */
export function bookPackages(contentDir: string, book: string): { file: string; pkg: LessonPackage }[] {
    const dir = path.join(contentDir, book);
    return fs.readdirSync(dir)
        .filter((f) => /^[a-z]\d+\.json$/.test(f))
        .map((file) => ({ file, pkg: LessonPackageSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))) }))
        .sort((a, b) => a.pkg.meta.number - b.pkg.meta.number);
}

/**
 * The lessons of a book as the print renders them: from its dashboard project, or else from its
 * lesson packages (pictures as file:// URLs under content/primary).
 * @param book A key of `PRINT_BOOKS`.
 * @param contentDir The content/primary folder.
 * @returns The book name with its number, the CEFR level, and the lessons with their place in the book.
 */
export async function bookLessons(book: string, contentDir: string): Promise<BookLessons> {
    const { project, name } = PRINT_BOOKS[book];
    if (project) {
        const meta = await readProjectMetadata(project);
        if (!meta) throw new Error(`${project}: no project.json`);
        const files = await listLessons(project);
        const lessons = await Promise.all(files.map(async (f, i) => ({ number: i + 1, lesson: await readLesson(project, f.id) })));
        return { name: `${meta.seriesName}${meta.levelNumber ? ` ${meta.levelNumber}` : ''}`, level: meta.cefrLevel ?? '', lessons };
    }
    const packages = bookPackages(contentDir, book).map((p) => p.pkg);
    const lessons = packages.map((p) => ({ number: p.meta.number, lesson: buildWorkbookLesson(p, { mediaBase: `file://${contentDir}/` }) }));
    return { name: name ?? book, level: packages[0]?.meta.cefrLevel ?? '', lessons };
}

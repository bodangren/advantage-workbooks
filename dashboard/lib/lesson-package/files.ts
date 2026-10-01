import fs from 'fs';
import path from 'path';
import { LessonPackageSchema, type LessonPackage } from './schema';
import { packageToLessonText } from './checks';
import type { LessonText } from '../text-profile/sources';

/**
 * Workbooks repo root: WORKBOOKS_ROOT, or found from the working directory (the repo root or
 * `dashboard/`). `__dirname` is wrong inside the Next.js bundle, so it is not used.
 */
export function findRepoRoot(cwd = process.cwd(), env = process.env.WORKBOOKS_ROOT): string {
    if (env) return path.resolve(env);
    return fs.existsSync(path.join(cwd, 'dashboard', 'package.json')) ? cwd : path.resolve(cwd, '..');
}

export const REPO_ROOT = findRepoRoot();
export const CONTENT_ROOT = path.join(REPO_ROOT, 'content', 'primary');
export const OBJECTIVE_KEY_DIR = path.join(REPO_ROOT, 'docs', 'content-plans', 'data');

/**
 * Primary books in teaching order. A lesson's prior texts are the packages of earlier books and
 * the earlier lessons of its own book. The Origins 3.1 folder holds only the lesson-12 insert.
 */
export const BOOK_ORDER = ['origins-3.1', 'origins-3.2', 'quest-4', 'quest-5', 'quest-6.1', 'quest-6.2'];

export interface PackageFile {
    file: string;
    raw: unknown;
    pkg?: LessonPackage;
    error?: string;
}

/**
 * Reads every package (`*.json`) in a book folder, parsed packages first in lesson-number order,
 * then the files that do not parse (with their error).
 * @param dir A book folder, for example `content/primary/origins-3.2`.
 * @returns The files; an empty list when the folder does not exist.
 */
export function loadPackageFolder(dir: string): PackageFile[] {
    if (!fs.existsSync(dir)) return [];
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f): PackageFile => {
            const file = path.join(dir, f);
            try {
                const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
                const parsed = LessonPackageSchema.safeParse(raw);
                return parsed.success ? { file, raw, pkg: parsed.data } : { file, raw, error: parsed.error.issues[0]?.message ?? 'invalid' };
            } catch (e) {
                return { file, raw: undefined, error: (e as Error).message };
            }
        });
    const good = files.filter((f) => f.pkg).sort((a, b) => (a.pkg as LessonPackage).meta.number - (b.pkg as LessonPackage).meta.number);
    return [...good, ...files.filter((f) => !f.pkg)];
}

/**
 * Text-check inputs for the packages that come before a lesson.
 * @param root The content root (`content/primary`).
 * @param book The lesson's book id.
 * @param number The lesson's number in its book.
 * @returns Earlier books' packages, then the earlier lessons of the same book.
 */
export function priorPackageTexts(root: string, book: string, number: number): LessonText[] {
    const at = BOOK_ORDER.indexOf(book);
    const earlierBooks = at < 0 ? [] : BOOK_ORDER.slice(0, at);
    const fromBook = (b: string) =>
        loadPackageFolder(path.join(root, b))
            .filter((f) => f.pkg && (b !== book || f.pkg.meta.number < number))
            .map((f) => packageToLessonText(f.pkg as LessonPackage, f.file));
    return [...earlierBooks.flatMap(fromBook), ...fromBook(book)];
}

/**
 * Objective IDs from every `*-objective-key.json` file in a folder.
 * @param dir Folder of key files (default `docs/content-plans/data`).
 * @returns The set of short objective IDs, for example `L19.1`.
 */
export function loadObjectiveIds(dir: string = OBJECTIVE_KEY_DIR): Set<string> {
    const ids = new Set<string>();
    if (!fs.existsSync(dir)) return ids;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('-objective-key.json'))) {
        const key = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as { objectives: { id: string }[] };
        for (const o of key.objectives) ids.add(o.id);
    }
    return ids;
}

import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lesson-package/files';
import { phonicsGraphFrom, type PhonicsGraph } from './phonics';
import { StorytimeWeekSchema, type StorytimeWeek } from './schema';

/** The Storytime content folder: `l<level>/w<nn>.json`, media in `l<level>/media/w<nn>/`. */
export const STORYTIME_ROOT = path.join(REPO_ROOT, 'content', 'storytime');

/**
 * The package file of a week: `<root>/l<level>/w<nn>.json`.
 * @param root The Storytime content folder.
 * @param level The Storytime level.
 * @param week The week of the level.
 * @returns The file path.
 */
export function storytimeWeekFile(root: string, level: number, week: number): string {
    return path.join(root, `l${level}`, `w${String(week).padStart(2, '0')}.json`);
}

/**
 * The media folder of a week: `<root>/l<level>/media/w<nn>/`.
 * @param root The Storytime content folder.
 * @param level The Storytime level.
 * @param week The week of the level.
 * @returns The folder path.
 */
export function storytimeMediaDir(root: string, level: number, week: number): string {
    return path.join(root, `l${level}`, 'media', `w${String(week).padStart(2, '0')}`);
}

/**
 * Reads the week files of a level, in week order.
 * @param root The Storytime content folder.
 * @param level The Storytime level.
 * @returns Each file with its raw JSON and, when it parses, the week (else the first parse issue).
 */
export function readLevelWeeks(root: string, level: number): { file: string; raw: unknown; week?: StorytimeWeek; error?: string }[] {
    const dir = path.join(root, `l${level}`);
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => /^w\d{2}\.json$/.test(f))
        .sort()
        .map((f) => {
            const file = path.join(dir, f);
            const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
            const parsed = StorytimeWeekSchema.safeParse(raw);
            if (parsed.success) return { file, raw, week: parsed.data };
            const issue = parsed.error.issues[0];
            return { file, raw, error: `${issue.path.map(String).join('.')}: ${issue.message}` };
        });
}

/** The phonics graph v1 (mastery-advantage, a sibling repo); `MASTERY_PHONICS_GRAPH` overrides the path. */
export const PHONICS_GRAPH_FILE =
    process.env.MASTERY_PHONICS_GRAPH ?? path.join(REPO_ROOT, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json');

/**
 * Reads the decodability facts of the phonics graph.
 * @param file The graph JSON file.
 * @returns The facts, or undefined when the file does not exist.
 */
export function readPhonicsGraph(file: string = PHONICS_GRAPH_FILE): PhonicsGraph | undefined {
    if (!fs.existsSync(file)) return undefined;
    return phonicsGraphFrom(JSON.parse(fs.readFileSync(file, 'utf8')));
}

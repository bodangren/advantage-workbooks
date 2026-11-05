import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lesson-package/files';
import { phonicsGraphFrom, type PhonicsGraph } from './phonics';
import { PHONEME_BANK_DIR, phonemeBankFrom, type PhonemeBank } from './phonemes';
import { StorytimeWeekSchema, type StorytimeWeek } from './schema';

/** The Storytime content folder: `l<level>/w<nn>.json`, media in `l<level>/media/w<nn>/`. */
export const STORYTIME_ROOT = path.join(REPO_ROOT, 'content', 'storytime');

/** The host of the printed Storytime QR codes: a subdomain of its own, not the Primary app (Daniel, 2026-10-22, S23). */
export const STORYTIME_QR_HOST = 'https://storytime.reading-advantage.com';

/** The canonical Storytime page path: the route, the level, the week, and an optional part query. */
const STORYTIME_PAGE_PATH = /^\/th\/st\/([1-9]\d*)\/([1-9]\d*)(\?part=(?:book|decodable|song))?$/;

/**
 * The address that a printed QR code holds: the Storytime host and a canonical page path of the package
 * (`home.songUrl`, `home.readAlongUrl`). The package keeps the path only.
 *
 * The canonical path is `/th/st/<level>/<week>` and then nothing, or one query: `?part=book`,
 * `?part=decodable`, or `?part=song`. The level is an integer from 1 to 4. The week is an integer from
 * 1 to 32. Neither has a leading zero. So no dot segment, no extra segment, no other query, and no
 * upper-case part value reaches the printed code (adversarial finding on c8aba128, spec P4).
 * @param pagePath The path of the public page, as "/th/st/2/1?part=song".
 * @returns The full address.
 * @throws Error When `pagePath` is not a canonical Storytime page path. The message names the path.
 */
export function storytimeQrUrl(pagePath: string): string {
    const page = STORYTIME_PAGE_PATH.exec(pagePath);
    const level = Number(page?.[1] ?? 0);
    const week = Number(page?.[2] ?? 0);
    if (!page || level < 1 || level > 4 || week < 1 || week > 32) {
        throw new Error(`not a Storytime page path: ${pagePath}`);
    }
    return STORYTIME_QR_HOST + pagePath;
}

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

/** One entry of the card picture file: the card word, its first week, and the Forge prompt. */
export interface StorytimeCardPictureEntry {
    /** The word of the card, as the card kit prints it. */
    word: string;
    /** The first week whose materials name the card. */
    week: number;
    /** The Forge prompt of the picture. */
    prompt: string;
}

/**
 * Reads the card picture file of a level: `<root>/l<level>/print/card-pictures.json`.
 * A level without that file gives an empty list. A file that is not an array, or that holds an
 * entry without a word, a week of 1 or more, or a prompt, throws. A broken file never reaches the
 * picture list.
 * @param root The Storytime content folder.
 * @param level The Storytime level.
 * @returns The entries in file order.
 * @throws Error When the file is not valid JSON, is not an array, or holds an invalid entry.
 */
export function readLevelCardPictures(root: string, level: number): StorytimeCardPictureEntry[] {
    const file = path.join(root, `l${level}`, 'print', 'card-pictures.json');
    if (!fs.existsSync(file)) return [];
    const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(raw)) throw new Error(`not a card picture list: ${file}`);
    return raw.map((entry: unknown, index: number) => {
        const item = entry as Partial<StorytimeCardPictureEntry> | null;
        const word = typeof item?.word === 'string' ? item.word.trim() : '';
        const week = typeof item?.week === 'number' ? item.week : 0;
        const prompt = typeof item?.prompt === 'string' ? item.prompt.trim() : '';
        if (!word || !Number.isInteger(week) || week < 1 || !prompt) {
            throw new Error(`card picture entry ${index} needs a word, a week of 1 or more, and a prompt`);
        }
        return { word, week, prompt };
    });
}

/**
 * Reads Daniel's phoneme bank (S22) from its manifest.
 * @param root The Storytime content folder.
 * @returns The bank, or undefined when the manifest does not exist.
 */
export function readPhonemeBank(root: string = STORYTIME_ROOT): PhonemeBank | undefined {
    const file = path.join(root, PHONEME_BANK_DIR, 'manifest.json');
    if (!fs.existsSync(file)) return undefined;
    return phonemeBankFrom(JSON.parse(fs.readFileSync(file, 'utf8')));
}

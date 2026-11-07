import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { checkStorytimeWeek, taughtTo } from '../../lib/storytime/checks';
import { PHONICS_GRAPH_FILE, readLevelWeeks, readPhonemeBank, readPhonicsGraph, STORYTIME_ROOT } from '../../lib/storytime/files';
import { phonemeAudioFields, phonemeAudioProblems } from '../../lib/storytime/phonemes';
import { bookWordKey, wordClipPath, type BookWords } from '../../lib/storytime/word-clips';

const USAGE = `Checks the Storytime week files of a level (track storytime_week_package_20261022).

Usage: npx tsx scripts/storytime/check-weeks.ts --level <n>

Exit code 1 when a week fails a check.`;

/** The exact label of the `word-clips` row (Phase 11 decision K12). */
const WORD_CLIPS_LABEL = 'The book word clips named in the package exist and match the word bank';

/** The exact label of the `song-lead-in` row (Phase 11 decision K14). */
const SONG_LEAD_IN_LABEL = 'The song video lead-in is set for each song video';

/**
 * The SHA-256 of a file.
 * @param file The path of the file.
 * @returns The hash, in lower-case hex.
 */
function sha256File(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * Checks named cover and page pictures for a Storytime week.
 * @param week The parsed week data.
 * @param contentRoot The root for paths named by the week.
 * @returns The check row, or undefined when no book picture names a file.
 */
export function checkBookPictures(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'fail'; detail?: string } | undefined {
    const files = (week.books ?? []).flatMap((book: any) => [book.cover?.file, ...(book.pages ?? []).map((page: any) => page.image?.file)]).filter((file: unknown): file is string => typeof file === 'string' && file.length > 0);
    if (!files.length) return undefined;
    const missing = files.filter((file: string) => !fs.existsSync(path.join(contentRoot, file)));
    return {
        id: 'book-pictures',
        label: 'The book pictures named in the package exist',
        status: missing.length ? 'fail' : 'pass',
        detail: missing.length ? `missing: ${missing.join(', ')}` : undefined,
    };
}

/**
 * Checks the family-word pictures named in a Storytime week (decision H9, pins S9 and S10). A
 * missing file is a fail. A family word with an image and no file is a warn. The check adds no row
 * for a week with no family word that has an image.
 * @param week The parsed week data.
 * @param contentRoot The root for paths named by the week.
 * @returns The check row, or undefined when no family word has an image.
 */
export function checkFamilyPictures(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined {
    const words = (week.focus?.family?.words ?? []).filter((word: any) => word?.image && typeof word.image === 'object');
    if (!words.length) return undefined;
    const named = words.filter((word: any) => typeof word.image.file === 'string' && word.image.file.length > 0);
    const missing = named.map((word: any) => word.image.file as string).filter((file: string) => !fs.existsSync(path.join(contentRoot, file)));
    const noFile = words.filter((word: any) => !(typeof word.image.file === 'string' && word.image.file.length > 0)).map((word: any) => String(word.word));
    const row = { id: 'family-pictures', label: 'The family-word pictures named in the package exist' };
    if (missing.length) return { ...row, status: 'fail', detail: `missing: ${missing.join(', ')}` };
    if (noFile.length) return { ...row, status: 'warn', detail: `no file: ${noFile.join(', ')}` };
    return { ...row, status: 'pass' };
}

/**
 * The keys of one book in document order, each key once (K12): books, speed, sentence, and word.
 * @param audio The audio of the book.
 * @returns The keys, in document order.
 */
function keysInDocumentOrder(audio: BookWords): string[] {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const sentence of [...(audio.sentences ?? []), ...(audio.slowSentences ?? [])]) {
        for (const item of sentence?.words ?? []) {
            if (typeof item?.word !== 'string') continue;
            const key = bookWordKey(item.word);
            if (key === undefined || seen.has(key)) continue;
            seen.add(key);
            keys.push(key);
        }
    }
    return keys;
}

/**
 * Checks the word clips named by the read-along books of a week against the word bank (Phase 11
 * decision K12, spec FR 6). A fault is a fail. A book word with no key in the map of its book is a
 * warn, because the weeks of another track get their clips in a later content commit (rule F9). A
 * week with no book and a week with no meta get no row.
 * @param week The parsed week data.
 * @param contentRoot The root for the paths named by the week, and for the word bank.
 * @returns The check row, or undefined when the week has no book or no meta.
 */
export function checkWordClips(week: any, contentRoot = STORYTIME_ROOT): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined {
    const books = week?.books ?? [];
    if (!books.length) return undefined;
    const level = Number(week?.meta?.level);
    const weekNumber = Number(week?.meta?.week);
    if (!Number.isInteger(level) || !Number.isInteger(weekNumber)) return undefined;
    const manifestFile = path.join(contentRoot, 'words/manifest.json');
    const rows: { word: string; mp3: string }[] = fs.existsSync(manifestFile)
        ? (JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as { items?: { word: string; mp3: string }[] }).items ?? []
        : [];
    const byWord = new Map(rows.map((row) => [row.word, row]));
    const missing: string[] = [];
    const differs: string[] = [];
    const noBank: string[] = [];
    const notBookWord: string[] = [];
    const badPath: string[] = [];
    const noClip: string[] = [];
    const seen = new Set<string>();
    for (const book of books) {
        const audio = book?.audio ?? {};
        const keys = keysInDocumentOrder(audio);
        const inBook = new Set(keys);
        const map: Record<string, string> = audio.wordClips ?? {};
        for (const key of keys) {
            const value = typeof map[key] === 'string' && map[key].length > 0 ? map[key] : undefined;
            if (value === undefined) {
                if (!seen.has(key)) {
                    seen.add(key);
                    noClip.push(key);
                }
                continue;
            }
            let expected: string | undefined;
            try {
                expected = wordClipPath(level, weekNumber, key);
            } catch {
                expected = undefined;
            }
            if (expected === undefined || value !== expected) {
                badPath.push(value);
                continue;
            }
            const clip = path.join(contentRoot, value);
            if (!fs.existsSync(clip)) {
                missing.push(value);
                continue;
            }
            const row = byWord.get(key);
            if (!row) {
                noBank.push(key);
                continue;
            }
            const bank = path.join(contentRoot, 'words', String(row.mp3));
            if (fs.existsSync(bank) && sha256File(bank) !== sha256File(clip)) differs.push(value);
        }
        for (const key of Object.keys(map)) if (!inBook.has(key)) notBookWord.push(key);
    }
    const head = { id: 'word-clips', label: WORD_CLIPS_LABEL };
    const failParts: string[] = [];
    if (missing.length) failParts.push(`missing: ${missing.join(', ')}`);
    if (differs.length) failParts.push(`differs from bank: ${differs.join(', ')}`);
    if (noBank.length) failParts.push(`no bank row: ${noBank.join(', ')}`);
    if (notBookWord.length) failParts.push(`not a book word: ${notBookWord.join(', ')}`);
    if (badPath.length) failParts.push(`bad path: ${badPath.join(', ')}`);
    if (failParts.length) return { ...head, status: 'fail', detail: failParts.join('; ') };
    if (noClip.length) return { ...head, status: 'warn', detail: `no clip: ${noClip.join(', ')}` };
    return { ...head, status: 'pass' };
}

/**
 * Checks the song video lead-in field of a week (Phase 11 decision K14, spec FR 6). The check does
 * not decode a video: the measure script owns the value.
 * @param week The parsed week data.
 * @returns The check row, or undefined when the song names no video and has no field, or when the
 * week has no song.
 */
export function checkSongLeadIn(week: any): { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string } | undefined {
    const song = week?.song;
    if (!song) return undefined;
    const video = [song.video, song.videoPhone, song.karaoke].some((file: unknown) => typeof file === 'string' && file.length > 0);
    const field = typeof song.videoLeadInSeconds === 'number' && Number.isFinite(song.videoLeadInSeconds);
    const head = { id: 'song-lead-in', label: SONG_LEAD_IN_LABEL };
    if (video && field) return { ...head, status: 'pass' };
    if (video) return { ...head, status: 'warn', detail: 'no lead-in' };
    if (field) return { ...head, status: 'fail', detail: 'lead-in without video' };
    return undefined;
}

function main(argv: string[]): number {
    const at = argv.indexOf('--level');
    const level = at >= 0 ? Number(argv[at + 1]) : NaN;
    if (argv.includes('--help') || !(level >= 1 && level <= 4)) {
        console.log(USAGE);
        return argv.includes('--help') ? 0 : 2;
    }
    const weeks = readLevelWeeks(STORYTIME_ROOT, level);
    // The decodability rule counts every week from Level 2 week 1.
    const known = [2, 3, 4].filter((l) => l <= level).flatMap((l) => readLevelWeeks(STORYTIME_ROOT, l)).flatMap((w) => (w.week ? [w.week] : []));
    const graph = readPhonicsGraph();
    if (!graph) console.warn(`No phonics graph at ${PHONICS_GRAPH_FILE}: the decodable check spells letter by letter.`);
    const bank = readPhonemeBank();
    const reports = weeks.map((w) => {
        const report = checkStorytimeWeek(w.raw, w.week ? taughtTo(known, w.week) : undefined, graph, known);
        // The song files that the package names must exist: the QR page copy step reads them.
        const song = w.week?.song;
        if (song) {
            const lines = song.lines.map((l) => l.image?.file);
            const named = [song.audio, song.video, song.videoPhone, song.poster, song.posterPhone, song.karaoke, ...lines].filter((p): p is string => !!p);
            const missing = named.filter((p) => !fs.existsSync(path.join(STORYTIME_ROOT, p)));
            report.checks.push({
                id: 'song-media',
                label: 'The song files named in the package exist',
                status: missing.length ? 'fail' : 'pass',
                detail: missing.length ? `missing: ${missing.join(', ')}` : undefined,
            });
        }
        // The book audio files (scripts/storytime/book-audio.ts); the QR page copy step reads them too.
        const books = (w.week?.books ?? []).flatMap((b) => [b.audio.file, b.audio.slowFile]).filter((p): p is string => !!p);
        if (books.length) {
            const missing = books.filter((p) => !fs.existsSync(path.join(STORYTIME_ROOT, p)));
            report.checks.push({
                id: 'book-audio',
                label: 'The book audio files named in the package exist',
                status: missing.length ? 'fail' : 'pass',
                detail: missing.length ? `missing: ${missing.join(', ')}` : undefined,
            });
        }
        const bookPictures = w.week ? checkBookPictures(w.week) : undefined;
        if (bookPictures) report.checks.push(bookPictures);
        const familyPictures = w.week ? checkFamilyPictures(w.week) : undefined;
        if (familyPictures) report.checks.push(familyPictures);
        const wordClips = w.week ? checkWordClips(w.week) : undefined;
        if (wordClips) report.checks.push(wordClips);
        const songLeadIn = w.week ? checkSongLeadIn(w.week) : undefined;
        if (songLeadIn) report.checks.push(songLeadIn);
        // Daniel's recordings (S22) for every sound of the package; the QR page copy step reads them too.
        if (w.week && bank) {
            const problems = phonemeAudioProblems(w.week, bank);
            const files = phonemeAudioFields(w.week, bank).fields.flatMap((f) => [f.value].flat(2));
            problems.push(...[...new Set(files)].filter((p) => !fs.existsSync(path.join(STORYTIME_ROOT, p))).map((p) => `missing file ${p}`));
            report.checks.push({
                id: 'phoneme-audio',
                label: "Every sound of the package has Daniel's recording (S22)",
                status: problems.length ? 'fail' : 'pass',
                detail: problems.length ? problems.slice(0, 5).join('; ') + (problems.length > 5 ? ` (${problems.length} in all)` : '') : undefined,
            });
        }
        return { ...report, file: path.relative(process.cwd(), w.file) };
    });
    console.log(formatPackageReports(reports));
    return reports.some((r) => r.checks.some((c) => c.status === 'fail')) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    process.exitCode = main(process.argv.slice(2));
}

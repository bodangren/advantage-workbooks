import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { checkStorytimeWeek, taughtTo } from '../../lib/storytime/checks';
import { PHONICS_GRAPH_FILE, readLevelWeeks, readPhonemeBank, readPhonicsGraph, STORYTIME_ROOT } from '../../lib/storytime/files';
import { phonemeAudioFields, phonemeAudioProblems } from '../../lib/storytime/phonemes';

const USAGE = `Checks the Storytime week files of a level (track storytime_week_package_20261022).

Usage: npx tsx scripts/storytime/check-weeks.ts --level <n>

Exit code 1 when a week fails a check.`;

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

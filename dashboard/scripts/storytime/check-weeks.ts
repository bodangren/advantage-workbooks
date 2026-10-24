import fs from 'fs';
import path from 'path';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { checkStorytimeWeek, taughtTo } from '../../lib/storytime/checks';
import { PHONICS_GRAPH_FILE, readLevelWeeks, readPhonemeBank, readPhonicsGraph, STORYTIME_ROOT } from '../../lib/storytime/files';
import { phonemeAudioFields, phonemeAudioProblems } from '../../lib/storytime/phonemes';

const USAGE = `Checks the Storytime week files of a level (track storytime_week_package_20261022).

Usage: npx tsx scripts/storytime/check-weeks.ts --level <n>

Exit code 1 when a week fails a check.`;

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

process.exitCode = main(process.argv.slice(2));

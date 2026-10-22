import path from 'path';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { checkStorytimeWeek, taughtTo } from '../../lib/storytime/checks';
import { PHONICS_GRAPH_FILE, readLevelWeeks, readPhonicsGraph, STORYTIME_ROOT } from '../../lib/storytime/files';

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
    const reports = weeks.map((w) => ({
        ...checkStorytimeWeek(w.raw, w.week ? taughtTo(known, w.week) : undefined, graph),
        file: path.relative(process.cwd(), w.file),
    }));
    console.log(formatPackageReports(reports));
    return reports.some((r) => r.checks.some((c) => c.status === 'fail')) ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));

import path from 'path';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { checkStorytimeWeek } from '../../lib/storytime/checks';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';

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
    const reports = weeks.map((w) => ({ ...checkStorytimeWeek(w.raw), file: path.relative(process.cwd(), w.file) }));
    console.log(formatPackageReports(reports));
    return reports.some((r) => r.checks.some((c) => c.status === 'fail')) ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));

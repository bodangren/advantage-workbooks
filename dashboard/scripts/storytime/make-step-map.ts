import fs from 'fs';
import path from 'path';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { storytimeStepMapFiles } from '../../lib/storytime/print/step-pages';

const USAGE = `Writes the step map of the student book of a level (A-48 U9) to content/storytime/l<n>/:
step-map-u1.json (one row for each part of a page that a script step uses, with its printed page)
and one step-icon-<name>.svg file for each icon.

Usage: npx tsx scripts/storytime/make-step-map.ts --level <n>

The level is an integer from 1 to 4. Regenerate the files whenever a week package or the page order
changes: the test keeps the committed files equal to the output. Exit code 1 when a week does not
parse, 2 when the arguments are wrong.`;

function main(argv: string[]): number {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const at = argv.indexOf('--level');
    const raw = at >= 0 ? argv[at + 1] : '';
    // The level is a plain integer: a path or a missing value must not reach the folder name.
    if (!/^\d+$/.test(raw ?? '') || Number(raw) < 1 || Number(raw) > 4) {
        console.log(USAGE);
        return 2;
    }
    const level = Number(raw);
    const weeks = readLevelWeeks(STORYTIME_ROOT, level);
    if (!weeks.length) {
        console.error(`no week files for level ${level} under ${STORYTIME_ROOT}`);
        return 1;
    }
    const broken = weeks.filter((w) => !w.week);
    if (broken.length) {
        for (const w of broken) console.error(`${path.relative(process.cwd(), w.file)}: ${w.error}`);
        return 1;
    }
    const dir = path.join(STORYTIME_ROOT, `l${level}`);
    const parsed = weeks.flatMap((w) => (w.week ? [w.week] : []));
    const units = [...new Set(parsed.map((week) => week.meta.unit))].sort((a, b) => a - b);
    const files = units.flatMap((unit) => storytimeStepMapFiles(parsed.filter((week) => week.meta.unit === unit)));
    for (const file of files) fs.writeFileSync(path.join(dir, file.name), file.text);
    console.log(`wrote ${files.length} files to ${path.relative(process.cwd(), dir)}${path.sep}: ${files.map((f) => f.name).join(', ')}`);
    return 0;
}

process.exitCode = main(process.argv.slice(2));

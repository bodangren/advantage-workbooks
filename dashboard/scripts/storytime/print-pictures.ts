import fs from 'fs';
import path from 'path';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { pictureListMarkdown, storytimePrintPictures } from '../../lib/storytime/print/pictures';

const USAGE = `Writes the print picture list of a level (spec FR-2) to content/storytime/l<n>/print/.

Usage: npx tsx scripts/storytime/print-pictures.ts --level <n>

The level is an integer from 1 to 4; the script writes only under content/storytime/l<n>/print/.
Regenerate the list whenever a week package changes: the contract test keeps the committed list
equal to the output. Exit code 1 when a week does not parse, 2 when the arguments are wrong.`;

function main(argv: string[]): number {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const at = argv.indexOf('--level');
    const raw = at >= 0 ? argv[at + 1] : '';
    // The level is a plain integer: a path or a missing value must not reach the folder name.
    if (!/^\d+$/.test(raw ?? '')) {
        console.log(USAGE);
        return 2;
    }
    const level = Number(raw);
    if (!(level >= 1 && level <= 4)) {
        console.log(USAGE);
        return 2;
    }
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
    const rows = storytimePrintPictures(weeks.flatMap((w) => (w.week ? [w.week] : [])));
    const dir = path.join(STORYTIME_ROOT, `l${level}`, 'print');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'pictures.json'), JSON.stringify(rows, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'pictures.md'), pictureListMarkdown(rows, level));
    console.log(`wrote ${rows.length} picture rows to ${path.relative(process.cwd(), dir)}${path.sep}pictures.json and pictures.md`);
    return 0;
}

process.exitCode = main(process.argv.slice(2));

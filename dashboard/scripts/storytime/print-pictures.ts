import fs from 'fs';
import path from 'path';
import { findRepoRoot } from '../../lib/lesson-package/files';
import { readLevelCardPictures, readLevelWeeks, readUnitCardPictures, STORYTIME_ROOT } from '../../lib/storytime/files';
import { pictureListMarkdown, storytimeCardPictureRows, storytimePrintPictures } from '../../lib/storytime/print/pictures';

const USAGE = `Writes the print picture list of each unit of a level (spec FR-2) to content/storytime/l<n>/print/.
Unit 1 keeps pictures.json and pictures.md in that folder. Unit 2 writes them under print/u2/.

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
    const parsed = weeks.flatMap((w) => (w.week ? [w.week] : []));
    const units = [...new Set(parsed.map((week) => week.meta.unit))].sort((a, b) => a - b);
    // The reuse rule needs the whole level: a unit 2 review word that unit 1 already holds keeps
    // the unit 1 row. Compute every row once, then keep the rows of this unit's weeks (Review A F1).
    const levelRows = storytimePrintPictures(parsed);
    for (const unit of units) {
        const unitWeeks = new Set(parsed.filter((week) => week.meta.unit === unit).map((week) => week.meta.week));
        const bookRows = levelRows.filter((row) => unitWeeks.has(row.week));
        // Version 7: the card rows of the unit kit follow the book rows, in file order. The card
        // contracts are committed content; when WORKBOOKS_ROOT redirects the tree for output and
        // holds no card file for the unit, read the committed copy from the repository (Review A F1).
        const entriesFor = (root: string) => unit === 1
            ? readLevelCardPictures(root, level)
            : readUnitCardPictures(root, level, unit);
        let entries = entriesFor(STORYTIME_ROOT);
        // An empty env argument bypasses the WORKBOOKS_ROOT default and resolves from the cwd.
        const committedRoot = path.join(findRepoRoot(process.cwd(), ''), 'content', 'storytime');
        if (!entries.length && path.resolve(STORYTIME_ROOT) !== committedRoot) entries = entriesFor(committedRoot);
        const cardRows = storytimeCardPictureRows(entries, level);
        const rows = [...bookRows, ...cardRows];
        const folder = path.join(STORYTIME_ROOT, `l${level}`);
        const dir = path.join(folder, unit === 1 ? 'print' : unit === 2 ? 'print/u2' : `print/u${unit}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'pictures.json'), JSON.stringify(rows, null, 2) + '\n');
        fs.writeFileSync(path.join(dir, 'pictures.md'), pictureListMarkdown(rows, level));
        console.log(`wrote ${rows.length} picture rows (${bookRows.length} book rows and ${cardRows.length} card rows) to ${path.relative(process.cwd(), dir)}${path.sep}pictures.json and pictures.md`);
    }
    return 0;
}

process.exitCode = main(process.argv.slice(2));

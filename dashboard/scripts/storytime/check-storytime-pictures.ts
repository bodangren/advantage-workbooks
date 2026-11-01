import path from 'path';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { checkStorytimePictureBatch, readStorytimePictureManifest } from '../../lib/storytime/print/picture-check';
import { storytimePrintPictures } from '../../lib/storytime/print/pictures';
import { checkRequestedWeeks } from '../../lib/storytime/print/student-book-cli';

const USAGE = `Runs stage 1 of the picture stages on a Forge batch (spec FR-9, strategy 5.1): the size,
the color mode, the alpha, the gray fill, the file name, the SHA-256, and the pixel size of the
color file and of the line art of each row, against the row of the picture list and the Forge
manifest.json.

Usage: npx tsx scripts/storytime/check-storytime-pictures.ts --batch <folder> [--level <n>] [--weeks <list>]

  --batch   The Forge batch folder; it must hold manifest.json and the picture files, and each
            manifest path must stay inside that folder
  --level   The Storytime level, a whole number from 1 to 4 (default 2)
  --weeks   The weeks to check, each a whole number from 1 to 32, comma separated (default 1);
            every requested week must load exactly once (checkRequestedWeeks)

The command prints one line for each picture-list row of the weeks and a summary line. Stage 1 is
a measurement, never an approval (spec P7); it writes no file.

Exit code 0 when every row passes, 1 when a row fails or a requested week does not load exactly
once. Exit code 2 on an argument error, on a batch folder without a manifest.json, and on a
manifest.json that does not parse.`;

/** One command run: the batch folder, the level, and the weeks. */
interface Args {
    batch: string;
    level: number;
    weeks: number[];
}

/** Parses one whole-number value; throws on a value that is not a safe integer in range. */
function wholeNumber(value: string | undefined, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${value}"`);
    return parsed;
}

/** Parses the arguments; throws an argument error (exit code 2). */
function parseArgs(argv: string[]): Args {
    let batch: string | undefined;
    let level = 2;
    let weeks = [1];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--batch') batch = argv[++i];
        else if (arg === '--level') level = wholeNumber(argv[++i], '--level', 1, 4);
        else if (arg === '--weeks') weeks = String(argv[++i] ?? '').split(',').map((week) => wholeNumber(week, `--weeks "${week}"`, 1, 32));
        else throw new Error(`unknown argument: ${arg}`);
    }
    if (!batch) throw new Error('a --batch folder is required');
    return { batch: path.resolve(batch), level, weeks };
}

async function main(argv: string[]): Promise<number> {
    if (argv.includes('--help') || argv.includes('-h')) {
        console.log(USAGE);
        return 0;
    }
    let args: Args;
    try {
        args = parseArgs(argv);
    } catch (e) {
        console.error(`${e instanceof Error ? e.message : String(e)}\n\n${USAGE}`);
        return 2;
    }
    // A batch folder without a manifest.json and a manifest.json that does not parse are batch
    // problems of the same class (C-P4-10): the command names either one before any row and
    // gives exit 2.
    try {
        readStorytimePictureManifest(args.batch);
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        return 2;
    }
    const read = readLevelWeeks(STORYTIME_ROOT, args.level).filter((r) => args.weeks.includes((r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    // The same --weeks contract as make-readers-pdf.ts (C-P4-9): a week that the level does not
    // load, and a duplicate week, stop the command before the batch, so it never reports a pass
    // for a week it did not check.
    checkRequestedWeeks(args.weeks, read.map((r) => (r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    const broken = read.filter((r) => !r.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((r) => `${r.file} (${r.error})`).join('; ')}`);
        return 1;
    }
    const weeks = read.flatMap((r) => (r.week ? [r.week] : [])).sort((a, b) => a.meta.week - b.meta.week);
    if (!weeks.length) {
        console.error(`no week files for level ${args.level} and weeks ${args.weeks.join(', ')} under ${STORYTIME_ROOT}`);
        return 1;
    }
    const rows = storytimePrintPictures(weeks).filter((row) => args.weeks.includes(row.week));
    if (!rows.length) {
        console.error(`no picture rows for level ${args.level} and weeks ${args.weeks.join(', ')}`);
        return 1;
    }
    const report = await checkStorytimePictureBatch(rows, args.batch);
    for (const result of report.results) {
        console.log(result.status === 'pass' ? `pass  ${result.rowId}` : `fail  ${result.rowId}: ${result.reason ?? 'no reason'}`);
    }
    const failed = report.results.filter((result) => result.status === 'fail').length;
    console.log(`${report.results.length - failed} of ${report.results.length} rows pass stage 1 (${args.batch})`);
    return report.exitCode;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

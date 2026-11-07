import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { storytimeLabels, type StorytimeLabels } from '../../lib/storytime/i18n';
import { StorytimeWeekSchema, type StorytimeWeek } from '../../lib/storytime/schema';

const USAGE = `Checks the caption list of the parent-share moments against its sources (track
storytime_teaching_loops_20261103, spec FR-14 "The caption cross-check").

Usage: npx tsx scripts/storytime/check-share-captions.ts --level <n> --list <path>

  --level   The level of the week files, a whole number from 1 to 4
  --list    The caption list of the 11-16 sitting

Exit code 0 when every row equals its source. Exit code 1 when a row differs, is missing, is
extra, or repeats. Exit code 2 on an argument error or a missing list file.
The last output line is "share captions: <rows> rows, <problems> problems".`;

/** The label keys of the caption list, in the order of the `SL-` rows (Q22). */
const LABEL_KEYS = ['sharePhoto', 'shareVideo', 'shareConsent', 'shareLength'] as const;

/** The cell count of an `SC-` row: id, week, day, shots, English caption, Thai caption (Q22). */
const SHARE_CELLS = 6;

/** The cell count of an `SL-` row: id, key, English, Thai (Q22). */
const LABEL_CELLS = 4;

/** The two label sets of the cross-check. */
type Labels = { en: StorytimeLabels; th: StorytimeLabels };

/** A whole number of two digits, as the week part of a row id (Q22). */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** The Shots cell of a moment: each shot as `<step> <media>`, joined with `; ` in array order (Q22). */
function shotsCell(shots: { step: string; media: string }[]): string {
    return shots.map((shot) => `${shot.step} ${shot.media}`).join('; ');
}

/**
 * The cells of one caption-list row. A cell splits on a `|` that no backslash precedes, `\|` reads back
 * as `|`, and each cell is trimmed (Q22).
 * @param line The row line, which starts with `| SC-` or `| SL-`.
 * @returns The cells of the row.
 */
function splitCells(line: string): string[] {
    const cells: string[] = [];
    let cell = '';
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '\\' && line[i + 1] === '|') {
            cell += '|';
            i++;
            continue;
        }
        if (c === '|') {
            cells.push(cell);
            cell = '';
            continue;
        }
        cell += c;
    }
    cells.push(cell);
    // The row line starts and ends with a bar; the empty cells around the row are not cells.
    if (cells.length && cells[0].trim() === '') cells.shift();
    if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
    return cells.map((x) => x.trim());
}

/**
 * The week number of an `SC-` row id.
 * @param id The row id, in the form `SC-w<NN>-d<D>`.
 * @returns The week number, or undefined when the id is not in that form.
 */
function scWeekOf(id: string): number | undefined {
    const match = /^SC-w(\d{2})-d\d$/.exec(id);
    return match ? Number(match[1]) : undefined;
}

/**
 * Compares the caption list with its sources: the share of each script of the weeks, and the four share
 * labels of the two languages (spec FR-14, Q22 to Q24).
 *
 * Each problem line starts with the row id and `: `. The row count holds every `SC-` and `SL-` row read.
 * A script without a share gives one problem and no throw. A week that does not parse gives one problem
 * that starts with its week id, and no throw. When the week list is empty, the `SC-` rows are not judged.
 *
 * @param weeks The parsed weeks of one level.
 * @param labels The label sets of the English and the Thai book.
 * @param list The text of the caption list.
 * @returns The rows read and one line for each problem.
 */
export function shareCaptionProblems(weeks: StorytimeWeek[], labels: Labels, list: string): { rows: number; problems: string[] } {
    const problems: string[] = [];
    const expected = new Map<string, string[]>();
    const noShare = new Set<string>();
    const brokenWeeks = new Set<number>();
    let parsed = 0;
    for (const entry of weeks) {
        const week = StorytimeWeekSchema.safeParse(entry);
        if (!week.success) {
            const n = Number((entry as unknown as { meta?: { week?: number } } | null | undefined)?.meta?.week);
            if (Number.isInteger(n)) brokenWeeks.add(n);
            problems.push(`w${Number.isInteger(n) ? pad2(n) : '??'}: the week file does not parse`);
            continue;
        }
        parsed++;
        for (const script of week.data.scripts) {
            const id = `SC-w${pad2(week.data.meta.week)}-d${script.day}`;
            if (!script.share) {
                noShare.add(id);
                problems.push(`${id}: the week file has no share`);
                continue;
            }
            expected.set(id, [
                String(week.data.meta.week),
                String(script.day),
                shotsCell(script.share.shots),
                script.share.caption.en.trim(),
                script.share.caption.th.trim(),
            ]);
        }
    }
    LABEL_KEYS.forEach((key, i) => expected.set(`SL-${i + 1}`, [key, labels.en[key].trim(), labels.th[key].trim()]));

    const seen = new Set<string>();
    let rows = 0;
    for (const line of list.split(/\r?\n/)) {
        const row = line.trim();
        const isSc = row.startsWith('| SC-');
        if (!isSc && !row.startsWith('| SL-')) continue;
        const cells = splitCells(row);
        rows++;
        const id = cells[0] ?? '';
        const want = isSc ? SHARE_CELLS : LABEL_CELLS;
        if (cells.length !== want) {
            problems.push(`${id}: the row has ${cells.length} cells, not ${want}`);
            seen.add(id);
            continue;
        }
        if (seen.has(id)) {
            problems.push(`${id}: the row repeats`);
            continue;
        }
        seen.add(id);
        if (noShare.has(id)) continue;
        const source = expected.get(id);
        if (source) {
            if (!source.every((cell, i) => cells[i + 1] === cell)) problems.push(`${id}: the row differs from the week file`);
            continue;
        }
        const week = isSc ? scWeekOf(id) : undefined;
        if (isSc && (parsed === 0 || (week !== undefined && brokenWeeks.has(week)))) continue;
        problems.push(`${id}: the row is not in the sources`);
    }
    for (const id of expected.keys()) if (!seen.has(id) && !noShare.has(id)) problems.push(`${id}: the row is missing`);
    return { rows, problems };
}

/**
 * Runs the cross-check of one level from the command line (spec FR-14).
 * @param argv The arguments after the script path.
 * @returns The exit code: 0 (clean), 1 (a problem), or 2 (a usage error).
 */
function main(argv: string[]): number {
    let level: number | undefined;
    let listFile: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') {
            const value = argv[++i];
            if (value === undefined) {
                console.error(`--level needs a value\n\n${USAGE}`);
                return 2;
            }
            level = Number(value);
        } else if (a === '--list') {
            const value = argv[++i];
            if (value === undefined) {
                console.error(`--list needs a value\n\n${USAGE}`);
                return 2;
            }
            listFile = path.resolve(value);
        } else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (level === undefined || listFile === undefined || !Number.isInteger(level) || level < 1 || level > 4) {
        console.error(USAGE);
        return 2;
    }
    if (!fs.existsSync(listFile)) {
        console.error(`No such list file: ${listFile}`);
        return 2;
    }
    // A week that does not parse goes to the function as its raw object, so that it names the week (Q24).
    const weeks = readLevelWeeks(STORYTIME_ROOT, level).map((read) => read.week ?? (read.raw as StorytimeWeek));
    const labels: Labels = { en: storytimeLabels('en'), th: storytimeLabels('th') };
    const result = shareCaptionProblems(weeks, labels, fs.readFileSync(listFile, 'utf8'));
    for (const problem of result.problems) console.log(problem);
    console.log(`share captions: ${result.rows} rows, ${result.problems.length} problems`);
    return result.problems.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    process.exitCode = main(process.argv.slice(2));
}

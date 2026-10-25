// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { checkStorytimeWeek } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import type { PackageCheck } from '../lib/lesson-package/checks';

/**
 * Green 2 API contract (test strategy 4.13.2):
 * - print/pictures.ts exports STORYTIME_PICTURE_SPEC and adds `lineArtFileName`, `width`, and
 *   `height` to every row; pictureListMarkdown(rows, 2) writes the "Version 2" readable list.
 * - print/text-check.ts adds the picture-word check; its id is `print-picture-word`.
 * - schema.ts keeps `source` and `words` on each of the six app approval parts (parsed values).
 * New modules load inside test bodies with await import, so a missing export fails one test.
 */
const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const storytimeModuleRoot = fileURLToPath(new URL('../lib/storytime/', import.meta.url));
const printDir = path.join(STORYTIME_ROOT, 'l2', 'print');
const temporaryFolders: string[] = [];
const checkById = (checks: PackageCheck[], id: string) => checks.find((check) => check.id === id);

/** The six app approval parts (FR-1.3); the print part is a seventh, separate part (G5). */
const APP_PARTS = ['text', 'thai', 'images', 'audio', 'song', 'scripts'] as const;

/** The pinned source line of record (a) of P14, per shipped week. */
const THAI_SOURCE_LINE: Record<number, number> = { 1: 67, 2: 80, 3: 80, 4: 80, 5: 82, 6: 82, 7: 82, 8: 155 };

const thaiSource = (week: number) =>
    `reading-advantage-monorepo 2ae13a4c6 measure/tracks/storytime_advantage_program_20261021/plan.md line ${THAI_SOURCE_LINE[week]}`;

interface V2PictureRow {
    id: string;
    week: number;
    use: string;
    sizeClass: 'A' | 'B' | 'C';
    fileName: string;
    lineArtFileName?: string;
    width?: number;
    height?: number;
}

interface WeekCopy {
    print?: { practice: { text: string; pictureWord: string }[]; [key: string]: unknown };
    approval?: Record<string, { status?: string; date?: string; words?: string; source?: string } | undefined>;
    books?: { pages: { text: string; image?: unknown }[]; [key: string]: unknown }[];
    [key: string]: unknown;
}

function shipped(week: number): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8'));
}

function parsed(week: unknown): StorytimeWeek {
    return StorytimeWeekSchema.parse(week);
}

function shippedWeeks(): StorytimeWeek[] {
    return weekNumbers.map((week) => parsed(shipped(week)));
}

// Persist each changed copy in its own folder. Never write to STORYTIME_ROOT.
function copyWeek(week: unknown, change: (copy: WeekCopy) => void): WeekCopy {
    const root = '/tmp/opencode';
    fs.mkdirSync(root, { recursive: true });
    const folder = fs.mkdtempSync(path.join(root, 'storytime-print-contract-v2-'));
    temporaryFolders.push(folder);
    const file = path.join(folder, 'week.json');
    fs.writeFileSync(file, JSON.stringify(week));
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')) as WeekCopy;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return JSON.parse(fs.readFileSync(file, 'utf8')) as WeekCopy;
}

async function textChecks(week: unknown): Promise<PackageCheck[]> {
    const exports = await import(path.join(storytimeModuleRoot, 'print', 'text-check.ts'));
    expect(exports.checkStorytimePrintText, 'Export checkStorytimePrintText from print/text-check.ts.').toBeTypeOf('function');
    return exports.checkStorytimePrintText(parsed(week));
}

async function pictures(weeks: unknown[]): Promise<V2PictureRow[]> {
    const exports = await import(path.join(storytimeModuleRoot, 'print', 'pictures.ts'));
    expect(exports.storytimePrintPictures, 'Export storytimePrintPictures from print/pictures.ts.').toBeTypeOf('function');
    return exports.storytimePrintPictures(weeks.map(parsed));
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe('Storytime print v2: line-art names of the picture list (R11)', () => {
    it('gives every row the line-art name of FR-2.3 and FR-9', async () => {
        const rows = await pictures(shippedWeeks());
        expect(rows.length, 'The shipped list has 192 rows.').toBe(192);
        for (const row of rows) {
            expect(row.lineArtFileName, `The row ${row.id} needs a line-art file name.`).toBe(
                row.fileName.replace(/-v(\d+)\.png$/, '-line-v$1.png'),
            );
            expect(row.lineArtFileName, `The line-art name of ${row.id} matches the pattern.`).toMatch(
                /^l2-w\d{2}-[a-z-]+-line-v\d+\.png$/,
            );
        }
    });

    it('keeps the 192 color names and the 192 line-art names distinct across weeks 1 to 8', async () => {
        const rows = await pictures(shippedWeeks());
        const colorNames = rows.map((row) => row.fileName);
        const lineNames = rows.map((row) => row.lineArtFileName);
        expect(new Set(colorNames).size, 'Color file names are unique across weeks 1 to 8.').toBe(192);
        const union = new Set([...colorNames, ...lineNames]);
        expect(union.size, 'The union of the color names and the line-art names has 384 distinct values.').toBe(384);
    });

    it('keeps colliding page slugs distinct, or throws with both ids (F13)', async () => {
        const week = copyWeek(shipped(1), (copy) => {
            const book = copy.books?.[0];
            if (!book) throw new Error('The shipped week 1 needs a book for the collision copy.');
            book.pages.push({ text: 'A line.' }, { text: 'A.' });
        });
        let rows: V2PictureRow[];
        try {
            rows = await pictures([week]);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            expect(message, 'A thrown collision names both ids.').toContain('l2-w01-story-page-a-line');
            expect(message).toContain('l2-w01-story-page-a');
            return;
        }
        const colorNames = rows.map((row) => row.fileName);
        const lineNames = rows.map((row) => row.lineArtFileName);
        for (const name of lineNames) expect(name, 'Every row keeps a line-art name.').toBeTypeOf('string');
        expect(new Set(colorNames).size, 'No two rows share a color file name.').toBe(colorNames.length);
        expect(new Set(lineNames).size, 'No two rows share a line-art file name.').toBe(lineNames.length);
        const colorSet = new Set(colorNames);
        for (const name of lineNames) {
            expect(colorSet.has(name!), `The line-art name ${name} must not equal a color name.`).toBe(false);
        }
    });
});

describe('Storytime print v2: the FR-9 v1 pixel spec (R12)', () => {
    it('exports STORYTIME_PICTURE_SPEC with the exact v1 constants', async () => {
        const exports = await import(path.join(storytimeModuleRoot, 'print', 'pictures.ts'));
        expect(exports.STORYTIME_PICTURE_SPEC, 'Export STORYTIME_PICTURE_SPEC from print/pictures.ts.').toEqual({
            A: { width: 4000, height: 3000 },
            B: { width: 4000, height: 3000 },
            C: { width: 1500, height: 1500 },
        });
    });

    it('gives every row the pixel size of its class, with the shipped counts by use', async () => {
        const exports = await import(path.join(storytimeModuleRoot, 'print', 'pictures.ts'));
        const spec = exports.STORYTIME_PICTURE_SPEC;
        expect(spec, 'Export STORYTIME_PICTURE_SPEC from print/pictures.ts.').toBeTypeOf('object');
        const rows = await pictures(shippedWeeks());
        for (const row of rows) {
            const size = spec[row.sizeClass];
            expect(size, `A size constant exists for class ${row.sizeClass}.`).toBeDefined();
            expect(row.width, `The width of ${row.id} equals the class ${row.sizeClass} constant.`).toBe(size.width);
            expect(row.height, `The height of ${row.id} equals the class ${row.sizeClass} constant.`).toBe(size.height);
        }
        const byUse: Record<string, number> = { 'story-page': 0, cover: 0, 'check-row': 0, 'practice-line': 0, card: 0, sticker: 0 };
        for (const row of rows) byUse[row.use] += 1;
        expect(byUse['story-page'], 'story-page rows: 112').toBe(112);
        expect(byUse.cover, 'cover rows: 14').toBe(14);
        expect(byUse['check-row'], 'check-row rows: 63').toBe(63);
        expect(byUse['practice-line'], 'practice-line rows: 3').toBe(3);
        expect(byUse.card, 'card rows: 0').toBe(0);
        expect(byUse.sticker, 'sticker rows: 0').toBe(0);
    });
});

describe('Storytime print v2: the picture-word rule (R13)', () => {
    it.each([['net'], ['Net'], ['zebra']])(
        'fails print-picture-word with "%s" as the picture word of the "and" line',
        async (pictureWord) => {
            const week = copyWeek(shipped(1), (copy) => {
                if (!copy.print) throw new Error('The shipped week 1 needs its print block.');
                copy.print.practice[2].pictureWord = pictureWord;
            });
            const checks = await textChecks(week);
            const found = checkById(checks, 'print-picture-word');
            expect(found, 'Report the rule as print-picture-word with status fail.').toMatchObject({ status: 'fail' });
            expect(found?.detail, 'The detail names the "and" line.').toMatch(/\band\b/);
            expect(found?.detail, 'The detail names the "A nest. A net." line.').toContain('A nest. A net.');
        },
    );

    it('allows a picture word on its own line (the rule is not over-broad)', async () => {
        const week = copyWeek(shipped(1), (copy) => {
            if (!copy.print) throw new Error('The shipped week 1 needs its print block.');
            copy.print.practice[1].pictureWord = 'nest';
        });
        const checks = await textChecks(week);
        expect(checkById(checks, 'print-picture-word'), 'A word on its own line is allowed.').toMatchObject({ status: 'pass' });
        expect(checks.filter((check) => check.status === 'fail'), 'No other print check fails on the copy.').toEqual([]);
    });

    it('passes the shipped week 1 after the F1 fix (pictureWord "nut")', async () => {
        const checks = await textChecks(shipped(1));
        expect(checkById(checks, 'print-picture-word'), 'The shipped week 1 passes the picture-word rule.').toMatchObject({ status: 'pass' });
    });

    it('wires the error into checkStorytimeWeek and the published gate', async () => {
        const week = copyWeek(shipped(1), (copy) => {
            if (!copy.print) throw new Error('The shipped week 1 needs its print block.');
            copy.print.practice[2].pictureWord = 'net';
        });
        const report = checkStorytimeWeek(week);
        expect(checkById(report.checks, 'print-picture-word'), 'checkStorytimeWeek carries the same FAIL.').toMatchObject({ status: 'fail' });
        const published = checkById(report.checks, 'published');
        expect(published?.detail, 'The published detail names the print-picture-word failure.').toContain('print-picture-word fails');
    });
});

describe('Storytime print v2: the P14 approval records (R14)', () => {
    it('preserves source and words on each app part as parsed values (F9)', () => {
        for (const part of APP_PARTS) {
            const record = {
                status: 'approved',
                date: '2026-10-23',
                words: 'Synthetic test words; not an owner decision.',
                source: 'Synthetic test source.',
            };
            const week = copyWeek(shipped(1), (copy) => {
                copy.approval = { ...(copy.approval ?? {}), [part]: { ...record } };
            });
            expect(parsed(week).approval[part], `The ${part} part must keep source and words exactly.`).toEqual(record);
        }
        const minimal = copyWeek(shipped(1), (copy) => {
            copy.approval = { ...(copy.approval ?? {}), text: { status: 'approved', date: '2026-10-23' } };
        });
        expect(parsed(minimal).approval.text, 'No new rule: status and date alone still parse.').toEqual({ status: 'approved', date: '2026-10-23' });
    });

    it.each(weekNumbers)('week %i records the thai approval with its pinned source line', (week) => {
        const approval = parsed(shipped(week)).approval;
        expect(approval.thai, `Week ${week}: record (a) of P14 with line ${THAI_SOURCE_LINE[week]}.`).toEqual({
            status: 'approved',
            date: '2026-10-22',
            source: thaiSource(week),
        });
        expect(approval.thai, 'The thai record carries no words key.').not.toHaveProperty('words');
    });

    it('week 1 records the text and scripts approvals (decision S29)', () => {
        const approval = parsed(shipped(1)).approval;
        const expected = {
            status: 'approved',
            date: '2026-10-23',
            words: 'publish week 1',
            source: 'Workbooks commit 4d78b21 (decision S29)',
        };
        expect(approval.text, 'Record (b) of P14 for the text part.').toEqual(expected);
        expect(approval.scripts, 'Record (b) of P14 for the scripts part.').toEqual(expected);
    });

    it('keeps the other parts draft in all eight weeks', () => {
        const first = parsed(shipped(1)).approval;
        expect(first.images, 'Week 1: images stay draft (record (c) of P14).').toEqual({ status: 'draft' });
        expect(first.audio, 'Week 1: audio stays draft.').toEqual({ status: 'draft' });
        expect(first.song, 'Week 1: song stays draft.').toEqual({ status: 'draft' });
        for (const week of weekNumbers) {
            const approval = parsed(shipped(week)).approval;
            expect(approval.print, `Week ${week}: the print part stays draft.`).toEqual({ status: 'draft' });
            if (week === 1) continue;
            for (const part of APP_PARTS) {
                if (part === 'thai') continue;
                expect(approval[part], `Week ${week}: ${part} stays draft.`).toEqual({ status: 'draft' });
            }
        }
    });

    it('the published gate of st2/1 names only images, audio, and song', () => {
        const published = checkById(checkStorytimeWeek(shipped(1)).checks, 'published');
        expect(published, 'st2/1 stays unpublished until its media are approved.').toMatchObject({ status: 'fail' });
        expect(published?.detail, 'The published detail of st2/1 is exactly the three media parts.').toBe(
            'images not approved; audio not approved; song not approved',
        );
    });
});

describe('Storytime print v2: the readable list drift guard (R10b)', () => {
    it('keeps the committed pictures.md equal to pictureListMarkdown(rows, 2), header "Version 2"', async () => {
        const exports = await import(path.join(storytimeModuleRoot, 'print', 'pictures.ts'));
        expect(exports.pictureListMarkdown, 'Export pictureListMarkdown from print/pictures.ts.').toBeTypeOf('function');
        const rows = await pictures(shippedWeeks());
        const file = path.join(printDir, 'pictures.md');
        expect(fs.existsSync(file), 'Commit content/storytime/l2/print/pictures.md.').toBe(true);
        const committed = fs.readFileSync(file, 'utf8');
        expect(committed.split('\n').slice(0, 3).join('\n'), 'The committed list header says Version 2.').toContain('Version 2');
        expect(committed, 'Regenerate pictures.md after its inputs change.').toBe(exports.pictureListMarkdown(rows, 2));
        const lines = committed.split('\n');
        for (const row of rows) {
            const line = lines.find((candidate) => candidate.includes(row.fileName));
            expect(line, `The readable list holds the row ${row.id}.`).toBeDefined();
            expect(line, `The row line holds the line-art name of ${row.id}.`).toContain(row.lineArtFileName);
            expect(line, `The row line holds the pixel size of class ${row.sizeClass}.`).toMatch(/\d{4}\s*[×x]\s*\d{4}/);
        }
    });
});

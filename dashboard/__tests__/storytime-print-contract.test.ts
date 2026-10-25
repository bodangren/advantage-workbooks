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
 * Green API contract:
 * - print/text-check.ts exports checkStorytimePrintText(week): PackageCheck[].
 * - print/pictures.ts exports storytimePrintPictures(weeks): PictureRow[].
 * New modules load inside test bodies. Missing modules must not stop collection.
 * The print block below defines the additive JSON contract for Phase 1.
 */
interface PrintBlock {
    letterBox: { letter: string; formationWords: string; startPoint: string };
    practice: { text: string; pictureWord: string }[];
    dictation: { letters: string[]; words: string[]; traceSentence?: string };
    writing: { traceText: string; line: 'name' | 'word'; pictureBox: boolean };
}

type PrintWeek = Omit<StorytimeWeek, 'print' | 'approval'> & {
    print?: PrintBlock;
    approval: Omit<StorytimeWeek['approval'], 'print'> & {
        print?: { status: string; date?: string; words?: string };
    };
};

interface PictureRow {
    id: string;
    week: number;
    use: 'story-page' | 'cover' | 'check-row' | 'practice-line' | 'card' | 'sticker';
    text: string;
    prompt: string;
    caption: string;
    objectCounts: Record<string, number>;
    sizeClass: 'A' | 'B' | 'C';
    fileName: string;
}

const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const storytimeModuleRoot = fileURLToPath(new URL('../lib/storytime/', import.meta.url));
const temporaryFolders: string[] = [];
const checkById = (checks: PackageCheck[], id: string) => checks.find((check) => check.id === id);

function shipped(week: number): PrintWeek {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8'));
}

function parsed(week: PrintWeek): PrintWeek {
    return StorytimeWeekSchema.parse(week) as PrintWeek;
}

function shippedWeeks(): PrintWeek[] {
    return weekNumbers.map((week) => parsed(shipped(week)));
}

function step(week: PrintWeek, id: string) {
    const found = week.scripts.flatMap((script) => script.steps).find((item) => item.id === id);
    if (!found) throw new Error(`The shipped week has no step ${id}.`);
    return found;
}

// Supplement a shipped week copy, not a replacement week fixture.
function withPrint(): PrintWeek & { print: PrintBlock } {
    const week = shipped(1);
    const formationWords = step(week, 'A3').en.teacherLanguage[0].replace(/^"|"$/g, '');
    const practiceText = step(week, 'A7').en.teacherLanguage[1].replace(/^"|"$/g, '');
    return {
        ...week,
        print: {
            letterBox: { letter: 'n', formationWords, startPoint: 'top' },
            practice: [
                { text: 'n n n', pictureWord: 'nose' },
                { text: practiceText, pictureWord: 'nest' },
                { text: 'and', pictureWord: 'net' },
            ],
            dictation: { letters: ['n', 'n', 'n'], words: ['a'] },
            writing: { traceText: 'Hello, I am', line: 'name', pictureBox: true },
        },
    };
}

// Persist each changed copy in its own folder. Never write to STORYTIME_ROOT.
function copyWeek(week: PrintWeek, change: (copy: PrintWeek) => void): PrintWeek {
    const root = '/tmp/opencode';
    fs.mkdirSync(root, { recursive: true });
    const folder = fs.mkdtempSync(path.join(root, 'storytime-print-contract-'));
    temporaryFolders.push(folder);
    const file = path.join(folder, 'week.json');
    fs.writeFileSync(file, JSON.stringify(week));
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')) as PrintWeek;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function textChecks(week: PrintWeek): Promise<PackageCheck[]> {
    const modulePath = path.join(storytimeModuleRoot, 'print', 'text-check.ts');
    const exports = await import(modulePath);
    expect(exports.checkStorytimePrintText, 'Export checkStorytimePrintText from print/text-check.ts.').toBeTypeOf('function');
    return exports.checkStorytimePrintText(parsed(week));
}

async function pictures(weeks: PrintWeek[]): Promise<PictureRow[]> {
    const modulePath = path.join(storytimeModuleRoot, 'print', 'pictures.ts');
    const exports = await import(modulePath);
    expect(exports.storytimePrintPictures, 'Export storytimePrintPictures from print/pictures.ts.').toBeTypeOf('function');
    return exports.storytimePrintPictures(weeks.map(parsed));
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe('Storytime print: shipped package characterization', () => {
    it.each(weekNumbers)('parses shipped week %i without changing its app contract', async (week) => {
        // Exercise the same dynamic resolution that the new print modules use.
        const modulePath = path.join(storytimeModuleRoot, 'schema.ts');
        const exports = await import(modulePath);
        const result = exports.StorytimeWeekSchema.safeParse(shipped(week));
        expect(result.success, `The shipped week ${week} must parse.`).toBe(true);
        if (result.success) expect(result.data.meta.key).toBe(`st2/${week}`);
    });
});

describe('Storytime print: schema and approvals', () => {
    it.each(weekNumbers)('R1: defaults print approval to draft for week %i without a print block', (number) => {
        const week = copyWeek(shipped(number), (copy) => {
            delete copy.print;
            delete copy.approval?.print;
        });
        expect(parsed(week).approval.print, 'The additive approval.print default is missing.').toEqual({ status: 'draft' });
    });

    it('R2: preserves the full week 1 print block', () => {
        const week = copyWeek(withPrint(), () => {});
        expect(parsed(week).print, 'The schema must preserve every print part.').toEqual(week.print);
    });

    it.each(['unknown block key', 'unknown part name', 'unknown nested key'])('R2: rejects an %s', (kind) => {
        const week = copyWeek(withPrint(), (copy) => {
            if (kind === 'unknown block key') Object.assign(copy.print!, { surprise: true });
            else if (kind === 'unknown part name') {
                Object.assign(copy.print!, { practiceSheet: copy.print!.practice });
                delete (copy.print as Partial<PrintBlock>).practice;
            } else Object.assign(copy.print!.writing, { surprise: true });
        });
        expect(StorytimeWeekSchema.safeParse(week).success, `Reject the ${kind}; do not strip it.`).toBe(false);
    });

    it('R9: preserves a complete print approval record on a temporary copy', () => {
        // This synthetic record tests the schema. It records no real approval.
        const approval = { status: 'approved', date: '2026-10-25', words: 'Synthetic test approval; not an owner decision.' };
        const week = copyWeek(withPrint(), (copy) => { copy.approval = { ...copy.approval, print: approval }; });
        expect(parsed(week).approval.print, 'Preserve the exact approval words and date.').toEqual(approval);
    });

    it.each(['date', 'words', 'empty words'])('R9: rejects approved print with invalid %s', (missing) => {
        const week = copyWeek(withPrint(), (copy) => {
            const approval: { status: string; date?: string; words?: string } = {
                status: 'approved', date: '2026-10-25', words: 'Synthetic test approval; not an owner decision.',
            };
            if (missing === 'date') delete approval.date;
            else if (missing === 'words') delete approval.words;
            else approval.words = '';
            copy.approval = { ...copy.approval, print: approval };
        });
        expect(StorytimeWeekSchema.safeParse(week).success, `Reject an approval with invalid ${missing}.`).toBe(false);
    });

    it('R9/G5: keeps a draft print part outside the six-part app publication gate', () => {
        const week = copyWeek(withPrint(), (copy) => {
            const approved = { status: 'approved' as const, date: '2026-10-25' };
            copy.meta.status = 'published';
            copy.approval = {
                text: approved, thai: approved, images: approved, audio: approved, song: approved, scripts: approved,
                print: { status: 'draft' },
            };
        });
        expect(parsed(week).approval.print, 'The draft print part must survive parsing before the G5 check.').toEqual({ status: 'draft' });
        expect(checkById(checkStorytimeWeek(week).checks, 'published'), 'Print approval must not block app publication.').toMatchObject({ status: 'pass' });
    });
});

describe('Storytime print: exact text checks', () => {
    it('R3: passes the complete week 1 block copied from the shipped scripts', async () => {
        const checks = await textChecks(copyWeek(withPrint(), () => {}));
        expect(checkById(checks, 'print-practice')).toMatchObject({ status: 'pass' });
        expect(checks.length, 'A print-text check must run.').toBeGreaterThan(0);
        expect(checks.every((check) => check.status === 'pass')).toBe(true);
    });

    it.each([
        ['removed A7 word', 'A nest. A.'],
        ['extra teacher-only words', 'A nest. A net. Look at the page.'],
    ])('R3: fails print-practice after this change: %s', async (_reason, text) => {
        const week = copyWeek(withPrint(), (copy) => { copy.print!.practice[1].text = text; });
        expect(checkById(await textChecks(week), 'print-practice'), 'Report the A7 difference as print-practice.').toMatchObject({ status: 'fail' });
        expect(checkById(checkStorytimeWeek(week).checks, 'print-practice'), 'Wire the print-text error into checkStorytimeWeek.').toMatchObject({ status: 'fail' });
    });

    it.each(['A3', 'C3', 'D4', 'E5'])('FR-1.2: detects the %s difference on a temporary copy', async (id) => {
        const week = copyWeek(withPrint(), (copy) => {
            if (id === 'A3') copy.print!.letterBox.formationWords = 'Start at the bottom.';
            if (id === 'C3') copy.print!.dictation.words = ['can'];
            if (id === 'D4') copy.print!.writing.traceText = 'Goodbye, I am';
            if (id === 'E5') {
                const item = copy.check.items[0];
                if (item.kind === 'circle-picture') item.pictures[0] = 'nut';
            }
        });
        const failures = (await textChecks(week)).filter((check) => check.status === 'fail');
        expect(failures.length, `The text check must detect the ${id} difference.`).toBeGreaterThan(0);
    });

    it.each(weekNumbers)('R4: warns, without a print FAIL, when week %i has no block', (number) => {
        const week = copyWeek(shipped(number), (copy) => { delete copy.print; });
        const checks = checkStorytimeWeek(week).checks;
        expect(checkById(checks, 'print-missing'), 'A missing block needs the fixed print-missing WARN.').toMatchObject({ status: 'warn' });
        expect(checks.filter((check) => check.id.startsWith('print-') && check.status === 'fail')).toEqual([]);
    });

    it('R4: requires the shipped week 1 block and nonempty PASS checks', () => {
        const week = shipped(1);
        expect(week.print, 'Green must add the week 1 print block; absence is not a PASS.').toBeDefined();
        const checks = checkStorytimeWeek(week).checks.filter((check) => check.id.startsWith('print-'));
        expect(checks.length, 'The shipped week 1 must run print checks.').toBeGreaterThan(0);
        expect(checkById(checks, 'print-practice')).toMatchObject({ status: 'pass' });
        expect(checks.every((check) => check.status === 'pass')).toBe(true);
    });
});

describe('Storytime print: Forge picture list', () => {
    it('R5: lists exactly 16 story pages, 2 covers, 9 check pictures, and each practice picture', async () => {
        const week = withPrint();
        const rows = await pictures([copyWeek(week, () => {})]);
        expect(rows.filter((row) => row.use === 'story-page')).toHaveLength(16);
        expect(rows.filter((row) => row.use === 'cover')).toHaveLength(2);
        const checkRows = rows.filter((row) => row.use === 'check-row');
        expect(checkRows).toHaveLength(9);
        expect(checkRows.map((row) => row.text)).toEqual(['nest', 'cat', 'fish', 'dog', 'nose', 'bus', 'hat', 'cup', 'net']);
        for (const row of checkRows) expect(row.id, 'The namespaced id must identify its picture word.').toContain(row.text);
        const practiceRows = rows.filter((row) => row.use === 'practice-line');
        expect(practiceRows).toHaveLength(week.print.practice.length);
        expect(practiceRows.map((row) => row.text)).toEqual(week.print.practice.map((line) => line.pictureWord));
    });

    it('FR-2.2: preserves the shipped prompts, captions, page text, and explicit object counts', async () => {
        const week = withPrint();
        const rows = await pictures([copyWeek(week, () => {})]);
        const pages = rows.filter((row) => row.use === 'story-page');
        const sourcePages = week.books.flatMap((book) => book.pages);
        expect(pages.map((row) => [row.text, row.prompt, row.caption])).toEqual(
            sourcePages.map((page) => [page.text, page.image?.prompt ?? '', page.image?.caption ?? '']),
        );
        expect(rows.filter((row) => row.use === 'cover').map((row) => [row.prompt, row.caption])).toEqual(
            week.books.map((book) => [book.cover?.prompt ?? '', book.cover?.caption ?? '']),
        );
        const nest = pages.find((row) => row.text === 'A nest.');
        expect(nest?.objectCounts, 'A nest means one nest, not three eggs from the prompt.').toMatchObject({ nest: 1 });
        for (const row of rows) {
            expect(row.id).toBeTruthy();
            expect(row.prompt).toBeTypeOf('string');
            expect(row.caption).toBeTypeOf('string');
            expect(row.objectCounts).toBeDefined();
            for (const count of Object.values(row.objectCounts)) {
                expect(Number.isInteger(count) && count > 0).toBe(true);
            }
        }
    });

    it('R6: assigns A to story pages, B to covers, and C to check and practice pictures', async () => {
        const rows = await pictures([copyWeek(withPrint(), () => {})]);
        for (const [use, sizeClass] of [['story-page', 'A'], ['cover', 'B'], ['check-row', 'C'], ['practice-line', 'C']]) {
            const selected = rows.filter((row) => row.use === use);
            expect(selected.length, `The ${use} rows must exist.`).toBeGreaterThan(0);
            expect(selected.every((row) => row.sizeClass === sizeClass), `${use} requires class ${sizeClass}.`).toBe(true);
        }
    });

    it('R7: gives unique ids and versioned file names across all eight shipped weeks', async () => {
        const weeks = shippedWeeks();
        const rows = await pictures(weeks);
        expect(rows.length).toBeGreaterThan(0);
        expect(new Set(rows.map((row) => row.id)).size, 'Picture ids must be unique across the unit.').toBe(rows.length);
        expect(new Set(rows.map((row) => row.fileName)).size, 'File names must be unique across the unit.').toBe(rows.length);
        for (const row of rows) {
            expect(row.fileName).toMatch(/^l2-w\d{2}-[a-z-]+-v\d+\.png$/);
            expect(Number(row.fileName.match(/^l2-w(\d{2})-/)?.[1]), 'The file week must equal the row week.').toBe(row.week);
            expect(weekNumbers).toContain(row.week);
        }
    });

    it('R8: handles shipped week 8 with no books and no cover or story-page rows', async () => {
        const week = shipped(8);
        expect(week.books).toEqual([]);
        const rows = await pictures([copyWeek(week, () => {})]);
        expect(rows.filter((row) => row.use === 'story-page')).toHaveLength(0);
        expect(rows.filter((row) => row.use === 'cover')).toHaveLength(0);
    });

    it('R10: keeps the committed picture list equal to the output on all shipped weeks', async () => {
        const file = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json');
        expect(fs.existsSync(file), 'Generate and commit content/storytime/l2/print/pictures.json.').toBe(true);
        const committed = JSON.parse(fs.readFileSync(file, 'utf8'));
        expect(committed, 'Regenerate the committed picture list after its inputs change.').toEqual(await pictures(shippedWeeks()));
    });
});

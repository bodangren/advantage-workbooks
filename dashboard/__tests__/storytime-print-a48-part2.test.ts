// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';

/**
 * A-48 step 2, part 2: the findings F3 (full stop in the D4 trace text), F4 (the picture row above
 * the trace row), F5 (the label of the picture row), and the units U7 to U9. The tests read the
 * shipped week files and compile the book in proof mode.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');

function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_v, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

let cachedBook: { html: string; doc: Document } | undefined;
/** The compiled 8-week book in proof mode, parsed once for the file. */
async function book(): Promise<{ html: string; doc: Document }> {
    if (cachedBook) return cachedBook;
    const { compileStorytimeStudentBook } = await import(studentModule) as {
        compileStorytimeStudentBook: (w: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' }) => { html: string };
    };
    const { html } = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
    cachedBook = { html, doc: new DOMParser().parseFromString(html, 'text/html') };
    return cachedBook;
}

const text = (element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The print-writing check of a week after a patch of `print.writing`. */
function writingCheck(weekNumber: number, patch: Record<string, unknown>) {
    const copy = JSON.parse(JSON.stringify(weeks()[weekNumber - 1])) as StorytimeWeek;
    Object.assign(copy.print!.writing, patch);
    return checkStorytimePrintText(StorytimeWeekSchema.parse(copy)).find((item) => item.id === 'print-writing')!;
}

describe('A-48 part 2, F3: the D4 trace text has the punctuation of the script', () => {
    it('F3-data: weeks 3, 5, and 6 end their trace text with a full stop', () => {
        const all = weeks().slice(0, 7).map((week) => week.print!.writing.traceText);
        expect(all).toEqual(['Hello, I am', 'How many?', 'It is red.', 'This is my ...', 'I have two eyes.', 'I can see a cat.', 'Is it a ball?']);
    });

    it('F3-check: the trace text equals the sentence of the D4 teacher action, with the punctuation', () => {
        for (let n = 1; n <= 7; n++) expect(writingCheck(n, {}).status, `Week ${n}`).toBe('pass');
        expect(writingCheck(3, { traceText: 'It is red' }).status, 'no full stop').toBe('fail');
        expect(writingCheck(3, { traceText: 'it is red.' }).status, 'no capital letter').toBe('fail');
        expect(writingCheck(6, { traceText: 'I can see a cat' }).status).toBe('fail');
        expect(writingCheck(2, { traceText: 'How many' }).status, 'no question mark').toBe('fail');
        expect(writingCheck(4, { traceText: 'This is my' }).status, 'the dots are optional').toBe('pass');
        expect(writingCheck(4, { traceText: 'This is your ...' }).status).toBe('fail');
        expect(writingCheck(1, { traceText: 'Hello, I am.' }).status, 'an extra full stop').toBe('fail');
    });

    it('F3-script: a D4 script with no "trace ..." action fails the check', () => {
        const copy = JSON.parse(JSON.stringify(weeks()[2])) as StorytimeWeek;
        for (const script of copy.scripts) for (const step of script.steps) if (step.id === 'D4') {
            step.en.teacherActions = step.en.teacherActions.map((action) => action.replace(/trace "/g, 'copy "'));
        }
        const found = checkStorytimePrintText(StorytimeWeekSchema.parse(copy)).find((item) => item.id === 'print-writing')!;
        expect(found.status).toBe('fail');
    });
});

describe('A-48 part 2, F5: the label of the picture row', () => {
    it('F5-schema: print.writing takes the optional promptAction look, color, or draw', () => {
        const make = (patch: Record<string, unknown>) => {
            const copy = JSON.parse(JSON.stringify(weeks()[2])) as StorytimeWeek;
            Object.assign(copy.print!.writing, patch);
            return StorytimeWeekSchema.safeParse(copy);
        };
        for (const value of ['look', 'color', 'draw']) expect(make({ promptAction: value }).success, value).toBe(true);
        expect(make({ promptAction: 'paint' }).success).toBe(false);
        expect(make({ promptAction: '' }).success).toBe(false);
    });

    it('F5-data: week 2 looks, weeks 3 and 6 color; weeks 5 and 7 wait for their art', () => {
        const actions = weeks().slice(0, 7).map((week) => week.print!.writing.promptAction);
        expect(actions).toEqual([undefined, 'look', 'color', undefined, undefined, 'color', undefined]);
    });

    it('F5-check: color needs the word "color" in D4 and draw needs the word "draw"', () => {
        expect(writingCheck(2, { promptAction: 'look' }).status).toBe('pass');
        expect(writingCheck(2, { promptAction: 'color' }).status, 'week 2 D4 does not color').toBe('fail');
        expect(writingCheck(3, { promptAction: 'color' }).status).toBe('pass');
    });

    it('F5-page: the label and the icon follow the action (Look. eye; Color. pencil)', async () => {
        const { doc } = await book();
        const want: Record<number, [string, string]> = { 2: ['Look.', 'read'], 3: ['Color.', 'pencil'], 6: ['Color.', 'pencil'] };
        for (const [week, [label, icon]] of Object.entries(want)) {
            const page = doc.querySelectorAll('.student-page[data-page-kind="writing"]')[Number(week) - 1];
            const row = page.querySelector('[data-part="prompt-row"]')!;
            expect(text(row.querySelector('.row-label')!), `Week ${week}`).toBe(label);
            expect(row.querySelector('.row-icons [data-icon]')!.getAttribute('data-icon')).toBe(icon);
        }
    });
});

describe('A-48 part 2, F4: the picture row stands above the trace row of D4', () => {
    it.each([2, 3, 6])('F4-order: week %i prints the picture row before the trace row, and the numbers keep the page order', async (weekNumber) => {
        const { doc } = await book();
        const page = doc.querySelectorAll('.student-page[data-page-kind="writing"]')[weekNumber - 1];
        const d4 = page.querySelector('[data-part="step-block"][data-step="D4"]')!;
        const rows = Array.from(d4.querySelectorAll('.work-row'));
        const labels = rows.map((row) => text(row.querySelector('.row-label')!));
        expect(labels[0] === 'Look.' || labels[0] === 'Color.', `The first row of D4 is the picture row: ${labels.join(' | ')}`).toBe(true);
        expect(labels[1]).toBe('Trace.');
        expect(rows[0].getAttribute('data-part')).toBe('prompt-row');
        const numbers = Array.from(page.querySelectorAll('[data-part="row-number"]'), text);
        expect(numbers).toEqual(numbers.map((_value, index) => String(index + 1)));
    });

    it('F4-others: week 1 and the weeks without a prompt picture keep the trace row first', async () => {
        const { doc } = await book();
        for (const weekNumber of [1, 4, 5, 7]) {
            const page = doc.querySelectorAll('.student-page[data-page-kind="writing"]')[weekNumber - 1];
            const d4 = page.querySelector('[data-part="step-block"][data-step="D4"]')!;
            expect(text(d4.querySelector('.row-label')!), `Week ${weekNumber}`).toBe('Trace.');
        }
    });
});

/** Every string of a parsed value, with its path (for the script and item searches of U7). */
function strings(value: unknown, trail = ''): { trail: string; value: string }[] {
    if (typeof value === 'string') return [{ trail, value }];
    if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${trail}[${index}]`));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => strings(item, `${trail}.${key}`));
    return [];
}

describe('A-48 part 2, U7: the check pictures axe and ostrich replace the alligator and the olive (E24, E26)', () => {
    const rowOf = (week: StorytimeWeek) => week.check.items.filter((item) => item.kind === 'circle-picture')[2];

    it('U7-data: week 2 row 3 is pig, bed, axe; week 7 row 3 is pen, bus, ostrich; week 8 names the axe', () => {
        const all = weeks();
        const w2 = rowOf(all[1]) as { pictures: string[]; answer: string };
        const w7 = rowOf(all[6]) as { pictures: string[]; answer: string };
        expect(w2).toMatchObject({ pictures: ['pig', 'bed', 'axe'], answer: 'axe' });
        expect(w7).toMatchObject({ pictures: ['pen', 'bus', 'ostrich'], answer: 'ostrich' });
        const w8 = JSON.stringify(all[7].block);
        expect(w8).not.toMatch(/alligator/);
        expect(w8).toMatch(/"axe"/);
    });

    it('U7-script: the row 3 lines of the week 2 and week 7 scripts say the new word in English and Thai, and the old word is gone from every check line', () => {
        const all = weeks();
        const row3 = (week: StorytimeWeek) => strings(week.scripts).filter((s) => /Row 3:|แถว 3:/.test(s.value)).map((s) => s.value);
        expect(row3(all[1]).length).toBe(2);
        for (const line of row3(all[1])) expect(line).toMatch(/pig, bed, axe/);
        expect(row3(all[6]).length).toBe(2);
        for (const line of row3(all[6])) expect(line).toMatch(/pen, bus, ostrich/);
        for (const [index, word] of [[1, 'alligator'], [6, 'olive']] as const) {
            expect(strings(all[index].check).filter((s) => s.value.includes(word)), `Week ${index + 1} check`).toEqual([]);
            expect(row3(all[index]).filter((line) => line.includes(word))).toEqual([]);
        }
    });

    it('U7-rows: the picture list has the rows axe (week 2) and ostrich (week 7), no alligator or olive row, and 194 rows (the ostrich row serves week 7 and week 8)', async () => {
        const mod = await import(path.join(dashboardRoot, 'lib/storytime/print/pictures.ts')) as { storytimePrintPictures: (w: StorytimeWeek[]) => { id: string }[] };
        const ids = mod.storytimePrintPictures(weeks()).map((row) => row.id);
        expect(ids).toContain('l2-w02-check-row-axe');
        expect(ids).toContain('l2-w07-check-row-ostrich');
        expect(ids.filter((id) => /alligator|olive/.test(id))).toEqual([]);
        expect(ids).toHaveLength(194);
    });

    it('U7-nut: the nut pages keep the word nut (Forge draws a peanut)', () => {
        expect(JSON.stringify(weeks()[0].books)).toMatch(/nut/i);
        expect(weeks()[0].home!.words).toContain('nut');
    });
});

describe('A-48 part 2, E23: "Nan Can Nod" is a first-sound listening book', () => {
    const readerSections = async (title: string) => {
        const { doc } = await book();
        return Array.from(doc.querySelectorAll('.student-page[data-page-kind="reader"]')).filter((section) => section.getAttribute('data-reader-title') === title);
    };

    it('E23-data: week 1 keeps kind decodable and soundBook true; the C4 title says first-sound book', () => {
        const week = weeks()[0];
        const nan = week.books.find((b) => b.title === 'Nan Can Nod')!;
        expect(nan.kind).toBe('decodable');
        expect(nan.soundBook).toBe(true);
        const c4 = week.scripts.flatMap((script) => script.steps).find((step) => step.id === 'C4')!;
        expect(c4.title.en).toBe('First-sound book: read together');
        expect(c4.title.th).toBe('หนังสือเสียงแรก: อ่านด้วยกัน');
    });

    it('E23-labels: the week 1 book says "The first sound in this book" and "Listen to the book"', async () => {
        const sections = await readerSections('Nan Can Nod');
        expect(sections.length).toBeGreaterThan(0);
        const all = sections.map(text).join(' ');
        expect(all).toContain('The first sound in this book');
        expect(all).not.toContain('Sounds in this book');
        expect(all).toContain('Listen to the book');
        expect(all).not.toContain('Listen and read the book');
    });

    it('E23-others: the decodables of weeks 2 to 7 keep their labels', async () => {
        for (const title of ['Can I?', 'The Pan', 'Pam', 'Sam and Pam', 'Tap, Tap!', 'The Top']) {
            const all = (await readerSections(title)).map(text).join(' ');
            expect(all, title).toContain('Sounds in this book');
            expect(all, title).toContain('Listen and read the book');
        }
    });
});

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

    it('F5-data: week 2 looks, weeks 3, 6, and 7 color, week 5 draws', () => {
        const actions = weeks().slice(0, 7).map((week) => week.print!.writing.promptAction);
        expect(actions).toEqual([undefined, 'look', 'color', undefined, 'draw', 'color', 'color']);
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
    }, 120_000);
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

    it('F4-others: week 1 and the weeks without a prompt picture (week 4) keep the trace row first', async () => {
        const { doc } = await book();
        for (const weekNumber of [1, 4]) {
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

    it('U7-rows: the picture list has the rows axe (week 2) and ostrich (week 7), no alligator or olive row, and 196 rows (the ostrich row serves week 7 and week 8; the 2 d4-prompt rows of weeks 5 and 7 are in the 196)', async () => {
        const mod = await import(path.join(dashboardRoot, 'lib/storytime/print/pictures.ts')) as { storytimePrintPictures: (w: StorytimeWeek[]) => { id: string }[] };
        const ids = mod.storytimePrintPictures(weeks()).map((row) => row.id);
        expect(ids).toContain('l2-w02-check-row-axe');
        expect(ids).toContain('l2-w07-check-row-ostrich');
        expect(ids.filter((id) => /alligator|olive/.test(id))).toEqual([]);
        expect(ids).toHaveLength(196);
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

const stepPagesModule = path.join(dashboardRoot, 'lib/storytime/print/step-pages.ts');
const manualModule = path.join(dashboardRoot, 'lib/storytime/manual.ts');
const stepMapModule = path.join(dashboardRoot, 'lib/storytime/print/step-map.ts');

interface BookPage { page: number; kind: string; week?: number }
interface StepPages {
    storytimeStudentBookPages: (w: StorytimeWeek[]) => BookPage[];
    storytimeStepPage: (pages: BookPage[], week: number, step: string) => { first: number; last: number } | undefined;
    storytimeStepMapRows: (w: StorytimeWeek[]) => { week: number; code: string; steps: string[]; pageKind: string; block: string; icons: string[]; page: number; pageEnd?: number }[];
}

describe('A-48 part 2, U8: the readers (B17, E52) and the question pages (E37)', () => {
    const sections = async (title: string) => {
        const { doc } = await book();
        return Array.from(doc.querySelectorAll('.student-page[data-page-kind="reader"]')).filter((section) => section.getAttribute('data-reader-title') === title);
    };

    it('E37-data: the questions that name a page use the printed page (story page 4 is printed page 6)', async () => {
        const mod = await import(stepMapModule) as { STORYTIME_READER_PAGE_OFFSET: number };
        expect(mod.STORYTIME_READER_PAGE_OFFSET).toBe(2);
        const ask = (n: number) => weeks()[n - 1].books.find((b) => b.kind === 'readalong')!.questions!.find((q) => q.kind === 'what')!.ask;
        expect(ask(3).en).toBe('What color is the paint on page 6? Point and say it.');
        expect(ask(3).th).toBe('สีในหน้า 6 คือสีอะไร? ให้ชี้ที่ภาพแล้วพูดตามครู');
        expect(ask(6).en).toBe('What can you see on page 6? Point and say it.');
        expect(ask(6).th).toBe('เห็นอะไรในหน้า 6? ให้ชี้ที่ภาพแล้วพูดตามครู');
    });

    it('B17-role: each reader cover has a role mark: listen and read, sound it out, or say the first sound', async () => {
        const { doc } = await book();
        const want: Record<string, [string, string[]]> = {
            'Hello!': ['Listen and read.', ['ear', 'read']],
            'Nan Can Nod': ['Listen and read.', ['ear', 'read']],
            'Can I?': ['Sound it out.', ['read', 'mouth']],
            'The Top': ['Sound it out.', ['read', 'mouth']],
            'Paint!': ['Listen and read.', ['ear', 'read']],
        };
        // changed 2026-11-11 (F5, PM look): page 1 is the quest leaf cover, so the role mark is the role-mark part of its footer;
        // its 2 icons are quest step icons with no data-icon names, so the check counts them.
        const ROLE = '[data-part="reader-role"], .quest-reader-page [data-part="role-mark"]';
        for (const [title, [label, icons]] of Object.entries(want)) {
            const marks = (await sections(title)).flatMap((section) => Array.from(section.querySelectorAll(ROLE)));
            expect(marks, title).toHaveLength(1);
            expect(text(marks[0]), title).toBe(label);
            expect(marks[0].querySelectorAll('svg').length, title).toBe(icons.length);
        }
        const all = doc.querySelectorAll('.student-page[data-page-kind="reader"] [data-part="reader-role"], .student-page[data-page-kind="reader"] .quest-reader-page [data-part="role-mark"]');
        expect(all.length, 'one role mark for each of the 14 readers').toBe(14);
    });

    it('E52-more: a page 11 list with a word that the story does not use is labeled "More words" (Hello!, How Many?, My Family); the other read-alongs keep the family name', async () => {
        for (const title of ['Hello!', 'How Many?', 'My Family']) {
            const all = (await sections(title)).map(text).join(' ');
            expect(all, title).toContain('More words');
        }
        const names: Record<string, string> = { 'Paint!': 'Colors', 'I Have Two': 'Body and face', 'I Can See': 'Animals', 'Is It a Ball?': 'Toys' };
        for (const [title, name] of Object.entries(names)) {
            const all = (await sections(title)).map(text).join(' ');
            expect(all, title).not.toContain('More words');
            expect(all, title).toContain(name);
        }
    });
});

describe('A-48 part 2, U8: the teacher book (step badge, student book pages, questions in D3)', () => {
    const teacherBook = async () => {
        const pages = await import(stepPagesModule) as StepPages;
        const manual = await import(manualModule) as { compileStorytimeManual: (w: StorytimeWeek[], o: Record<string, unknown>) => { html: string } };
        const all = weeks();
        const { html } = manual.compileStorytimeManual(all, { lang: 'th', loops: true, studentBookPages: pages.storytimeStudentBookPages(all) });
        return { doc: new DOMParser().parseFromString(html, 'text/html'), pages, all };
    };
    const stepsOf = (doc: Document, week: number, id: string) => Array.from(doc.querySelectorAll(`#week-${week}-day-1 .st-step, #week-${week}-day-2 .st-step, #week-${week}-day-3 .st-step, #week-${week}-day-4 .st-step, #week-${week}-day-5 .st-step`))
        .filter((step) => text(step.querySelector('[data-part="step-badge"]') ?? step).startsWith(id));

    it('U8-badge: each step carries the grey badge of its code, and a part that two steps share carries both codes', async () => {
        const { doc } = await teacherBook();
        const steps = Array.from(doc.querySelectorAll('.st-step'));
        expect(steps.length).toBeGreaterThan(60);
        for (const step of steps) expect(step.querySelector('.st-step-title [data-part="step-badge"]'), text(step).slice(0, 40)).not.toBeNull();
        const badges = (week: number, id: string) => stepsOf(doc, week, id).map((step) => text(step.querySelector('[data-part="step-badge"]')!));
        expect(badges(1, 'A3')).toEqual(['A3']);
        // A6 (day 1) and D2 (day 4) share the page part, so both steps carry the badge A6·D2.
        expect(badges(1, 'A6')).toEqual(['A6·D2', 'A6·D2']);
        expect(badges(1, 'E5')).toEqual(['E5']);
    });

    it('U8-pages: the materials name the printed page of the student book ("หนังสือนักเรียน หน้า N")', async () => {
        const { doc } = await teacherBook();
        const materials = (week: number, id: string) => stepsOf(doc, week, id).map((step) => text(step.querySelector('.st-gloss') ?? step)).join(' ');
        const want: [number, string, string][] = [
            [1, 'A3', 'หนังสือนักเรียน หน้า 4'], [1, 'A7', 'หนังสือนักเรียน หน้า 4'], [1, 'A8', 'หนังสือนักเรียน หน้า 7'],
            [1, 'C3', 'หนังสือนักเรียน หน้า 5'], [1, 'C7', 'หนังสือนักเรียน หน้า 2'], [1, 'D4', 'หนังสือนักเรียน หน้า 5'],
            [1, 'D5', 'หนังสือนักเรียน หน้า 5'], [1, 'E5', 'หนังสือนักเรียน หน้า 6'],
            [2, 'A3', 'หนังสือนักเรียน หน้า 22'], [4, 'E5', 'หนังสือนักเรียน หน้า 60'], [7, 'D4', 'หนังสือนักเรียน หน้า 113'],
            [8, 'A1', 'หนังสือนักเรียน หน้า 130–131'], [8, 'A2', 'หนังสือนักเรียน หน้า 132'], [8, 'E1', 'หนังสือนักเรียน หน้า 136'], [8, 'E3', 'หนังสือนักเรียน หน้า 2'],
        ];
        for (const [week, id, expected] of want) expect(materials(week, id), `week ${week} ${id}`).toContain(expected);
        expect(Array.from(doc.querySelectorAll('.st-step'), (step) => text(step.querySelector('.st-gloss') ?? step)).join(' ')).not.toContain('student book:');
    });

    it('U8-questions: the read-along questions print in D3 with the printed page, and not in C5', async () => {
        const { doc, all } = await teacherBook();
        for (const week of all.slice(0, 7)) {
            const questions = week.books.find((b) => b.kind === 'readalong')!.questions!;
            const d3 = stepsOf(doc, week.meta.week, 'D3');
            expect(d3, `week ${week.meta.week} D3`).toHaveLength(1);
            const loop = text(d3[0].querySelector('.st-loop') ?? d3[0]);
            for (const question of questions) {
                expect(loop, question.ask.en).toContain(question.ask.en);
                expect(loop).toContain(`${question.answer.word} (หน้า ${question.answer.page + 2})`);
            }
            const c5 = stepsOf(doc, week.meta.week, 'C5');
            expect(c5.map((step) => step.querySelectorAll('.st-loop').length).reduce((a, b) => a + b, 0) && text(c5[0]).includes(questions[0].ask.en), `week ${week.meta.week} C5 has no questions`).toBeFalsy();
        }
    });
});

describe('A-48 part 2, U9: the step map file for the app (tasks 4.3 and 4.6)', () => {
    const unitDir = path.join(STORYTIME_ROOT, 'l2');
    const readRows = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'step-map-u1.json'), 'utf8')) as { week: number; code: string; steps: string[]; pageKind: string; block: string; icons: string[]; page: number; pageEnd?: number }[];

    it('U9-file: the committed file equals the rows that the code builds, with the shape {week, code, steps, pageKind, block, icons, page}', async () => {
        const mod = await import(stepPagesModule) as StepPages;
        const rows = readRows();
        expect(rows).toEqual(JSON.parse(JSON.stringify(mod.storytimeStepMapRows(weeks()))));
        for (const row of rows) {
            expect(Object.keys(row).filter((key) => key !== 'pageEnd').sort()).toEqual(['block', 'code', 'icons', 'page', 'pageKind', 'steps', 'week']);
            expect(Number.isInteger(row.page) && row.page > 0).toBe(true);
        }
        const codes = (week: number) => rows.filter((row) => row.week === week).map((row) => row.code).sort();
        expect(codes(1)).toEqual(['A3', 'A6·D2', 'A7', 'A8', 'C3', 'C7', 'D4', 'D5', 'E5']);
        expect(codes(8)).toEqual(['A1', 'A2', 'B1', 'C1', 'D1', 'E1', 'E3']);
        expect(new Set(rows.map((row) => row.week))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
    });

    it('U9-book: each row points to the page of that kind in the built book, and the week check page is page 6, 24, 42, 60, 78, 96, 114', async () => {
        const { doc } = await book();
        const sections = new Map(Array.from(doc.querySelectorAll('.student-page')).map((s) => [Number(s.getAttribute('data-page-number')), s]));
        for (const row of readRows()) {
            const section = sections.get(row.page)!;
            expect(section.getAttribute('data-page-kind'), `week ${row.week} ${row.code}`).toBe(row.pageKind);
            if (row.pageKind !== 'book-map') expect(Number(section.getAttribute('data-week')), `week ${row.week} ${row.code}`).toBe(row.week);
            if (row.pageEnd) expect(sections.get(row.pageEnd)!.getAttribute('data-page-kind')).toBe(row.pageKind);
        }
        expect(readRows().filter((row) => row.code === 'E5').map((row) => row.page)).toEqual([6, 24, 42, 60, 78, 96, 114]);
        expect(readRows().find((row) => row.week === 8 && row.code === 'A1')).toMatchObject({ page: 130, pageEnd: 131 });
    });

    it('U9-icons: every icon of the file has a black line SVG file in the folder', () => {
        const names = [...new Set(readRows().flatMap((row) => row.icons))].sort();
        expect(names).toEqual(['circle', 'ear', 'mouth', 'pencil', 'read', 'star'].filter((name) => names.includes(name)));
        expect(names.length).toBeGreaterThanOrEqual(5);
        for (const name of ['ear', 'mouth', 'read', 'pencil', 'circle', 'book', 'star']) {
            const svg = fs.readFileSync(path.join(unitDir, `step-icon-${name}.svg`), 'utf8');
            expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"/);
            expect(svg).toContain('stroke="#000"');
            expect(svg).not.toMatch(/fill="#(?!000)|<image|<script/);
        }
    });
});

// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimePrintBlockSchema, StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { storytimePrintPictures } from '../lib/storytime/print/pictures';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';
import { STORYTIME_CHECK_ROW_TYPES } from '../lib/storytime/print/step-map';
import { compileStorytimeReaders, storytimeReaderLeafSides } from '../lib/storytime/print/readers';
import { renderStorytimeWeek } from '../lib/storytime/manual';
import { storytimeLabels } from '../lib/storytime/i18n';

/**
 * A-48 part F, the v15 fix batch (PM decisions of 2026-11-05 on the v14 audit):
 * B1 the fold-test print line, E2/E23/B05 the week 1 reader role, F3 the week 8 review key,
 * AX alligator to axe, F1/E50 the home-card page numbers, G6/B14 the two teacher-marked check rows,
 * E46 one pronunciation note, E48 one song text. The tests read the shipped week files and
 * compile the book in proof mode. Each expected value is a literal from the PM decisions.
 */

/** The commit before the v15 work: the Thai texts that must not change are read from it. */
const ROLE_BASE_SHA = '9740a5ac303ea77c4ad19819ce1bb28a15c0623e';

const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
const dashboardRoot = path.join(repoRoot, 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const foldTestModule = path.join(dashboardRoot, 'lib/storytime/print/fold-test.ts');
const reviewRowsModule = path.join(dashboardRoot, 'lib/storytime/print/review-rows.ts');

const weekPath = (n: number): string => storytimeWeekFile(STORYTIME_ROOT, 2, n);

function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_v, index) => StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(weekPath(index + 1), 'utf8'))));
}

/** The raw JSON of a week at the base commit. */
function baseWeek(n: number): Record<string, unknown> {
    const rel = path.relative(repoRoot, weekPath(n));
    return JSON.parse(execFileSync('git', ['show', `${ROLE_BASE_SHA}:${rel}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })) as Record<string, unknown>;
}

const options = { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' as const };
type Compile = (w: StorytimeWeek[], o: typeof options) => { html: string };

async function compileBook(list: StorytimeWeek[]): Promise<{ html: string; doc: Document }> {
    const { compileStorytimeStudentBook } = await import(studentModule) as { compileStorytimeStudentBook: Compile };
    const { html } = compileStorytimeStudentBook(list, options);
    return { html, doc: new DOMParser().parseFromString(html, 'text/html') };
}

let cachedBook: { html: string; doc: Document } | undefined;
/** The compiled 8-week book in proof mode, parsed once for the file. */
async function book(): Promise<{ html: string; doc: Document }> {
    if (!cachedBook) cachedBook = await compileBook(weeks());
    return cachedBook;
}

const text = (element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim();
const iconsOf = (element: Element): string[] => Array.from(element.querySelectorAll('[data-icon]'), (icon) => icon.getAttribute('data-icon') ?? '');
const pageOf = (doc: Document, number: number): Element => {
    const found = doc.querySelector(`.student-page[data-page-number="${number}"]`);
    if (!found) throw new Error(`no page ${number}`);
    return found;
};

/** A parsed copy of a week after a patch of the raw object. */
function patched(n: number, patch: (raw: Record<string, unknown>) => void): StorytimeWeek {
    const raw = JSON.parse(JSON.stringify(weeks()[n - 1])) as Record<string, unknown>;
    patch(raw);
    return StorytimeWeekSchema.parse(raw);
}

/** The values of the PM decisions: print.checkRows of weeks 1 to 7. */
const TRICKY = ['a', 'I', 'get', 'is', 'off', 'he', 'from'];
const BLEND = ['net', 'cat', 'pan', 'jam', 'sad', 'ten', 'pot'];
const ITEMS = [4, 7, 7, 7, 7, 7, 7];

const stepOf = (week: StorytimeWeek, id: string) => week.scripts.flatMap((s) => s.steps).filter((s) => s.id === id);

// ---------------------------------------------------------------------------------------------
// B1: the fold-test lead sheets
// ---------------------------------------------------------------------------------------------

describe('v15 B1: the fold-test lead sheet prints the agreed line', () => {
    const LINE = 'Print at 100 %, both sides, flip on long edge.';

    it('B1-const: the module exports the print line', async () => {
        const mod = await import(foldTestModule) as { STORYTIME_FOLD_TEST_PRINT_LINE: string };
        expect(mod.STORYTIME_FOLD_TEST_PRINT_LINE).toBe(LINE);
    });

    it('B1-sheets: two A4 portrait sheets; sheet 1 holds the line once; sheet 2 is the blank back', async () => {
        const mod = await import(foldTestModule) as { compileFoldTestLead: (p: typeof STORYTIME_PRINT_PROFILE) => { html: string } };
        const { html } = mod.compileFoldTestLead(STORYTIME_PRINT_PROFILE);
        expect(html).toMatch(/@page\s*\{[^}]*size:\s*A4\s+portrait/i);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const sheets = Array.from(doc.querySelectorAll('.sheet'));
        expect(sheets).toHaveLength(2);
        expect(text(sheets[0]).split(LINE).length - 1, 'sheet 1 holds the line once').toBe(1);
        expect(text(sheets[1]), 'sheet 2 has no text').toBe('');
        expect(text(doc.body).split(LINE).length - 1, 'the line appears once in the document').toBe(1);
    });
});

// ---------------------------------------------------------------------------------------------
// E2, E23, B05: the week 1 reader role
// ---------------------------------------------------------------------------------------------

describe('v15 E2/E23/B05: Nan Can Nod says "Listen and read."', () => {
    const week1 = (): StorytimeWeek => weeks()[0];
    // changed 2026-11-11 (F5, PM look): page 1 is the quest reader cover: the role mark is the role-mark part of the leaf
    // footer or the A3 role bar, and its 2 icons are quest step icons with no data-icon names, so the checks count them.
    const roleMarks = (doc: Document | Element): Element[] =>
        Array.from(doc.querySelectorAll('[data-part="reader-role"], .quest-reader-page [data-part="role-mark"], .quest-reader-page [data-part="role-bar"]'));
    const roleIcons = (mark: Element): number => mark.querySelectorAll('svg').length;

    it('E2-workbook: the leaf sides of Nan Can Nod print "Listen and read." with ear and read, not "Sound it out."', () => {
        const sides = storytimeReaderLeafSides(week1(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook', bookTitle: 'Nan Can Nod' });
        const html = sides.map((side) => side.html).join('');
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
        const marks = roleMarks(doc);
        expect(marks).toHaveLength(1);
        expect(text(marks[0])).toBe('Listen and read.');
        expect(roleIcons(marks[0])).toBe(2);
        expect(html).not.toContain('Sound it out.');
        expect(html).not.toContain('Say the first sound.');
    });

    it('E2-a3: the A3 color output of Nan Can Nod (cover included) prints "Listen and read."', () => {
        const { html } = compileStorytimeReaders([week1()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'a3-color', bookTitle: 'Nan Can Nod' });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const marks = roleMarks(doc);
        expect(marks).toHaveLength(1);
        expect(text(marks[0])).toBe('Listen and read.');
        expect(roleIcons(marks[0])).toBe(2);
        expect(doc.body.textContent).not.toContain('Sound it out.');
    });

    it('E2-qr: the QR label of Nan Can Nod stays "Listen to the book"', async () => {
        const { doc } = await book();
        const pages = Array.from(doc.querySelectorAll('.student-page[data-page-kind="reader"]')).filter((s) => s.getAttribute('data-reader-title') === 'Nan Can Nod');
        expect(pages.length).toBeGreaterThan(0);
        const all = pages.map(text).join(' ');
        expect(all).toContain('Listen to the book');
        expect(all).not.toContain('Listen and read the book');
        expect(all).not.toContain('Sound it out.');
    });

    it('E2-others: each decodable of weeks 2 to 7 still prints "Sound it out."', async () => {
        const { doc } = await book();
        for (const title of ['Can I?', 'The Pan', 'Pam', 'Sam and Pam', 'Tap, Tap!', 'The Top']) {
            const marks = Array.from(doc.querySelectorAll('.student-page[data-page-kind="reader"]'))
                .filter((s) => s.getAttribute('data-reader-title') === title).flatMap((s) => roleMarks(s));
            expect(marks, title).toHaveLength(1);
            expect(text(marks[0]), title).toBe('Sound it out.');
            expect(roleIcons(marks[0]), title).toBe(2);
        }
    });

    it('E2-page4: the week 1 practice page A7 block says "Listen and read" with ear and read; weeks 2 to 7 say "Read it"', async () => {
        const { doc } = await book();
        const a7 = (page: Element): Element => {
            const block = page.querySelector('.step-block[data-step="A7"]');
            if (!block) throw new Error('no A7 block');
            return block;
        };
        const page4 = pageOf(doc, 4);
        expect(page4.getAttribute('data-page-kind')).toBe('practice');
        expect(page4.getAttribute('data-week')).toBe('1');
        expect(text(a7(page4).querySelector('[data-part="step-title"]')!)).toBe('Listen and read');
        expect(iconsOf(a7(page4).querySelector('.step-head')!)).toEqual(['ear', 'read']);
        const practice = Array.from(doc.querySelectorAll('.student-page[data-page-kind="practice"]'));
        expect(practice).toHaveLength(7);
        for (const page of practice.slice(1)) {
            expect(text(a7(page).querySelector('[data-part="step-title"]')!), `week ${page.getAttribute('data-week')}`).toBe('Read it');
            expect(iconsOf(a7(page).querySelector('.step-head')!), `week ${page.getAttribute('data-week')}`).toEqual(['read']);
        }
    });
});

// ---------------------------------------------------------------------------------------------
// F3: the week 8 review key
// ---------------------------------------------------------------------------------------------

describe('v15 F3: the week 8 teacher key names only the pictures that print', () => {
    it('F3-helper: storytimeReviewSoundRows gives the targets and the 4 printed pictures of each group', async () => {
        const mod = await import(reviewRowsModule) as {
            storytimeReviewSoundRows: (g: { sound: string; pictures: string[] }[]) => { sound: string; targets: string[]; printed: string[] }[];
        };
        expect(mod.storytimeReviewSoundRows([
            { sound: '/n/', pictures: ['nest', 'nose', 'net'] },
            { sound: '/a/', pictures: ['apple', 'ant', 'axe'] },
        ])).toEqual([
            { sound: '/n/', targets: ['nest', 'nose'], printed: ['nest', 'apple', 'ant', 'nose'] },
            { sound: '/a/', targets: ['apple', 'ant'], printed: ['nest', 'apple', 'ant', 'nose'] },
        ]);
        const seven = ['n:nest', 'a:apple', 'p:pen', 'm:moon', 's:sun', 't:tiger', 'o:octopus'].map((entry) => {
            const [sound, picture] = entry.split(':');
            return { sound: `/${sound}/`, pictures: [picture] };
        });
        const rows = mod.storytimeReviewSoundRows(seven);
        expect(rows[0]).toEqual({ sound: '/n/', targets: ['nest'], printed: ['nest', 'apple', 'pen', 'moon'] });
        expect(rows[3]).toEqual({ sound: '/m/', targets: ['moon'], printed: ['sun', 'tiger', 'octopus', 'moon'] });
    });

    for (const lang of ['en', 'th'] as const) {
        it(`F3-key-${lang}: for each review day and sound, the key names the target pictures that the student page prints in that row`, async () => {
            const all = weeks();
            const week8 = all[7];
            const { doc } = await book();
            const idToWord = new Map(storytimePrintPictures(all).map((row) => [row.id, row.text] as const));
            const reviewPages = Array.from(doc.querySelectorAll('.student-page[data-page-kind="review"]')).filter((p) => p.querySelector('[data-part="picture-sort"]'));
            expect(reviewPages).toHaveLength(5);
            const keyDoc = new DOMParser().parseFromString(renderStorytimeWeek(week8, lang), 'text/html');
            // The answer key of the review pages is the last block of the week: one titled list for each day.
            const labels = storytimeLabels(lang);
            // P9-B11: the key holds one list per review day, headed by the review-page heading, and a "more" list after each of days 2 to 5.
            const lists = [1, 2, 3, 4, 5].map((day) => {
                const list = Array.from(keyDoc.querySelectorAll('ol')).find((ol) => {
                    const strong = ol.previousElementSibling?.querySelector('strong');
                    return !!strong && text(strong) === labels.reviewPage(day);
                });
                expect(list, `day ${day} key list`).toBeDefined();
                return list!;
            });
            week8.block!.days.slice().sort((x, y) => x.day - y.day).forEach((day, d) => {
                const groups = day.paper.flatMap((item) => (item.kind === 'picture-sort' ? item.groups : []));
                expect(groups.length, `day ${d + 1}`).toBeGreaterThan(0);
                const li = Array.from(lists[d].querySelectorAll('li')).find((item) => /\/.+\/: /.test(text(item)));
                expect(li, `day ${d + 1} has a picture-sort key`).toBeDefined();
                const keyText = text(li!);
                const keyed = new Map(keyText.slice(keyText.indexOf(': /') + 2).split('; ').map((part) => {
                    const cut = part.indexOf(': ');
                    return [part.slice(0, cut), part.slice(cut + 2)] as const;
                }));
                const soundRows = Array.from(reviewPages[d].querySelectorAll('[data-part="sound-row"]'));
                expect(soundRows, `day ${d + 1} rows`).toHaveLength(groups.length);
                soundRows.forEach((row, g) => {
                    const sound = text(row.querySelector('[data-part="sound-label"]')!);
                    expect(sound).toBe(groups[g].sound);
                    const printed = Array.from(row.querySelectorAll('[data-picture-id]'), (p) => idToWord.get(p.getAttribute('data-picture-id') ?? ''));
                    const own = printed.filter((word): word is string => !!word && groups[g].pictures.includes(word));
                    expect(own.length, `day ${d + 1} ${sound} prints a target`).toBeGreaterThan(0);
                    expect(keyed.get(sound), `day ${d + 1} ${sound} (${lang})`).toBe(own.join(', '));
                });
                // P9-B11: the "more" list of the day comes right after the day list, for days 2 to 5.
                if (d >= 1) {
                    const more = lists[d].nextElementSibling?.nextElementSibling;
                    expect(more?.tagName, `day ${d + 1} more list`).toBe('OL');
                    expect(text(more!.previousElementSibling?.querySelector('strong') ?? more!), `day ${d + 1} more heading`).toBe(`${labels.reviewPage(d + 1)} more`);
                }
            });
        });
    }
});

// ---------------------------------------------------------------------------------------------
// AX: alligator to axe
// ---------------------------------------------------------------------------------------------

describe('v15 AX: week 2 names the axe, not the alligator', () => {
    const raw = (): string => fs.readFileSync(weekPath(2), 'utf8');

    it('AX-none: w02.json has no "alligator" in any case', () => {
        expect(raw().toLowerCase()).not.toContain('alligator');
    });

    it('AX-lines: exactly 5 lines of w02.json name apple, ant, axe, astronaut', () => {
        const matching = raw().split('\n').filter((line) => line.includes('apple, ant, axe, astronaut'));
        expect(matching).toHaveLength(5);
    });
});

// ---------------------------------------------------------------------------------------------
// F1, E50: the home-card page numbers
// ---------------------------------------------------------------------------------------------

describe('v15 F1/E50: each home-card page carries its page number', () => {
    it('F1-numbers: the 14 home-card pages print their own page number; the book stays at 140 pages', async () => {
        const { doc } = await book();
        expect(doc.querySelectorAll('.student-page')).toHaveLength(140);
        const cards = Array.from(doc.querySelectorAll('.student-page[data-page-kind="home-front"], .student-page[data-page-kind="home-back"]'));
        const numbers = cards.map((page) => Number(page.getAttribute('data-page-number')));
        expect(numbers).toEqual([7, 8, 25, 26, 43, 44, 61, 62, 79, 80, 97, 98, 115, 116]);
        for (const page of cards) {
            const marks = Array.from(page.querySelectorAll('[data-part="page-number"]'));
            expect(marks, `page ${page.getAttribute('data-page-number')}`).toHaveLength(1);
            expect(text(marks[0])).toBe(page.getAttribute('data-page-number'));
        }
    });
});

// ---------------------------------------------------------------------------------------------
// G6, B14: two teacher-marked check rows
// ---------------------------------------------------------------------------------------------

describe('v15 G6/B14: the check page has a read-the-word row and an oral-blend row', () => {
    it('G6-schema: print.checkRows is an optional strict object of two non-empty strings', () => {
        const print = weeks()[0].print!;
        const ok = StorytimePrintBlockSchema.safeParse({ ...print, checkRows: { trickyWord: 'a', blendWord: 'net' } });
        expect(ok.success).toBe(true);
        expect(ok.success && ok.data.checkRows).toEqual({ trickyWord: 'a', blendWord: 'net' });
        expect(StorytimePrintBlockSchema.safeParse({ ...print, checkRows: { trickyWord: 'a', blendWord: 'net', extra: 'x' } }).success, 'extra key').toBe(false);
        expect(StorytimePrintBlockSchema.safeParse({ ...print, checkRows: { trickyWord: '', blendWord: 'net' } }).success, 'empty trickyWord').toBe(false);
        expect(StorytimePrintBlockSchema.safeParse({ ...print, checkRows: { trickyWord: 'a', blendWord: '' } }).success, 'empty blendWord').toBe(false);
        expect(StorytimePrintBlockSchema.safeParse({ ...print, checkRows: { trickyWord: 'a' } }).success, 'blendWord missing').toBe(false);
    });

    it('G6-data: weeks 1 to 7 carry print.checkRows with the decided tricky and blend words', () => {
        weeks().slice(0, 7).forEach((week, i) => {
            expect(week.print!.checkRows, `week ${i + 1}`).toEqual({ trickyWord: TRICKY[i], blendWord: BLEND[i] });
            expect(week.check.items, `week ${i + 1} items`).toHaveLength(ITEMS[i]);
            expect(week.focus.trickyWords, `week ${i + 1}`).toContain(TRICKY[i]);
        });
    });

    it('G6-types: STORYTIME_CHECK_ROW_TYPES has read-word and oral-blend', () => {
        expect(STORYTIME_CHECK_ROW_TYPES['read-word']).toEqual({ icons: ['read', 'mouth'], label: 'Read the word.' });
        expect(STORYTIME_CHECK_ROW_TYPES['oral-blend']).toEqual({ icons: ['ear', 'mouth'], label: 'Listen. Say the word.' });
    });

    it('G6-page: each check page adds the 2 rows after the items, with teacher ticks, and the score strip counts them', async () => {
        const { doc } = await book();
        const pages = Array.from(doc.querySelectorAll('.student-page[data-page-kind="check"]'));
        expect(pages).toHaveLength(7);
        pages.forEach((page, i) => {
            const week = i + 1;
            const n = ITEMS[i];
            const rowOf = (part: string): Element => {
                const marks = Array.from(page.querySelectorAll(`[data-part="${part}"]`));
                expect(marks, `week ${week} ${part}`).toHaveLength(1);
                const row = marks[0].closest('[data-part="check-item"]');
                expect(row, `week ${week} ${part} sits in a numbered row`).not.toBeNull();
                return row!;
            };
            const read = rowOf('check-read-word');
            expect(text(read.querySelector('[data-part="row-number"]')!), `week ${week} read row number`).toBe(String(n + 1));
            expect(text(read.querySelector('[data-part="check-read-word"]')!), `week ${week} tricky word`).toBe(TRICKY[i]);
            expect(read.querySelectorAll('[data-part="teacher-tick"]'), `week ${week} read ticks`).toHaveLength(1);
            const blend = rowOf('check-oral-blend');
            expect(text(blend.querySelector('[data-part="row-number"]')!), `week ${week} blend row number`).toBe(String(n + 2));
            expect(blend.querySelectorAll('[data-part="teacher-tick"]'), `week ${week} blend ticks`).toHaveLength(1);
            expect(new RegExp(`\\b${BLEND[i]}\\b`, 'i').test(text(blend)), `week ${week} does not print the blend word`).toBe(false);
            const heads = Array.from(page.querySelectorAll('[data-part="row-group-head"]')).map((head) => [text(head), iconsOf(head)] as const);
            expect(heads, `week ${week} read head`).toContainEqual(['Read the word.', ['read', 'mouth']]);
            expect(heads, `week ${week} blend head`).toContainEqual(['Listen. Say the word.', ['ear', 'mouth']]);
            expect(text(page.querySelector('[data-part="score-strip"]')!), `week ${week} score`).toBe(`/ ${n + 2}`);
        });
    });

    it('G6-build-tricky: the build throws when the tricky word is not in focus.trickyWords', async () => {
        const all = weeks();
        all[0] = patched(1, (raw) => { (raw.print as Record<string, unknown>).checkRows = { trickyWord: 'zzz', blendWord: 'net' }; });
        await expect(compileBook(all)).rejects.toThrow(/zzz/);
    });

    it('G6-build-blend: the build throws when the blend word is not a word of the A4 blend drill', async () => {
        const all = weeks();
        all[1] = patched(2, (raw) => { (raw.print as Record<string, unknown>).checkRows = { trickyWord: 'I', blendWord: 'zzz' }; });
        await expect(compileBook(all)).rejects.toThrow(/zzz/);
    });

    it('G6-build-control: a valid checkRows copy of week 3 compiles', async () => {
        const all = weeks();
        all[2] = patched(3, (raw) => { (raw.print as Record<string, unknown>).checkRows = { trickyWord: 'get', blendWord: 'pan' }; });
        await expect(compileBook(all)).resolves.toBeDefined();
    });

    for (const lang of ['en', 'th'] as const) {
        it(`G6-e5-${lang}: step E5 has the Row lines of the 2 rows; the en and th notes keep equal line counts`, () => {
            weeks().slice(0, 7).forEach((week, i) => {
                const n = ITEMS[i];
                const [e5] = stepOf(week, 'E5');
                const lines = (lang === 'en' ? e5.en : e5.th!).teacherLanguage;
                const head = lang === 'en' ? 'Row' : 'แถว';
                const readLine = lines.find((line) => line.startsWith(`"${head} ${n + 1}:`));
                const blendLine = lines.find((line) => line.startsWith(`"${head} ${n + 2}:`));
                expect(readLine, `week ${week.meta.week} read line`).toBeDefined();
                expect(blendLine, `week ${week.meta.week} blend line`).toBeDefined();
                const after = (line: string): string => line.slice(line.indexOf(':') + 1);
                expect(new RegExp(`(^|[^A-Za-z])${TRICKY[i]}($|[^A-Za-z])`).test(after(readLine!)), `week ${week.meta.week} names ${TRICKY[i]}`).toBe(true);
                const drill = stepOf(week, 'A4')[0].blendDrill!.words.find((w) => w.word === BLEND[i]);
                expect(drill, `week ${week.meta.week} drill word ${BLEND[i]}`).toBeDefined();
                let from = 0;
                for (const sound of drill!.sounds) {
                    const at = after(blendLine!).indexOf(sound, from);
                    expect(at, `week ${week.meta.week} names the sound ${sound} in order`).toBeGreaterThanOrEqual(0);
                    from = at + sound.length;
                }
                if (lang === 'th') {
                    const counts = (note: typeof e5.en) => [note.teacherActions.length, note.teacherLanguage.length, note.studentActions.length, note.watchFor.length];
                    expect(counts(e5.th!), `week ${week.meta.week} line counts`).toEqual(counts(e5.en));
                }
            });
        });
    }

    it('G6-text-check: the print text check passes on weeks 1 to 7 and fails without the read-word Row line', () => {
        const checkOf = (week: StorytimeWeek) => checkStorytimePrintText(week).find((item) => item.id === 'print-check')!;
        weeks().slice(0, 7).forEach((week, i) => {
            expect(checkOf(week).status, `week ${i + 1}`).toBe('pass');
            const without = patched(i + 1, (raw) => {
                for (const script of raw.scripts as StorytimeWeek['scripts']) for (const step of script.steps) if (step.id === 'E5') {
                    step.en.teacherLanguage = step.en.teacherLanguage.filter((line) => !line.startsWith(`"Row ${ITEMS[i] + 1}:`));
                }
            });
            expect(checkOf(without).status, `week ${i + 1} without the read-word line`).toBe('fail');
        });
    });
});

// ---------------------------------------------------------------------------------------------
// E46: one pronunciation note
// ---------------------------------------------------------------------------------------------

describe('v15 E46: the pronunciation note stays in the line, not in the activity', () => {
    const NOTE = 'ไม่ใช่ชื่อตัวอักษร';

    it('E46-none: no home.activity.th of weeks 1 to 7 holds the note', () => {
        weeks().slice(0, 7).forEach((week, i) => expect(week.home!.activity.th, `week ${i + 1}`).not.toContain(NOTE));
    });

    it('E46-w02: the w02 activity is the exact decided Thai text', () => {
        expect(weeks()[1].home!.activity.th).toBe('วางช้อนหรือของเล่นจำนวนหนึ่งบนโต๊ะ แล้วถามบุตรหลานเป็นภาษาอังกฤษว่า "How many?" ให้บุตรหลานนับเป็นภาษาอังกฤษ: "One, two, three. Three!" จากนั้นพูด "ap, ap, apple" และ "an, an, ant" พร้อมกับบุตรหลาน');
    });

    it('E46-line: home.line.th of weeks 1 to 7 is the same as at the base commit', () => {
        weeks().slice(0, 7).forEach((week, i) => {
            const base = baseWeek(i + 1).home as { line: { th: string } };
            expect(week.home!.line.th, `week ${i + 1}`).toBe(base.line.th);
        });
    });
});

// ---------------------------------------------------------------------------------------------
// E48: one song text
// ---------------------------------------------------------------------------------------------

describe('v15 E48: the lyric sheet is the text of song.lines', () => {
    const isTag = (line: string): boolean => /^\[[^\]]*\]$/.test(line);
    const sheetLines = (sheet: string): string[] => sheet.split('\n').map((line) => line.trim()).filter((line) => line !== '' && !isTag(line));
    const tagLines = (sheet: string): string[] => sheet.split('\n').map((line) => line.trim()).filter(isTag);

    it('E48-text: the sheet lines, without tags and empty lines, equal song.lines exactly and in order', () => {
        let checked = 0;
        weeks().forEach((week, i) => {
            if (!week.song || !week.song.lyricSheet) return;
            checked++;
            expect(sheetLines(week.song.lyricSheet), `week ${i + 1}`).toEqual(week.song.lines.map((line) => line.text));
        });
        expect(checked, 'weeks with a song and a sheet').toBeGreaterThanOrEqual(7);
    });

    it('E48-tags: the [tag] lines of each sheet are the same as at the base commit', () => {
        weeks().forEach((week, i) => {
            if (!week.song || !week.song.lyricSheet) return;
            const base = baseWeek(i + 1).song as { lyricSheet: string };
            expect(tagLines(week.song.lyricSheet), `week ${i + 1}`).toEqual(tagLines(base.lyricSheet));
        });
    });
});

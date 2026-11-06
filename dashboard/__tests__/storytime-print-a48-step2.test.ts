// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';

/**
 * A-48 step 2, part 1: the findings F1 and F2, the check-page rule, and the units U1 to U6
 * (the sound, write, and check pages, week 8, the home cards, and the book map). The tests read
 * the shipped week files and compile the book in proof mode, so they need no picture files.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const printDir = path.join(dashboardRoot, 'lib/storytime/print');
const studentModule = path.join(printDir, 'student-book.ts');
const wordsModule = path.join(printDir, 'trace-words.ts');
const taughtModule = path.join(printDir, 'taught-letters.ts');

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

/** The body of the first CSS rule whose selector list contains the selector exactly. */
function cssRule(style: string, selector: string): string {
    for (const match of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (match[1].split(',').map((part) => part.trim()).includes(selector)) return match[2];
    }
    return '';
}

/**
 * The right offset of the page number of a page, in mm. The inline style of the element wins.
 * Then a CSS rule that matches the element wins over the book rule of `.page-number`.
 * @param element The page-number element.
 * @param style The CSS text of the book.
 * @returns The offset in mm, or null when no rule sets it.
 */
function pageNumberRightMm(element: Element, style: string): number | null {
    const inline = element.getAttribute('style') ?? '';
    const inlineRight = inline.match(/(?:^|;)\s*right\s*:\s*([0-9.]+)mm/);
    if (inlineRight) return Number(inlineRight[1]);
    let bookRule: number | null = null;
    let scoped: number | null = null;
    for (const match of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const right = match[2].match(/(?:^|;)\s*right\s*:\s*([0-9.]+)mm/);
        if (!right) continue;
        for (const selector of match[1].split(',').map((part) => part.trim())) {
            if (selector === '.page-number') {
                bookRule = Number(right[1]);
                continue;
            }
            let applies = false;
            try {
                applies = element.matches(selector);
            } catch {
                applies = false;
            }
            if (applies) scoped = Number(right[1]);
        }
    }
    return scoped ?? bookRule;
}

interface TaughtModule { dictationRowKind: (word: string, week: number) => 'sound-boxes' | 'trace' }

describe('A-48 part 1, version: the picture list is Version 7', () => {
    it('V6-list: the constant, the committed pictures.md, and the generated header say Version 7', async () => {
        const mod = await import(path.join(printDir, 'pictures.ts')) as { STORYTIME_PICTURE_LIST_VERSION: number };
        expect(mod.STORYTIME_PICTURE_LIST_VERSION).toBe(7);
        const md = fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/print/pictures.md'), 'utf8');
        expect(md.split('\n').slice(0, 3).join('\n')).toContain('Version 7');
    });
});

describe('A-48 F1: every trace word sits on its rule line', () => {
    it('F1-geometry: the baseline of each trace line is the bottom of its SVG, where the rule line starts (within 0.5 mm)', async () => {
        const { doc } = await book();
        const spans = Array.from(doc.querySelectorAll('.student-page [data-part="writing-trace"], .student-page [data-part="dictation-trace"], .student-page [data-part="dictation-word-trace"], .student-page [data-part="choice-word-trace"]'));
        // 7 frame traces, 6 trace sentences, the week 1 trace word "a", and the 22 choice words of weeks 2 to 7.
        expect(spans.length).toBeGreaterThanOrEqual(36);
        for (const span of spans) {
            const svg = span.querySelector('svg')!;
            const view = svg.getAttribute('viewBox')!.split(' ').map(Number);
            expect(parseFloat(svg.getAttribute('height')!), 'The SVG unit is 1 mm.').toBeCloseTo(view[3], 2);
            const texts = Array.from(svg.querySelectorAll('text'));
            expect(texts.length).toBeGreaterThan(0);
            for (const item of texts) {
                expect(Math.abs(Number(item.getAttribute('y')) - view[3]), `The baseline of "${text(item)}" lies ${Math.abs(Number(item.getAttribute('y')) - view[3]).toFixed(2)} mm from the rule line.`).toBeLessThanOrEqual(0.5);
            }
        }
        const style = doc.querySelector('style')!.textContent ?? '';
        const wrapper = cssRule(style, '.writing-trace');
        expect(wrapper, 'The rule line is the bottom border of the wrapper.').toMatch(/border-bottom:\s*0\.6mm solid #000/);
        expect(wrapper, 'No space between the SVG and the rule line.').not.toMatch(/padding/);
        const svgRule = cssRule(style, '.trace-line');
        expect(svgRule).toMatch(/display:\s*block/);
        expect(svgRule, 'Letters with a tail hang below the rule line, so the SVG does not clip them.').toMatch(/overflow:\s*visible/);
    }, 120_000);

    it('F1-layout: the trace line geometry puts the baseline at the line height, and a start dot stays inside the SVG', async () => {
        const words = await import(wordsModule) as { TRACE_LINE: { baselineMm: number; heightMm: number; fontSizeMm: number; dotRadiusMm: number }; TRACE_START_EM: Record<string, { x: number; y: number }> };
        expect(words.TRACE_LINE.baselineMm).toBeCloseTo(words.TRACE_LINE.heightMm, 2);
        const tallestDot = Math.max(...Object.values(words.TRACE_START_EM).map((point) => point.y)) * words.TRACE_LINE.fontSizeMm + words.TRACE_LINE.dotRadiusMm;
        expect(tallestDot, 'The highest start dot lies inside the SVG.').toBeLessThan(words.TRACE_LINE.heightMm);
    });
});

describe('A-48 F2: a practice line with a full stop starts every sentence with a capital letter', () => {
    const rule = (week: StorytimeWeek) => checkStorytimePrintText(week).find((item) => item.id === 'print-practice-capital');

    it('F2-weeks: the rule exists and passes on the practice lines of weeks 1 to 7 (week 8 has no print block)', () => {
        for (const week of weeks().slice(0, 7)) {
            const result = rule(week);
            expect(result, `Week ${week.meta.week} has the check print-practice-capital.`).toBeDefined();
            expect(result!.status, `Week ${week.meta.week}: ${result?.detail ?? ''}`).toBe('pass');
        }
        expect(rule(weeks()[7])).toBeUndefined();
    });

    it('F2-mutants: a line that starts in lower case, or a sentence after a stop that starts in lower case, fails; a line with no stop passes', () => {
        const base = weeks()[0];
        const make = (line: string): StorytimeWeek => {
            const copy = JSON.parse(JSON.stringify(base)) as StorytimeWeek;
            copy.print!.practice[1].text = line;
            return StorytimeWeekSchema.parse(copy);
        };
        expect(rule(make('a nest. A net.'))?.status, 'a lower-case start').toBe('fail');
        expect(rule(make('A nest. a net.'))?.status, 'a lower-case sentence').toBe('fail');
        expect(rule(make('A nest! a net?'))?.status, 'a lower-case sentence after ! or ?').toBe('fail');
        expect(rule(make('A nest. A net.'))?.status).toBe('pass');
        expect(rule(make('nest net'))?.status, 'no full stop, no rule').toBe('pass');
    });
});

describe('A-48 part 1, check pages: a write-word item uses only the letters taught by its week', () => {
    it('K-taught: every write-word item of weeks 1 to 7 is a word of taught letters (a check tests; it does not teach a trace)', async () => {
        const taught = await import(taughtModule) as TaughtModule;
        const seen: string[] = [];
        for (const week of weeks().slice(0, 7)) {
            for (const item of week.check.items) {
                if (item.kind !== 'write-word') continue;
                seen.push(`${week.meta.week}:${item.word}`);
                expect(taught.dictationRowKind(item.word, week.meta.week), `Week ${week.meta.week} writes "${item.word}"`).toBe('sound-boxes');
            }
        }
        expect(seen.length, 'Weeks 2 to 7 each have one write-word item.').toBe(6);
        expect(taught.dictationRowKind('top', 6), 'The rule fails a word with an untaught letter.').toBe('trace');
    });
});

describe('A-48 U1: the sound pages (E49)', () => {
    it('U1-E49: the formation words of all 7 weeks start with "Start at the dot.", on the data and on the page, and the print check of each week passes', async () => {
        const { doc } = await book();
        const printed = Array.from(doc.querySelectorAll('[data-part="formation-words"]'), text);
        expect(printed).toHaveLength(7);
        weeks().slice(0, 7).forEach((week, index) => {
            expect(week.print!.letterBox.formationWords, `Week ${week.meta.week} data`).toMatch(/^Start at the dot\./);
            expect(week.print!.letterBox.startPoint, `Week ${week.meta.week} start point`).toBe('dot');
            expect(printed[index], `Week ${week.meta.week} page`).toMatch(/^Start at the dot\./);
            const failed = checkStorytimePrintText(week).filter((item) => item.status === 'fail');
            expect(failed.map((item) => `${item.id}: ${item.detail}`), `Week ${week.meta.week} print text check`).toEqual([]);
        });
    });
});

/** The D4 data of each teaching week (E16): the prompt picture word and the choice words that print from existing pictures. */
const D4_DATA: Record<number, { promptPicture?: string; choiceWords?: string[]; pictureBox: boolean }> = {
    1: { pictureBox: true },
    2: { promptPicture: 'ducks', choiceWords: ['one', 'two', 'three'], pictureBox: true },
    3: { promptPicture: 'apple', choiceWords: ['red', 'blue', 'yellow'], pictureBox: true },
    4: { choiceWords: ['mom', 'dad', 'brother', 'sister', 'grandma', 'grandpa', 'family'], pictureBox: true },
    5: { promptPicture: 'face', choiceWords: ['hands', 'ears', 'feet'], pictureBox: true },
    6: { promptPicture: 'cat', choiceWords: ['dog', 'fish', 'bird'], pictureBox: true },
    7: { promptPicture: 'ball', choiceWords: ['car', 'kite', 'drum'], pictureBox: true },
};

describe('A-48 U2: the write pages (E11 to E16)', () => {
    it('U2-schema: print.writing takes the optional promptPicture and choiceWords, and rejects an empty value and an unknown key', () => {
        const base = weeks()[1];
        const make = (patch: Record<string, unknown>) => {
            const copy = JSON.parse(JSON.stringify(base)) as StorytimeWeek;
            Object.assign(copy.print!.writing, patch);
            return StorytimeWeekSchema.safeParse(copy);
        };
        expect(make({ promptPicture: 'ducks', choiceWords: ['one'] }).success).toBe(true);
        expect(make({ promptPicture: '' }).success, 'an empty prompt picture word').toBe(false);
        expect(make({ choiceWords: [] }).success, 'an empty choice word list').toBe(false);
        expect(make({ choiceWords: [''] }).success, 'an empty choice word').toBe(false);
        expect(make({ extra: 1 }).success, 'the block stays strict').toBe(false);
    });

    it('U2-data: each week names its prompt picture and choice words from the D4 script, and week 3 keeps its draw box', () => {
        weeks().slice(0, 7).forEach((week) => {
            const want = D4_DATA[week.meta.week];
            expect(week.print!.writing.promptPicture, `Week ${week.meta.week} prompt picture`).toBe(want.promptPicture);
            expect(week.print!.writing.choiceWords, `Week ${week.meta.week} choice words`).toEqual(want.choiceWords);
            expect(week.print!.writing.pictureBox, `Week ${week.meta.week} draw box`).toBe(want.pictureBox);
        });
    });

    it('U2-script: the week 3 D4 script has no balloon (decision 7), the week 2 script counts the ducks, and the print check of each week passes', () => {
        const d4 = (week: StorytimeWeek) => JSON.stringify(week.scripts.flatMap((script) => script.steps).find((step) => step.id === 'D4'));
        expect(d4(weeks()[2])).not.toMatch(/balloon|ลูกโป่ง/);
        expect(d4(weeks()[1])).not.toMatch(/apples|แอปเปิล/);
        expect(d4(weeks()[1])).toMatch(/ducks/);
        for (const week of weeks().slice(0, 7)) {
            const failed = checkStorytimePrintText(week).filter((item) => item.status === 'fail');
            expect(failed.map((item) => `${item.id}: ${item.detail}`), `Week ${week.meta.week}`).toEqual([]);
        }
    });

    it('U2-check: a choice word or a prompt picture word that the D4 script does not say fails the print check', () => {
        const make = (patch: Record<string, unknown>) => {
            const copy = JSON.parse(JSON.stringify(weeks()[5])) as StorytimeWeek;
            Object.assign(copy.print!.writing, patch);
            return checkStorytimePrintText(StorytimeWeekSchema.parse(copy)).find((item) => item.id === 'print-writing')!;
        };
        expect(make({}).status).toBe('pass');
        expect(make({ choiceWords: ['dog', 'fish', 'zebra'] }).status, 'a choice word that D4 does not say').toBe('fail');
        expect(make({ promptPicture: 'zebra' }).status, 'a prompt picture that D4 does not say').toBe('fail');
    });

    it.each([1, 2, 3, 4, 5, 6, 7])('U2-page: week %i D4 block prints the prompt picture, the draw boxes, the choice words, and the numbered rows', async (weekNumber) => {
        const { doc } = await book();
        const week = weeks()[weekNumber - 1];
        const want = D4_DATA[weekNumber];
        const page = doc.querySelectorAll('.student-page[data-page-kind="writing"]')[weekNumber - 1];
        const d4 = page.querySelector('[data-part="step-block"][data-step="D4"]')!;
        // The prompt picture is a picture-list row: an existing row, or the d4-prompt row of weeks 5 and 7 (version 6).
        const prompts = d4.querySelectorAll('[data-part="prompt-row"] .picture-box');
        expect(prompts).toHaveLength(want.promptPicture ? 1 : 0);
        if (want.promptPicture) expect(prompts[0].getAttribute('data-picture-id')).toMatch(/^l2-w0[1-7]-(story-page|check-row|practice-line|d4-prompt)-/);
        const boxes = d4.querySelectorAll('[data-part="writing-picture-box"]');
        const expectedBoxes = want.pictureBox ? (want.choiceWords ? 2 - (want.promptPicture ? 1 : 0) : 1) : 0;
        expect(boxes, `Week ${weekNumber} draw boxes`).toHaveLength(expectedBoxes);
        const choice = Array.from(d4.querySelectorAll('[data-part="choice-word"]'), text);
        expect(choice).toEqual(want.choiceWords ?? []);
        for (const word of d4.querySelectorAll('[data-part="choice-word"]')) {
            expect(word.querySelectorAll('circle[data-part="trace-word-dot"]'), 'one start dot on the first letter').toHaveLength(1);
            expect(word.querySelector('.writing-trace'), 'each choice word has its own rule line').not.toBeNull();
        }
        const numbers = Array.from(page.querySelectorAll('[data-part="row-number"]'), text);
        expect(numbers, 'the row numbers run 1, 2, 3 through the page').toEqual(numbers.map((_value, index) => String(index + 1)));
        const labels = Array.from(d4.querySelectorAll('.row-label'), text);
        expect(labels).toContain('Trace.');
        expect(labels).toContain('Write.');
        if (want.promptPicture) expect(labels).toContain({ look: 'Look.', color: 'Color.', draw: 'Draw.' }[week.print!.writing.promptAction ?? 'look']);
        if (want.choiceWords) expect(labels).toContain('Trace one.');
        expect(week.print!.writing.line === 'name' ? labels.indexOf('Write.') < labels.indexOf('Draw.') : labels.indexOf('Write.') > labels.lastIndexOf('Trace one.'), 'the name line follows the frame; the word line follows the choice words').toBe(true);
    });

    it('U2-rows: the picture list has 196 rows (194 after U7, plus the 2 d4-prompt rows of weeks 5 and 7)', async () => {
        const mod = await import(path.join(printDir, 'pictures.ts')) as { storytimePrintPictures: (w: StorytimeWeek[]) => { id: string }[] };
        expect(mod.storytimePrintPictures(weeks()).length).toBe(196);
    });

    it('U2-count: the book keeps 136 pages', async () => {
        const { doc } = await book();
        expect(doc.querySelectorAll('.student-page').length).toBe(136);
    });
});

/** The 8 pages of week 8 in the book: the blank leaf side, the 2 benchmark pages, and the 5 review pages (U4). */
const REVIEW_CODES = ['A2', 'B1', 'C1', 'D1', 'E1'];

function pages(doc: Document): Element[] {
    return Array.from(doc.querySelectorAll('.student-page'));
}

/** The picture-list row ids of the check-row words, by word (the rows that the review and benchmark pictures print). */
async function checkRowIds(): Promise<Map<string, string>> {
    const mod = await import(path.join(printDir, 'pictures.ts')) as { storytimePrintPictures: (w: StorytimeWeek[]) => { id: string; use: string; text: string; week: number }[] };
    const map = new Map<string, string>();
    for (const row of mod.storytimePrintPictures(weeks())) if (row.use === 'check-row' && !map.has(row.text)) map.set(row.text, row.id);
    return map;
}

const idsOf = (root: ParentNode): string[] => Array.from(root.querySelectorAll('[data-picture-id]'), (element) => element.getAttribute('data-picture-id') ?? '');

describe('A-48 U4: week 8, the benchmark on 2 pages before Review 1, and the reviews as real tasks (E41 to E43, B20 to B23)', () => {
    it('U4-order: the book keeps 136 pages; the benchmark takes pages 130 and 131 before Review 1 (page 132 to 136), with no pad at the end (B23)', async () => {
        const { doc } = await book();
        const list = pages(doc);
        expect(list).toHaveLength(136);
        expect(list.map((page) => page.getAttribute('data-page-kind')).slice(128)).toEqual(['blank', 'benchmark', 'benchmark', 'review', 'review', 'review', 'review', 'review']);
        expect(list.map((page) => page.getAttribute('data-page-number'))).toEqual(list.map((_page, index) => String(index + 1)));
    });

    it('U4-chrome: each benchmark and review page has the week header, the page number, and the step badge (A1, A2, B1, C1, D1, E1)', async () => {
        const { doc } = await book();
        const list = pages(doc).slice(129);
        const codes = ['A1', 'A1', ...REVIEW_CODES];
        list.forEach((page, index) => {
            expect(text(page.querySelector('[data-part="week-label"]')!), `page ${130 + index}`).toBe('Week 8 · สัปดาห์ที่ 8');
            expect(text(page.querySelector('[data-part="page-number"]')!)).toBe(String(130 + index));
            expect(page.querySelector('[data-part="step-badge"]')!.getAttribute('data-step')).toBe(codes[index]);
        });
        expect(text(list[0].querySelector('.page-title')!)).toBe('Benchmark 1');
        list.slice(2).forEach((page, index) => expect(text(page.querySelector('.page-title')!)).toBe(`Review ${index + 1}`));
    });

    it('U4-bench1: rows 1 to 8 print 3 pictures each, numbered, with the first-sound or last-sound mark and a head for each group (B22, E43)', async () => {
        const { doc } = await book();
        const week8 = weeks()[7];
        const ids = await checkRowIds();
        const page = pages(doc)[129];
        const rows = Array.from(page.querySelectorAll('[data-part="benchmark-row"]'));
        const items = week8.benchmark!.paper.items.filter((item) => item.kind === 'circle-picture');
        expect(rows).toHaveLength(8);
        rows.forEach((row, index) => {
            const item = items[index] as { pictures: string[]; position?: string };
            expect(text(row.querySelector('[data-part="row-number"]')!)).toBe(String(index + 1));
            expect(idsOf(row)).toEqual(item.pictures.map((word) => ids.get(word)));
            const position = item.position === 'last' ? 'last' : 'first';
            expect(row.getAttribute('data-position')).toBe(position);
            expect(row.querySelector('[data-part="position-mark"]')!.getAttribute('data-position')).toBe(position);
            expect(row.querySelectorAll('.picture-box')).toHaveLength(3);
        });
        const heads = Array.from(page.querySelectorAll('[data-part="row-group-head"]'));
        expect(heads.map(text)).toEqual(['Listen. Circle the picture that starts with the sound.', 'Listen. Circle the picture that ends with the sound.']);
        expect(heads[0].querySelectorAll('[data-part="step-icon"]')).toHaveLength(2);
        expect(page.querySelectorAll('[data-answer], [data-correct], .answer, .correct')).toHaveLength(0);
        expect(text(page.querySelector('[data-part="score-strip"]')!), 'a blank, then the total').toBe('/ 8');
        expect(page.querySelectorAll('[data-part="score-strip"] .score-blank')).toHaveLength(1);
        expect(page.querySelectorAll('[data-part="check-write-letter"]'), 'the letter boxes are on page 2').toHaveLength(0);
    });

    it('U4-bench2: boxes 9 to 15 are numbered and empty, with the listen-and-write head and a score strip for the letters (B22, E43)', async () => {
        const { doc } = await book();
        const page = pages(doc)[130];
        const boxes = Array.from(page.querySelectorAll('[data-part="benchmark-box"]'));
        expect(boxes).toHaveLength(7);
        expect(boxes.map((box) => text(box.querySelector('[data-part="row-number"]')!))).toEqual(['9', '10', '11', '12', '13', '14', '15']);
        for (const box of boxes) expect(text(box.querySelector('[data-part="check-write-letter"]')!)).toBe('');
        expect(Array.from(page.querySelectorAll('[data-part="row-group-head"]'), text)).toEqual(['Listen. Write.']);
        expect(text(page.querySelector('[data-part="score-strip"]')!)).toBe('/ 7');
        expect(page.querySelectorAll('[data-picture-id]')).toHaveLength(0);
    });

    it.each([1, 2, 3, 4, 5])('U4-review%i: the review page has the match rows and the picture rows, each a task that the child can do alone (E41, B20, B21)', async (number) => {
        const { doc } = await book();
        const week8 = weeks()[7];
        const ids = await checkRowIds();
        const page = pages(doc)[130 + number];
        const day = week8.block!.days[number - 1];
        const words = day.paper.filter((item) => item.kind === 'circle-word') as { words: string[]; answer: string }[];
        const sort = day.paper.find((item) => item.kind === 'picture-sort') as { groups: { sound: string; pictures: string[] }[] };
        const heads = Array.from(page.querySelectorAll('[data-part="row-group-head"]'), text);
        expect(heads).toEqual(['Find the same word. Circle it.', number === 5 ? 'Circle the picture that starts with the sound.' : 'Circle the pictures that start with the sound.']);
        // The match rows: the word to find stands at the row start, and the child circles the same word.
        const matches = Array.from(page.querySelectorAll('[data-part="match-row"]'));
        expect(matches).toHaveLength(3);
        matches.forEach((row, index) => {
            expect(text(row.querySelector('[data-part="match-target"]')!)).toBe(words[index].answer);
            expect(Array.from(row.querySelectorAll('[data-part="circle-word"]'), text)).toEqual(words[index].words);
            expect(text(row.querySelector('[data-part="row-number"]')!)).toBe(String(index + 1));
        });
        // The picture rows: the sound label starts the row, and the row mixes the pictures of the sound with pictures of other sounds.
        const rows = Array.from(page.querySelectorAll('[data-part="picture-sort"] [data-part="sound-row"]'));
        expect(rows).toHaveLength(sort.groups.length);
        const letterOf = (sound: string): string => sound.replace(/\//g, '');
        rows.forEach((row, index) => {
            const group = sort.groups[index];
            expect(text(row.querySelector('[data-part="sound-label"]')!)).toBe(group.sound);
            expect(text(row.querySelector('[data-part="row-number"]')!)).toBe(String(3 + index + 1));
            const printed = idsOf(row);
            expect(printed).toHaveLength(4);
            const targets = group.pictures.slice(0, 2).map((word) => ids.get(word)!);
            for (const target of targets) expect(printed, `row ${index + 1} holds the target`).toContain(target);
            const wordOf = new Map([...ids.entries()].map(([word, id]) => [id, word]));
            const others = printed.filter((id) => !targets.includes(id)).map((id) => wordOf.get(id)!);
            expect(others).toHaveLength(4 - targets.length);
            for (const other of others) expect(other.startsWith(letterOf(group.sound)), `${other} does not start with ${group.sound}`).toBe(false);
            for (const target of targets) expect(wordOf.get(target)!.startsWith(letterOf(group.sound))).toBe(true);
        });
        const strip = text(page.querySelector('[data-part="score-strip"]')!);
        expect(strip).toBe(`/ ${3 + sort.groups.length}`);
        expect(page.querySelectorAll('[data-answer], [data-correct], .answer, .correct')).toHaveLength(0);
    });

    it('U4-label: one label style for a sound in the whole book, /x/ (E42)', () => {
        const groups = weeks()[7].block!.days.flatMap((day) => day.paper).flatMap((item) => (item.kind === 'picture-sort' ? item.groups : []));
        expect(groups).toHaveLength(2 + 2 + 2 + 2 + 7);
        for (const group of groups) expect(group.sound, 'a sound label of a review group').toMatch(/^\/[a-z]\/$/);
    });

    it('U4-map: the step map names the benchmark and the 5 review pages', async () => {
        const mod = await import(path.join(printDir, 'step-map.ts')) as { STORYTIME_STEP_MAP: { code: string; pageKind: string; label: string; icons: string[] }[] };
        const byCode = new Map(mod.STORYTIME_STEP_MAP.map((entry) => [entry.code, entry]));
        expect(byCode.get('A1')).toMatchObject({ pageKind: 'benchmark', label: 'Benchmark 1' });
        REVIEW_CODES.forEach((code, index) => expect(byCode.get(code)).toMatchObject({ pageKind: 'review', label: `Review ${index + 1}` }));
        expect(new Set(mod.STORYTIME_STEP_MAP.map((entry) => entry.code)).size).toBe(mod.STORYTIME_STEP_MAP.length);
    });
});

describe('A-48 U5: the home cards (E44, E45, E47)', () => {
    it('U5-week: each card side names its week, "Week N · สัปดาห์ที่ N", and carries its own page number (A-48 part F F1/E50)', async () => {
        const { doc } = await book();
        for (const kind of ['home-front', 'home-back']) {
            const sides = Array.from(doc.querySelectorAll(`.student-page[data-page-kind="${kind}"]`));
            expect(sides).toHaveLength(7);
            sides.forEach((side, index) => {
                expect(text(side.querySelector('[data-part="home-week"]')!), `${kind} of week ${index + 1}`).toBe(`Week ${index + 1} · สัปดาห์ที่ ${index + 1}`);
                expect(text(side.querySelector('[data-part="page-number"]')!), `${kind} of week ${index + 1}`).toBe(side.getAttribute('data-page-number'));
            });
        }
    });

    it('U5-qr: the two QR labels of the Thai card print in Thai, with the English line below', async () => {
        const { doc } = await book();
        const sides = Array.from(doc.querySelectorAll('.student-page[data-page-kind="home-front"]'));
        for (const side of sides) {
            const labels = Array.from(side.querySelectorAll('.qr'));
            expect(labels).toHaveLength(2);
            expect(labels.map((label) => text(label.querySelector('[data-part="qr-label-th"]')!))).toEqual(['เพลงประจำสัปดาห์', 'หนังสือประจำสัปดาห์']);
            expect(labels.map((label) => text(label.querySelector('.qr-label:not([data-part="qr-label-th"])')!))).toEqual(['The song of the week', 'The book of the week']);
        }
    });

    it('U5-margin: the text of a card keeps 6 mm from the cut line, 4 mm more than before (E47)', async () => {
        const { doc } = await book();
        const cards = Array.from(doc.querySelectorAll('.student-page[data-page-kind="home-front"], .student-page[data-page-kind="home-back"]'));
        expect(cards).toHaveLength(14);
        for (const card of cards) {
            const edge = card.querySelector('[data-part="perforation"]')!.getAttribute('data-spine-edge');
            const cut = card.querySelector('[data-part="perforation"]')!.getAttribute('style') ?? '';
            expect(cut, 'the cut line stays 12 mm from the spine edge').toContain(`${edge}:12mm`);
            expect(card.getAttribute('style') ?? '', `page ${card.getAttribute('data-page-number')}`).toContain(`padding-${edge}:18mm`);
        }
    });

    it('U5-number: the page number of a card keeps 6 mm from the cut line (A-48 part F F1)', async () => {
        const { doc } = await book();
        const cards = Array.from(doc.querySelectorAll('.student-page[data-page-kind="home-front"], .student-page[data-page-kind="home-back"]'));
        expect(cards).toHaveLength(14);
        const style = doc.querySelector('style')!.textContent ?? '';
        expect(cssRule(style, '.page-number'), 'The book rule puts the page number 14 mm from the outer edge.').toMatch(/right:\s*14mm/);
        for (const card of cards) {
            const page = card.getAttribute('data-page-number');
            const edge = card.querySelector('[data-part="perforation"]')!.getAttribute('data-spine-edge');
            const number = card.querySelector('[data-part="page-number"]');
            expect(number, `page ${page} carries a page number`).not.toBeNull();
            // The cut line stands 12 mm from the spine edge, so the number keeps 6 mm from it at 18 mm.
            const offset = pageNumberRightMm(number!, style);
            const expected = edge === 'right' ? 18 : 14;
            expect(offset, `page ${page}: the page number of a card with the spine edge on the ${edge} keeps ${expected} mm from that edge.`).toBe(expected);
        }
    });

    it('U5-words: each home word of weeks 1 to 7 starts with the letter of its week (E44: cup is not a /p/ word)', () => {
        for (const week of weeks().slice(0, 7)) {
            const letter = week.print!.letterBox.letter;
            for (const word of week.home!.words) expect(word.startsWith(letter), `Week ${week.meta.week}: "${word}" starts with ${letter}`).toBe(true);
        }
        expect(weeks()[2].home!.words).toEqual(['pen', 'pear', 'pencil']);
    });
});

describe('A-48 U6: the book map and the title page (B19, B24, E51)', () => {
    it('U6-title: the title has no comma after the unit (E51)', async () => {
        const { doc } = await book();
        expect(text(doc.querySelector('.student-page[data-page-kind="name"] [data-part="title"]')!)).toBe('Storytime Advantage, Level 2, Unit 1 Student Book');
    });

    it('U6-numbers: boxes 1 to 7 carry a big number, the unit box carries a star, one line says what to do (B19)', async () => {
        const { doc } = await book();
        const map = doc.querySelector('.student-page[data-page-kind="book-map"]')!;
        const places = Array.from(map.querySelectorAll('[data-sticker]'));
        expect(places.map((place) => place.getAttribute('data-sticker'))).toEqual(['decodable-1', 'decodable-2', 'decodable-3', 'decodable-4', 'decodable-5', 'decodable-6', 'decodable-7', 'unit-1']);
        expect(places.slice(0, 7).map((place) => text(place.querySelector('[data-part="map-number"]')!))).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        const unit = places[7];
        expect(unit.querySelector('[data-icon="star"]'), 'the unit box shows the star').not.toBeNull();
        expect(text(unit.querySelector('[data-part="map-number"]')!)).toBe('Unit 1');
        expect(text(map.querySelector('[data-part="map-line"]')!)).toBe('Put the sticker on the number.');
    });

    it('U6-pages: each book-map page number equals the page printed in the book (B24)', async () => {
        const { doc } = await book();
        const map = doc.querySelector('.student-page[data-page-kind="book-map"]')!;
        const places = Array.from(map.querySelectorAll('[data-sticker]'));
        const practice = Array.from(doc.querySelectorAll('.student-page[data-page-kind="practice"]'));
        expect(practice).toHaveLength(7);
        places.slice(0, 7).forEach((place, index) => {
            const printed = text(practice[index].querySelector('[data-part="page-number"]')!);
            expect(printed).toBe(practice[index].getAttribute('data-page-number'));
            expect(text(place.querySelector('[data-part="map-page"]')!), `book ${index + 1}`).toBe(`page ${printed}`);
        });
        const first8 = doc.querySelector('.student-page[data-page-kind="benchmark"]')!;
        expect(text(places[7].querySelector('[data-part="map-page"]')!)).toBe(`page ${text(first8.querySelector('[data-part="page-number"]')!)}`);
        expect(new Set(places.map((place) => text(place.querySelector('[data-part="map-page"]')!))).size).toBe(8);
    });
});

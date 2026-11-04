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

interface TaughtModule { dictationRowKind: (word: string, week: number) => 'sound-boxes' | 'trace' }

describe('A-48 part 1, version: the picture list is Version 5', () => {
    it('V5-list: the constant, the committed pictures.md, and the generated header say Version 5', async () => {
        const mod = await import(path.join(printDir, 'pictures.ts')) as { STORYTIME_PICTURE_LIST_VERSION: number };
        expect(mod.STORYTIME_PICTURE_LIST_VERSION).toBe(5);
        const md = fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/print/pictures.md'), 'utf8');
        expect(md.split('\n').slice(0, 3).join('\n')).toContain('Version 5');
    });
});

describe('A-48 F1: every trace word sits on its rule line', () => {
    it('F1-geometry: the baseline of each trace line is the bottom of its SVG, where the rule line starts (within 0.5 mm)', async () => {
        const { doc } = await book();
        const spans = Array.from(doc.querySelectorAll('.student-page [data-part="writing-trace"], .student-page [data-part="dictation-trace"], .student-page [data-part="dictation-word-trace"]'));
        // 7 frame traces, 6 trace sentences, and the week 1 trace word "a".
        expect(spans.length).toBeGreaterThanOrEqual(14);
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
    });

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

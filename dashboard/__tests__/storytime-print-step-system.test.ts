// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { insideInk, outsideDistance, parseFont, placeGlyph, samplePath, type OutlinePoint } from './fixtures/storytime-glyph-outline';

/**
 * A-48 step 1 (the sample): the per-letter stroke data, the step map with its badge and icons, and
 * the three page templates (sound, write, check) of every week. The stroke checks are vector
 * checks against the real Andika outline; one Chrome test proves that the browser draws the
 * letters and the trace words where the vector model says. Imports of the new modules stay inside
 * test bodies, so that a missing module fails a test and not the collection.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const printDir = path.join(dashboardRoot, 'lib/storytime/print');
const strokesModule = path.join(printDir, 'letter-strokes.ts');
const wordsModule = path.join(printDir, 'trace-words.ts');
const stepMapModule = path.join(printDir, 'step-map.ts');
const iconsModule = path.join(printDir, 'icons.ts');
const taughtModule = path.join(printDir, 'taught-letters.ts');
const studentModule = path.join(printDir, 'student-book.ts');
const textCheckModule = path.join(printDir, 'text-check.ts');
const font = parseFont(path.join(dashboardRoot, 'assets/print-fonts/andika-regular.ttf'));
const temporaryFolders: string[] = [];

/** The seven letters of unit 1 with the stroke count of each (the formation words of its week). */
const LETTERS: [string, number][] = [['n', 2], ['a', 2], ['p', 2], ['m', 3], ['s', 1], ['t', 2], ['o', 1]];
/** The R41 tolerance for guide ink outside the letter. */
const GUIDE_TOLERANCE_MM = 0.5;
/** The most that any ink point of a letter may lie from a stroke centerline, in box units. */
const MAX_INK_DISTANCE = 10;

interface StrokeModule {
    LETTER_BOX: { width: number; height: number; fontSize: number; centerX: number; baseline: number };
    LETTER_CELL_MM: { width: number; height: number };
    LETTER_GUIDE: { strokeWidth: number; modelDotRadius: number; traceDotRadius: number; numberSize: number };
    LETTER_STROKES: Record<string, StrokeData>;
    letterStrokeData: (letter: string) => StrokeData;
}
interface StrokeData {
    strokes: { d: string; number: { x: number; y: number } }[];
    modelDot: OutlinePoint;
    traceDot: OutlinePoint;
    dotOnlyDot: OutlinePoint;
}
interface WordsModule {
    ANDIKA_ADVANCE_EM: Record<string, number>;
    TRACE_START_EM: Record<string, { x: number; y: number }>;
    TRACE_LINE: { fontSizeMm: number; baselineMm: number; heightMm: number; padMm: number; dotRadiusMm: number };
    traceLineLayout: (text: string, fontSize: number) => { words: { text: string; x: number; dot?: { x: number; y: number } }[]; width: number };
}
interface TaughtModule {
    STORYTIME_LETTER_ORDER: readonly string[];
    taughtLetters: (week: number) => string[];
    dictationRowKind: (word: string, week: number) => 'sound-boxes' | 'trace';
}
interface StepEntry { code: string; steps: string[]; pageKind: string; block: string; icons: string[]; label: string }
interface StepModule {
    STORYTIME_ICONS: string[];
    STORYTIME_STEP_MAP: StepEntry[];
    STORYTIME_CHECK_ROW_TYPES: Record<string, { icons: string[]; label: string }>;
    STORYTIME_ICON_KEY: { icon: string; english: string; thai: string }[];
    STORYTIME_DAY_KEY: { letter: string; thai: string }[];
}

function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_v, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

let cachedBook: { html: string; doc: Document } | undefined;
/** The compiled 8-week book in proof mode, parsed once for the file. */
async function book(): Promise<{ html: string; doc: Document }> {
    if (cachedBook) return cachedBook;
    expect(fs.existsSync(studentModule), 'Missing module: lib/storytime/print/student-book.ts').toBe(true);
    const { compileStorytimeStudentBook } = await import(studentModule) as {
        compileStorytimeStudentBook: (w: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' }) => { html: string };
    };
    const { html } = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
    cachedBook = { html, doc: new DOMParser().parseFromString(html, 'text/html') };
    return cachedBook;
}

const text = (element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim();
const texts = (root: ParentNode, selector: string): string[] => Array.from(root.querySelectorAll(selector), text);

/** The page of a kind for a teaching week (the weeks come in order, one page of each kind). */
function weekPage(doc: Document, kind: string, week: number): Element {
    const found = doc.querySelectorAll(`.student-page[data-page-kind="${kind}"]`);
    expect(found.length, `Each teaching week prints one ${kind} page.`).toBeGreaterThanOrEqual(week);
    return found[week - 1];
}

function onlyPart(root: ParentNode, name: string): Element {
    const found = root.querySelectorAll(`[data-part="${name}"]`);
    expect(found.length, `Exactly one ${name} must print.`).toBe(1);
    return found[0];
}

function blocks(page: Element): Element[] {
    return Array.from(page.querySelectorAll('[data-part="step-block"]'));
}

function headIcons(block: Element): string[] {
    return Array.from(block.querySelectorAll('.step-head [data-part="step-icon"]'), (icon) => icon.getAttribute('data-icon') ?? '');
}

function numAttr(element: Element, name: string): number {
    return Number(element.getAttribute(name));
}

/** The body of the first CSS rule whose selector list contains the selector exactly. */
function cssRule(style: string, selector: string): string {
    for (const match of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (match[1].split(',').map((part) => part.trim()).includes(selector)) return match[2];
    }
    return '';
}

// ---- the vector stroke checks ----

/**
 * The problems of the stroke data of one letter against the Andika outline (R41 tolerance, D5,
 * E01 to E10): the stroke count, ink outside the outline, ink that no stroke guides, and the three
 * start dots on the first point of stroke 1.
 * @param letter The letter.
 * @param data The stroke data under test.
 * @param expectedStrokes The stroke count of the formation words.
 * @param mod The stroke module (the box, the cell size, and the guide look).
 * @returns The problems; an empty list means that the data passes.
 */
function strokeProblems(letter: string, data: StrokeData, expectedStrokes: number, mod: StrokeModule): string[] {
    const problems: string[] = [];
    const { LETTER_BOX: box, LETTER_CELL_MM: cell, LETTER_GUIDE: guide } = mod;
    const toleranceUnits = GUIDE_TOLERANCE_MM / (cell.width / box.width);
    const glyph = placeGlyph(font, letter, { fontSize: box.fontSize, x: box.centerX, baseline: box.baseline });
    if (data.strokes.length !== expectedStrokes) problems.push(`${data.strokes.length} strokes, expected ${expectedStrokes}`);
    const samples = data.strokes.flatMap((stroke) => samplePath(stroke.d, 0.25));
    data.strokes.forEach((stroke, index) => {
        let worst = 0;
        for (const point of samplePath(stroke.d, 0.25)) worst = Math.max(worst, outsideDistance(glyph.contours, point) + guide.strokeWidth / 2);
        if (worst > toleranceUnits) problems.push(`stroke ${index + 1} leaves the letter by ${(worst * cell.width / box.width).toFixed(2)} mm`);
    });
    let farthest = 0;
    for (let y = 0; y < box.height; y += 1) for (let x = 0; x < box.width; x += 1) {
        if (!insideInk(glyph.contours, { x, y })) continue;
        let best = Infinity;
        for (const point of samples) best = Math.min(best, Math.hypot(point.x - x, point.y - y));
        farthest = Math.max(farthest, best);
    }
    if (farthest > MAX_INK_DISTANCE) problems.push(`ink lies ${farthest.toFixed(1)} units from the nearest stroke`);
    const start = samplePath(data.strokes[0].d, 0.25)[0];
    for (const [name, dot] of [['model', data.modelDot], ['trace', data.traceDot], ['dot-only', data.dotOnlyDot]] as const) {
        if (Math.hypot(dot.x - start.x, dot.y - start.y) > 0.5) problems.push(`the ${name} dot is not on the first point of stroke 1`);
    }
    if (!insideInk(glyph.contours, data.traceDot)) problems.push('the trace dot is not on the ink of the letter');
    return problems;
}

describe('A-48: the per-letter stroke data (E01 to E10)', () => {
    it.each(LETTERS)('S-%s: the strokes follow the Andika outline, cover the letter, and start at the dots (%i strokes)', async (letter, count) => {
        expect(fs.existsSync(strokesModule), 'Missing module: lib/storytime/print/letter-strokes.ts').toBe(true);
        const mod = await import(strokesModule) as StrokeModule;
        expect(mod.letterStrokeData(letter).strokes).toHaveLength(count);
        expect(strokeProblems(letter, mod.letterStrokeData(letter), count, mod)).toEqual([]);
    });

    it('S-all: a stroke path is not shared by two letters, and an unknown letter fails loudly', async () => {
        const mod = await import(strokesModule) as StrokeModule;
        const keys = LETTERS.map(([letter]) => JSON.stringify(mod.letterStrokeData(letter).strokes.map((stroke) => stroke.d)));
        expect(new Set(keys).size).toBe(LETTERS.length);
        expect(() => mod.letterStrokeData('x')).toThrow(/no stroke data/);
        expect(Object.keys(mod.LETTER_STROKES).sort()).toEqual(LETTERS.map(([letter]) => letter).sort());
    });

    it('S-weeks: the table holds the letter of each of the 7 teaching weeks, in order', async () => {
        const mod = await import(strokesModule) as StrokeModule;
        expect(weeks().slice(0, 7).map((week) => week.print!.letterBox.letter)).toEqual(['n', 'a', 'p', 'm', 's', 't', 'o']);
        for (const week of weeks().slice(0, 7)) expect(() => mod.letterStrokeData(week.print!.letterBox.letter)).not.toThrow();
    });

    it('S-a-up: stroke 1 of the a goes up the stem to the top, and stroke 2 starts there beside it (week 2 words)', async () => {
        const mod = await import(strokesModule) as StrokeModule;
        const a = mod.letterStrokeData('a');
        const mm = mod.LETTER_CELL_MM.width / mod.LETTER_BOX.width;
        const first = samplePath(a.strokes[0].d, 0.25);
        const second = samplePath(a.strokes[1].d, 0.25);
        const end = first[first.length - 1];
        const start = second[0];
        expect(Math.hypot(end.x - start.x, end.y - start.y) * mm, 'The end of stroke 1 is within 1 mm of the top of the stem.').toBeLessThanOrEqual(1);
        expect(Math.abs(end.x - start.x), 'The up path and the down path are offset, as on the n.').toBeGreaterThanOrEqual(mod.LETTER_GUIDE.strokeWidth);
        expect(end.y, 'The arrow of stroke 1 stops near the top of the stem, not at its middle.').toBeLessThan(45);
        expect(Math.min(...first.map((point) => point.y)), 'Stroke 1 does not rise above the start dot.').toBeGreaterThanOrEqual(a.modelDot.y - 2);
    });

    it('S-mutants: the n strokes for o, a dot off the stroke, and a missing stroke each fail the check', async () => {
        const mod = await import(strokesModule) as StrokeModule;
        const o = mod.letterStrokeData('o');
        const n = mod.letterStrokeData('n');
        expect(strokeProblems('o', n, 1, mod), 'Mutant 1: the n guide on the o (E06).').not.toEqual([]);
        expect(strokeProblems('o', { ...o, strokes: n.strokes.slice(0, 1) }, 1, mod), 'Mutant 1b: one n stem on the o.').not.toEqual([]);
        expect(strokeProblems('o', { ...o, traceDot: { x: 12, y: 12 } }, 1, mod), 'Mutant 2: a trace dot in white space (E07 to E10).').not.toEqual([]);
        const m = mod.letterStrokeData('m');
        expect(strokeProblems('m', { ...m, strokes: m.strokes.slice(0, 2) }, 3, mod), 'Mutant 3: two strokes on the m (E03).').not.toEqual([]);
        const a = mod.letterStrokeData('a');
        expect(strokeProblems('a', { ...a, strokes: [{ ...a.strokes[0], d: 'M31.6 33.3 L31.6 82.0' }, a.strokes[1]] }, 2, mod), 'Mutant 4: a straight stem for the bowl of a (E01).').not.toEqual([]);
    });
});

describe('A-48: the trace words (E11 to E14)', () => {
    it('W-start: each first-letter start point lies on the ink of its Andika letter', async () => {
        const mod = await import(wordsModule) as WordsModule;
        expect(Object.keys(mod.TRACE_START_EM).length).toBeGreaterThanOrEqual(18);
        for (const [letter, point] of Object.entries(mod.TRACE_START_EM)) {
            const outline = font.glyph(letter);
            const at = { x: point.x * font.unitsPerEm, y: point.y * font.unitsPerEm };
            expect(insideInk(outline.contours, at), `The start of "${letter}" must sit on its ink.`).toBe(true);
        }
    });

    it('W-advance: the advance table equals the Andika advance of every printable ASCII character', async () => {
        const mod = await import(wordsModule) as WordsModule;
        for (let code = 33; code <= 126; code++) {
            const ch = String.fromCharCode(code);
            const real = font.glyph(ch).advance / font.unitsPerEm;
            expect(Math.abs(mod.ANDIKA_ADVANCE_EM[ch] - real), `Advance of ${ch}`).toBeLessThan(0.001);
        }
    });

    it('W-layout: every trace text of the 7 weeks lays out, with one dot for each word that starts with a letter', async () => {
        const mod = await import(wordsModule) as WordsModule;
        for (const week of weeks().slice(0, 7)) {
            for (const line of [week.print!.writing.traceText, week.print!.dictation.traceSentence].filter((value): value is string => Boolean(value))) {
                const layout = mod.traceLineLayout(line, 10);
                expect(layout.words.map((word) => word.text).join(' ')).toBe(line.split(/\s+/).filter(Boolean).join(' '));
                expect(layout.words.filter((word) => word.dot).length).toBe(line.split(/\s+/).filter((word) => /^\p{L}/u.test(word)).length);
                for (let i = 1; i < layout.words.length; i++) expect(layout.words[i].x).toBeGreaterThan(layout.words[i - 1].x);
            }
        }
        expect(mod.traceLineLayout('"><img', 10).words[0].dot, 'A word that starts with a mark has no dot.').toBeUndefined();
        expect(() => mod.traceLineLayout('Qq', 10)).toThrow(/no trace start point/);
    });
});

describe('A-48: the step map, the badge, and the icons (B section 5)', () => {
    it('M-map: one constant maps each step code to its page kind, block, icons, and label', async () => {
        expect(fs.existsSync(stepMapModule), 'Missing module: lib/storytime/print/step-map.ts').toBe(true);
        const mod = await import(stepMapModule) as StepModule;
        const byCode = new Map(mod.STORYTIME_STEP_MAP.map((entry) => [entry.code, entry]));
        expect(byCode.size, 'Codes are unique.').toBe(mod.STORYTIME_STEP_MAP.length);
        const pick = (code: string): Omit<StepEntry, 'steps'> => {
            const entry = byCode.get(code)!;
            return { code: entry.code, pageKind: entry.pageKind, block: entry.block, icons: entry.icons, label: entry.label };
        };
        expect(pick('A3')).toEqual({ code: 'A3', pageKind: 'practice', block: 'form-it', icons: ['pencil'], label: 'Form it' });
        expect(pick('A7')).toEqual({ code: 'A7', pageKind: 'practice', block: 'read-it', icons: ['read'], label: 'Read it' });
        expect(pick('A6·D2')).toEqual({ code: 'A6·D2', pageKind: 'practice', block: 'tricky-words', icons: ['read'], label: 'Tricky words' });
        expect(pick('C3')).toEqual({ code: 'C3', pageKind: 'writing', block: 'dictation', icons: ['ear', 'pencil'], label: 'Dictation · day 3' });
        expect(pick('D4')).toEqual({ code: 'D4', pageKind: 'writing', block: 'write-it', icons: ['pencil'], label: 'Write it · day 4' });
        expect(byCode.get('E5')?.pageKind).toBe('check');
        expect(byCode.get('C7')).toMatchObject({ pageKind: 'book-map', icons: ['star'] });
        expect(byCode.get('A6·D2')!.steps).toEqual(['A6', 'D2']);
        for (const entry of mod.STORYTIME_STEP_MAP) for (const icon of entry.icons) expect(mod.STORYTIME_ICONS).toContain(icon);
        expect(mod.STORYTIME_ICONS).toEqual(['ear', 'mouth', 'read', 'pencil', 'circle', 'book', 'star']);
        expect(mod.STORYTIME_CHECK_ROW_TYPES['circle-picture']).toEqual({ icons: ['ear', 'circle'], label: 'Listen. Circle the picture.' });
        expect(mod.STORYTIME_CHECK_ROW_TYPES['circle-word']).toEqual({ icons: ['read', 'circle'], label: 'Circle the word.' });
        expect(mod.STORYTIME_CHECK_ROW_TYPES['write-letter']).toEqual({ icons: ['ear', 'pencil'], label: 'Listen. Write.' });
        expect(mod.STORYTIME_CHECK_ROW_TYPES['write-word']).toEqual({ icons: ['ear', 'pencil'], label: 'Listen. Write.' });
    });

    it('M-icons: each icon is a black line SVG with no color, no transparency, and no gradient, 10 to 12 mm wide', async () => {
        const icons = await import(iconsModule) as { iconSvg: (name: string, className?: string) => string };
        const mod = await import(stepMapModule) as StepModule;
        for (const name of mod.STORYTIME_ICONS) {
            const svg = icons.iconSvg(name);
            expect(svg, `${name} is an svg`).toMatch(/^<svg /);
            expect(svg).toContain(`data-icon="${name}"`);
            expect(svg).not.toMatch(/opacity|gradient|rgba|hsl|<image|<filter|<mask|style="[^"]*opacity/i);
            const colors = Array.from(svg.matchAll(/(?:fill|stroke)="([^"]+)"/g), (match) => match[1].toLowerCase());
            expect(colors.length, `${name} draws something`).toBeGreaterThan(0);
            for (const color of colors) expect(['#000', '#000000', 'none', '#fff', '#ffffff'], `${name} color ${color}`).toContain(color);
        }
        const { html } = await book();
        const style = new DOMParser().parseFromString(html, 'text/html').querySelector('style')!.textContent ?? '';
        const width = /width:\s*([\d.]+)mm/.exec(cssRule(style, '.step-icon'));
        expect(width, 'The .step-icon rule sets a width in mm.').not.toBeNull();
        expect(Number(width![1])).toBeGreaterThanOrEqual(10);
        expect(Number(width![1])).toBeLessThanOrEqual(12);
    }, 120_000);

    it('M-badge: the step badge is a grey box of 8 pt, and the new look uses only black, white, and grey (PRINT_GATE)', async () => {
        const { html, doc } = await book();
        const style = doc.querySelector('style')!.textContent ?? '';
        const badge = cssRule(style, '.step-badge');
        expect(badge).toMatch(/font-size:\s*8pt/);
        const background = /background(?:-color)?:\s*#([0-9a-f]{6}|[0-9a-f]{3})\b/i.exec(badge);
        expect(background, 'The badge has a grey background.').not.toBeNull();
        const hex = background![1].length === 3 ? background![1].split('').map((c) => c + c).join('') : background![1];
        expect(hex.slice(0, 2) === hex.slice(2, 4) && hex.slice(2, 4) === hex.slice(4, 6), 'The badge background is grey.').toBe(true);
        expect(html).not.toMatch(/opacity|gradient|rgba\(|hsla?\(/i);
        for (const color of html.matchAll(/#([0-9a-f]{6})\b/gi)) {
            expect(color[1].slice(0, 2) === color[1].slice(2, 4) && color[1].slice(2, 4) === color[1].slice(4, 6), `Color #${color[1]} is a grey.`).toBe(true);
        }
    });

    it('M-key: page 1 carries the icon key: 6 icons with their Thai words, and the day letters A to E', async () => {
        const { doc } = await book();
        const mod = await import(stepMapModule) as StepModule;
        const name = doc.querySelector('.student-page[data-page-kind="name"]')!;
        const key = onlyPart(name, 'icon-key');
        expect(Array.from(key.querySelectorAll('[data-part="key-icon"]'), (node) => node.getAttribute('data-icon')))
            .toEqual(['ear', 'mouth', 'read', 'pencil', 'circle', 'book']);
        expect(texts(key, '[data-part="key-thai"]')).toEqual(['ฟัง', 'พูด', 'อ่าน', 'เขียน', 'วงกลม', 'หนังสือเล่มเล็ก']);
        expect(texts(key, '[data-part="key-english"]')).toEqual(['Listen.', 'Say.', 'Read.', 'Write.', 'Circle.', 'Book.']);
        expect(mod.STORYTIME_ICON_KEY.map((entry) => entry.thai)).toEqual(['ฟัง', 'พูด', 'อ่าน', 'เขียน', 'วงกลม', 'หนังสือเล่มเล็ก']);
        expect(key.querySelectorAll('[data-part="key-icon"] svg, svg[data-part="key-icon"]').length).toBeGreaterThanOrEqual(6);
        const days = Array.from(key.querySelectorAll('[data-part="key-day"]'));
        expect(days.map((day) => day.getAttribute('data-day'))).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(days.map((day) => text(day).replace(/\s+/g, ' '))).toEqual(['A วันที่ 1', 'B วันที่ 2', 'C วันที่ 3', 'D วันที่ 4', 'E วันที่ 5']);
    });
});

describe.each([1, 2, 3, 4, 5, 6, 7])('A-48: the page templates of week %i', (weekNumber) => {
    it('P-sound: three framed step blocks, each with a badge and an icon; 6 formation cells; numbered lines; one card for each tricky word', async () => {
        const { doc } = await book();
        const week = weeks()[weekNumber - 1];
        const strokes = await import(strokesModule) as StrokeModule;
        const steps = await import(stepMapModule) as StepModule;
        const data = strokes.letterStrokeData(week.print!.letterBox.letter);
        const sound = weekPage(doc, 'practice', weekNumber);
        const list = blocks(sound);
        expect(list.map((block) => block.getAttribute('data-step'))).toEqual(['A3', 'A7', 'A6·D2']);
        // A decodable sound book is a listen-and-read book: the A7 head says "Listen and read" with ear and read (A-48 part F E2).
        const soundBookReader = week.books.find((book) => book.kind === 'decodable')?.soundBook === true;
        for (const block of list) {
            const entry = steps.STORYTIME_STEP_MAP.find((item) => item.code === block.getAttribute('data-step'))!;
            const a7Override = soundBookReader && entry.code === 'A7';
            expect(block.getAttribute('data-block')).toBe(entry.block);
            expect(text(onlyPart(block, 'step-badge'))).toBe(entry.code);
            expect(text(onlyPart(block, 'step-title'))).toBe(a7Override ? 'Listen and read' : entry.label);
            expect(headIcons(block)).toEqual(a7Override ? ['ear', 'read'] : entry.icons);
        }
        const box = onlyPart(list[0], 'letter-box');
        const cells = Array.from(box.querySelectorAll('[data-part="letter-cell"]'));
        expect(cells.map((cell) => cell.getAttribute('data-cell-kind'))).toEqual(['model', 'trace', 'trace', 'trace', 'dot-only', 'empty']);
        const model = cells[0];
        const arrows = Array.from(model.querySelectorAll('path[data-part="formation-arrow"]'));
        expect(arrows.map((arrow) => arrow.getAttribute('d'))).toEqual(data.strokes.map((stroke) => stroke.d));
        expect(texts(model, '[data-part="stroke-number"]')).toEqual(data.strokes.map((_stroke, index) => String(index + 1)));
        const modelDot = onlyPart(model, 'start-dot');
        expect([numAttr(modelDot, 'cx'), numAttr(modelDot, 'cy')]).toEqual([data.modelDot.x, data.modelDot.y]);
        expect(modelDot.getAttribute('data-start-point')).toBe(week.print!.letterBox.startPoint);
        expect(text(onlyPart(model, 'letter'))).toBe(week.print!.letterBox.letter);
        for (const cell of cells.slice(1, 4)) {
            expect(text(onlyPart(cell, 'trace-letter'))).toBe(week.print!.letterBox.letter);
            const dot = onlyPart(cell, 'trace-dot');
            expect([numAttr(dot, 'cx'), numAttr(dot, 'cy')]).toEqual([data.traceDot.x, data.traceDot.y]);
            expect(numAttr(dot, 'r')).toBeGreaterThan(0);
        }
        const dotOnly = cells[4];
        const onlyDot = onlyPart(dotOnly, 'dot-only-dot');
        expect([numAttr(onlyDot, 'cx'), numAttr(onlyDot, 'cy')]).toEqual([data.dotOnlyDot.x, data.dotOnlyDot.y]);
        expect(dotOnly.querySelector('[data-part="trace-letter"]'), 'The dot-only cell prints no grey letter.').toBeNull();
        const empty = cells[5];
        expect(empty.querySelector('circle, text, path'), 'The own-work cell is empty.').toBeNull();
        expect(onlyPart(empty, 'write-letter').hasAttribute('data-student-work')).toBe(true);
        expect(text(onlyPart(box, 'formation-words'))).toBe(week.print!.letterBox.formationWords);
        // A7: numbered practice lines, each with the full-width rule of fix 4.
        const lines = Array.from(list[1].querySelectorAll('.practice-line'));
        expect(texts(list[1], '[data-part="row-number"]')).toEqual(week.print!.practice.map((_line, index) => String(index + 1)));
        expect(lines).toHaveLength(week.print!.practice.length);
        for (const line of lines) expect(line.querySelectorAll('.practice-rule-line').length).toBeGreaterThanOrEqual(6);
        expect(texts(list[1], '[data-part="practice-text"]')).toEqual(week.print!.practice.map((line) => line.text));
        // A6 and D2: one boxed card for each tricky word of the week.
        expect(texts(list[2], '[data-part="tricky-card"]')).toEqual(week.focus.trickyWords);
        expect(week.focus.trickyWords.length).toBeGreaterThan(0);
    });

    it('P-write: two framed blocks, C3 with letter boxes, sound boxes, and the trace sentence, and D4 with the frame trace', async () => {
        const { doc } = await book();
        const week = weeks()[weekNumber - 1];
        const words = await import(wordsModule) as WordsModule;
        const steps = await import(stepMapModule) as StepModule;
        const page = weekPage(doc, 'writing', weekNumber);
        const list = blocks(page);
        expect(list.map((block) => block.getAttribute('data-step'))).toEqual(['C3', 'D4']);
        for (const block of list) {
            const entry = steps.STORYTIME_STEP_MAP.find((item) => item.code === block.getAttribute('data-step'))!;
            expect(text(onlyPart(block, 'step-badge'))).toBe(entry.code);
            expect(text(onlyPart(block, 'step-title'))).toBe(entry.label);
            expect(headIcons(block)).toEqual(entry.icons);
        }
        const style = doc.querySelector('style')!.textContent ?? '';
        expect(cssRule(style, '.step-block')).toMatch(/border:\s*[\d.]+mm solid #000/);
        // C3, row 1: an empty box for each dictated letter.
        const dictation = onlyPart(list[0], 'dictation');
        expect(texts(dictation, '[data-part="dictation-letter"]')).toEqual(week.print!.dictation.letters.map(() => ''));
        // C3, row 2: a word with only taught letters gets sound boxes ("Say. Write."); a word with a letter
        // that is not taught yet is a trace row ("Trace."). The word is never printed as plain text (E15).
        const taught = await import(taughtModule) as TaughtModule;
        const wordRows = Array.from(list[0].querySelectorAll('[data-dictation-kind]'));
        expect(wordRows).toHaveLength(week.print!.dictation.words.length);
        week.print!.dictation.words.forEach((word, index) => {
            const kind = taught.dictationRowKind(word, weekNumber);
            const row = wordRows[index];
            expect(row.getAttribute('data-dictation-kind')).toBe(kind === 'trace' ? 'trace' : 'sound');
            const icons = Array.from(row.querySelectorAll('[data-part="row-icon"]'), (icon) => icon.getAttribute('data-icon'));
            if (kind === 'sound-boxes') {
                expect(row.getAttribute('data-part')).toBe('sound-row');
                expect(text(row.querySelector('.row-label')!)).toBe('Say. Write.');
                expect(icons).toEqual(['mouth', 'pencil']);
                expect(row.querySelectorAll('[data-part="sound-box"]')).toHaveLength([...word].length);
                expect(texts(row, '[data-part="sound-box"]').join('')).toBe('');
                expect(row.querySelector('[data-part="dictation-word"], [data-part="trace-letter"], text'), 'The sound row prints no letter of the word.').toBeNull();
            } else {
                expect(row.getAttribute('data-part')).toBe('work-row');
                expect(text(row.querySelector('.row-label')!)).toBe('Trace.');
                expect(icons).toEqual(['pencil']);
                expect(row.querySelectorAll('[data-part="sound-box"]'), 'A trace row has no sound box.').toHaveLength(0);
                const trace = onlyPart(row, 'dictation-word-trace');
                for (const part of ['writing-trace', 'dictation-trace', 'dictation-word-trace']) {
                    expect(cssRule(style, `.student-page [data-part="${part}"] text`), `The ${part} text prints in trace gray (an SVG text is black without the rule).`).toMatch(/fill:\s*#b0b0b0/);
                }
                expect(text(trace)).toBe(word);
                const layout = words.traceLineLayout(word, words.TRACE_LINE.fontSizeMm);
                const placed = layout.words.filter((item) => item.dot);
                const dots = Array.from(trace.querySelectorAll('circle[data-part="trace-word-dot"]'));
                expect(dots).toHaveLength(placed.length);
                dots.forEach((dot, dotIndex) => {
                    expect(numAttr(dot, 'cx')).toBeCloseTo(words.TRACE_LINE.padMm + placed[dotIndex].x + placed[dotIndex].dot!.x, 1);
                    expect(numAttr(dot, 'cy')).toBeCloseTo(words.TRACE_LINE.baselineMm - placed[dotIndex].dot!.y, 1);
                });
            }
        });
        expect(list[0].querySelector('[data-part="dictation-word"]'), 'The dictated word is not printed (E15).').toBeNull();
        // C3, row 3 (weeks 2 to 7): the trace sentence in grey with a start dot on each word (E14).
        const sentence = week.print!.dictation.traceSentence;
        const traces = list[0].querySelectorAll('[data-part="dictation-trace"]');
        if (!sentence) expect(traces).toHaveLength(0);
        else {
            expect(traces).toHaveLength(1);
            expect(text(traces[0])).toBe(sentence);
            const layout = words.traceLineLayout(sentence, words.TRACE_LINE.fontSizeMm);
            const dots = Array.from(traces[0].querySelectorAll('circle[data-part="trace-word-dot"]'));
            expect(dots).toHaveLength(layout.words.filter((word) => word.dot).length);
            const placed = layout.words.filter((word) => word.dot);
            dots.forEach((dot, index) => {
                expect(numAttr(dot, 'cx')).toBeCloseTo(words.TRACE_LINE.padMm + placed[index].x + placed[index].dot!.x, 1);
                expect(numAttr(dot, 'cy')).toBeCloseTo(words.TRACE_LINE.baselineMm - placed[index].dot!.y, 1);
            });
        }
        // D4: the frame trace with a start dot on each word, the name or word line, and the draw box.
        const frame = onlyPart(list[1], 'writing-trace');
        expect(text(frame)).toBe(week.print!.writing.traceText);
        const frameLayout = words.traceLineLayout(week.print!.writing.traceText, words.TRACE_LINE.fontSizeMm);
        expect(frame.querySelectorAll('circle[data-part="trace-word-dot"]')).toHaveLength(frameLayout.words.filter((word) => word.dot).length);
        expect(onlyPart(list[1], `${week.print!.writing.line}-line`).hasAttribute('data-student-work')).toBe(true);
        const draw = week.print!.writing;
        // One draw box with no choice words; else two boxes in all, and the prompt picture counts as one of them (A-48 U2).
        expect(list[1].querySelectorAll('[data-part="writing-picture-box"]')).toHaveLength(draw.pictureBox ? (draw.choiceWords ? 2 - (draw.promptPicture ? 1 : 0) : 1) : 0);
        // The row numbers run through the page: C3 first, then D4.
        const numbers = texts(page, '[data-part="row-number"]');
        expect(numbers).toEqual(numbers.map((_value, index) => String(index + 1)));
        expect(numbers.length).toBeGreaterThanOrEqual(wordRows.length + 1 + 2 + (sentence ? 1 : 0));
    });

    it('P-check: numbered rows, an icon and one line for each row type, sound boxes for the word, no printed answer, and a score strip', async () => {
        const { doc } = await book();
        const week = weeks()[weekNumber - 1];
        const steps = await import(stepMapModule) as StepModule;
        const page = weekPage(doc, 'check', weekNumber);
        const items = week.check.items;
        const checkRows = week.print?.checkRows;
        const entry = steps.STORYTIME_STEP_MAP.find((item) => item.code === 'E5')!;
        expect(text(onlyPart(page, 'step-badge'))).toBe('E5');
        expect(entry.pageKind).toBe('check');
        const rows = Array.from(page.querySelectorAll('[data-part="check-item"]'));
        expect(rows).toHaveLength(items.length + (checkRows ? 2 : 0));
        expect(rows.map((row) => text(onlyPart(row, 'row-number'))))
            .toEqual(items.map((_item, index) => String(index + 1)).concat(checkRows ? [String(items.length + 1), String(items.length + 2)] : []));
        // One head (icons and one short line) before each run of rows of the same label.
        const expected: { label: string; icons: string[]; rows: number }[] = [];
        for (const item of items) {
            const type = steps.STORYTIME_CHECK_ROW_TYPES[item.kind];
            const last = expected.at(-1);
            if (last && last.label === type.label) last.rows += 1;
            else expected.push({ label: type.label, icons: type.icons, rows: 1 });
        }
        // The 2 teacher-marked rows after the items, each with its own head (A-48 part F G6/B14).
        if (checkRows) for (const kind of ['read-word', 'oral-blend'] as const) {
            const type = steps.STORYTIME_CHECK_ROW_TYPES[kind];
            expected.push({ label: type.label, icons: type.icons, rows: 1 });
        }
        const found: { label: string; icons: string[]; rows: number }[] = [];
        for (const node of Array.from(page.querySelectorAll('[data-part="row-group-head"], [data-part="check-item"]'))) {
            if (node.getAttribute('data-part') === 'row-group-head') {
                found.push({
                    label: text(node.querySelector('.check-cue')!),
                    icons: Array.from(node.querySelectorAll('[data-part="step-icon"]'), (icon) => icon.getAttribute('data-icon') ?? ''),
                    rows: 0,
                });
            } else found.at(-1)!.rows += 1;
        }
        expect(found).toEqual(expected);
        const letterBox = onlyPart(page, 'check-write-letter');
        expect(letterBox.closest('[data-part="check-item"]'), 'The write-letter box sits in a numbered row.').not.toBeNull();
        expect(letterBox.hasAttribute('data-student-work')).toBe(true);
        const wordItem = items.find((item) => item.kind === 'write-word');
        const wordBoxes = page.querySelectorAll('[data-part="check-write-word"]');
        if (!wordItem) expect(wordBoxes).toHaveLength(0);
        else {
            expect(wordBoxes).toHaveLength(1);
            expect(wordBoxes[0].querySelectorAll('[data-part="sound-box"]')).toHaveLength([...wordItem.word].length);
            expect(text(wordBoxes[0]), 'The write-word item prints no answer (E39).').toBe('');
            expect(wordBoxes[0].closest('[data-part="check-item"]')).not.toBeNull();
        }
        expect(text(onlyPart(page, 'score-strip'))).toMatch(new RegExp(`/ ${items.length + (checkRows ? 2 : 0)}$`));
        expect(page.querySelectorAll('[data-answer], [data-correct], .answer, .correct').length).toBe(0);
    });

    it('P-chrome: the week header and the page number sit on the sound, write, and check pages', async () => {
        const { doc } = await book();
        for (const kind of ['practice', 'writing', 'check']) {
            const page = weekPage(doc, kind, weekNumber);
            expect(text(onlyPart(page, 'week-label'))).toBe(`Week ${weekNumber} · สัปดาห์ที่ ${weekNumber}`);
            expect(onlyPart(page, 'week-label').querySelector('[lang="th"], .th-run'), 'The Thai part of the header is a Thai run.').not.toBeNull();
            expect(text(onlyPart(page, 'page-number'))).toBe(page.getAttribute('data-page-number'));
            const number = Number(page.getAttribute('data-page-number'));
            expect(number).toBeGreaterThanOrEqual(4);
            expect(number).toBeLessThanOrEqual(135);
        }
    });
});

describe('A-48: the page chrome and the shared look', () => {
    it('C-pages: the page number is at the bottom right; the reader leaves carry no page number and no week header', async () => {
        const { doc } = await book();
        const style = doc.querySelector('style')!.textContent ?? '';
        const rule = cssRule(style, '.page-number');
        expect(rule).toMatch(/position:\s*absolute/);
        expect(rule).toMatch(/right:\s*[\d.]+mm/);
        expect(rule).toMatch(/bottom:\s*[\d.]+mm/);
        expect(doc.querySelectorAll('.student-page[data-page-kind="reader"] [data-part="page-number"], .student-page[data-page-kind="reader"] [data-part="week-label"]')).toHaveLength(0);
        const marked = Array.from(doc.querySelectorAll('.student-page')).filter((page) => page.querySelector('[data-part="page-number"]'));
        // The week 8 pages (the 2 benchmark pages and the 5 reviews) carry a number and a week header too (A-48 U4).
        expect(marked.map((page) => page.getAttribute('data-page-kind'))).toEqual([
            ...Array.from({ length: 7 }, () => ['practice', 'writing', 'check', 'home-front', 'home-back']).flat(),
            'benchmark', 'benchmark', 'review', 'review', 'review', 'review', 'review',
        ]);
        for (const page of marked) expect(text(onlyPart(page, 'page-number'))).toBe(page.getAttribute('data-page-number'));
    });

    it('C-hostile: a hostile trace text and a hostile dictation word add no element and print only as text', async () => {
        const hostile = 'H"><img/src=x/onerror=alert(1)> I<script>alert(2)</script> a&';
        const { compileStorytimeStudentBook } = await import(studentModule) as {
            compileStorytimeStudentBook: (w: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' }) => { html: string };
        };
        const changed = weeks().slice(0, 1).map((week) => {
            const copy = JSON.parse(JSON.stringify(week)) as StorytimeWeek;
            copy.print!.writing.traceText = hostile;
            return StorytimeWeekSchema.parse(copy);
        });
        const dirty = new DOMParser().parseFromString(compileStorytimeStudentBook(changed, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html, 'text/html');
        const clean = new DOMParser().parseFromString(compileStorytimeStudentBook(weeks().slice(0, 1), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html, 'text/html');
        expect(dirty.querySelectorAll('*').length).toBe(clean.querySelectorAll('*').length);
        expect(dirty.querySelectorAll('script, img').length).toBe(0);
        expect(text(onlyPart(dirty, 'writing-trace'))).toBe(hostile);
    });
});

describe('A-48: the dictated word rule (C3 row 2)', () => {
    it('T-rule: a word of taught letters gets sound boxes, a word with an untaught letter is a trace row', async () => {
        expect(fs.existsSync(taughtModule), 'Missing module: lib/storytime/print/taught-letters.ts').toBe(true);
        const mod = await import(taughtModule) as TaughtModule;
        expect(mod.STORYTIME_LETTER_ORDER).toEqual(['n', 'a', 'p', 'm', 's', 't', 'o']);
        expect(mod.taughtLetters(1)).toEqual(['n']);
        expect(mod.taughtLetters(2)).toEqual(['n', 'a']);
        expect(mod.taughtLetters(7)).toEqual(['n', 'a', 'p', 'm', 's', 't', 'o']);
        expect(mod.taughtLetters(8), 'A week after the last letter week has every letter.').toEqual(['n', 'a', 'p', 'm', 's', 't', 'o']);
        const cases: [string, number, 'sound-boxes' | 'trace'][] = [
            ['a', 1, 'trace'], ['an', 1, 'trace'], ['n', 1, 'sound-boxes'], ['an', 2, 'sound-boxes'], ['pan', 2, 'trace'], ['pan', 3, 'sound-boxes'],
            ['map', 3, 'trace'], ['map', 4, 'sound-boxes'], ['Sam', 4, 'trace'], ['Sam', 5, 'sound-boxes'], ['mat', 5, 'trace'], ['mat', 6, 'sound-boxes'],
            ['top', 6, 'trace'], ['top', 7, 'sound-boxes'], ['can', 7, 'trace'],
        ];
        for (const [word, week, kind] of cases) expect(mod.dictationRowKind(word, week), `${word} in week ${week}`).toBe(kind);
    });

    it('T-weeks: the order table equals the letter of each week, and the C3 script of each week matches the rule', async () => {
        const mod = await import(taughtModule) as TaughtModule;
        const all = weeks().slice(0, 7);
        expect(all.map((week) => week.print!.letterBox.letter)).toEqual([...mod.STORYTIME_LETTER_ORDER]);
        const kinds = all.map((week) => week.print!.dictation.words.map((word) => mod.dictationRowKind(word, week.meta.week)));
        expect(kinds, 'Week 1 traces the tricky word a; weeks 2 to 7 dictate a word of taught letters.').toEqual([
            ['trace'], ['sound-boxes'], ['sound-boxes'], ['sound-boxes'], ['sound-boxes'], ['sound-boxes'], ['sound-boxes'],
        ]);
        for (const week of all) {
            const c3 = JSON.stringify(findStep(week, 'C3')).replace(/\\"/g, '"');
            for (const word of week.print!.dictation.words) {
                const kind = mod.dictationRowKind(word, week.meta.week);
                if (kind === 'trace') expect(c3, `The C3 script of week ${week.meta.week} traces "${word}".`).toMatch(new RegExp(`trace the (tricky )?word[^"]{0,6}${word}`, 'i'));
                else expect(c3, `The C3 script of week ${week.meta.week} writes "${word}" in boxes.`).toMatch(new RegExp(`Say "${word}"[^"]*boxes`));
            }
        }
    });
});

/** The C3 step of a week, from the scripts. */
function findStep(week: StorytimeWeek, id: string): unknown {
    let found: unknown;
    const walk = (value: unknown): void => {
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') {
            if ((value as { id?: string }).id === id && !found) found = value;
            Object.values(value).forEach(walk);
        }
    };
    walk(week.scripts);
    if (!found) throw new Error(`no step ${id} in week ${week.meta.week}`);
    return found;
}

describe('A-48: week 1 data (E17, E18)', () => {
    it('D-w01: the practice line "and" moves to the tricky-word row, and line 2 shows the nest and the net', async () => {
        const week = weeks()[0];
        expect(week.print!.practice.map((line) => line.text)).toEqual(['n n n', 'A nest. A net.']);
        expect(week.print!.practice[1]).toMatchObject({ pictureWord: 'nest', extraPictureWords: ['net'] });
        expect(week.focus.trickyWords).toContain('and');
        const { doc } = await book();
        const sound = weekPage(doc, 'practice', 1);
        const lines = Array.from(sound.querySelectorAll('.practice-line'));
        expect(lines).toHaveLength(2);
        expect(Array.from(lines[1].querySelectorAll('[data-picture-id]'), (node) => node.getAttribute('data-picture-id')))
            .toEqual(['l2-w01-practice-line-nest', 'l2-w01-check-row-net']);
        expect(Array.from(sound.querySelectorAll('[data-picture-id]'), (node) => node.getAttribute('data-picture-id')))
            .toEqual(['l2-w01-practice-line-nose', 'l2-w01-practice-line-nest', 'l2-w01-check-row-net']);
        expect(texts(sound, '[data-part="tricky-card"]')).toEqual(['a', 'and', 'can']);
    });

    it('D-checks: the text check accepts the A7 word "and" in the tricky-word row, and still fails a word that neither holds', async () => {
        const { checkStorytimePrintText } = await import(textCheckModule) as {
            checkStorytimePrintText: (week: StorytimeWeek) => { id: string; status: string }[];
        };
        const week = weeks()[0];
        const result = checkStorytimePrintText(week);
        expect(result.filter((item) => item.status === 'fail')).toEqual([]);
        expect(result.find((item) => item.id === 'print-practice')?.status).toBe('pass');
        const copy = JSON.parse(JSON.stringify(week)) as StorytimeWeek;
        copy.focus.trickyWords = copy.focus.trickyWords.filter((word) => word !== 'and');
        expect(checkStorytimePrintText(StorytimeWeekSchema.parse(copy)).find((item) => item.id === 'print-practice')?.status,
            'Mutant: "and" in neither the practice lines nor the tricky-word row.').toBe('fail');
    });

    it('D-extra: an extra picture word that is not a word of its line fails the text check', async () => {
        const { checkStorytimePrintText } = await import(textCheckModule) as {
            checkStorytimePrintText: (week: StorytimeWeek) => { id: string; status: string }[];
        };
        const week = weeks()[0];
        expect(checkStorytimePrintText(week).find((item) => item.id === 'print-picture-word')?.status).toBe('pass');
        const copy = JSON.parse(JSON.stringify(week)) as StorytimeWeek;
        copy.print!.practice[1].extraPictureWords = ['dog'];
        expect(checkStorytimePrintText(StorytimeWeekSchema.parse(copy)).find((item) => item.id === 'print-picture-word')?.status,
            'Mutant: the extra picture "dog" for the line "A nest. A net.".').toBe('fail');
    });
});

// ---- the Chrome parity test ----

/** Proves that the run goes through the heavy-run wrapper (the existing student-book tests do the same). */
function requireHeavyWrapper(): void {
    let pid = process.pid;
    let found = false;
    for (let hop = 0; pid > 1 && hop < 64; hop++) {
        const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
        if (command.some((arg) => arg.endsWith('/heavy-run.sh'))) found = true;
        const parent = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^PPid:\s+(\d+)/m);
        pid = Number(parent?.[1] ?? 0);
    }
    expect(found, 'Run Chrome and Ghostscript only through heavy-run.sh.').toBe(true);
}

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-step-system-');
    temporaryFolders.push(folder);
    return folder;
}

afterAll(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

/** Builds a PDF/X file from HTML through the real Chrome and make-pdfx path. */
function buildPdfx(html: string): string {
    requireHeavyWrapper();
    const folder = temporaryFolder();
    const htmlFile = path.join(folder, 'parity.html');
    const chromeFile = path.join(folder, 'parity.pdf');
    const pdfxFile = path.join(folder, 'parity-pdfx.pdf');
    fs.writeFileSync(htmlFile, html);
    const script = `
        import fs from 'node:fs';
        import { execFileSync } from 'node:child_process';
        import { chromium } from '@playwright/test';
        import { renderPagedPdf } from ${JSON.stringify(path.join(dashboardRoot, 'lib/print/render.ts'))};
        const browser = await chromium.launch({ channel: 'chrome', timeout: 15000 });
        try {
            await renderPagedPdf(browser, ${JSON.stringify(htmlFile)}, ${JSON.stringify(chromeFile)},
                fs.readFileSync('node_modules/pagedjs/dist/paged.polyfill.js', 'utf8'));
        } finally { await browser.close(); }
        execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts',
            ${JSON.stringify(chromeFile)}, '--out', ${JSON.stringify(pdfxFile)}, '--keep-fonts', '--k-only'],
            { stdio: 'inherit', timeout: 45000 });
    `;
    execFileSync('timeout', ['--signal=TERM', '--kill-after=3s', '180s', process.execPath,
        '--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: dashboardRoot, encoding: 'utf8', timeout: 185000, maxBuffer: 8 * 1024 * 1024,
    });
    expect(fs.existsSync(pdfxFile), 'The real PDF/X output must exist.').toBe(true);
    return pdfxFile;
}

async function rasterPage(file: string, pageNumber: number): Promise<{ width: number; height: number; data: Buffer }> {
    const prefix = path.join(temporaryFolder(), `raster-p${pageNumber}`);
    execFileSync('pdftoppm', ['-f', String(pageNumber), '-l', String(pageNumber), '-singlefile', '-r', '300', '-png', file, prefix], { encoding: 'utf8', timeout: 60000 });
    const { default: sharp } = await import('sharp');
    const raster = await sharp(`${prefix}.png`).greyscale().raw().toBuffer({ resolveWithObject: true });
    return { width: raster.info.width, height: raster.info.height, data: raster.data };
}

/** The ink bounding box of a page raster, in millimeters. */
function inkBox(raster: { width: number; height: number; data: Buffer }): { left: number; right: number; top: number; bottom: number } {
    const px = 300 / 25.4;
    let left = raster.width, right = -1, top = raster.height, bottom = -1;
    for (let y = 0; y < raster.height; y++) for (let x = 0; x < raster.width; x++) {
        if (raster.data[y * raster.width + x] < 230) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    }
    return { left: left / px, right: (right + 1) / px, top: top / px, bottom: (bottom + 1) / px };
}

describe('A-48: Chrome draws the letters and the trace words where the vector model says', () => {
    it('X-parity: the grey model letters and the trace lines match the Andika outline within 0.5 mm', async () => {
        const { doc } = await book();
        const strokes = await import(strokesModule) as StrokeModule;
        const words = await import(wordsModule) as WordsModule;
        const style = doc.querySelector('style')!.textContent ?? '';
        const pagesHtml: string[] = [];
        const predicted: { left: number; right: number; top: number; bottom: number }[] = [];
        const { LETTER_BOX: box, LETTER_CELL_MM: cell } = strokes;
        const mm = cell.width / box.width;
        for (let w = 1; w <= 7; w++) {
            const model = weekPage(doc, 'practice', w).querySelector('svg.letter-model')!;
            const letter = model.querySelector('[data-part="letter"]')!;
            pagesHtml.push(`<section class="student-page"><svg class="letter-model" viewBox="0 0 ${box.width} ${box.height}" xmlns="http://www.w3.org/2000/svg">${letter.outerHTML}</svg></section>`);
            const glyph = placeGlyph(font, text(letter), { fontSize: box.fontSize, x: box.centerX, baseline: box.baseline });
            const pts = glyph.contours.flat();
            predicted.push({
                left: 14 + Math.min(...pts.map((p) => p.x)) * mm, right: 14 + Math.max(...pts.map((p) => p.x)) * mm,
                top: 14 + Math.min(...pts.map((p) => p.y)) * mm, bottom: 14 + Math.max(...pts.map((p) => p.y)) * mm,
            });
        }
        const traceTexts = [weeks()[0].print!.writing.traceText, weeks()[6].print!.dictation.traceSentence!];
        const { TRACE_LINE: line } = words;
        traceTexts.forEach((traceText, index) => {
            const week = index === 0 ? 1 : 7;
            const selector = index === 0 ? '[data-part="writing-trace"]' : '[data-part="dictation-trace"]';
            const svg = weekPage(doc, 'writing', week).querySelector(`${selector} svg`)!.cloneNode(true) as Element;
            svg.querySelectorAll('[data-part="trace-word-dot"]').forEach((dot) => dot.remove());
            pagesHtml.push(`<section class="student-page">${svg.outerHTML}</section>`);
            const layout = words.traceLineLayout(traceText, line.fontSizeMm);
            let left = Infinity, right = -Infinity;
            for (const word of layout.words) {
                let x = word.x;
                for (const ch of word.text) {
                    const outline = font.glyph(ch);
                    const scale = line.fontSizeMm / font.unitsPerEm;
                    for (const p of outline.contours.flat()) { left = Math.min(left, x + p.x * scale); right = Math.max(right, x + p.x * scale); }
                    x += outline.advance * scale;
                }
            }
            predicted.push({ left: 14 + line.padMm + left, right: 14 + line.padMm + right, top: 0, bottom: 0 });
        });
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>a48 parity</title><style>${style}</style></head><body>${pagesHtml.join('\n')}</body></html>`;
        const file = buildPdfx(html);
        for (let index = 0; index < predicted.length; index++) {
            const measured = inkBox(await rasterPage(file, index + 1));
            const label = index < 7 ? `letter ${LETTERS[index][0]}` : `trace line ${index - 6}`;
            expect(Math.abs(measured.left - predicted[index].left), `${label}: left edge`).toBeLessThanOrEqual(0.5);
            expect(Math.abs(measured.right - predicted[index].right), `${label}: right edge`).toBeLessThanOrEqual(0.5);
            if (index < 7) {
                expect(Math.abs(measured.top - predicted[index].top), `${label}: top edge`).toBeLessThanOrEqual(0.5);
                expect(Math.abs(measured.bottom - predicted[index].bottom), `${label}: bottom edge`).toBeLessThanOrEqual(0.5);
            }
        }
    }, 250000);
    it('X-rule: the baseline of a trace word lies on its rule line in the PDF (A-48 F1, within 0.5 mm)', async () => {
        const { doc } = await book();
        const style = doc.querySelector('style')!.textContent ?? '';
        const span = weekPage(doc, 'writing', 7).querySelector('[data-part="writing-trace"]')!.cloneNode(true) as Element;
        span.querySelectorAll('[data-part="trace-word-dot"]').forEach((dot) => dot.remove());
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>a48 rule</title><style>${style}</style></head><body><section class="student-page"><div class="work-row">${span.outerHTML}</div></section></body></html>`;
        const file = buildPdfx(html);
        const raster = await rasterPage(file, 1);
        const px = 300 / 25.4;
        const fromX = Math.round(110 * px), toX = Math.round(180 * px);
        let ruleTop = -1;
        for (let y = 0; y < raster.height && ruleTop < 0; y++) {
            let dark = 0;
            for (let x = fromX; x < toX; x++) if (raster.data[y * raster.width + x] < 60) dark++;
            if (dark / (toX - fromX) > 0.9) ruleTop = y;
        }
        expect(ruleTop, 'The rule line prints.').toBeGreaterThan(0);
        let inkBottom = -1;
        for (let y = ruleTop - 1; y >= 0 && inkBottom < 0; y--) {
            for (let x = Math.round(14 * px); x < Math.round(100 * px); x++) {
                const value = raster.data[y * raster.width + x];
                if (value > 120 && value < 215) { inkBottom = y; break; }
            }
        }
        expect(inkBottom, 'The grey trace word prints above the rule line.').toBeGreaterThan(0);
        const gapMm = (ruleTop - (inkBottom + 1)) / px;
        expect(Math.abs(gapMm), `The grey word ends ${gapMm.toFixed(2)} mm above the rule line.`).toBeLessThanOrEqual(0.5);
    }, 250000);
    it('X-fit: the 2 benchmark pages and the 5 review pages of week 8 print on 7 pages, and the circle words carry no drawn oval (A-48 U4)', async () => {
        const { doc } = await book();
        const style = doc.querySelector('style')!.textContent ?? '';
        expect(cssRule(style, '.picture-sort'), 'The sound rows stack, so no flex row.').not.toMatch(/display:\s*flex/);
        expect(cssRule(style, '.circle-word'), 'A drawn oval looks like a circled answer.').not.toMatch(/border/);
        const sections = Array.from(doc.querySelectorAll('.student-page[data-page-kind="benchmark"], .student-page[data-page-kind="review"]')).map((section) => section.outerHTML);
        expect(sections).toHaveLength(7);
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>a48 fit</title><style>${style}</style></head><body>${sections.join('\n')}</body></html>`;
        const file = buildPdfx(html);
        const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
        expect(Number(/Pages:\s+(\d+)/.exec(info)![1]), 'Each week 8 page fits on one page.').toBe(7);
    }, 250000);
    it('X-fit-write: each of the 7 write pages prints on one page (A-48 F4)', async () => {
        const { doc } = await book();
        const style = doc.querySelector('style')!.textContent ?? '';
        const sections = Array.from(doc.querySelectorAll('.student-page[data-page-kind="writing"]')).map((section) => section.outerHTML);
        expect(sections).toHaveLength(7);
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>a48 write fit</title><style>${style}</style></head><body>${sections.join('\n')}</body></html>`;
        const info = execFileSync('pdfinfo', [buildPdfx(html)], { encoding: 'utf8' });
        expect(Number(/Pages:\s+(\d+)/.exec(info)![1]), 'Each write page fits on one page.').toBe(7);
    }, 250000);
});

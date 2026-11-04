// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { STORYTIME_ROOT, storytimeQrUrl, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { LETTER_BOX, LETTER_CELL_MM, LETTER_STROKES } from '../lib/storytime/print/letter-strokes';
import { ANDIKA_ADVANCE_EM, TRACE_START_EM } from '../lib/storytime/print/trace-words';
import { generateQRCode } from '../lib/qr-generator';
import { samplePath, type OutlinePoint } from './fixtures/storytime-glyph-outline';

/**
 * A-48 step 2, part 3a: three audit checks that the PM asked for.
 * C1 and C3: the stroke table of each letter follows the formation words of its week (the stroke
 * count, the order, and the direction of each stroke).
 * C4: every start dot of a letter in the built book sits at one place on the letter.
 * I1: the QR check script decodes a QR code from an image (the pure part).
 * The tests read the shipped week files and compile the book in proof mode.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const qrModule = path.join(dashboardRoot, 'lib/storytime/print/qr-check.ts');

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

// ---------------------------------------------------------------------------------------------
// C1 and C3: the stroke table follows the formation words
// ---------------------------------------------------------------------------------------------

type Pt = OutlinePoint;
/** The kinds of stroke that the formation words of the seven letters use. */
type Kind = 'stem-down' | 'stem-below' | 'hill' | 'round-left-up' | 'up-round-right' | 'round-left-then-right' | 'down-hook' | 'across' | 'round-left-closed';

/** What the formation words of each letter say, as the strokes in writing order. */
const STROKE_PLAN: Record<string, Kind[]> = {
    n: ['stem-down', 'hill'],
    a: ['round-left-up', 'stem-down'],
    p: ['stem-below', 'up-round-right'],
    m: ['stem-down', 'hill', 'hill'],
    s: ['round-left-then-right'],
    t: ['down-hook', 'across'],
    o: ['round-left-closed'],
};

/** The phrases of the formation words, in order, that stand behind each plan (lower case). */
const WORD_PHRASES: Record<string, string[]> = {
    n: ['start at the dot.', 'down.', 'up.', 'over the hill.', 'down.'],
    a: ['start at the dot.', 'round to the left.', 'up to the top.', 'down.'],
    p: ['start at the dot.', 'down, down, below the line.', 'back up to the top.', 'round to the right, and back to the stick.'],
    m: ['start at the dot.', 'down.', 'up, over the hill, down.', 'up, over the hill, down.'],
    s: ['start at the dot.', 'round to the left.', 'then round to the right.'],
    t: ['start at the dot.', 'down, with a little curve at the bottom.', 'then a short line across.'],
    o: ['start at the dot.', 'round to the left, all the way round, and back to the dot.'],
};

/** The 100 × 120 box line of the letters: the baseline, and the top of the x-height letters. */
const BASELINE = LETTER_BOX.baseline;
const X_TOP = 33;
const UNIT_MM = LETTER_CELL_MM.width / LETTER_BOX.width;

const last = <T,>(items: T[]): T => items[items.length - 1];
/** Every `step`-th point, with the first and the last point kept. */
const thin = (points: Pt[], step: number): Pt[] => points.filter((_p, index) => index % step === 0 || index === points.length - 1);
/**
 * The signed turning of a path in degrees. In the SVG frame (y down) a negative value is a turn to
 * the left (counter-clockwise on the page: "round to the left"); a positive value is a turn to the right.
 */
function turning(points: Pt[], from = 0, to = points.length - 1): number {
    const p = thin(points.slice(from, to + 1), 4);
    let total = 0;
    for (let i = 2; i < p.length; i++) {
        const ax = p[i - 1].x - p[i - 2].x, ay = p[i - 1].y - p[i - 2].y, bx = p[i].x - p[i - 1].x, by = p[i].y - p[i - 1].y;
        if (!ax && !ay || !bx && !by) continue;
        total += Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    }
    return (total * 180) / Math.PI;
}
const monotoneDown = (points: Pt[], slack = 0.6): boolean => points.every((p, i) => i === 0 || p.y >= points[i - 1].y - slack);

/** The problems of one stroke against its kind. `previous` is the stroke before it, if any. */
function kindProblems(kind: Kind, p: Pt[], previous: Pt[] | undefined): string[] {
    const problems: string[] = [];
    const start = p[0], end = last(p);
    const top = Math.min(...p.map((q) => q.y));
    const need = (ok: boolean, message: string): void => { if (!ok) problems.push(`${kind}: ${message}`); };
    switch (kind) {
        case 'stem-down':
        case 'stem-below':
            need(end.y - start.y >= 40, 'goes down at least 40 units');
            need(Math.abs(end.x - start.x) <= 2, 'stays on one line');
            need(monotoneDown(p), 'never goes up');
            need(start.y <= 40, 'starts at the top of the letter');
            if (kind === 'stem-down') need(Math.abs(end.y - BASELINE) <= 6, 'stops on the line');
            else need(end.y >= BASELINE + 12, 'goes below the line');
            break;
        case 'hill': {
            const peak = p.reduce((best, q) => (q.y < best.y ? q : best), p[0]);
            const peakAt = p.indexOf(peak);
            need(!!previous && Math.abs(start.x - last(previous).x) <= 1.5, 'starts on the stem before it');
            need(start.y - top >= 8, 'starts below the top of the letter');
            need(peakAt > 0 && peakAt < p.length - 1, 'rises first, then falls');
            need(Math.abs(peak.y - X_TOP) <= 4, 'the top of the hill is the top of the letter');
            need(peak.x > start.x + 10 && end.x - start.x >= 25, 'goes to the right');
            need(end.y - peak.y >= 35 && Math.abs(end.y - BASELINE) <= 8, 'ends going down to the line');
            need(monotoneDown(p.slice(peakAt + 8)), 'the last part goes down');
            need(turning(p) >= 90, 'turns to the right over the hill');
            break;
        }
        case 'round-left-up': {
            const xs = p.map((q) => q.x);
            const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
            need(start.y <= 40 && start.x > centerX, 'starts at the top right');
            need(p.slice(0, 40).every((q) => q.x <= start.x + 0.5) && p[20].x < start.x, 'first goes to the left');
            need(turning(p) <= -270, 'turns to the left, all the way round');
            need(p[p.length - 6].y > end.y, 'ends going up');
            need(Math.hypot(end.x - start.x, end.y - start.y) * UNIT_MM <= 1.5, 'comes back to the top, near the start');
            break;
        }
        case 'up-round-right': {
            const peak = p.reduce((best, q) => (q.y < best.y ? q : best), p[0]);
            need(!!previous && Math.abs(start.x - previous[0].x) <= 1.5, 'starts on the stick');
            need(start.y - peak.y >= 8 && p.indexOf(peak) > 0, 'goes up first');
            need(Math.abs(peak.y - X_TOP) <= 4, 'goes up to the top');
            need(turning(p) >= 200, 'turns to the right');
            need(!!previous && Math.abs(end.x - previous[0].x) <= 2 && end.y >= 70, 'comes back to the stick');
            break;
        }
        case 'round-left-then-right': {
            const q = thin(p, 8);
            const local = q.slice(2).map((_c, i) => {
                const a = q[i], b = q[i + 1], c = q[i + 2];
                return Math.atan2((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x), (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y)) * 180 / Math.PI;
            });
            const signs: number[] = [];
            for (let i = 0; i < local.length; i++) {
                const window = local.slice(Math.max(0, i - 2), i + 3).reduce((sum, v) => sum + v, 0);
                if (Math.abs(window) < 8) continue;
                const sign = Math.sign(window);
                if (signs[signs.length - 1] !== sign) signs.push(sign);
            }
            need(start.y <= 40 && end.y >= 70, 'goes from the top to the bottom');
            need(signs.length === 2 && signs[0] === -1 && signs[1] === 1, `turns to the left first, then to the right (signs ${signs.join(',')})`);
            need(turning(p) <= 0 || turning(p, 0, Math.floor(p.length / 2)) <= -90, 'the first half turns to the left');
            need(turning(p, Math.floor(p.length / 2)) >= 90, 'the second half turns to the right');
            break;
        }
        case 'down-hook': {
            const body = p.slice(0, Math.floor(p.length * 0.6));
            need(start.y <= 22, 'starts above the letter');
            need(monotoneDown(body) && Math.abs(last(body).x - start.x) <= 1.5, 'the first part goes straight down');
            need(end.y - start.y >= 55, 'goes down at least 55 units');
            need(end.x - start.x >= 10 && end.x > p[Math.floor(p.length * 0.85)].x, 'curves to the right at the bottom');
            break;
        }
        case 'across':
            need(Math.abs(end.y - start.y) <= 0.5, 'is level');
            need(end.x - start.x >= 20 && end.x - start.x <= 45, 'is short and goes from left to right');
            need(Math.abs(start.y - X_TOP) <= 3, 'sits on the top of the letter');
            need(!!previous && start.x < previous[0].x && end.x > previous[0].x, 'crosses the stem');
            break;
        case 'round-left-closed':
            need(start.y <= 40, 'starts at the top');
            need(p[12].x < start.x, 'first goes to the left');
            need(turning(p) <= -300, 'turns to the left, nearly all the way round');
            need(Math.hypot(end.x - start.x, end.y - start.y) * UNIT_MM <= 4, 'comes back to the dot');
            break;
    }
    return problems;
}

/** The problems of a letter: its words, its stroke count, and each stroke in order. `strokes` are point lists. */
function letterProblems(letter: string, words: string, strokes: Pt[][]): string[] {
    const problems: string[] = [];
    const lower = words.toLowerCase();
    let at = 0;
    for (const phrase of WORD_PHRASES[letter]) {
        const found = lower.indexOf(phrase, at);
        if (found < 0) problems.push(`the words of "${letter}" no longer say "${phrase}" in this order: ${words}`);
        else at = found + phrase.length;
    }
    const plan = STROKE_PLAN[letter];
    if (strokes.length !== plan.length) return [...problems, `${strokes.length} strokes, the words say ${plan.length}`];
    plan.forEach((kind, index) => {
        for (const problem of kindProblems(kind, strokes[index], strokes[index - 1])) problems.push(`stroke ${index + 1}: ${problem}`);
    });
    return problems;
}

const strokePoints = (letter: string): Pt[][] => LETTER_STROKES[letter].strokes.map((stroke) => samplePath(stroke.d, 0.5));
const LETTER_WEEKS: [string, number][] = [['n', 1], ['a', 2], ['p', 3], ['m', 4], ['s', 5], ['t', 6], ['o', 7]];

describe('A-48 part 3a, C1 and C3: the strokes follow the formation words', () => {
    it.each(LETTER_WEEKS)('S-words-%s: the table of the letter follows the formation words of week %i (count, order, direction)', (letter, weekNumber) => {
        const week = weeks()[weekNumber - 1];
        expect(week.print!.letterBox.letter).toBe(letter);
        expect(letterProblems(letter, week.print!.letterBox.formationWords, strokePoints(letter))).toEqual([]);
    });

    it('S-words-mutants: a reversed stroke and two swapped strokes each fail, for every letter', () => {
        for (const [letter, weekNumber] of LETTER_WEEKS) {
            const words = weeks()[weekNumber - 1].print!.letterBox.formationWords;
            const strokes = strokePoints(letter);
            strokes.forEach((_stroke, index) => {
                const reversed = strokes.map((stroke, i) => (i === index ? [...stroke].reverse() : stroke));
                expect(letterProblems(letter, words, reversed), `Mutant: stroke ${index + 1} of "${letter}" reversed.`).not.toEqual([]);
            });
            for (let a = 0; a < strokes.length; a++) for (let b = a + 1; b < strokes.length; b++) {
                const swapped = strokes.map((stroke, i) => (i === a ? strokes[b] : i === b ? strokes[a] : stroke));
                expect(letterProblems(letter, words, swapped), `Mutant: strokes ${a + 1} and ${b + 1} of "${letter}" swapped.`).not.toEqual([]);
            }
            expect(letterProblems(letter, words, strokes.slice(0, -1)), `Mutant: a stroke of "${letter}" missing.`).not.toEqual([]);
            expect(letterProblems(letter, words.replace(/Start at the dot\./, 'Start at the top.'), strokes), `Mutant: the words of "${letter}" change.`).not.toEqual([]);
        }
    });
});

// ---------------------------------------------------------------------------------------------
// C4: the start dots of a letter across all weeks
// ---------------------------------------------------------------------------------------------

/** One start dot found in the book. */
interface FoundDot { week: number; letter: string; cell: string; em: Pt; fontMm: number }

/** Where a dot sits on its letter, in em from the left end of the advance (y up from the baseline). */
function emOnLetter(cx: number, cy: number, originX: number, baselineY: number, fontSize: number): Pt {
    return { x: (cx - originX) / fontSize, y: (baselineY - cy) / fontSize };
}

/** Every start dot of the book: the letter box cells and the trace words (C3, D4, the choice words). */
function collectDots(doc: Document): FoundDot[] {
    const all = weeks();
    const found: FoundDot[] = [];
    for (const dot of Array.from(doc.querySelectorAll('[data-part="start-dot"], [data-part="trace-dot"], [data-part="dot-only-dot"]'))) {
        const week = Number(dot.closest('.student-page')!.getAttribute('data-week'));
        const letter = all[week - 1].print!.letterBox.letter;
        const { centerX, baseline, fontSize } = LETTER_BOX;
        const originX = centerX - (ANDIKA_ADVANCE_EM[letter] * fontSize) / 2;
        found.push({
            week, letter, cell: dot.getAttribute('data-part')!, fontMm: fontSize * UNIT_MM,
            em: emOnLetter(Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy')), originX, baseline, fontSize),
        });
    }
    for (const svg of Array.from(doc.querySelectorAll('svg.trace-line'))) {
        const week = Number(svg.closest('.student-page')!.getAttribute('data-week'));
        const words = Array.from(svg.querySelectorAll('text')).filter((t) => /^\p{L}/u.test(t.textContent ?? ''));
        const dots = Array.from(svg.querySelectorAll('[data-part="trace-word-dot"]'));
        if (words.length !== dots.length) throw new Error(`week ${week}: ${words.length} words that start with a letter, ${dots.length} dots`);
        words.forEach((word, i) => {
            const size = Number(word.getAttribute('font-size'));
            found.push({
                week, letter: word.textContent![0], cell: 'trace-word-dot', fontMm: size,
                em: emOnLetter(Number(dots[i].getAttribute('cx')), Number(dots[i].getAttribute('cy')), Number(word.getAttribute('x')), Number(word.getAttribute('y')), size),
            });
        });
    }
    return found;
}

/** The em place of the start of stroke 1 of a letter, from the table; absent for a letter with no stroke data. */
function strokeStartEm(letter: string): Pt | undefined {
    const data = LETTER_STROKES[letter];
    if (!data) return undefined;
    const start = samplePath(data.strokes[0].d, 0.5)[0];
    const { centerX, baseline, fontSize } = LETTER_BOX;
    return emOnLetter(start.x, start.y, centerX - (ANDIKA_ADVANCE_EM[letter] * fontSize) / 2, baseline, fontSize);
}

/** The tolerance of C4 in millimeters at the printed size of the cell of the dot. */
const DOT_TOLERANCE_MM = 0.3;

/** The problems of a dot list: a dot more than 0.3 mm from its letter's place, or from the start of stroke 1. */
function dotProblems(dots: FoundDot[]): string[] {
    const problems: string[] = [];
    const byLetter = new Map<string, FoundDot[]>();
    for (const dot of dots) byLetter.set(dot.letter, [...(byLetter.get(dot.letter) ?? []), dot]);
    for (const [letter, list] of byLetter) {
        const reference = strokeStartEm(letter) ?? TRACE_START_EM[letter] ?? list[0].em;
        for (const dot of list) {
            const mm = Math.hypot(dot.em.x - reference.x, dot.em.y - reference.y) * dot.fontMm;
            if (mm > DOT_TOLERANCE_MM) problems.push(`"${letter}" ${dot.cell} in week ${dot.week} sits ${mm.toFixed(2)} mm from the start of stroke 1`);
        }
    }
    return problems;
}

describe('A-48 part 3a, C4: the start dots of a letter sit at one place in the whole book', () => {
    it('D-all: every dot of every letter, in every week and cell kind, is on the start of stroke 1 within 0.3 mm', async () => {
        const dots = collectDots((await book()).doc);
        const box = dots.filter((dot) => dot.cell !== 'trace-word-dot');
        expect(box, 'Each of the 7 teaching weeks has a model dot, 3 trace dots, and a dot-only dot.').toHaveLength(7 * 5);
        expect(dots.filter((dot) => dot.cell === 'trace-word-dot').length, 'The trace rows of C3 and D4 and the choice words have dots.').toBeGreaterThanOrEqual(60);
        for (const [letter] of LETTER_WEEKS) expect(strokeStartEm(letter), `The stroke table has the letter ${letter}.`).toBeDefined();
        expect(dotProblems(dots)).toEqual([]);
        for (const dot of dots) {
            if (dot.cell === 'trace-word-dot' || !strokeStartEm(dot.letter)) continue;
            expect(Math.abs(dot.em.x - strokeStartEm(dot.letter)!.x) * dot.fontMm, `${dot.cell} week ${dot.week} x`).toBeLessThan(0.05);
        }
    });

    it('D-letters: the trace words of the same first letter share one place, in all weeks', async () => {
        const dots = collectDots((await book()).doc).filter((dot) => dot.cell === 'trace-word-dot');
        const letters = new Set(dots.map((dot) => dot.letter));
        expect(letters.size, 'The book has trace words of many letters.').toBeGreaterThanOrEqual(10);
        for (const letter of letters) {
            const list = dots.filter((dot) => dot.letter === letter);
            const xs = list.map((dot) => dot.em.x), ys = list.map((dot) => dot.em.y);
            const spread = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 7.76;
            expect(spread, `Letter "${letter}" (${list.length} dots)`).toBeLessThanOrEqual(DOT_TOLERANCE_MM);
        }
    });

    it('D-mutants: a dot moved in one week only, in one kind of cell, fails the check', async () => {
        const doc = new DOMParser().parseFromString((await book()).html, 'text/html');
        const kinds: [string, string, string, number][] = [
            ['trace-dot', '3', 'cx', 2], ['start-dot', '5', 'cx', 2], ['dot-only-dot', '2', 'cx', 2], ['trace-word-dot', '4', 'cx', 0.4],
            ['trace-dot', '4', 'cy', 1.5], ['trace-word-dot', '7', 'cy', -0.4],
        ];
        expect(dotProblems(collectDots(doc)), 'The unchanged book is clean.').toEqual([]);
        for (const [part, weekNumber, attribute, shift] of kinds) {
            const dot = doc.querySelector(`.student-page[data-week="${weekNumber}"] [data-part="${part}"]`)!;
            expect(dot, `${part} in week ${weekNumber}`).not.toBeNull();
            const before = dot.getAttribute(attribute)!;
            dot.setAttribute(attribute, String(Number(before) + shift));
            expect(dotProblems(collectDots(doc)), `Mutant: ${part} of week ${weekNumber} moved on ${attribute}.`).not.toEqual([]);
            dot.setAttribute(attribute, before);
        }
        expect(dotProblems(collectDots(doc)), 'The book is clean again after the mutants.').toEqual([]);
    }, 30_000);
});

// ---------------------------------------------------------------------------------------------
// I1: the QR check (the pure part)
// ---------------------------------------------------------------------------------------------

interface QrModule {
    qrSvgToPng: (svg: string, pixels?: number) => Promise<Buffer>;
    decodeQrCodes: (png: Buffer, minimum?: number) => Promise<{ data: string }[]>;
    expectedStudentBookQrs: (weeks: StorytimeWeek[], pages: { page: number; kind: string; week?: number; readerQrs?: number }[]) => { page: number; week: number; address: string }[];
    compareQrs: (expected: { page: number; address: string }[], found: { page: number; data: string }[]) => { page: number; address: string; expected: string; status: 'pass' | 'fail'; note: string }[];
}

const loadQr = async (): Promise<QrModule> => {
    expect(fs.existsSync(qrModule), 'Missing module: lib/storytime/print/qr-check.ts').toBe(true);
    return await import(qrModule) as QrModule;
};
const SONG = storytimeQrUrl('/th/st/2/1?part=song');
const BOOK = storytimeQrUrl('/th/st/2/1?part=book');

describe('A-48 part 3a, I1: a QR code decodes from an image', () => {
    it('Q-roundtrip: a QR SVG from the code turns into a PNG that decodes to its input', async () => {
        const qr = await loadQr();
        const png = await qr.qrSvgToPng(generateQRCode(SONG)!);
        expect((await qr.decodeQrCodes(png)).map((code) => code.data)).toEqual([SONG]);
        expect((await qr.decodeQrCodes(await qr.qrSvgToPng(generateQRCode(BOOK)!, 300))).map((code) => code.data)).toEqual([BOOK]);
    });

    it('Q-mutant: one changed character gives another result and fails the comparison', async () => {
        const qr = await loadQr();
        const changed = SONG.replace('part=song', 'part=sone');
        const decoded = await qr.decodeQrCodes(await qr.qrSvgToPng(generateQRCode(changed)!));
        expect(decoded.map((code) => code.data)).toEqual([changed]);
        expect(decoded[0].data).not.toBe(SONG);
        expect(qr.compareQrs([{ page: 7, address: SONG }], [{ page: 7, data: decoded[0].data }])[0].status).toBe('fail');
    });

    it('Q-two: two codes on one page both decode, and an image with no code decodes to nothing', async () => {
        const qr = await loadQr();
        const one = await qr.qrSvgToPng(generateQRCode(SONG)!, 400);
        const two = await qr.qrSvgToPng(generateQRCode(BOOK)!, 400);
        const page = await sharp({ create: { width: 1400, height: 600, channels: 3, background: '#fff' } })
            .composite([{ input: one, left: 100, top: 100 }, { input: two, left: 800, top: 100 }]).png().toBuffer();
        expect((await qr.decodeQrCodes(page, 2)).map((code) => code.data).sort()).toEqual([BOOK, SONG].sort());
        const blank = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#fff' } }).png().toBuffer();
        expect(await qr.decodeQrCodes(blank)).toEqual([]);
    });

    it('Q-compare: a missing code, a wrong address, and an unexpected code each fail; a match passes', async () => {
        const qr = await loadQr();
        const expected = [{ page: 7, address: SONG }, { page: 7, address: BOOK }];
        const pass = qr.compareQrs(expected, [{ page: 7, data: BOOK }, { page: 7, data: SONG }]);
        expect(pass.map((row) => row.status)).toEqual(['pass', 'pass']);
        expect(qr.compareQrs(expected, [{ page: 7, data: SONG }]).map((row) => row.status), 'a missing code').toContain('fail');
        expect(qr.compareQrs(expected, [{ page: 7, data: SONG }, { page: 7, data: BOOK.replace('book', 'boot') }]).filter((row) => row.status === 'fail').length, 'a wrong address').toBeGreaterThanOrEqual(1);
        expect(qr.compareQrs(expected, [{ page: 7, data: SONG }, { page: 7, data: BOOK }, { page: 9, data: SONG }]).some((row) => row.status === 'fail' && row.page === 9), 'an unexpected code').toBe(true);
        expect(qr.compareQrs(expected, [{ page: 8, data: SONG }, { page: 8, data: BOOK }]).every((row) => row.status === 'fail'), 'the right codes on the wrong page').toBe(true);
    });

    it('Q-expected: the expected codes are the song and book codes of each home card and the code of each reader, on the pages that print them', async () => {
        const qr = await loadQr();
        const { html } = await book();
        const { storytimeStudentBookPages } = await import(path.join(dashboardRoot, 'lib/storytime/print/step-pages.ts')) as {
            storytimeStudentBookPages: (w: StorytimeWeek[]) => { page: number; kind: string; week?: number; readerQrs?: number }[];
        };
        const all = weeks();
        const pages = storytimeStudentBookPages(all);
        const expected = qr.expectedStudentBookQrs(all, pages);
        const fronts = pages.filter((p) => p.kind === 'home-front');
        expect(fronts.length).toBeGreaterThanOrEqual(7);
        const homeCodes = fronts.reduce((sum, p) => sum + (all[p.week! - 1].home?.songUrl ? 1 : 0) + (all[p.week! - 1].home?.readAlongUrl ? 1 : 0), 0);
        expect(expected.length, 'the home codes plus one code for each reader').toBe(homeCodes + all.reduce((sum, week) => sum + week.books.length, 0));
        for (const week of all.slice(0, 7)) {
            const home = expected.filter((row) => row.week === week.meta.week && pages.find((p) => p.page === row.page)!.kind === 'home-front').map((row) => row.address);
            expect(home).toEqual([storytimeQrUrl(week.home!.songUrl!), storytimeQrUrl(week.home!.readAlongUrl!)]);
            const readers = expected.filter((row) => row.week === week.meta.week && pages.find((p) => p.page === row.page)!.kind === 'reader').map((row) => row.address);
            expect(readers.sort(), `Week ${week.meta.week} readers`).toEqual(week.books.map((b) => storytimeQrUrl(`/th/st/2/${week.meta.week}?part=${b.kind === 'decodable' ? 'decodable' : 'book'}`)).sort());
        }
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const printed = Array.from(doc.querySelectorAll('[data-qr-input]'), (el) => ({ page: Number(el.closest('.student-page')!.getAttribute('data-page-number')), address: el.getAttribute('data-qr-input')! }));
        expect(printed.map((row) => row.page), 'the pages of the printed codes').toEqual(expected.map((row) => row.page));
        expect(printed.map((row) => row.address).sort(), 'the printed addresses equal the expected addresses').toEqual(expected.map((row) => row.address).sort());
        expect(() => qr.expectedStudentBookQrs(all, pages.map((p) => ({ ...p, readerQrs: undefined })))).toThrow(/reader QR codes/);
    });
});

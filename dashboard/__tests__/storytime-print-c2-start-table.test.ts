// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { LETTER_BOX, LETTER_STROKES } from '../lib/storytime/print/letter-strokes';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { ANDIKA_ADVANCE_EM, TRACE_START_EM, traceLineLayout } from '../lib/storytime/print/trace-words';

/**
 * Phase 9, P9-B Red run 1: the C2 start table (spec addendum "Addendum 2026-11-14 (2): C2, F3, the
 * week 8 review pages, and the cast sheet", decisions P9-B2 to P9-B5; plan task "Red, C2, F3, and
 * the review pages").
 *
 * The table `TRACE_START_EM` holds 18 lowercase letters and 6 uppercase letters today. Eight
 * lowercase letters have no value, and three lowercase values (c, d, g) and the value of S are old.
 * Every case fails now inside its body with a label that names the missing letter or the old value.
 * The case C2-taught passes today, because the 7 taught letters keep their values.
 *
 * Names and values that the spec leaves open are fixed here, so that Green does not guess. Each is
 * marked PIN:
 *  - PIN the six case names: C2-keys, C2-taught, C2-ink, C2-book, C2-all-letters, C2-mutants.
 *  - PIN the 32 values of the table are the 26 lowercase values and the 6 uppercase values of the
 *    table of P9-B3, written by hand below in `EXPECTED_START_EM`. The unit is em: x from the left
 *    end of the advance, y up from the baseline. A shipped value agrees when it lies within 0.001 em
 *    of its pinned value.
 *  - PIN the keys of `TRACE_START_EM` are exactly the 26 lowercase letters a to z and the 6
 *    uppercase letters G, H, I, P, S, T. No other key is allowed.
 *  - PIN the ink measure: Andika regular renders at 1000 px per em, a pixel below 128 is ink, and
 *    the inset of a point is the distance to the nearest white pixel in em. One child process
 *    renders the glyphs (P9-B5, Q9-7). The minimum inset is 0.02 em.
 *  - PIN the trace line geometry: the font size is 7.76 mm per em, the left pad is 1.5 mm, and the
 *    baseline sits 8 mm from the top of the line.
 *  - PIN C2-book asserts absolute positions. The six positive cases are "saw" on page 77 and "car",
 *    "kite", "drum", "can", and "see" on page 113 of the compiled student book of weeks 1 to 7.
 *    Their absolute dot positions are pinned below in `BOOK_CASES` from the values of P9-B3.
 *  - PIN the rule of decision D-P9B-R1 (orchestrator, 2026-11-14): the expected position of each of
 *    the six words is the word origin in the compiled book plus the P9-B3 value of its first letter.
 *    P9-B3 replaces the measured x of spec fact 2 for every letter whose value changes (c, d, g, S).
 *    Fact 2 measured the r6-v1 dots, so its value for a changed letter is the old, faulty place.
 *    For a letter with no change this rule equals the fact-2 position within 0.3 mm; the case checks
 *    that for "saw" and "see" (s), the two cases whose letter does not change.
 *  - PIN the decision D-P9B-G1 (orchestrator, Red retry R1, 2026-11-14): the case C2-ink renders the
 *    32 glyphs in one child process and takes 4.4 to 5.0 s, so the default 5000 ms timeout stopped it
 *    twice with correct values; the case carries a 60000 ms timeout (the third argument of `it`).
 *
 * Every expected value below is a value of the spec, written by hand. The test never reads an
 * expected value from the code under the test. The file holds no Thai string, names no track
 * folder, and writes no file outside the temporary folder of the operating system.
 */

/** One point in em: x from the left end of the advance, y up from the baseline. */
interface Point {
    x: number;
    y: number;
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const UPPER = ['G', 'H', 'I', 'P', 'S', 'T'];
const TABLE_KEYS = [...LOWER, ...UPPER];

/** PIN the 32 values of the table of P9-B3, written by hand (em). */
const EXPECTED_START_EM: Readonly<Record<string, Point>> = {
    a: { x: 0.4217, y: 0.4409 },
    b: { x: 0.1165, y: 0.7445 },
    c: { x: 0.4, y: 0.445 },
    d: { x: 0.442, y: 0.441 },
    e: { x: 0.0992, y: 0.2545 },
    f: { x: 0.2922, y: 0.7545 },
    g: { x: 0.42, y: 0.441 },
    h: { x: 0.1164, y: 0.7445 },
    i: { x: 0.137, y: 0.4182 },
    j: { x: 0.151, y: 0.4182 },
    k: { x: 0.1163, y: 0.7445 },
    l: { x: 0.134, y: 0.7445 },
    m: { x: 0.1309, y: 0.4609 },
    n: { x: 0.1216, y: 0.4609 },
    o: { x: 0.2783, y: 0.4691 },
    p: { x: 0.122, y: 0.4609 },
    q: { x: 0.417, y: 0.441 },
    r: { x: 0.1214, y: 0.4609 },
    s: { x: 0.3801, y: 0.4536 },
    t: { x: 0.167, y: 0.6073 },
    u: { x: 0.1175, y: 0.44 },
    v: { x: 0.085, y: 0.44 },
    w: { x: 0.0835, y: 0.44 },
    x: { x: 0.13, y: 0.44 },
    y: { x: 0.0679, y: 0.4609 },
    z: { x: 0.11, y: 0.455 },
    G: { x: 0.574, y: 0.6318 },
    H: { x: 0.1315, y: 0.6764 },
    I: { x: 0.2326, y: 0.6764 },
    P: { x: 0.1327, y: 0.6782 },
    S: { x: 0.425, y: 0.66 },
    T: { x: 0.3029, y: 0.6764 },
};

/** The 7 letters that the letter box teaches, with the week of each. */
const TAUGHT: readonly (readonly [string, number])[] = [
    ['n', 1], ['a', 2], ['p', 3], ['m', 4], ['s', 5], ['t', 6], ['o', 7],
];

/**
 * PIN the measured x of spec fact 2, in em from the word start, for the two cases whose first
 * letter does not change (s): the rule of D-P9B-R1 must equal these values within 0.3 mm.
 */
const FACT_2_X_EM: Readonly<Record<string, number>> = { saw: 0.383, see: 0.383 };

const FONT_MM = 7.76;
const PAD_MM = 1.5;
const BASELINE_MM = 8;
const DOT_TOLERANCE_MM = 0.3;
const VALUE_TOLERANCE_EM = 0.001;
const INK_MIN_EM = 0.02;
const MIN_INK_PIXELS = 500;

/** The dot the book must print for a word: the page, the word, the text x, and the absolute dot position in mm. */
interface BookCase {
    page: number;
    word: string;
    x: number;
    cx: number;
    cy: number;
}

/** PIN the absolute dot positions of the six positive cases of P9-B5, from the values of P9-B3. */
const BOOK_CASES: readonly BookCase[] = [
    { page: 77, word: 'saw', x: 18.778, cx: 21.7276, cy: 4.4801 },
    { page: 113, word: 'car', x: 1.5, cx: 4.604, cy: 4.5468 },
    { page: 113, word: 'kite', x: 1.5, cx: 2.4025, cy: 2.2227 },
    { page: 113, word: 'drum', x: 1.5, cx: 4.9299, cy: 4.5778 },
    { page: 113, word: 'can', x: 19.082, cx: 22.186, cy: 4.5468 },
    { page: 113, word: 'see', x: 33.878, cx: 36.8276, cy: 4.4801 },
];

/** One trace dot found in the compiled book. */
interface BookDot extends BookCase {
    week: number;
}

interface InkMeasurement {
    inset: number;
    inkPixels: number;
}

interface InkJob {
    id: string;
    letter: string;
    x: number;
    y: number;
}

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const fontFolder = path.join(dashboardRoot, 'assets', 'print-fonts');
const andikaFile = path.join(fontFolder, 'andika-regular.ttf');
const sharpEntry = path.join(dashboardRoot, 'node_modules', 'sharp', 'dist', 'index.mjs');

const temporaryFolders: string[] = [];
afterAll(() => {
    for (const folder of temporaryFolders) fs.rmSync(folder, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------------------------
// The book
// ---------------------------------------------------------------------------------------------

function week(n: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')));
}

/** Every trace dot of the compiled student book of weeks 1 to 7. */
function bookDots(): BookDot[] {
    const html = compileStorytimeStudentBook([1, 2, 3, 4, 5, 6, 7].map(week), {
        profile: STORYTIME_PRINT_PROFILE,
        mode: 'final',
    }).html;
    const dots: BookDot[] = [];
    for (const page of html.split(/(?=<section class="student-page")/)) {
        const pageNumber = page.match(/data-page-number="([\d]+)"/)?.[1];
        if (!pageNumber) continue;
        const weekNumber = page.match(/data-week="([\d]+)"/)?.[1];
        for (const svg of page.match(/<svg class="trace-line"[\s\S]*?<\/svg>/g) ?? []) {
            const words = Array.from(svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" font-size="([\d.]+)">([^<]*)<\/text>/g))
                .filter((match) => /^\p{L}/u.test(match[4]));
            const circles = Array.from(svg.matchAll(/<circle data-part="trace-word-dot" cx="([\d.]+)" cy="([\d.]+)"/g));
            if (words.length !== circles.length) throw new Error(`page ${pageNumber}: ${words.length} words that start with a letter, ${circles.length} dots`);
            words.forEach((word, index) => {
                dots.push({
                    page: Number(pageNumber),
                    week: weekNumber === undefined ? 0 : Number(weekNumber),
                    word: word[4],
                    x: Number(word[1]),
                    cx: Number(circles[index][1]),
                    cy: Number(circles[index][2]),
                });
            });
        }
    }
    return dots;
}

// ---------------------------------------------------------------------------------------------
// The checks, as functions over a table, so that a mutant can run the same check
// ---------------------------------------------------------------------------------------------

/** The problems of a table's keys: a missing letter, or a key outside the 32 letters. */
function keyProblems(table: Readonly<Record<string, unknown>>): string[] {
    const problems: string[] = [];
    for (const letter of TABLE_KEYS) if (!(letter in table)) problems.push(`the table has no value for "${letter}"`);
    for (const key of Object.keys(table).sort()) {
        if (!TABLE_KEYS.includes(key)) problems.push(`the table holds "${key}", which is not a lowercase letter or one of G, H, I, P, S, T`);
    }
    return problems;
}

/** The problems of a table's values: a value more than 0.001 em from the pinned value of P9-B3. */
function valueProblems(table: Readonly<Record<string, Point>>): string[] {
    const problems: string[] = [];
    for (const letter of TABLE_KEYS) {
        const value = table[letter];
        if (!value) continue;
        const pinned = EXPECTED_START_EM[letter];
        const em = Math.hypot(value.x - pinned.x, value.y - pinned.y);
        if (em > VALUE_TOLERANCE_EM) {
            problems.push(`the value of "${letter}" is ${value.x}, ${value.y}; the table of P9-B3 says ${pinned.x}, ${pinned.y}`);
        }
    }
    return problems;
}

/** The problems of the 7 taught letters: the start of stroke 1 of the letter box and the table differ by more than 0.3 mm. */
function taughtProblems(table: Readonly<Record<string, Point>>): string[] {
    const problems: string[] = [];
    for (const [letter] of TAUGHT) {
        const data = LETTER_STROKES[letter];
        if (!data) {
            problems.push(`the stroke table has no data for the taught letter "${letter}"`);
            continue;
        }
        const start = /^M\s*([\d.]+)[ ,]([\d.]+)/.exec(data.strokes[0]?.d ?? '');
        if (!start) {
            problems.push(`the first stroke of "${letter}" has no start point`);
            continue;
        }
        const originX = LETTER_BOX.centerX - (ANDIKA_ADVANCE_EM[letter] * LETTER_BOX.fontSize) / 2;
        const emX = (Number(start[1]) - originX) / LETTER_BOX.fontSize;
        const emY = (LETTER_BOX.baseline - Number(start[2])) / LETTER_BOX.fontSize;
        const value = table[letter];
        if (!value) {
            problems.push(`the table has no value for the taught letter "${letter}"`);
            continue;
        }
        const mm = Math.hypot(emX - value.x, emY - value.y) * FONT_MM;
        if (mm > DOT_TOLERANCE_MM) {
            problems.push(`"${letter}" starts at ${emX.toFixed(4)}, ${emY.toFixed(4)} in the letter box and the table says ${value.x}, ${value.y}: ${mm.toFixed(2)} mm`);
        }
    }
    return problems;
}

/** The problem of one measured value against the ink rule; absent when the value is on the ink. */
function inkProblem(letter: string, measured: InkMeasurement | undefined): string | undefined {
    if (!measured) return `the table has no value for "${letter}", so the ink check does not run`;
    if (measured.inkPixels < MIN_INK_PIXELS) return `the glyph "${letter}" rendered ${measured.inkPixels} ink pixels, so the Andika font did not render`;
    if (measured.inset < INK_MIN_EM) {
        return `the start of "${letter}" sits ${measured.inset.toFixed(4)} em inside the ink, less than ${INK_MIN_EM} em`;
    }
    return undefined;
}

/** The problems of a dot list: a dot more than 0.3 mm from the pinned start, or from its absolute case position. */
function bookProblems(dots: readonly BookDot[]): string[] {
    const problems: string[] = [];
    if (dots.length < 60) problems.push(`the compiled book of weeks 1 to 7 has ${dots.length} trace dots; the batch measured at least 60`);
    for (const dot of dots) {
        const pinned = EXPECTED_START_EM[dot.word[0]];
        if (dot.x < PAD_MM) {
            problems.push(`the word "${dot.word}" (page ${dot.page}) starts at ${dot.x} mm, left of the ${PAD_MM} mm pad`);
            continue;
        }
        if (!pinned) {
            problems.push(`the first letter of "${dot.word}" (page ${dot.page}) has no value in the 32 values of the spec`);
            continue;
        }
        const mm = Math.hypot(dot.cx - (dot.x + pinned.x * FONT_MM), dot.cy - (BASELINE_MM - pinned.y * FONT_MM));
        if (mm > DOT_TOLERANCE_MM) {
            problems.push(`the dot of "${dot.word}" (page ${dot.page}) sits ${mm.toFixed(2)} mm from the spec start of "${dot.word[0]}"`);
        }
    }
    for (const pin of BOOK_CASES) {
        const found = dots.filter((dot) => dot.page === pin.page && dot.word === pin.word);
        if (found.length !== 1) {
            problems.push(`page ${pin.page} has ${found.length} trace dots of "${pin.word}"; the spec names one`);
            continue;
        }
        const mm = Math.hypot(found[0].cx - pin.cx, found[0].cy - pin.cy);
        if (mm > DOT_TOLERANCE_MM) {
            problems.push(`the dot of "${pin.word}" (page ${pin.page}) sits at ${found[0].cx}, ${found[0].cy}; the spec position is ${pin.cx}, ${pin.cy} (${mm.toFixed(2)} mm)`);
        }
    }
    for (const [word, em] of Object.entries(FACT_2_X_EM)) {
        const pin = BOOK_CASES.find((entry) => entry.word === word);
        if (!pin) {
            problems.push(`the pinned cases have no "${word}", so the rule of D-P9B-R1 cannot be checked for it`);
            continue;
        }
        const pinnedMm = Math.abs(pin.cx - pin.x - em * FONT_MM);
        if (pinnedMm > DOT_TOLERANCE_MM) {
            problems.push(`the pinned position of "${word}" is ${pinnedMm.toFixed(2)} mm from the x of spec fact 2 (${em} em); the letter of "${word}" does not change, so the rule of D-P9B-R1 must agree`);
        }
        const found = dots.filter((dot) => dot.word === word);
        if (found.length === 0) {
            problems.push(`the book has no trace dot of "${word}", so the rule of D-P9B-R1 cannot be checked`);
            continue;
        }
        for (const dot of found) {
            const mm = Math.abs(dot.cx - dot.x - em * FONT_MM);
            if (mm > DOT_TOLERANCE_MM) {
                problems.push(`the dot of "${word}" (page ${dot.page}) sits ${mm.toFixed(2)} mm from the x of spec fact 2 (${em} em), and its letter does not change`);
            }
        }
    }
    return problems;
}

// ---------------------------------------------------------------------------------------------
// The ink measure in a child process (P9-B5, Q9-7)
// ---------------------------------------------------------------------------------------------

/** The child process: it renders one glyph per job and prints the inset and the ink pixel count of each. */
const INK_PROBE_SOURCE = `import fs from 'node:fs';

const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const sharpModule = await import(process.argv[3]);
const sharp = sharpModule.default ?? sharpModule;

const PX = 1000;
const SIZE = 1400;
const ORIGIN_X = 300;
const BASELINE = 1100;
const RADIUS = 120;

function inset(data, width, px, py) {
    let best = Infinity;
    const x0 = Math.max(0, Math.floor(px) - RADIUS);
    const x1 = Math.min(width - 1, Math.ceil(px) + RADIUS);
    const y0 = Math.max(0, Math.floor(py) - RADIUS);
    const y1 = Math.min(data.length / width - 1, Math.ceil(py) + RADIUS);
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (data[y * width + x] >= 128) {
                const distance = Math.hypot(x - px, y - py);
                if (distance < best) best = distance;
            }
        }
    }
    return best / PX;
}

const results = {};
for (const job of jobs) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + SIZE + '" height="' + SIZE + '">' +
        '<rect width="' + SIZE + '" height="' + SIZE + '" fill="white"/>' +
        '<text x="' + ORIGIN_X + '" y="' + BASELINE + '" font-family="Andika" font-size="' + PX + '" fill="black">' + job.letter + '</text>' +
        '</svg>';
    const image = await sharp(Buffer.from(svg)).grayscale().raw().toBuffer({ resolveWithObject: true });
    const data = image.data;
    const width = image.info.width;
    let inkPixels = 0;
    for (let i = 0; i < data.length; i++) if (data[i] < 128) inkPixels++;
    results[job.id] = { inset: inset(data, width, ORIGIN_X + job.x * PX, BASELINE - job.y * PX), inkPixels };
}
process.stdout.write(JSON.stringify(results));
`;

/** Renders the jobs through one child process and gives the inset and the ink pixel count of each job. */
function measureInk(jobs: readonly InkJob[]): Map<string, InkMeasurement> {
    if (!fs.existsSync(andikaFile)) throw new Error(`missing font file ${andikaFile}`);
    if (!fs.existsSync(sharpEntry)) throw new Error(`missing sharp module ${sharpEntry}`);
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-c2-ink-'));
    temporaryFolders.push(folder);
    const conf = path.join(folder, 'fonts.conf');
    fs.writeFileSync(conf, [
        '<?xml version="1.0"?>',
        '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">',
        '<fontconfig>',
        `  <dir>${fontFolder}</dir>`,
        `  <cachedir>${path.join(folder, 'cache')}</cachedir>`,
        '</fontconfig>',
        '',
    ].join('\n'));
    const jobsFile = path.join(folder, 'jobs.json');
    fs.writeFileSync(jobsFile, JSON.stringify(jobs));
    const probe = path.join(folder, 'ink-probe.mjs');
    fs.writeFileSync(probe, INK_PROBE_SOURCE);
    const stdout = execFileSync(process.execPath, [probe, jobsFile, pathToFileURL(sharpEntry).href], {
        encoding: 'utf8',
        env: { ...process.env, FONTCONFIG_FILE: conf },
        timeout: 600_000,
    });
    const parsed = JSON.parse(stdout) as Record<string, InkMeasurement>;
    return new Map(Object.entries(parsed));
}

/** The jobs of a table: one job for each letter that the table holds. */
function tableJobs(table: Readonly<Record<string, Point>>): InkJob[] {
    return Object.entries(table).map(([letter, point]) => ({ id: letter, letter, x: point.x, y: point.y }));
}

/** A copy of the 32 values with one letter removed. */
function withoutLetter(letter: string): Record<string, Point> {
    const copy: Record<string, Point> = { ...EXPECTED_START_EM };
    delete copy[letter];
    return copy;
}

// ---------------------------------------------------------------------------------------------
// C2-keys
// ---------------------------------------------------------------------------------------------

describe('C2: the start table of the trace words (P9-B2 to P9-B5)', () => {
    it('C2-keys: the table holds exactly the 26 lowercase letters a to z and the 6 uppercase letters G, H, I, P, S, T', () => {
        expect(keyProblems(TRACE_START_EM).length, keyProblems(TRACE_START_EM).join('\n') || 'the keys of TRACE_START_EM are complete').toBe(0);
        expect(Object.keys(TRACE_START_EM).sort().join(''), 'the key list of TRACE_START_EM').toBe([...TABLE_KEYS].sort().join(''));
    });

    // -----------------------------------------------------------------------------------------
    // C2-taught: it passes today, because the 7 taught letters keep their values
    // -----------------------------------------------------------------------------------------

    it('C2-taught: the 7 taught letters agree with the start of stroke 1 of the letter box within 0.3 mm', () => {
        for (const [letter, weekNumber] of TAUGHT) {
            expect(week(weekNumber).print?.letterBox.letter, `the letter of week ${weekNumber}`).toBe(letter);
        }
        expect(taughtProblems(TRACE_START_EM), 'the 7 taught letters').toEqual([]);
    });

    // -----------------------------------------------------------------------------------------
    // C2-ink
    // -----------------------------------------------------------------------------------------

    it('C2-ink: each of the 32 values equals the pinned value of P9-B3 and sits 0.02 em or more inside the Andika glyph', () => {
        const shipped: Record<string, Point> = {};
        for (const letter of TABLE_KEYS) {
            const value = TRACE_START_EM[letter];
            if (value) shipped[letter] = { x: value.x, y: value.y };
        }
        const measured = measureInk(tableJobs(shipped));
        const problems = valueProblems(TRACE_START_EM);
        for (const letter of TABLE_KEYS) {
            const problem = inkProblem(letter, measured.get(letter));
            if (problem) problems.push(problem);
        }
        expect(problems.length, problems.join('\n') || 'the values of TRACE_START_EM and their ink inset are complete').toBe(0);
    }, 60000);

    // -----------------------------------------------------------------------------------------
    // C2-book
    // -----------------------------------------------------------------------------------------

    it('C2-book: every trace dot of weeks 1 to 7 sits at the absolute spec position within 0.3 mm', () => {
        expect(bookProblems(bookDots()).length, bookProblems(bookDots()).join('\n') || 'the trace dots of the compiled student book are on the spec positions').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // C2-all-letters
    // -----------------------------------------------------------------------------------------

    it('C2-all-letters: traceLineLayout gives a dot for each of the 26 lowercase letters and throws for a letter outside the table', () => {
        const problems: string[] = [];
        for (const letter of LOWER) {
            const pinned = EXPECTED_START_EM[letter];
            let layout: { words: { text: string; dot?: Point }[] };
            try {
                layout = traceLineLayout(letter, FONT_MM);
            } catch (error) {
                problems.push(`traceLineLayout throws for "${letter}": ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            const dot = layout.words[0]?.dot;
            if (!dot) {
                problems.push(`the word "${letter}" has no start dot`);
                continue;
            }
            const mm = Math.hypot(dot.x / FONT_MM - pinned.x, dot.y / FONT_MM - pinned.y) * FONT_MM;
            if (mm > DOT_TOLERANCE_MM) {
                problems.push(`the dot of "${letter}" sits at ${dot.x.toFixed(4)}, ${dot.y.toFixed(4)} mm; the table of P9-B3 gives ${(pinned.x * FONT_MM).toFixed(4)}, ${(pinned.y * FONT_MM).toFixed(4)} mm`);
            }
        }
        expect(problems.length, problems.join('\n') || 'one dot for each lowercase letter').toBe(0);
        expect(() => traceLineLayout('A', FONT_MM), 'a letter outside the table throws').toThrow(/no trace start point/);
    });

    // -----------------------------------------------------------------------------------------
    // C2-mutants
    // -----------------------------------------------------------------------------------------

    it('C2-mutants: the old c, the old S, a left-middle value, a missing u, and a dot 0.5 mm left each fail', () => {
        const oldC: Point = { x: 0.4272, y: 0.3873 };
        const oldS: Point = { x: 0.4696, y: 0.6718 };
        const leftMiddle: Point = { x: 0.1, y: 0.25 };
        const measured = measureInk([
            { id: 'c-old', letter: 'c', ...oldC },
            { id: 'S-old', letter: 'S', ...oldS },
            { id: 'c-left', letter: 'c', ...leftMiddle },
            { id: 's-left', letter: 's', ...leftMiddle },
            { id: 'd-left', letter: 'd', ...leftMiddle },
        ]);

        // (a) the old value of c and the old value of S each fail C2-ink
        expect(inkProblem('c', measured.get('c-old')), 'Mutant a: the old value of c fails C2-ink.').toBeDefined();
        expect(inkProblem('S', measured.get('S-old')), 'Mutant a: the old value of S fails C2-ink.').toBeDefined();

        // (b) a left-middle value fails C2-ink or C2-book: the ink of s is white there, and the ink of c and of d passes
        expect(inkProblem('s', measured.get('s-left')), 'Mutant b: the left middle of s fails C2-ink.').toBeDefined();
        expect(inkProblem('c', measured.get('c-left')), 'Mutant b: the left middle of c lies on ink, so C2-book must catch it.').toBeUndefined();
        expect(inkProblem('d', measured.get('d-left')), 'Mutant b: the left middle of d lies on ink, so C2-book must catch it.').toBeUndefined();
        for (const word of ['car', 'drum']) {
            const x = PAD_MM;
            const mutant: BookDot = {
                page: 113,
                week: 7,
                word,
                x,
                cx: x + leftMiddle.x * FONT_MM,
                cy: BASELINE_MM - leftMiddle.y * FONT_MM,
            };
            expect(bookProblems([mutant]).length, `Mutant b: the left middle of "${word}" fails C2-book.`).toBeGreaterThan(0);
        }

        // (c) a table with the letter u removed fails C2-keys
        expect(keyProblems(withoutLetter('u')), 'Mutant c: a table without u fails C2-keys.').not.toEqual([]);
        expect(keyProblems(EXPECTED_START_EM), 'The pinned table of P9-B3 passes C2-keys.').toEqual([]);

        // (d) the dot of "drum" moved 0.5 mm left fails C2-book
        const drum = BOOK_CASES.find((pin) => pin.word === 'drum')!;
        expect(bookProblems([{ page: drum.page, week: 7, word: drum.word, x: drum.x, cx: drum.cx - 0.5, cy: drum.cy }]).length,
            'Mutant d: the dot of "drum" moved 0.5 mm left fails C2-book.').toBeGreaterThan(0);
    });
});

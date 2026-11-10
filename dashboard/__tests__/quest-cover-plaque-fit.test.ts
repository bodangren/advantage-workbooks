// @vitest-environment jsdom
/**
 * Red of the front plaque fit (track storytime_cover_options_20261106, Phase 2, the
 * Task (Red, the plaque text fits) pair of 2026-11-10).
 *
 * The finding (the orchestrator page look of the r3 fronts, 2026-11-10 10:40; the PM accepted the
 * fix at 10:45): "on both fronts the 2 title lines cross the plaque frame lines, and the plaque
 * hides the bottom of the Sprout tab text".
 *
 * The measured numbers of the finding:
 *   - The plaque box is 14 mm high and stands at 278 mm to 292 mm from the top edge.
 *   - Its inner band in the level colour, the SVG path of the plaque whose fill equals the
 *     data-plaque-colour value, spans 2.8 mm to 11.2 mm of the box (8.4 mm).
 *   - The level line is 7 mm and the book line 4.2 mm, at a line height of 1.05, so the 2 lines
 *     need about 12.2 mm.
 *   - The teacher band pill, the Sprout tab, stands at 271.5 mm to 280.5 mm, under the plaque, and
 *     its 13 pt text reaches below 278 mm.
 *
 * The PM speed note (word for word): "choose the layout that fits with the least new design. One
 * option is ONE line, 'Level 2 · Unit 1 · Student Book', in the 8.4 mm band, if it fits at a
 * readable size."
 *
 * The contract of this file:
 *   P1: Every text of the front title plaque lies inside the band of the plaque in the level
 *       colour, within 0.1 mm on all 4 sides.
 *   P2: No text of the plaque touches a diamond ornament of the plaque, and no 2 texts of the
 *       plaque touch each other (0.1 mm tolerance).
 *   P3: Every text of the plaque is set at 4.2 mm or more, a readable size.
 *   P4: The plaque text reads "Level 2 Unit 1 Student Book" on the student front and
 *       "Level 2 Unit 1 Teacher Book" on the teacher front, with the middle dots removed.
 *   P5: The text of the teacher Sprout tab lies inside its pill, and its bottom is at or above
 *       the top of the plaque (0.1 mm tolerance).
 *   P6: The 2 reader plaques and the 2 series banners keep the bytes of the role base sha
 *       19ecfdc2. The file runs no browser for this check.
 *
 * The contract holds no layout choice. A plaque that fits in any way passes P1 to P4.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from '@playwright/test';
import {
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestReaderRow,
} from '../lib/storytime/print/cover-quest';

/** The art string of the renders. The test reads no art file (pin P8). */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The millimetres of one pixel: 96 px is 25.4 mm. */
const MM_PER_PX = 25.4 / 96;

/** The tolerance of the fit checks, in millimetres. */
const TOLERANCE_MM = 0.1;

/** The least font size of a plaque text, in millimetres. */
const MIN_FONT_MM = 4.2;

/** The slack of the font size check, in millimetres (the browser rounds the size to 1/64 px). */
const FONT_EPSILON_MM = 0.01;

/** The SHA-256 of the reader A3 title plaque at the role base sha 19ecfdc2 (pin P6). */
const PIN_READER_A3_PLAQUE = 'b2fcb49e6162d2b03b40d15480eb6f0d556227ad5244c55e72de64548ecee707';

/** The SHA-256 of the reader leaf title plaque at the role base sha 19ecfdc2 (pin P6). */
const PIN_READER_LEAF_PLAQUE = '4b37d4ca7d78f6f9228a97a94e8568d69e9593041e83d9af4fdce841f55eeaa1';

/** The SHA-256 of the series banner of both fronts at the role base sha 19ecfdc2 (pin P6). */
const PIN_SERIES_BANNER = '47ee7dadf2ccfc0ce7a6d70b013c9ebaab98f27a0cdfbc198680442d7d1c0bb9';

/** The 2 fronts of the check, with the plaque text of each. */
const FRONTS = [
    { kind: 'student-front' as const, expected: 'Level 2 Unit 1 Student Book' },
    { kind: 'teacher-front' as const, expected: 'Level 2 Unit 1 Teacher Book' },
];

/** One measured box, in millimetres. */
interface Box {
    /** The left edge. */
    leftMm: number;
    /** The top edge. */
    topMm: number;
    /** The right edge. */
    rightMm: number;
    /** The bottom edge. */
    bottomMm: number;
}

/** One measured text, in millimetres. */
interface TextBox extends Box {
    /** The text of the node. */
    text: string;
    /** The font size of the parent element, in millimetres. */
    fontMm: number;
    /** The part mark of the parent element. */
    part: string;
}

/** One measured box as the browser gives it, in pixels. */
interface RawBox {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** One measured text as the browser gives it, in pixels. */
interface RawText extends RawBox {
    text: string;
    fontPx: number;
    part: string;
}

/** The measurement of one front, as the browser gives it. */
interface RawMeasure {
    plaque: RawBox;
    band: RawBox;
    texts: RawText[];
    ornaments: RawBox[];
    pill: { box: RawBox; text: RawBox | null } | null;
    textContent: string;
}

/** The measurement of one front, in millimetres. */
interface Measure {
    plaque: Box;
    band: Box;
    texts: TextBox[];
    ornaments: Box[];
    pill: { box: Box; text: Box | null } | null;
    textContent: string;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the layout checks. */
let browser: Browser | undefined;

/**
 * Converts one box of the browser to millimetres.
 * @param box The box, in pixels.
 * @returns The box, in millimetres.
 */
function toMm(box: RawBox): Box {
    return {
        leftMm: box.left * MM_PER_PX,
        topMm: box.top * MM_PER_PX,
        rightMm: box.right * MM_PER_PX,
        bottomMm: box.bottom * MM_PER_PX,
    };
}

/**
 * Writes the measured values of one box in a readable form.
 * @param box The box.
 * @returns The text.
 */
function showBox(box: Box): string {
    return (
        `left ${box.leftMm.toFixed(2)} mm, top ${box.topMm.toFixed(2)} mm, ` +
        `right ${box.rightMm.toFixed(2)} mm, bottom ${box.bottomMm.toFixed(2)} mm`
    );
}

/**
 * Tells when one box lies inside another box, with a tolerance.
 * @param text The first box.
 * @param band The second box.
 * @returns True when the first box lies inside the second box.
 */
function liesInside(text: Box, band: Box): boolean {
    return (
        text.leftMm >= band.leftMm - TOLERANCE_MM &&
        text.rightMm <= band.rightMm + TOLERANCE_MM &&
        text.topMm >= band.topMm - TOLERANCE_MM &&
        text.bottomMm <= band.bottomMm + TOLERANCE_MM
    );
}

/**
 * Tells when two boxes share an area, with a tolerance.
 * @param first The first box.
 * @param second The second box.
 * @returns True when the boxes share an area.
 */
function overlaps(first: Box, second: Box): boolean {
    const overlapX = Math.min(first.rightMm, second.rightMm) - Math.max(first.leftMm, second.leftMm);
    const overlapY = Math.min(first.bottomMm, second.bottomMm) - Math.max(first.topMm, second.topMm);
    return overlapX > TOLERANCE_MM && overlapY > TOLERANCE_MM;
}

/**
 * Renders one front of the shipped Level 2 Unit 1 row.
 * @param kind The front kind.
 * @returns The page document.
 */
function frontHtml(kind: 'student-front' | 'teacher-front'): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    expect(book.level, 'the row is Level 2.').toBe(2);
    expect(book.unit, 'the row is Unit 1.').toBe(1);
    return renderQuestCover(kind, book, { art: ART }, { bleedMm: 0 });
}

/**
 * Renders the first reader cover of a reader kind.
 * @param kind The reader kind.
 * @returns The page document.
 */
function readerHtml(kind: 'reader-a3' | 'reader-leaf'): string {
    const rows: QuestReaderRow[] = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    return renderQuestCover(kind, rows[0], { art: ART }, { bleedMm: 0 });
}

/**
 * Reads the SHA-256 of the outerHTML of one part of one rendered page.
 * @param kind The cover kind.
 * @param part The part mark.
 * @returns The hash.
 */
function shaOfPart(kind: 'student-front' | 'teacher-front' | 'reader-a3' | 'reader-leaf', part: string): string {
    const html = kind === 'student-front' || kind === 'teacher-front' ? frontHtml(kind) : readerHtml(kind);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const element = doc.querySelector(`[data-part="${part}"]`);
    expect(element, `the ${kind} page holds a ${part} part.`).not.toBeNull();
    return createHash('sha256').update(element!.outerHTML, 'utf8').digest('hex');
}

/**
 * Measures one front in Chrome: the plaque box, the band in the level colour, every text of the
 * plaque, the diamond ornaments, and the teacher band pill.
 * @param kind The front kind.
 * @returns The measurement, in millimetres.
 */
async function measureFront(kind: 'student-front' | 'teacher-front'): Promise<Measure> {
    const active = browser;
    if (!active) throw new Error('the browser of the layout check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-plaque-'));
    scratch.push(folder);
    const file = path.join(folder, `${kind}.html`);
    fs.writeFileSync(file, frontHtml(kind));
    const context = await active.newContext({ viewport: { width: 900, height: 1300 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        expect(
            await page.evaluate(() => document.fonts.check('16px "League Spartan"')),
            'the League Spartan font loads in the browser',
        ).toBe(true);
        const raw = await page.evaluate((): RawMeasure => {
            const plaque = document.querySelector('[data-part="title-plaque"]');
            if (!plaque) throw new Error('the page holds no title plaque');
            const colour = plaque.getAttribute('data-plaque-colour') ?? '';
            const bands = Array.from(plaque.querySelectorAll('path')).filter(
                (one) => one.getAttribute('fill') === colour,
            );
            if (bands.length !== 1) throw new Error(`the plaque holds ${bands.length} paths in the level colour`);
            const walker = document.createTreeWalker(plaque, NodeFilter.SHOW_TEXT);
            const texts: RawText[] = [];
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                const value = node.nodeValue ?? '';
                if (!value.trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                const rect = range.getBoundingClientRect();
                const parent = node.parentElement;
                texts.push({
                    text: value.trim(),
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    fontPx: parent ? Number.parseFloat(window.getComputedStyle(parent).fontSize) : 0,
                    part: parent?.getAttribute('data-part') ?? '',
                });
            }
            const ornaments = Array.from(plaque.querySelectorAll('g')).map((one) => {
                const rect = one.getBoundingClientRect();
                return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
            });
            const plaqueRect = plaque.getBoundingClientRect();
            const bandRect = bands[0].getBoundingClientRect();
            const pill = document.querySelector('[data-part="band-pill"]');
            let pillBox: RawBox | null = null;
            let pillText: RawBox | null = null;
            if (pill) {
                const rect = pill.getBoundingClientRect();
                pillBox = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
                const pillWalker = document.createTreeWalker(pill, NodeFilter.SHOW_TEXT);
                while (pillWalker.nextNode()) {
                    const node = pillWalker.currentNode as Text;
                    if (!(node.nodeValue ?? '').trim()) continue;
                    const range = document.createRange();
                    range.selectNodeContents(node);
                    const textRect = range.getBoundingClientRect();
                    pillText = {
                        left: textRect.left,
                        top: textRect.top,
                        right: textRect.right,
                        bottom: textRect.bottom,
                    };
                    break;
                }
            }
            return {
                plaque: {
                    left: plaqueRect.left,
                    top: plaqueRect.top,
                    right: plaqueRect.right,
                    bottom: plaqueRect.bottom,
                },
                band: {
                    left: bandRect.left,
                    top: bandRect.top,
                    right: bandRect.right,
                    bottom: bandRect.bottom,
                },
                texts,
                ornaments,
                pill: pillBox ? { box: pillBox, text: pillText } : null,
                textContent: plaque.textContent ?? '',
            };
        });
        return {
            plaque: toMm(raw.plaque),
            band: toMm(raw.band),
            texts: raw.texts.map((text) => ({
                ...toMm(text),
                text: text.text,
                fontMm: text.fontPx * MM_PER_PX,
                part: text.part,
            })),
            ornaments: raw.ornaments.map(toMm),
            pill: raw.pill ? { box: toMm(raw.pill.box), text: raw.pill.text ? toMm(raw.pill.text) : null } : null,
            textContent: raw.textContent,
        };
    } finally {
        await context.close();
    }
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
}, 120_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-plaque-fit: P1 to P6 (Red, the plaque text fits)', () => {
    for (const front of FRONTS) {
        it(`P1: the plaque text of the ${front.kind} lies inside the band in the level colour`, async () => {
            const measure = await measureFront(front.kind);
            expect(measure.texts.length, `the ${front.kind} plaque holds a text.`).toBeGreaterThan(0);
            const outside = measure.texts.filter((text) => !liesInside(text, measure.band));
            const detail = outside
                .map((text) => `the text "${text.text}" (${showBox(text)}) leaves the band (${showBox(measure.band)})`)
                .join('; ');
            expect(
                outside.length,
                `the text of the ${front.kind} plaque lies inside the band in the level colour within ` +
                    `0.1 mm on all 4 sides: ${detail}`,
            ).toBe(0);
        }, 120_000);

        it(`P2: the plaque text of the ${front.kind} is clear of the diamond ornaments and of itself`, async () => {
            const measure = await measureFront(front.kind);
            const problems: string[] = [];
            for (const text of measure.texts) {
                for (const ornament of measure.ornaments) {
                    if (overlaps(text, ornament)) {
                        problems.push(
                            `the text "${text.text}" (${showBox(text)}) touches a diamond ornament ` +
                                `(${showBox(ornament)})`,
                        );
                    }
                }
            }
            for (let first = 0; first < measure.texts.length; first += 1) {
                for (let second = first + 1; second < measure.texts.length; second += 1) {
                    const one = measure.texts[first];
                    const other = measure.texts[second];
                    if (overlaps(one, other)) {
                        problems.push(
                            `the texts "${one.text}" (${showBox(one)}) and "${other.text}" ` +
                                `(${showBox(other)}) touch each other`,
                        );
                    }
                }
            }
            expect(
                problems.length,
                `the text of the ${front.kind} plaque is clear of the diamond ornaments and of the ` +
                    `other texts, with a tolerance of 0.1 mm: ${problems.join('; ')}`,
            ).toBe(0);
        }, 120_000);

        it(`P3: the plaque text of the ${front.kind} is set at a readable size`, async () => {
            const measure = await measureFront(front.kind);
            const small = measure.texts.filter((text) => text.fontMm < MIN_FONT_MM - FONT_EPSILON_MM);
            const detail = small
                .map(
                    (text) =>
                        `the text "${text.text}" of the part "${text.part}" is set at ` +
                        `${text.fontMm.toFixed(2)} mm (at least ${MIN_FONT_MM} mm)`,
                )
                .join('; ');
            expect(
                small.length,
                `every text of the ${front.kind} plaque is set at ${MIN_FONT_MM} mm or more: ${detail}`,
            ).toBe(0);
        }, 120_000);

        it(`P4: the plaque text of the ${front.kind} reads the approved words`, async () => {
            const measure = await measureFront(front.kind);
            const text = measure.textContent.replace(/·/g, '').replace(/\s+/g, ' ').trim();
            expect(text, `the plaque text of the ${front.kind} holds the approved words.`).toBe(front.expected);
        }, 120_000);
    }

    it('P5: the Sprout tab text of the teacher front lies inside its pill and above the plaque', async () => {
        const measure = await measureFront('teacher-front');
        expect(measure.pill, 'the teacher front holds a band pill.').not.toBeNull();
        const pill = measure.pill!;
        expect(pill.text, 'the band pill holds a text.').not.toBeNull();
        const text = pill.text!;
        const problems: string[] = [];
        if (!liesInside(text, pill.box)) {
            problems.push(`the Sprout tab text (${showBox(text)}) leaves its pill (${showBox(pill.box)})`);
        }
        if (text.bottomMm > measure.plaque.topMm + TOLERANCE_MM) {
            problems.push(
                `the Sprout tab text (${showBox(text)}) reaches ${text.bottomMm.toFixed(2)} mm, below the ` +
                    `top of the plaque (${showBox(measure.plaque)}) at ${measure.plaque.topMm.toFixed(2)} mm`,
            );
        }
        expect(
            problems.length,
            `the Sprout tab text of the teacher front lies inside its pill and at or above the top of ` +
                `the plaque, with a tolerance of 0.1 mm: ${problems.join('; ')}`,
        ).toBe(0);
    }, 120_000);

    it('P6: the reader plaques and the series banners keep their bytes of the role base sha', () => {
        expect(
            shaOfPart('reader-a3', 'title-plaque'),
            'the reader A3 title plaque keeps its bytes of the role base sha 19ecfdc2.',
        ).toBe(PIN_READER_A3_PLAQUE);
        expect(
            shaOfPart('reader-leaf', 'title-plaque'),
            'the reader leaf title plaque keeps its bytes of the role base sha 19ecfdc2.',
        ).toBe(PIN_READER_LEAF_PLAQUE);
        expect(
            shaOfPart('student-front', 'series-banner'),
            'the series banner of the student front keeps its bytes of the role base sha 19ecfdc2.',
        ).toBe(PIN_SERIES_BANNER);
        expect(
            shaOfPart('teacher-front', 'series-banner'),
            'the series banner of the teacher front keeps its bytes of the role base sha 19ecfdc2.',
        ).toBe(PIN_SERIES_BANNER);
    });
});

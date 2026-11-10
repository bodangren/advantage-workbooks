// @vitest-environment jsdom
/**
 * Red of the alternate A2 of the quest covers: the horizontal logo as the only top chrome.
 *
 * The track: storytime_cover_options_20261106, Phase 2, the Task (Red, alternate A2 horizontal
 * logo) pair of 2026-11-10.
 *
 * The owner words (Daniel, the look note on the r5 covers, Google Tasks NXlkaVBtUW9hZWRuU1J6UA,
 * 2026-11-10 14:50, relayed by the PM, word for word): "I want an alternate where we just use the
 * horizontal logo as the entire top Chrome here, meaning the logo is the only thing on the top and
 * it doesn't repeat the words story Time Advantage the way we have now".
 *
 * The PM spec of 2026-11-10:
 *   (1) Option A, the r5 covers, stays exactly as it is. The alternate A2 changes the top of the
 *       2 fronts and the 2 backs only.
 *   (2) The top of A2 holds only the horizontal logo. Its file is
 *       content/storytime/covers/logos/storytime-advantage-horizontal.svg, SHA-256
 *       3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc. Its viewBox is
 *       37.59 -2.9 1461.6 464.88, so the aspect is 3.144. The mark and the words are brown and the
 *       background is transparent.
 *   (3) The logo sits on its own amber #FCD34D tile with a brown #92400E edge. The logo is
 *       centered in the tile within 1 mm and fills about 80 % of the tile height. The tile is
 *       centered at the top and takes about 80 % to 85 % of the cover width.
 *   (4) The tile replaces the square logo and the title banner of the 2 fronts, and the logo box
 *       and the title banner of the 2 backs.
 *   (5) The plaque, the Sprout tab, the story panel, the contact sign with the RA mark, the QR,
 *       the art, no game bar, and 0 Type 3 fonts stay.
 *   (6) The top style is opt in: QuestRenderOptions.top is 'banner', the default, which is r5, or
 *       'hlogo', which is A2. The build takes the flag --top banner|hlogo, and the default is
 *       banner.
 *   (7) The tile part is data-part="logo-tile" and holds one img of the horizontal logo. The box
 *       table holds the key "<kind>:logo-tile" for the 2 fronts and the 2 backs.
 *
 * The contract of this file:
 *   A1: The horizontal logo file sits in content/storytime/covers/logos/ with the approved hash.
 *   A2: The default render, with no top option and with top 'banner', is byte equal to r5 for the
 *       4 kinds. The 4 hashes are the pins of the r5 state at this commit.
 *   A3: With top 'hlogo', the 2 fronts hold no series banner, no series logo, and no crest. The 2
 *       backs hold no series banner and no logo box. Each kind holds one logo tile with one image
 *       of the horizontal logo. No text node of the body holds the series name. The 2 fronts hold
 *       the level line once. The check reads the body: the document title and the style block are
 *       not visible chrome.
 *   A4: The box table holds the key "<kind>:logo-tile" for the 4 kinds. The tile is 168 mm to
 *       178.5 mm wide, is centered at 105 mm, and starts at 5 mm or more. The tile of the 2 fronts
 *       ends at 100 mm or less. The tile of the student back ends 3 mm above the panel. The boxes
 *       of the kept parts do not change.
 *   A5: The kept parts hold the same HTML in the hlogo render and in the default render.
 *   A6: The logo sits centered in its tile, fills 75 % to 85 % of the inner tile height, keeps the
 *       aspect 3.144 within 1 %, and the tile takes the amber and the brown with no shadow and no
 *       opacity under 1.
 *   A7: The PDF of the student front and of the student back holds no Type 3 font and holds an
 *       embedded font.
 *   A8: The build takes the flag --top. The value hlogo parses, the default is banner, and the
 *       value round is an error.
 *
 * The 2 backs render the 5 contact lines, which hold Thai. The file prints no text of a back: it
 * prints millimetre values, counts, colors, hashes, and part names only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from '@playwright/test';
import {
    QUEST_BOXES,
    loadQuestCovers,
    renderQuestCover,
    type QuestBookRow,
    type QuestPanelValue,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';
import { parseQuestArgs, type QuestArgs } from '../scripts/storytime/make-storytime-quest-covers';
import { parsePdffonts } from '../lib/print/pdfx';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The millimetres of one pixel: 96 px is 25.4 mm. */
const MM_PER_PX = 25.4 / 96;

/** The 2 front kinds of this file. */
const KINDS_FRONT = ['student-front', 'teacher-front'] as const;

/** The 2 back kinds of this file. */
const KINDS_BACK = ['student-back', 'teacher-back'] as const;

/** The 4 kinds of this file. */
const KINDS = [...KINDS_FRONT, ...KINDS_BACK] as const;

/** The 4 kinds of this file, as a plain array of strings. */
type Kind = (typeof KINDS)[number];

/** The amber of the logo tile. */
const AMBER = '#fcd34d';

/** The brown of the logo edge. */
const BROWN = '#92400e';

/** The SHA-256 of the horizontal Storytime Advantage logo. */
const SHA_HORIZONTAL_LOGO = '3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc';

/** The aspect of the horizontal logo: 1461.6 / 464.88. */
const LOGO_ASPECT = 3.144;

/** The least share of the inner tile height that the logo fills. */
const MIN_FILL_SHARE = 0.75;

/** The most share of the inner tile height that the logo fills. */
const MAX_FILL_SHARE = 0.85;

/** The least share of the tile height that the logo fills. */
const MIN_TILE_FILL_SHARE = 0.75;

/** The most share of the tile height that the logo fills. */
const MAX_TILE_FILL_SHARE = 0.85;

/** The tolerance of the centring checks, in millimetres. */
const CENTRE_TOLERANCE_MM = 1;

/** The tolerance of the aspect check, as a share. */
const ASPECT_TOLERANCE = 0.01;

/** The centre of a cover, in millimetres. */
const COVER_CENTRE_MM = 105;

/** The least width of the logo tile, in millimetres: 80 % of 210 mm. */
const MIN_TILE_WIDTH_MM = 168;

/** The most width of the logo tile, in millimetres: 85 % of 210 mm. */
const MAX_TILE_WIDTH_MM = 178.5;

/** The r5 pins: the SHA-256 of the default render of each kind at this commit. */
const R5_PINS: Record<Kind, string> = {
    'student-front': '5ae17617643524865a9dbbc63cc73754b0170fbe5063bc71d35399288d3265b6',
    'teacher-front': 'b526e81e4f6aa9e9c94d8354f334e4d044b9ca22f8e7f5b344b28fe515895daf',
    'student-back': '8bdd615af444553c3aecca920c809beb5d52bc7ec7cc819763b837b76d4df2b0',
    'teacher-back': '5e086f4fcc6b2ba6d799f9c9d16212338ff5cf4d0c055cd5319fbd5ad486be79',
};

/** The parts that A2 keeps. */
const KEPT_PARTS = [
    'title-plaque',
    'band-pill',
    'panel',
    'contact-sign',
    'qr',
    'line-label',
    'publisher-mark',
] as const;

/** The boxes of the kept parts at this commit. */
const KEPT_BOXES: Record<string, { leftMm: number; topMm: number; widthMm: number; heightMm: number }> = {
    'student-front:title-plaque': { leftMm: 26, topMm: 278, widthMm: 158, heightMm: 14 },
    'teacher-front:title-plaque': { leftMm: 26, topMm: 278, widthMm: 158, heightMm: 14 },
    'teacher-front:band-pill': { leftMm: 83, topMm: 271.5, widthMm: 44, heightMm: 9 },
    'student-back:panel': { leftMm: 12, topMm: 48, widthMm: 186, heightMm: 142 },
    'student-back:contact-sign': { leftMm: 12, topMm: 200, widthMm: 186, heightMm: 80 },
    'student-back:qr': { leftMm: 141, topMm: 205, widthMm: 50, heightMm: 50 },
    'student-back:line-label': { leftMm: 141, topMm: 259, widthMm: 50, heightMm: 8 },
    'student-back:publisher-mark': { leftMm: 71, topMm: 251.5, widthMm: 14, heightMm: 14 },
    'teacher-back:contact-sign': { leftMm: 12, topMm: 200, widthMm: 186, heightMm: 80 },
    'teacher-back:qr': { leftMm: 141, topMm: 205, widthMm: 50, heightMm: 50 },
    'teacher-back:line-label': { leftMm: 141, topMm: 259, widthMm: 50, heightMm: 8 },
    'teacher-back:publisher-mark': { leftMm: 71, topMm: 251.5, widthMm: 14, heightMm: 14 },
};

/** The render options, with the top style that the alternate A2 adds. */
type TopOptions = QuestRenderOptions & { top?: string };

/** The parsed arguments of the build, with the top style that the alternate A2 adds. */
type TopArgs = QuestArgs & { top?: string };

/** The default render options: the r5 style. */
const DEFAULT_OPTIONS: TopOptions = { bleedMm: 0 };

/** The render options of the named banner style: the r5 style. */
const BANNER_OPTIONS: TopOptions = { bleedMm: 0, top: 'banner' };

/** The render options of the A2 style: the horizontal logo on its tile. */
const HLOGO_OPTIONS: TopOptions = { bleedMm: 0, top: 'hlogo' };

/** The repo root. */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The folder of the logo files. */
const logoDir = path.join(repoRoot, 'content', 'storytime', 'covers', 'logos');

/** The file of the horizontal Storytime Advantage logo. */
const horizontalLogoFile = path.join(logoDir, 'storytime-advantage-horizontal.svg');

/** One box as the browser gives it, in pixels. */
interface RawBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** One box in millimetres. */
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

/** The measurement of the logo tile of one kind. */
interface RawTile {
    /** The box of the tile. */
    rect: RawBox;
    /** The computed border widths of the tile, in pixels. */
    borders: { top: number; right: number; bottom: number; left: number };
    /** The computed background color of the tile. */
    background: string;
    /** The computed border colors of the sides with a border. */
    borderColors: string[];
    /** The box of the image of the tile, or null when the tile holds none. */
    imgRect: RawBox | null;
    /** The text shadows of the tile and of its descendants. */
    shadows: string[];
    /** The opacities under 1 of the tile and of its descendants. */
    opacities: string[];
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the hlogo checks. */
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
 * Converts a computed color to a lower case hex value.
 * @param value The computed color.
 * @returns The hex value.
 */
function toHex(value: string): string {
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (!match) return value.trim().toLowerCase();
    const hex = [match[1], match[2], match[3]]
        .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0'))
        .join('');
    return `#${hex}`;
}

/**
 * Shortens a list of problems for a failure message.
 * @param problems The problems.
 * @returns The text.
 */
function summarise(problems: string[]): string {
    const head = problems.slice(0, 10).join('; ');
    return problems.length > 10 ? `${problems.length} problems: ${head}` : head;
}

/**
 * Reads the bytes of one file.
 * @param file The file.
 * @returns The bytes, or null when the file does not exist.
 */
function bytesOfFile(file: string): Uint8Array | null {
    if (!fs.existsSync(file)) return null;
    return new Uint8Array(fs.readFileSync(file));
}

/**
 * Reads the bytes of one source of an image.
 * @param src The source: a file URL or a data URL.
 * @returns The bytes, or null when the source holds no readable bytes.
 */
function bytesOfSrc(src: string): Uint8Array | null {
    if (src.startsWith('data:')) {
        const comma = src.indexOf(',');
        if (comma < 0) return null;
        const head = src.slice(5, comma);
        const payload = src.slice(comma + 1);
        if (!head.endsWith(';base64')) return new TextEncoder().encode(decodeURIComponent(payload));
        let binary: string;
        try {
            binary = atob(payload);
        } catch {
            return null;
        }
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes;
    }
    if (src.startsWith('file://')) {
        try {
            return bytesOfFile(fileURLToPath(src));
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Reads the SHA-256 of one file.
 * @param file The file.
 * @returns The hash.
 */
function hashOfFile(file: string): string {
    const bytes = bytesOfFile(file);
    expect(bytes, `the file ${path.basename(file)} holds bytes.`).not.toBeNull();
    return createHash('sha256').update(bytes!).digest('hex');
}

/**
 * Reads the SHA-256 of the bytes of one image source.
 * @param src The source.
 * @param who The name of the element, for the failure message.
 * @returns The hash.
 */
function hashOfSrc(src: string, who: string): string {
    const bytes = bytesOfSrc(src);
    expect(bytes, `the image source of the ${who} holds bytes.`).not.toBeNull();
    return createHash('sha256').update(bytes!).digest('hex');
}

/**
 * Reads the SHA-256 of one text.
 * @param text The text.
 * @returns The hash.
 */
function hashOfText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * The panel values of the shipped Level 2 Unit 1 row.
 * @returns The values.
 */
function panelValues(): QuestPanelValue[] {
    const data = loadStorytimeCoverBooks();
    const book = data.books.find((row) => row.level === 2 && row.unit === 1);
    expect(book, 'books.json holds the Level 2 Unit 1 row.').toBeTruthy();
    const graph = readPhonicsGraph();
    if (!graph) return [{ field: 'story', value: book!.panel?.story?.text ?? '', items: [] }];
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
    return storytimeCoverPanelValues(book!, { weeks, graph });
}

/**
 * Renders one kind with the given options.
 * @param kind The cover kind.
 * @param opts The render options.
 * @returns The page document.
 */
function renderKind(kind: Kind, opts: TopOptions): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
    return renderQuestCover(kind, book, assets, opts);
}

/**
 * Finds the text nodes of the body that hold the series name.
 * @param doc The parsed document.
 * @returns The part mark of each node, or the tag name when no part holds it.
 */
function seriesNameNodes(doc: Document): string[] {
    const body = doc.body;
    if (!body) return [];
    const found: string[] = [];
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest('style, script')) continue;
        if (!/storytime|advantage/i.test(node.nodeValue ?? '')) continue;
        const part = parent.closest('[data-part]');
        found.push(part?.getAttribute('data-part') ?? parent.tagName.toLowerCase());
    }
    return found;
}

/**
 * Opens one rendered page in Chrome and measures the logo tile.
 * @param kind The cover kind.
 * @returns The measurement, or null when the page holds no logo tile.
 */
async function measureTile(kind: Kind): Promise<RawTile | null> {
    const active = browser;
    if (!active) throw new Error('the browser of the hlogo check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-hlogo-'));
    scratch.push(folder);
    const file = path.join(folder, `${kind}.html`);
    fs.writeFileSync(file, renderKind(kind, HLOGO_OPTIONS));
    const context = await active.newContext({ viewport: { width: 900, height: 1300 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        return await page.evaluate((): RawTile | null => {
            const tile = document.querySelector('[data-part="logo-tile"]');
            if (!tile) return null;
            const style = window.getComputedStyle(tile);
            const rect = tile.getBoundingClientRect();
            const image = tile.querySelector('img');
            let imgRect: RawBox | null = null;
            if (image) {
                const box = image.getBoundingClientRect();
                imgRect = { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
            }
            const borderColors: string[] = [];
            const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
            for (const side of sides) {
                const width = Number.parseFloat(style[`border${side}Width`]);
                if (Number.isFinite(width) && width > 0) borderColors.push(style[`border${side}Color`]);
            }
            const shadows: string[] = [];
            const opacities: string[] = [];
            for (const target of [tile, ...Array.from(tile.querySelectorAll('*'))]) {
                const one = window.getComputedStyle(target);
                if (one.textShadow && one.textShadow !== 'none') shadows.push(one.textShadow);
                const opacity = Number.parseFloat(one.opacity);
                if (Number.isFinite(opacity) && opacity < 1) opacities.push(String(opacity));
            }
            return {
                rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
                borders: {
                    top: Number.parseFloat(style.borderTopWidth),
                    right: Number.parseFloat(style.borderRightWidth),
                    bottom: Number.parseFloat(style.borderBottomWidth),
                    left: Number.parseFloat(style.borderLeftWidth),
                },
                background: style.backgroundColor,
                borderColors,
                imgRect,
                shadows,
                opacities,
            };
        });
    } finally {
        await context.close();
    }
}

/**
 * Prints one rendered page to a PDF file and reads its fonts.
 * @param kind The cover kind.
 * @returns The pdffonts output.
 */
async function pdfFontsOf(kind: Kind): Promise<string> {
    const active = browser;
    if (!active) throw new Error('the browser of the hlogo check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-hlogo-pdf-'));
    scratch.push(folder);
    const htmlFile = path.join(folder, `${kind}.html`);
    const pdfFile = path.join(folder, `${kind}.pdf`);
    fs.writeFileSync(htmlFile, renderKind(kind, HLOGO_OPTIONS));
    const context = await active.newContext({ viewport: { width: 900, height: 1300 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(htmlFile).href);
        await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: pdfFile, format: 'A4', printBackground: true });
    } finally {
        await context.close();
    }
    return execFileSync('pdffonts', [pdfFile], { encoding: 'utf8', timeout: 30_000 });
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

describe('quest-cover-hlogo: A1 to A8 (Red, the alternate A2 with the horizontal logo)', () => {
    it('A1: the horizontal logo file sits in the logo folder with the approved hash', () => {
        expect(
            fs.existsSync(horizontalLogoFile),
            'the horizontal logo file sits in content/storytime/covers/logos/.',
        ).toBe(true);
        expect(hashOfFile(horizontalLogoFile), 'the SHA-256 of the horizontal logo.').toBe(SHA_HORIZONTAL_LOGO);
    });

    it('A2: the default render of each kind is byte equal to the r5 pin', () => {
        for (const kind of KINDS) {
            const plain = hashOfText(renderKind(kind, DEFAULT_OPTIONS));
            expect(plain, `the SHA-256 of the default render of the ${kind}.`).toBe(R5_PINS[kind]);
            const banner = hashOfText(renderKind(kind, BANNER_OPTIONS));
            expect(banner, `the SHA-256 of the top banner render of the ${kind}.`).toBe(R5_PINS[kind]);
        }
    });

    it('A3: with the top style hlogo, the logo tile is the only top chrome', () => {
        for (const kind of KINDS) {
            const doc = parseHtml(renderKind(kind, HLOGO_OPTIONS));
            expect(doc.querySelectorAll('[data-part="series-banner"]').length, `${kind} holds no series banner.`).toBe(0);
            if (kind === 'student-front' || kind === 'teacher-front') {
                expect(doc.querySelectorAll('[data-part="series-logo"]').length, `${kind} holds no series logo.`).toBe(0);
                expect(doc.querySelectorAll('[data-part="crest"]').length, `${kind} holds no crest.`).toBe(0);
            } else {
                expect(doc.querySelectorAll('[data-part="logo-box"]').length, `${kind} holds no logo box.`).toBe(0);
            }
            const tiles = doc.querySelectorAll('[data-part="logo-tile"]');
            expect(tiles.length, `${kind} holds one logo tile.`).toBe(1);
            const tile = tiles[0];
            const images =
                tile.tagName.toLowerCase() === 'img' ? [tile] : Array.from(tile.querySelectorAll('img'));
            expect(images.length, `${kind} logo tile holds one image.`).toBe(1);
            expect(
                hashOfSrc(images[0].getAttribute('src') ?? '', `${kind} logo tile`),
                `the logo tile of the ${kind} holds the horizontal logo bytes.`,
            ).toBe(SHA_HORIZONTAL_LOGO);
            const names = seriesNameNodes(doc);
            expect(
                names.length,
                `no text node of the ${kind} body holds the series name: ${summarise(names)}`,
            ).toBe(0);
        }
        for (const kind of KINDS_FRONT) {
            const html = renderKind(kind, HLOGO_OPTIONS);
            const count = html.split('Level 2 · Unit 1').length - 1;
            expect(count, `the ${kind} page holds the level line once.`).toBe(1);
        }
    });

    it('A4: the box table holds the tile of the 4 kinds and the kept boxes do not change', () => {
        for (const kind of KINDS) {
            const tile = QUEST_BOXES[`${kind}:logo-tile`];
            expect(tile, `the box table holds ${kind}:logo-tile.`).toBeDefined();
            expect(tile!.widthMm, `${kind} logo tile width is 168 mm to 178.5 mm.`).toBeGreaterThanOrEqual(
                MIN_TILE_WIDTH_MM,
            );
            expect(tile!.widthMm, `${kind} logo tile width is 168 mm to 178.5 mm.`).toBeLessThanOrEqual(
                MAX_TILE_WIDTH_MM,
            );
            expect(
                Math.abs(tile!.leftMm + tile!.widthMm / 2 - COVER_CENTRE_MM),
                `${kind} logo tile centre is 105 mm.`,
            ).toBeLessThanOrEqual(0.5);
            expect(tile!.topMm, `${kind} logo tile top is 5 mm or more.`).toBeGreaterThanOrEqual(5);
            if (kind === 'student-front' || kind === 'teacher-front') {
                expect(tile!.topMm + tile!.heightMm, `${kind} logo tile bottom is 100 mm or less.`).toBeLessThanOrEqual(
                    100,
                );
            }
            if (kind === 'student-back') {
                const panel = QUEST_BOXES['student-back:panel'];
                expect(panel, 'the box table holds student-back:panel.').toBeDefined();
                expect(
                    tile!.topMm + tile!.heightMm,
                    'the student back logo tile bottom is 3 mm above the panel.',
                ).toBeLessThanOrEqual(panel!.topMm - 3);
            }
        }
        const kept = Object.keys(QUEST_BOXES).filter(
            (key) =>
                KEPT_PARTS.some((part) => key.endsWith(`:${part}`)) &&
                KINDS.some((kind) => key.startsWith(`${kind}:`)),
        );
        expect(kept.slice().sort(), 'the box table holds the same kept parts.').toEqual(
            Object.keys(KEPT_BOXES).sort(),
        );
        for (const [key, box] of Object.entries(KEPT_BOXES)) {
            const found = QUEST_BOXES[key];
            expect(found, `the box table holds ${key}.`).toBeDefined();
            expect(found!.leftMm, `the left of ${key}.`).toBe(box.leftMm);
            expect(found!.topMm, `the top of ${key}.`).toBe(box.topMm);
            expect(found!.widthMm, `the width of ${key}.`).toBe(box.widthMm);
            expect(found!.heightMm, `the height of ${key}.`).toBe(box.heightMm);
        }
    });

    it('A5: the kept parts hold the same HTML in the hlogo render and in the default render', () => {
        for (const kind of KINDS) {
            const plain = parseHtml(renderKind(kind, DEFAULT_OPTIONS));
            const alt = parseHtml(renderKind(kind, HLOGO_OPTIONS));
            for (const part of KEPT_PARTS) {
                const one = plain.querySelector(`[data-part="${part}"]`);
                if (!one) continue;
                const two = alt.querySelector(`[data-part="${part}"]`);
                expect(two, `the ${kind} holds the part ${part} in the hlogo render.`).not.toBeNull();
                const first = hashOfText(one!.outerHTML);
                const second = hashOfText(two!.outerHTML);
                expect(second, `the HTML hash of the ${kind} ${part} in the hlogo render.`).toBe(first);
            }
        }
    });

    it('A6: the logo sits centered in its tile and the tile takes the amber and the brown', async () => {
        for (const kind of KINDS) {
            const raw = await measureTile(kind);
            expect(raw, `the ${kind} holds a logo tile.`).not.toBeNull();
            const tile = raw!;
            const box = toMm(tile.rect);
            const inner: Box = {
                leftMm: box.leftMm + tile.borders.left * MM_PER_PX,
                topMm: box.topMm + tile.borders.top * MM_PER_PX,
                rightMm: box.rightMm - tile.borders.right * MM_PER_PX,
                bottomMm: box.bottomMm - tile.borders.bottom * MM_PER_PX,
            };
            expect(tile.imgRect, `the logo tile of the ${kind} holds an image.`).not.toBeNull();
            const img = toMm(tile.imgRect!);
            const leftGap = img.leftMm - inner.leftMm;
            const rightGap = inner.rightMm - img.rightMm;
            const topGap = img.topMm - inner.topMm;
            const bottomGap = inner.bottomMm - img.bottomMm;
            expect(
                Math.abs(leftGap - rightGap),
                `the logo of the ${kind} is centered in its tile: the left gap is ${leftGap.toFixed(2)} mm, ` +
                    `the right gap is ${rightGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(topGap - bottomGap),
                `the logo of the ${kind} is centered in its tile: the top gap is ${topGap.toFixed(2)} mm, ` +
                    `the bottom gap is ${bottomGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
            const innerHeight = inner.bottomMm - inner.topMm;
            const share = (img.bottomMm - img.topMm) / innerHeight;
            expect(share, `the logo of the ${kind} fills 75 % to 85 % of the inner tile height.`).toBeGreaterThanOrEqual(
                MIN_FILL_SHARE,
            );
            expect(share, `the logo of the ${kind} fills 75 % to 85 % of the inner tile height.`).toBeLessThanOrEqual(
                MAX_FILL_SHARE,
            );
            const tileShare = (img.bottomMm - img.topMm) / (box.bottomMm - box.topMm);
            expect(
                tileShare,
                `the logo of the ${kind} fills 75 % to 85 % of the tile height.`,
            ).toBeGreaterThanOrEqual(MIN_TILE_FILL_SHARE);
            expect(tileShare, `the logo of the ${kind} fills 75 % to 85 % of the tile height.`).toBeLessThanOrEqual(
                MAX_TILE_FILL_SHARE,
            );
            const aspect = (img.rightMm - img.leftMm) / (img.bottomMm - img.topMm);
            expect(
                Math.abs(aspect - LOGO_ASPECT) / LOGO_ASPECT,
                `the logo of the ${kind} keeps the aspect 3.144 within 1 %.`,
            ).toBeLessThanOrEqual(ASPECT_TOLERANCE);
            expect(toHex(tile.background), `the tile background of the ${kind}.`).toBe(AMBER);
            expect(tile.borderColors.length, `the ${kind} tile holds a border.`).toBeGreaterThanOrEqual(1);
            for (const colour of tile.borderColors) {
                expect(toHex(colour), `every border color of the ${kind} tile.`).toBe(BROWN);
            }
            expect(tile.shadows.length, `the ${kind} tile holds no text shadow.`).toBe(0);
            expect(tile.opacities.length, `the ${kind} tile holds no opacity under 1.`).toBe(0);
        }
    }, 300_000);

    it('A7: the PDF of the student front and of the student back holds no Type 3 font', async () => {
        for (const kind of ['student-front', 'student-back'] as const) {
            const output = await pdfFontsOf(kind);
            const type3 = output.split('\n').filter((line) => line.includes('Type 3'));
            expect(type3.length, `the ${kind} PDF holds no Type 3 font.`).toBe(0);
            const fonts = parsePdffonts(output);
            const embedded = fonts.filter((row) => row.embedded).length;
            expect(embedded, `the ${kind} PDF holds an embedded font.`).toBeGreaterThanOrEqual(1);
        }
    }, 300_000);

    it('A8: the build takes the flag --top', () => {
        const withTop = parseQuestArgs(['--top', 'hlogo']);
        expect(withTop.errors, 'the flag --top hlogo holds no error.').toEqual([]);
        const args = withTop.args as TopArgs | null;
        expect(args, 'the flag --top hlogo parses.').not.toBeNull();
        expect(args!.top, 'the parsed top style is hlogo.').toBe('hlogo');
        const plain = parseQuestArgs([]);
        const plainArgs = plain.args as TopArgs | null;
        expect(plainArgs, 'the build without --top parses.').not.toBeNull();
        expect(plainArgs!.top, 'the default top style is banner.').toBe('banner');
        const bad = parseQuestArgs(['--top', 'round']);
        expect(bad.errors.length, 'the flag --top round is an error.').toBeGreaterThan(0);
        expect(bad.args, 'the flag --top round parses no arguments.').toBeNull();
    });
});

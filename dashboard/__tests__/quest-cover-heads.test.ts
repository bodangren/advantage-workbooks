// @vitest-environment jsdom
/**
 * Red of the standing head rule of the PM order of 2026-11-11 (track storytime_cover_options_20261106,
 * Phase 2, the Task (Red, F1 F2 and heads) pair of 2026-11-11).
 *
 * The owner words (Daniel, Google Tasks OE9xdmthbHJjX2tmWmtubQ, 2026-11-11 16:35 ICT, word for word):
 * "2. The horizontal logo is a nice idea, but it covers important elements of almost every cover
 * picture. Put it on the back cover, instead, where's there's no conflict."
 *
 * The PM order of 2026-11-11 (the part of this file, word for word): "NEW TEST (standing, every cover
 * kind): no chrome element (plaque, pill, bar, tile) covers a face or a head of a figure, or the dog.
 * Your method; PM default: hand-marked head boxes per picture in a JSON beside pictures.json, and a
 * box-overlap test against the chrome boxes of the build report."
 *
 * The pins of this file:
 *   H0: `content/storytime/l2/print/pictures-heads.json` holds 31 entries: the 3 book art files of
 *       `quest.json` and the colour file and the line file of the 14 reader covers of
 *       `questReaders()`. The width and the height of each entry equal the pixel size of the real
 *       file (the IHDR of the PNG), each box lies inside its picture, each label is a text, and the
 *       back art holds no box.
 *   G7: each head box maps to page millimetres through the art layer of the page (`artLayer` of
 *       `cover-quest.ts`: `object-fit: cover`, centred, on the page box). Chrome measures the box of
 *       each chrome part of each of the 32 shipped pages (the `hlogo` style, the bleed 0). The test
 *       fails when a chrome box and a head box overlap by more than 0 mm. Each failure line names
 *       the page, the part, the label, and the overlap in millimetres.
 *
 * The method notes:
 *   - The chrome box of a part is the union of its painted boxes: an element with a background or a
 *     border, an image, an SVG shape, and a text line. The box of the leaf footer is thus its text
 *     line and its icons, not its full-width line box.
 *   - The render uses a small data URL as the art, so Chrome loads no art file. The mapping takes
 *     the art element box from Chrome and the pixel size from the JSON.
 *   - The teacher front art file is not in the git-ignored picture folder: the build prepares it in
 *     a scratch folder from the Forge file of the PM hand-off, with the same pixels. H0 reads that
 *     Forge file when the picture folder holds no teacher front file.
 *   - The 2 book backs hold Thai contact lines. The file prints no page text.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import {
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestPanelValue,
    type QuestReaderRow,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';

/** The art string of the renders. Chrome loads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The render options of the shipped style: the horizontal logo style, and the bleed 0. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The head box file, beside `pictures.json`. */
const HEADS_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-heads.json');

/** The git-ignored picture folder of Level 2. */
const PICTURES_DIR = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');

/** The files that the build prepares outside the picture folder, by the name of the art. */
const PREPARED_SOURCES: Record<string, string> = {
    'l2-u1-cover-quest-teacher-front-v1-300ppi.png': path.join(
        os.homedir(),
        'Desktop',
        'handoff',
        'storytime-cover-teacher-front-forge',
        'l2-u1-cover-quest-teacher-front-forge-v1.png',
    ),
};

/** The count of the entries of the head box file. */
const HEAD_FILE_ENTRIES = 31;

/** The 4 book kinds of this file. */
const BOOK_KINDS = ['student-front', 'teacher-front', 'student-back', 'teacher-back'] as const;

/** The chrome parts of G7. */
const CHROME_PARTS = [
    'logo-tile',
    'title-plaque',
    'week-pill',
    'role-bar',
    'footer',
    'panel',
    'contact-sign',
    'qr',
    'band-pill',
] as const;

/** The row ids of the 14 reader rows, in the order of `questReaders()`. */
const ROW_IDS = [
    'w01-1',
    'w01-2',
    'w02-1',
    'w02-2',
    'w03-1',
    'w03-2',
    'w04-1',
    'w04-2',
    'w05-1',
    'w05-2',
    'w06-1',
    'w06-2',
    'w07-1',
    'w07-2',
] as const;

/** One box in millimetres. */
interface MmBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** One head box of the JSON. */
interface HeadBox {
    /** The name of the head. */
    label: string;
    /** The box in pixels of the file: x0, y0, x1, y1. */
    box: [number, number, number, number];
    /** The key kind: head, dog-body, or title-object (changed 2026-11-11, F3, PM look). */
    kind?: string;
}

/** One entry of the JSON. */
interface HeadEntry {
    /** The width of the file in pixels. */
    widthPx: number;
    /** The height of the file in pixels. */
    heightPx: number;
    /** The head boxes. */
    boxes: HeadBox[];
}

/** One page of the 32 pages. */
interface PageSpec {
    /** The name of the page in the failure lines. */
    id: string;
    /** The art file of the page. */
    artFile: string;
    /** The rendered HTML. */
    html: string;
}

/** The Chrome measure of one page. */
interface RawPage {
    /** The box of the page. */
    pageBox: MmBox | null;
    /** The box of the art element. */
    artBox: MmBox | null;
    /** The computed `object-fit` of the art element. */
    objectFit: string;
    /** The computed `object-position` of the art element. */
    objectPosition: string;
    /** The painted box of each chrome part. */
    parts: { name: string; box: MmBox | null }[];
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the head check. */
let browser: Browser | undefined;

/** The 32 pages of this file. */
let pages: PageSpec[] = [];

/** The Chrome measures of the 32 pages. */
const measures = new Map<string, RawPage>();

/**
 * Reads the head box file.
 * @returns The entries by file name.
 */
function readHeads(): Record<string, HeadEntry> {
    expect(fs.existsSync(HEADS_FILE), `The head box file ${HEADS_FILE} exists.`).toBe(true);
    return JSON.parse(fs.readFileSync(HEADS_FILE, 'utf8')) as Record<string, HeadEntry>;
}

/**
 * Reads the pixel size of one PNG file from its IHDR chunk.
 * @param file The PNG file.
 * @returns The size, or null when the file is not a PNG.
 */
function pngSize(file: string): { widthPx: number; heightPx: number } | null {
    const handle = fs.openSync(file, 'r');
    try {
        const head = Buffer.alloc(24);
        fs.readSync(handle, head, 0, 24, 0);
        const signature = head.subarray(0, 8).toString('hex');
        if (signature !== '89504e470d0a1a0a' || head.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
        return { widthPx: head.readUInt32BE(16), heightPx: head.readUInt32BE(20) };
    } finally {
        fs.closeSync(handle);
    }
}

/**
 * Finds the real file of one art name.
 * @param name The art file name.
 * @returns The path, or null when no file exists.
 */
function artFileOf(name: string): string | null {
    const shipped = path.join(PICTURES_DIR, name);
    if (fs.existsSync(shipped)) return shipped;
    const prepared = PREPARED_SOURCES[name];
    if (prepared && fs.existsSync(prepared)) return prepared;
    return null;
}

/**
 * Reads the panel values of the shipped Level 2 Unit 1 row.
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
 * Builds the 32 pages of this file, each with the name of its art file.
 * @returns The pages.
 */
function buildPages(): PageSpec[] {
    const built: PageSpec[] = [];
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    const artOf: Record<(typeof BOOK_KINDS)[number], string> = {
        'student-front': book.art.studentFront,
        'teacher-front': book.art.teacherFront,
        'student-back': book.art.back,
        'teacher-back': book.art.back,
    };
    for (const kind of BOOK_KINDS) {
        const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
        built.push({ id: kind, artFile: artOf[kind], html: renderQuestCover(kind, book, assets, HLOGO_OPTIONS) });
    }
    const rows: QuestReaderRow[] = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    for (const [index, row] of rows.entries()) {
        built.push({
            id: `${ROW_IDS[index]} reader-a3`,
            artFile: row.picture.fileName,
            html: renderQuestCover('reader-a3', row, { art: ART }, HLOGO_OPTIONS),
        });
        built.push({
            id: `${ROW_IDS[index]} reader-leaf`,
            artFile: row.picture.lineArtFileName,
            html: renderQuestCover('reader-leaf', row, { art: ART }, HLOGO_OPTIONS),
        });
    }
    return built;
}

/**
 * Opens one rendered page in Chrome and measures the art element and the chrome parts.
 * @param page The browser page.
 * @param html The rendered HTML.
 * @returns The measure.
 */
async function measurePage(page: Page, html: string): Promise<RawPage> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-heads-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    return page.evaluate((chrome: string[]): RawPage => {
        const mm = 25.4 / 96;
        const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'use', 'image'];
        const toMm = (rect: DOMRect): MmBox => ({
            left: rect.left * mm,
            top: rect.top * mm,
            right: rect.right * mm,
            bottom: rect.bottom * mm,
        });
        const boxOf = (element: Element | null): MmBox | null => (element ? toMm(element.getBoundingClientRect()) : null);
        const paintedBox = (root: Element): MmBox | null => {
            const rects: DOMRect[] = [];
            const add = (rect: DOMRect): void => {
                if (rect.width > 0 && rect.height > 0) rects.push(rect);
            };
            for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
                const tag = element.tagName.toLowerCase();
                if (element instanceof SVGElement) {
                    if (SHAPES.includes(tag)) add(element.getBoundingClientRect());
                    continue;
                }
                const style = window.getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                const background = style.backgroundColor.replace(/\s+/g, '');
                const hasBackground =
                    (background !== 'transparent' && background !== 'rgba(0,0,0,0)') || style.backgroundImage !== 'none';
                const hasBorder = (['Top', 'Right', 'Bottom', 'Left'] as const).some(
                    (side) =>
                        Number.parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
                        style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none',
                );
                if (hasBackground || hasBorder || tag === 'img') add(element.getBoundingClientRect());
            }
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                for (const rect of Array.from(range.getClientRects())) add(rect);
            }
            if (rects.length === 0) return null;
            return {
                left: Math.min(...rects.map((rect) => rect.left)) * mm,
                top: Math.min(...rects.map((rect) => rect.top)) * mm,
                right: Math.max(...rects.map((rect) => rect.right)) * mm,
                bottom: Math.max(...rects.map((rect) => rect.bottom)) * mm,
            };
        };
        const art = document.querySelector('[data-part="art"]');
        const artStyle = art ? window.getComputedStyle(art) : null;
        const parts: { name: string; box: MmBox | null }[] = [];
        for (const name of chrome) {
            for (const element of Array.from(document.querySelectorAll(`[data-part="${name}"]`))) {
                parts.push({ name, box: paintedBox(element) });
            }
        }
        return {
            pageBox: boxOf(document.querySelector('.quest-page')),
            artBox: boxOf(art),
            objectFit: artStyle ? artStyle.objectFit : '',
            objectPosition: artStyle ? artStyle.objectPosition : '',
            parts,
        };
    }, [...CHROME_PARTS]);
}

/**
 * Maps one head box of the art file to page millimetres through the art element: `object-fit:
 * cover` scales the file by the larger of the 2 ratios and centres it on the art element box.
 * @param box The head box in pixels.
 * @param entry The entry of the art file.
 * @param art The art element box in millimetres.
 * @returns The head box in page millimetres.
 */
function headBoxMm(box: HeadBox['box'], entry: HeadEntry, art: MmBox, position = '50% 50%'): MmBox {
    const widthMm = art.right - art.left;
    const heightMm = art.bottom - art.top;
    const scale = Math.max(widthMm / entry.widthPx, heightMm / entry.heightPx);
    // changed 2026-11-11 (F3, PM look): the mapping reads the computed object-position (a percentage
    // or a length in px), because the Q1 default of quest-cover-f3f6.test.ts aligns one A3 art bottom.
    const share = (token: string | undefined, free: number): number =>
        token && token.endsWith('px') ? Number.parseFloat(token) * (25.4 / 96) : (free * Number.parseFloat(token ?? '50%')) / 100;
    const tokens = position.trim().split(/\s+/);
    const offsetX = art.left + share(tokens[0], widthMm - entry.widthPx * scale);
    const offsetY = art.top + share(tokens[1] ?? tokens[0], heightMm - entry.heightPx * scale);
    return {
        left: offsetX + box[0] * scale,
        top: offsetY + box[1] * scale,
        right: offsetX + box[2] * scale,
        bottom: offsetY + box[3] * scale,
    };
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    const active = browser;
    if (!active) throw new Error('the browser of the head check did not start');
    pages = buildPages();
    expect(pages.length, 'the file holds 32 pages.').toBe(32);
    const context = await active.newContext({ viewport: { width: 1700, height: 1300 } });
    const page = await context.newPage();
    try {
        for (const spec of pages) {
            measures.set(spec.id, await measurePage(page, spec.html));
        }
    } finally {
        await context.close();
    }
}, 600_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-heads: H0 and G7 (Red, no chrome part covers a head on the 32 shipped pages)', () => {
    it('H0: pictures-heads.json holds the 31 art files with their real pixel size and boxes inside each picture', () => {
        const heads = readHeads();
        const problems: string[] = [];
        const names = Object.keys(heads);
        const wanted = new Set(pages.map((spec) => spec.artFile));
        console.log(`HEAD_FILE_ENTRIES=${names.length} ART_FILES_OF_PAGES=${wanted.size}`);
        if (names.length !== HEAD_FILE_ENTRIES) {
            problems.push(`the file holds ${names.length} entries (the pin is ${HEAD_FILE_ENTRIES}).`);
        }
        for (const name of wanted) {
            if (!(name in heads)) problems.push(`${name}: the art file of a shipped page has no entry.`);
        }
        let boxes = 0;
        for (const [name, entry] of Object.entries(heads)) {
            if (!wanted.has(name)) problems.push(`${name}: the entry is not the art file of a shipped page.`);
            const file = artFileOf(name);
            if (!file) {
                problems.push(`${name}: no real file exists in the picture folder or in the prepared sources.`);
            } else {
                const size = pngSize(file);
                if (!size) {
                    problems.push(`${name}: the real file is not a PNG.`);
                } else if (size.widthPx !== entry.widthPx || size.heightPx !== entry.heightPx) {
                    problems.push(
                        `${name}: the entry is ${entry.widthPx} x ${entry.heightPx} px and the real file is ` +
                            `${size.widthPx} x ${size.heightPx} px.`,
                    );
                }
            }
            if (!Array.isArray(entry.boxes)) {
                problems.push(`${name}: the entry holds no box list.`);
                continue;
            }
            for (const head of entry.boxes) {
                boxes += 1;
                if (typeof head.label !== 'string' || head.label.trim() === '') {
                    problems.push(`${name}: a box holds no label.`);
                }
                // changed 2026-11-11 (F3, PM look): each box names its key kind.
                if (!['head', 'dog-body', 'title-object'].includes(head.kind ?? '')) {
                    problems.push(`${name} "${head.label}": the kind "${String(head.kind)}" is not head, dog-body, or title-object.`);
                }
                const [x0, y0, x1, y1] = head.box;
                const inside =
                    head.box.length === 4 &&
                    head.box.every((value) => Number.isFinite(value)) &&
                    x0 >= 0 &&
                    y0 >= 0 &&
                    x1 > x0 &&
                    y1 > y0 &&
                    x1 <= entry.widthPx &&
                    y1 <= entry.heightPx;
                if (!inside) {
                    problems.push(
                        `${name} "${head.label}": the box ${JSON.stringify(head.box)} is not inside the picture of ` +
                            `${entry.widthPx} x ${entry.heightPx} px.`,
                    );
                }
            }
        }
        const back = loadQuestCovers().books[0].art.back;
        if ((heads[back]?.boxes.length ?? -1) !== 0) {
            problems.push(`${back}: the back art holds ${heads[back]?.boxes.length ?? 'no'} boxes (the pin is 0).`);
        }
        console.log(`HEAD_BOXES=${boxes}`);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G7: no chrome part box overlaps a head box on any of the 32 shipped pages', () => {
        const heads = readHeads();
        const problems: string[] = [];
        const overlaps: string[] = [];
        const byPart = new Map<string, number>();
        let checked = 0;
        for (const spec of pages) {
            const raw = measures.get(spec.id);
            const entry = heads[spec.artFile];
            if (!raw || !raw.artBox || !raw.pageBox) {
                problems.push(`${spec.id}: the browser holds no art box or no page box.`);
                continue;
            }
            if (!entry) {
                problems.push(`${spec.id}: the head box file holds no entry for ${spec.artFile}.`);
                continue;
            }
            // changed 2026-11-11 (F3, PM look): the mapping reads any object-position; the aspect rule stays cover.
            if (raw.objectFit !== 'cover') {
                problems.push(`${spec.id}: the art element is object-fit ${raw.objectFit} (the mapping needs cover).`);
                continue;
            }
            for (const head of entry.boxes) {
                const headMm = headBoxMm(head.box, entry, raw.artBox, raw.objectPosition);
                for (const part of raw.parts) {
                    checked += 1;
                    if (!part.box) continue;
                    const width = Math.min(part.box.right, headMm.right) - Math.max(part.box.left, headMm.left);
                    const height = Math.min(part.box.bottom, headMm.bottom) - Math.max(part.box.top, headMm.top);
                    if (width > 0 && height > 0) {
                        byPart.set(part.name, (byPart.get(part.name) ?? 0) + 1);
                        overlaps.push(
                            `HEAD-OVERLAP ${spec.id} ${part.name} "${head.label}": ${width.toFixed(2)} mm x ` +
                                `${height.toFixed(2)} mm (head ${headMm.left.toFixed(1)} to ${headMm.right.toFixed(1)} mm ` +
                                `by ${headMm.top.toFixed(1)} to ${headMm.bottom.toFixed(1)} mm; part ` +
                                `${part.box.left.toFixed(1)} to ${part.box.right.toFixed(1)} mm by ` +
                                `${part.box.top.toFixed(1)} to ${part.box.bottom.toFixed(1)} mm).`,
                        );
                    }
                }
            }
        }
        for (const line of overlaps) console.log(line);
        const summary = [...byPart.entries()].map(([name, count]) => `${name} ${count}`).join(', ') || 'none';
        console.log(`HEAD_PAIRS_CHECKED=${checked} HEAD_OVERLAPS=${overlaps.length} BY_PART: ${summary}`);
        expect(checked, 'the check reads at least one head and part pair.').toBeGreaterThan(0);
        expect([...problems, ...overlaps], [...problems, ...overlaps].join('\n')).toEqual([]);
    });
});

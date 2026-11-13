// @vitest-environment jsdom
/**
 * Red of the priority fix F1 and F2 of Daniel's look of 2026-11-11 (track
 * storytime_cover_options_20261106, Phase 2, the Task (Red, F1 F2 and heads) pair of 2026-11-11).
 *
 * The owner words (Daniel, Google Tasks OE9xdmthbHJjX2tmWmtubQ, 2026-11-11 16:35 ICT, word for word):
 * "1. The coloring pages have a frame which is not a real frame. It is not lined up with the chrome.
 * The image exists both inside and outside the frame. It seems worse than pointless. 2. The
 * horizontal logo is a nice idea, but it covers important elements of almost every cover picture.
 * Put it on the back cover, instead, where's there's no conflict."
 *
 * The PM order of 2026-11-11 (word for word): "F1 (leaf covers, the black-and-white coloring pages,
 * 14 files): remove the double-line frame with round corners. The line art fills the page as it
 * does now. Test: no frame element in the leaf HTML. Also check every framed picture on the reader
 * inside pages: the art is clipped inside its frame, with no art outside it. Report the count of
 * pages checked and the count that failed. F2 (horizontal logo): remove the logo plaque from every
 * FRONT: the student front, the teacher front, the 14 A3 reader covers and the 14 leaf covers. No
 * other chrome moves into its place. The book backs keep their logo tile (r3 back). Each reader gets
 * the horizontal logo on its BACK COVER (page 12, the word-list page) in free space: color logo on
 * the A3 version, gray K-only logo on the workbook leaf. Apply the 5 cover rules to it (logo by hash,
 * about 80 % fill of its tile, centered, logo colors). Page 12 can belong to the templates of
 * storytime_print_r1. Pick the track and the task in your repo; PM default: Task 2.9 part 8 of
 * storytime_cover_options, with the page-12 path added to its allowed list."
 *
 * The pins of this file (the shipped style `top: 'hlogo'`, the bleed 0; the default style keeps its
 * bytes, and the older files pin it):
 *   G1 (F1): the hlogo leaf cover holds no `double-line-frame` part and no other frame element: no
 *       element that draws a border line or a stroke around the art (a box of at least half the page
 *       width and half the page height). The art layer still covers the page.
 *   G2 (F1 check, a guard): every framed picture of the reader pages of `compileStorytimeReaders`
 *       (the 14 readers of weeks 1 to 7, the outputs `workbook` and `a3-color`, final mode) holds at
 *       most one `img`, its computed `overflow` is `hidden`, and the image box lies inside the frame
 *       box. The test prints `FRAMED_PAGES_CHECKED=<n> FRAMED_PAGES_FAILED=<n>`.
 *   G3 (F2 fronts): the hlogo student front, teacher front, 14 reader-a3 and 14 reader-leaf renders
 *       hold 0 `logo-tile` parts. The set of `data-part` values of each front is the r3 set minus
 *       `logo-tile` (and minus `double-line-frame` on the leaf), and no part box enters the r3 tile
 *       box.
 *   G4 (F2 backs): the 2 hlogo book backs keep their logo tile and every r3 part: the SHA-256 of the
 *       2 renders equals the pin of the role base d3a581ec.
 *   G5 (F2 page 12): page 12 of each reader holds one `logo-tile` part with one `img`: the colour
 *       logo on the amber tile on `a3-color`, the K logo on the gray tile on `workbook`. The tile is
 *       78.8 mm x 25.5 mm at reader page scale, centred across the page within 1 mm, at least 5 mm
 *       below the word row, at least 5 mm above the bottom edge, and clear of the footer. The logo
 *       fills 78 % to 82 % of the inner tile height and stands at the tile centre within 1 mm. Page
 *       12 holds 0 band words; the series line, the heading, and the word row stay.
 *   G6 (the standing rules follow F2): `quest-cover-standing-rules.test.ts` holds the changed S1 and
 *       the page 12 scope of S2, S4, and S5. This file guards the source of that change only.
 *
 * The F10 change of 2026-11-13 (the r6 book covers):
 *   (1) G3 changes for the 2 book fronts. The part set of each front adds "front-title", and the r3
 *       tile box rule skips that part, because the title plate stands in the tile box. Every other
 *       part still stays out of the tile box, and the 28 reader fronts keep their part set.
 *
 * The method notes:
 *   - G2 and G5 share one Chrome page and one document for each output and week (14 documents).
 *     The documents use final mode, so each picture frame holds its `img`. The test replaces the
 *     source of each picture `img` with a 1 x 1 PNG data URL before Chrome opens the document, so
 *     Chrome loads no art file. The page 12 logo keeps its file source.
 *   - The a3-color output scales the reader page by 2.0. G5 divides each measure by the scale of the
 *     page box, so every value is at reader page scale.
 *   - The file prints reader ids, millimetres, counts, colours, and hashes only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import {
    QUEST_BANDS,
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestCoverKind,
    type QuestPanelValue,
    type QuestReaderRow,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';
import { compileStorytimeReaders, type StorytimeReaderOutput } from '../lib/storytime/print/readers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import type { StorytimeWeek } from '../lib/storytime/schema';

/** The art string of the cover renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The 1 x 1 PNG that replaces each picture source of the reader documents. */
const TINY_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** The render options of the shipped style: the horizontal logo style, and the bleed 0. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The 2 book front kinds. */
const BOOK_FRONTS = ['student-front', 'teacher-front'] as const;

/** The 2 book back kinds. */
const BOOK_BACKS = ['student-back', 'teacher-back'] as const;

/** The SHA-256 of the 2 hlogo book back renders at the role base d3a581ec. */
const BACK_SHA_PINS: Record<(typeof BOOK_BACKS)[number], string> = {
    'student-back': '5a17085f221416481873bb0dea129711727bf4e399ddf26c8f5e31fe92093fbc',
    'teacher-back': 'f7666628f955c41d946ce50df11b1ffa366693e2542f7e962ccec165a1f43fab',
};

/** The `data-part` sets of the hlogo renders at the role base d3a581ec (r3). */
const R3_PARTS: Record<string, string[]> = {
    'student-front': ['art', 'book-line', 'level-line', 'logo-tile', 'plaque-sep', 'title-plaque'],
    'teacher-front': ['art', 'book-line', 'level-line', 'logo-tile', 'plaque-sep', 'title-plaque'],
    'student-back': [
        'art',
        'contact-line',
        'contact-sign',
        'line-label',
        'logo-tile',
        'panel',
        'panel-field',
        'panel-heading',
        'panel-value',
        'publisher-mark',
        'qr',
    ],
    'teacher-back': ['art', 'contact-line', 'contact-sign', 'line-label', 'logo-tile', 'publisher-mark', 'qr'],
    'reader-a3': ['art', 'logo-tile', 'role-bar', 'title-plaque', 'week-pill'],
    'reader-leaf': ['art', 'double-line-frame', 'footer', 'logo-tile', 'role-mark', 'series', 'title-plaque', 'week'],
};

/** The r3 logo tile box of each front kind at the bleed 0, in millimetres: left, top, width, height. */
const R3_TILE_BOXES: Record<string, [number, number, number, number]> = {
    'student-front': [21.4, 12, 167.2, 54],
    'teacher-front': [21.4, 12, 167.2, 54],
    'reader-a3': [126.4, 12, 167.2, 54],
    'reader-leaf': [59.6, 5.7, 78.8, 25.5],
};

/**
 * The covers whose default chrome comes within 1 mm of a key box at the role base f2a2a1d9, so that
 * the F3 placement moves it (changed 2026-11-11, F3, PM look; the D3 test of
 * quest-cover-f3f6.test.ts reads the same covers).
 */
const F3_MOVED_COVERS: string[] = [
    'w01-2 reader-a3',
    'w01-2 reader-leaf',
    'w07-1 reader-a3',
    'w07-1 reader-leaf',
    'w07-2 reader-a3',
    'w07-2 reader-leaf',
];

/** The pins of the page 12 logo tile of each output. */
const PAGE12_TILE: Record<StorytimeReaderOutput, { file: string; sha: string; fill: string; border: string }> = {
    'a3-color': {
        file: 'storytime-advantage-horizontal.svg',
        sha: '3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc',
        fill: '#fcd34d',
        border: '#92400e',
    },
    workbook: {
        file: 'storytime-advantage-horizontal-k.svg',
        sha: '93e1eef8aaa890f61f16564a09c9c9bf6b6f330da63a0cfaffed2fe0c9922489',
        fill: '#d2d2d2',
        border: '#4e4e4e',
    },
};

/** The page 12 tile box at reader page scale, in millimetres. */
const PAGE12_TILE_WIDTH_MM = 78.8;

/** The page 12 tile height at reader page scale, in millimetres. */
const PAGE12_TILE_HEIGHT_MM = 25.5;

/** The tolerance of the page 12 tile size, in millimetres. */
const SIZE_TOLERANCE_MM = 0.2;

/** The tolerance of the centring checks, in millimetres. */
const CENTRE_TOLERANCE_MM = 1;

/** The least free space around the page 12 tile, in millimetres. */
const CLEARANCE_MM = 5;

/** The least share of the inner tile height that the logo fills. */
const MIN_FILL = 0.78;

/** The most share of the inner tile height that the logo fills. */
const MAX_FILL = 0.82;

/** The reader page width at reader page scale, in millimetres. */
const READER_PAGE_WIDTH_MM = STORYTIME_PRINT_PROFILE.readerPage.widthMm;

/** The share of the page width and of the page height from which a lined box is a frame element. */
const FRAME_SHARE = 0.5;

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

/** The 2 reader outputs. */
const OUTPUTS: StorytimeReaderOutput[] = ['workbook', 'a3-color'];

/** The standing rules file that G6 reads. */
const STANDING_FILE = path.join(__dirname, 'quest-cover-standing-rules.test.ts');

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

/** One cover page of G1 and G3. */
interface CoverSpec {
    /** The name of the page in the failure lines. */
    id: string;
    /** The cover kind. */
    kind: QuestCoverKind;
    /** The rendered HTML. */
    html: string;
}

/** The Chrome measure of one cover page. */
interface CoverMeasure {
    /** The box of the page. */
    pageBox: MmBox | null;
    /** The box of the art element. */
    artBox: MmBox | null;
    /** The computed `object-fit` of the art element. */
    objectFit: string;
    /** The frame elements: each lined element of at least half the page width and height. */
    frames: string[];
    /** The box of each part outside the art. */
    parts: { name: string; box: MmBox }[];
}

/** The Chrome measure of one framed picture. */
interface PictureMeasure {
    /** The count of the `img` elements in the frame. */
    images: number;
    /** The computed `overflow-x` of the frame. */
    overflowX: string;
    /** The computed `overflow-y` of the frame. */
    overflowY: string;
    /** The box of the frame. */
    frameBox: MmBox;
    /** The boxes of the images. */
    imageBoxes: MmBox[];
}

/** The Chrome measure of one reader page with a framed picture. */
interface FramedPage {
    /** The index of the reader in the document. */
    reader: number;
    /** The page number. */
    number: number;
    /** The width of the page box, in millimetres. */
    pageWidthMm: number;
    /** The framed pictures. */
    pictures: PictureMeasure[];
}

/** The Chrome measure of one page 12. */
interface Page12Measure {
    /** The index of the reader in the document. */
    reader: number;
    /** The box of the page. */
    pageBox: MmBox;
    /** The count of the logo tiles. */
    tiles: number;
    /** The box of the first tile. */
    tileBox: MmBox | null;
    /** The computed background colour of the first tile. */
    tileFill: string;
    /** The computed border colours of the first tile: top, right, bottom, left. */
    borderColours: string[];
    /** The computed border widths of the first tile in millimetres: top, right, bottom, left. */
    borderWidths: number[];
    /** The computed border styles of the first tile. */
    borderStyles: string[];
    /** The count of the images in the first tile. */
    images: number;
    /** The source of the first image. */
    imageSrc: string;
    /** The box of the first image. */
    imageBox: MmBox | null;
    /** The box of the word row. */
    wordRowBox: MmBox | null;
    /** The count of the words in the word row. */
    words: number;
    /** The painted box of the footer: its text lines. */
    footerBox: MmBox | null;
    /** The count of the `.reader-band` elements. */
    bandLines: number;
    /** The texts of the `.reader-series` elements. */
    series: string[];
    /** The texts of the `.reader-heading` elements. */
    headings: string[];
    /** The trimmed lower case text nodes of the page. */
    texts: string[];
}

/** The Chrome measure of one reader document. */
interface ReaderMeasure {
    /** The pages with a framed picture. */
    framed: FramedPage[];
    /** The page 12 of each reader. */
    page12: Page12Measure[];
}

/** One reader document of G2 and G5. */
interface ReaderDoc {
    /** The week. */
    week: number;
    /** The output. */
    output: StorytimeReaderOutput;
    /** The count of the picture sources that the test replaced. */
    replaced: number;
    /** The Chrome measure. */
    measure: ReaderMeasure;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of this file. */
let browser: Browser | undefined;

/** The cover pages of G1 and G3. */
let covers: CoverSpec[] = [];

/** The Chrome measures of the cover pages. */
const coverMeasures = new Map<string, CoverMeasure>();

/** The reader documents of G2 and G5. */
const readerDocs: ReaderDoc[] = [];

/**
 * Converts a computed colour to a lower case hex value.
 * @param value The computed colour.
 * @returns The hex value, or the lower case text when the value is not an rgb value.
 */
function toHex(value: string): string {
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (!match) return value.trim().toLowerCase();
    return `#${[match[1], match[2], match[3]].map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Reads the SHA-256 of a text or a file.
 * @param data The text or the file bytes.
 * @returns The hash.
 */
function sha256(data: string | Buffer): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The rendered HTML parses.').toBeNull();
    return doc;
}

/**
 * Reads the sorted set of the `data-part` values of one render.
 * @param html The rendered HTML.
 * @returns The set as a sorted list.
 */
function partSet(html: string): string[] {
    const doc = parseHtml(html);
    return [...new Set(Array.from(doc.querySelectorAll('[data-part]'), (element) => element.getAttribute('data-part') ?? ''))].sort();
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
 * Renders one book side in the shipped style.
 * @param kind The book kind.
 * @returns The HTML.
 */
function renderBook(kind: (typeof BOOK_FRONTS)[number] | (typeof BOOK_BACKS)[number]): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
    return renderQuestCover(kind, book, assets, HLOGO_OPTIONS);
}

/**
 * Builds the 30 front pages of G1 and G3.
 * @returns The pages.
 */
function buildCovers(): CoverSpec[] {
    const built: CoverSpec[] = BOOK_FRONTS.map((kind) => ({ id: kind, kind, html: renderBook(kind) }));
    const rows: QuestReaderRow[] = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    for (const [index, row] of rows.entries()) {
        built.push({ id: `${ROW_IDS[index]} reader-a3`, kind: 'reader-a3', html: renderQuestCover('reader-a3', row, { art: ART }, HLOGO_OPTIONS) });
        built.push({ id: `${ROW_IDS[index]} reader-leaf`, kind: 'reader-leaf', html: renderQuestCover('reader-leaf', row, { art: ART }, HLOGO_OPTIONS) });
    }
    return built;
}

/**
 * Reads the 7 shipped weeks of the readers.
 * @returns The weeks 1 to 7.
 */
function readerWeeks(): StorytimeWeek[] {
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2)
        .flatMap((entry) => (entry.week ? [entry.week] : []))
        .filter((week) => week.meta.week >= 1 && week.meta.week <= 7);
    expect(weeks.length, 'Level 2 holds the weeks 1 to 7.').toBe(7);
    return weeks;
}

/**
 * Writes one HTML text to a scratch file and opens it in Chrome.
 * @param page The browser page.
 * @param html The HTML.
 * @returns Nothing.
 */
async function openHtml(page: Page, html: string): Promise<void> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f1f2-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
}

/**
 * Measures one cover page in Chrome: the art box, the frame elements, and the part boxes.
 * @param page The browser page.
 * @param html The rendered HTML.
 * @returns The measure.
 */
async function measureCover(page: Page, html: string): Promise<CoverMeasure> {
    await openHtml(page, html);
    return page.evaluate((share: number): CoverMeasure => {
        const mm = 25.4 / 96;
        const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];
        const toMm = (rect: DOMRect): MmBox => ({ left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm });
        const root = document.querySelector('.quest-page');
        const art = document.querySelector('[data-part="art"]');
        const pageRect = root ? root.getBoundingClientRect() : null;
        const frames: string[] = [];
        if (root && pageRect) {
            for (const element of Array.from(root.querySelectorAll('*'))) {
                if (element === art) continue;
                const rect = element.getBoundingClientRect();
                if (rect.width < share * pageRect.width || rect.height < share * pageRect.height) continue;
                const style = window.getComputedStyle(element);
                const tag = element.tagName.toLowerCase();
                let lined = false;
                if (element instanceof SVGElement) {
                    lined = SHAPES.includes(tag) && style.stroke !== 'none' && Number.parseFloat(style.strokeWidth) > 0;
                } else {
                    lined =
                        (['top', 'right', 'bottom', 'left'] as const).some(
                            (side) =>
                                Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
                                style.getPropertyValue(`border-${side}-style`) !== 'none',
                        ) ||
                        (Number.parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none') ||
                        style.boxShadow !== 'none';
                }
                if (lined) {
                    const holder = element.closest('[data-part]');
                    frames.push(
                        `<${tag}> in the part ${holder ? holder.getAttribute('data-part') : 'none'}, ` +
                            `${(rect.width * mm).toFixed(1)} mm x ${(rect.height * mm).toFixed(1)} mm`,
                    );
                }
            }
        }
        const parts: { name: string; box: MmBox }[] = [];
        for (const element of Array.from(document.querySelectorAll('[data-part]'))) {
            const name = element.getAttribute('data-part') ?? '';
            if (name === 'art') continue;
            parts.push({ name, box: toMm(element.getBoundingClientRect()) });
        }
        return {
            pageBox: pageRect ? toMm(pageRect) : null,
            artBox: art ? toMm(art.getBoundingClientRect()) : null,
            objectFit: art ? window.getComputedStyle(art).objectFit : '',
            frames,
            parts,
        };
    }, FRAME_SHARE);
}

/**
 * Measures one reader document in Chrome: the framed pictures and the page 12 of each reader.
 * @param page The browser page.
 * @param html The reader document.
 * @returns The measure.
 */
async function measureReaders(page: Page, html: string): Promise<ReaderMeasure> {
    await openHtml(page, html);
    return page.evaluate((): ReaderMeasure => {
        const mm = 25.4 / 96;
        const toMm = (rect: DOMRect): MmBox => ({ left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm });
        const boxOf = (element: Element | null): MmBox | null => (element ? toMm(element.getBoundingClientRect()) : null);
        const textBox = (element: Element | null): MmBox | null => {
            if (!element) return null;
            const rects: DOMRect[] = [];
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                rects.push(...Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0));
            }
            if (rects.length === 0) return null;
            return {
                left: Math.min(...rects.map((rect) => rect.left)) * mm,
                top: Math.min(...rects.map((rect) => rect.top)) * mm,
                right: Math.max(...rects.map((rect) => rect.right)) * mm,
                bottom: Math.max(...rects.map((rect) => rect.bottom)) * mm,
            };
        };
        const readers = Array.from(document.querySelectorAll('.reader-leaf[data-reader-title], .reader-book[data-reader-title]'));
        const titles = [...new Set(readers.map((element) => element.getAttribute('data-reader-title') ?? ''))];
        const readerOf = (element: Element): number => {
            const holder = element.closest('[data-reader-title]');
            return titles.indexOf(holder ? (holder.getAttribute('data-reader-title') ?? '') : '');
        };
        const framed: FramedPage[] = [];
        const page12: Page12Measure[] = [];
        for (const readerPage of Array.from(document.querySelectorAll('.reader-page'))) {
            const number = Number(readerPage.getAttribute('data-page-number'));
            const pageRect = readerPage.getBoundingClientRect();
            const pictures = Array.from(readerPage.querySelectorAll('.reader-picture'));
            if (pictures.length > 0) {
                framed.push({
                    reader: readerOf(readerPage),
                    number,
                    pageWidthMm: pageRect.width * mm,
                    pictures: pictures.map((picture) => {
                        const style = window.getComputedStyle(picture);
                        const images = Array.from(picture.querySelectorAll('img'));
                        return {
                            images: images.length,
                            overflowX: style.overflowX,
                            overflowY: style.overflowY,
                            frameBox: toMm(picture.getBoundingClientRect()),
                            imageBoxes: images.map((image) => toMm(image.getBoundingClientRect())),
                        };
                    }),
                });
            }
            if (number !== 12) continue;
            const tiles = Array.from(readerPage.querySelectorAll('[data-part="logo-tile"]'));
            const tile = tiles[0] ?? null;
            const tileStyle = tile ? window.getComputedStyle(tile) : null;
            const sides = ['top', 'right', 'bottom', 'left'] as const;
            const images = tile ? Array.from(tile.querySelectorAll('img')) : [];
            const row = readerPage.querySelector('[data-part="reader-back-words"]');
            const texts: string[] = [];
            const walker = document.createTreeWalker(readerPage, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const text = ((walker.currentNode as Text).nodeValue ?? '').trim().toLowerCase();
                if (text) texts.push(text);
            }
            page12.push({
                reader: readerOf(readerPage),
                pageBox: toMm(pageRect),
                tiles: tiles.length,
                tileBox: boxOf(tile),
                tileFill: tileStyle ? tileStyle.backgroundColor : '',
                borderColours: tileStyle ? sides.map((side) => tileStyle.getPropertyValue(`border-${side}-color`)) : [],
                borderWidths: tileStyle ? sides.map((side) => Number.parseFloat(tileStyle.getPropertyValue(`border-${side}-width`)) * mm) : [],
                borderStyles: tileStyle ? sides.map((side) => tileStyle.getPropertyValue(`border-${side}-style`)) : [],
                images: images.length,
                imageSrc: images[0] ? (images[0].getAttribute('src') ?? '') : '',
                imageBox: boxOf(images[0] ?? null),
                wordRowBox: boxOf(row),
                words: row ? row.querySelectorAll('.reader-word').length : 0,
                footerBox: textBox(readerPage.querySelector('[data-part="reader-footer"]')),
                bandLines: readerPage.querySelectorAll('.reader-band').length,
                series: Array.from(readerPage.querySelectorAll('.reader-series'), (element) => (element.textContent ?? '').trim()),
                headings: Array.from(readerPage.querySelectorAll('.reader-heading'), (element) => (element.textContent ?? '').trim()),
                texts,
            });
        }
        return { framed, page12 };
    });
}

/**
 * Replaces the source of each picture `img` of a reader document with the 1 x 1 PNG.
 * @param html The reader document.
 * @returns The new document and the count of the replaced sources.
 */
function withTinyPictures(html: string): { html: string; replaced: number } {
    let replaced = 0;
    const next = html.replace(/(<div class="reader-picture"[^>]*><img src=")[^"]*(")/g, (_match, open: string, close: string) => {
        replaced += 1;
        return `${open}${TINY_PNG}${close}`;
    });
    return { html: next, replaced };
}

/**
 * Tells whether 2 boxes overlap with a positive area.
 * @param one The first box.
 * @param two The second box.
 * @returns True when the boxes overlap.
 */
function overlaps(one: MmBox, two: MmBox): boolean {
    return Math.min(one.right, two.right) - Math.max(one.left, two.left) > 0 && Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top) > 0;
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    const active = browser;
    if (!active) throw new Error('the browser of the F1 F2 check did not start');
    covers = buildCovers();
    expect(covers.length, 'the file holds 30 front pages.').toBe(30);
    const context = await active.newContext({ viewport: { width: 1700, height: 1300 } });
    const page = await context.newPage();
    try {
        for (const spec of covers) coverMeasures.set(spec.id, await measureCover(page, spec.html));
        for (const week of readerWeeks()) {
            for (const output of OUTPUTS) {
                const compiled = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output });
                const tiny = withTinyPictures(compiled.html);
                readerDocs.push({ week: week.meta.week, output, replaced: tiny.replaced, measure: await measureReaders(page, tiny.html) });
            }
        }
    } finally {
        await context.close();
    }
}, 900_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-f1f2: G1 to G6 (Red, F1 and F2 of the look of 2026-11-11)', () => {
    it('G1: the hlogo leaf cover holds no frame element, and the art layer still covers the page', () => {
        const problems: string[] = [];
        const leaves = covers.filter((spec) => spec.kind === 'reader-leaf');
        expect(leaves.length, 'the file holds 14 leaf covers.').toBe(14);
        for (const spec of leaves) {
            const frameParts = parseHtml(spec.html).querySelectorAll('[data-part="double-line-frame"]').length;
            if (frameParts !== 0) problems.push(`${spec.id}: the leaf holds ${frameParts} double-line-frame parts (the pin is 0).`);
            const raw = coverMeasures.get(spec.id);
            if (!raw || !raw.pageBox || !raw.artBox) {
                problems.push(`${spec.id}: the browser holds no page box or no art box.`);
                continue;
            }
            for (const frame of raw.frames) problems.push(`${spec.id}: a frame element draws a line around the art: ${frame}.`);
            const edges = (['left', 'top', 'right', 'bottom'] as const).map((edge) => Math.abs(raw.artBox![edge] - raw.pageBox![edge]));
            if (Math.max(...edges) > 0.1 || raw.objectFit !== 'cover') {
                problems.push(
                    `${spec.id}: the art layer is ${edges.map((edge) => edge.toFixed(2)).join(', ')} mm from the page edges ` +
                        `with object-fit ${raw.objectFit} (the pin is the page box within 0.1 mm, cover).`,
                );
            }
        }
        console.log(`G1 leaf covers 14, problems ${problems.length}`);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G2: every framed picture of the reader pages holds one image at most and clips it inside its frame', () => {
        const problems: string[] = [];
        let checked = 0;
        let failed = 0;
        let pictures = 0;
        expect(readerDocs.length, 'the file holds 14 reader documents.').toBe(14);
        for (const doc of readerDocs) {
            const framedPictures = doc.measure.framed.reduce((sum, entry) => sum + entry.pictures.length, 0);
            if (doc.replaced !== framedPictures) {
                problems.push(
                    `week ${doc.week} ${doc.output}: the test replaced ${doc.replaced} picture sources and Chrome holds ` +
                        `${framedPictures} framed pictures.`,
                );
            }
            for (const entry of doc.measure.framed) {
                checked += 1;
                const scale = entry.pageWidthMm / READER_PAGE_WIDTH_MM;
                const tolerance = 0.05 * scale;
                const before = problems.length;
                for (const picture of entry.pictures) {
                    pictures += 1;
                    const id = `week ${doc.week} ${doc.output} reader ${entry.reader + 1} page ${entry.number}`;
                    if (picture.images > 1) problems.push(`${id}: the frame holds ${picture.images} images (the pin is 1 at most).`);
                    if (picture.overflowX !== 'hidden' || picture.overflowY !== 'hidden') {
                        problems.push(`${id}: the frame overflow is ${picture.overflowX} ${picture.overflowY} (the pin is hidden).`);
                    }
                    for (const image of picture.imageBoxes) {
                        const inside =
                            image.left >= picture.frameBox.left - tolerance &&
                            image.top >= picture.frameBox.top - tolerance &&
                            image.right <= picture.frameBox.right + tolerance &&
                            image.bottom <= picture.frameBox.bottom + tolerance;
                        if (!inside) problems.push(`${id}: the image box lies outside the frame box.`);
                    }
                }
                if (problems.length > before) failed += 1;
            }
        }
        console.log(`FRAMED_PAGES_CHECKED=${checked} FRAMED_PAGES_FAILED=${failed} FRAMED_PICTURES=${pictures}`);
        expect(checked, 'the check reads at least one framed page.').toBeGreaterThan(0);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G3: the 30 hlogo fronts hold no logo tile, and no other part takes the tile box', () => {
        const problems: string[] = [];
        for (const spec of covers) {
            const doc = parseHtml(spec.html);
            const tiles = doc.querySelectorAll('[data-part="logo-tile"]').length;
            if (tiles !== 0) problems.push(`${spec.id}: the front holds ${tiles} logo-tile parts (the pin is 0).`);
            const removed = spec.kind === 'reader-leaf' ? ['logo-tile', 'double-line-frame'] : ['logo-tile'];
            // changed 2026-11-11 (F4, PM look): the hlogo leaf cover adds the white footer strip part.
            // changed 2026-11-13 (F10): the 2 book fronts add the front-title part; the readers keep their part set.
            const added =
                spec.kind === 'reader-leaf'
                    ? ['footer-strip']
                    : spec.kind === 'student-front' || spec.kind === 'teacher-front'
                      ? ['front-title']
                      : [];
            const wanted = [...R3_PARTS[spec.kind].filter((name) => !removed.includes(name)), ...added].sort();
            const found = partSet(spec.html);
            if (JSON.stringify(found) !== JSON.stringify(wanted)) {
                problems.push(`${spec.id}: the part set is ${found.join(', ')} (the pin is ${wanted.join(', ')}).`);
            }
            const raw = coverMeasures.get(spec.id);
            if (!raw) {
                problems.push(`${spec.id}: the browser holds no measure.`);
                continue;
            }
            const [left, top, width, height] = R3_TILE_BOXES[spec.kind];
            const tileBox: MmBox = { left, top, right: left + width, bottom: top + height };
            // changed 2026-11-11 (F3, PM look): where the F3 placement moves the chrome, the key box rule of
            // quest-cover-f3f6.test.ts governs the place, so the r3 tile box rule reads the other covers only.
            if (F3_MOVED_COVERS.includes(spec.id)) continue;
            for (const part of raw.parts) {
                // changed 2026-11-13 (F10): the title plate stands in the r3 tile box, so the rule skips it.
                if (part.name === 'front-title') continue;
                if (overlaps(part.box, tileBox)) {
                    problems.push(
                        `${spec.id}: the part ${part.name} (${part.box.left.toFixed(1)} to ${part.box.right.toFixed(1)} mm by ` +
                            `${part.box.top.toFixed(1)} to ${part.box.bottom.toFixed(1)} mm) enters the r3 tile box.`,
                    );
                }
            }
        }
        console.log(`G3 fronts ${covers.length}, problems ${problems.length}`);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G4: the 2 hlogo book backs keep their logo tile and every r3 part (SHA-256 pins of the role base)', () => {
        const problems: string[] = [];
        for (const kind of BOOK_BACKS) {
            const html = renderBook(kind);
            const hash = sha256(html);
            const tiles = parseHtml(html).querySelectorAll('[data-part="logo-tile"]').length;
            console.log(`G4 ${kind}: sha256 ${hash}, logo tiles ${tiles}`);
            if (hash !== BACK_SHA_PINS[kind]) problems.push(`${kind}: the SHA-256 is ${hash} (the pin is ${BACK_SHA_PINS[kind]}).`);
            if (tiles !== 1) problems.push(`${kind}: the back holds ${tiles} logo tiles (the pin is 1).`);
            const found = partSet(html);
            if (JSON.stringify(found) !== JSON.stringify(R3_PARTS[kind])) {
                problems.push(`${kind}: the part set is ${found.join(', ')} (the pin is ${R3_PARTS[kind].join(', ')}).`);
            }
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G5: page 12 of each reader holds the logo tile in free space, by the 5 cover rules, and no band word', () => {
        const problems: string[] = [];
        let checked = 0;
        for (const doc of readerDocs) {
            const pin = PAGE12_TILE[doc.output];
            for (const entry of doc.measure.page12) {
                checked += 1;
                const id = `week ${doc.week} ${doc.output} reader ${entry.reader + 1} page 12`;
                const scale = (entry.pageBox.right - entry.pageBox.left) / READER_PAGE_WIDTH_MM;
                const at = (value: number): number => value / scale;
                if (entry.bandLines !== 0) problems.push(`${id}: the page holds ${entry.bandLines} reader-band lines (the pin is 0).`);
                const bandTexts = entry.texts.filter((text) => (QUEST_BANDS as readonly string[]).includes(text)).length;
                if (bandTexts !== 0) problems.push(`${id}: the page holds ${bandTexts} band words (the pin is 0).`);
                // changed 2026-11-11 (F6, PM look): page 12 holds no series line and no "Storytime Advantage" text.
                if (entry.series.length !== 0 || entry.texts.some((text) => text.includes('storytime advantage'))) {
                    problems.push(`${id}: the page holds ${entry.series.length} series lines (the pin is 0, and no "Storytime Advantage" text).`);
                }
                if (entry.headings.length !== 1 || entry.headings[0] !== 'Words in this book') {
                    problems.push(`${id}: the page holds ${entry.headings.length} headings (the pin is 1, "Words in this book").`);
                }
                if (!entry.wordRowBox || entry.words === 0) problems.push(`${id}: the page holds no word row with words.`);
                if (entry.tiles !== 1) {
                    problems.push(`${id}: the page holds ${entry.tiles} logo-tile parts (the pin is 1).`);
                    continue;
                }
                if (entry.images !== 1) problems.push(`${id}: the tile holds ${entry.images} images (the pin is 1).`);
                if (!entry.imageSrc.startsWith('file://')) {
                    problems.push(`${id}: the logo source is not a file URL.`);
                } else {
                    const file = fileURLToPath(entry.imageSrc);
                    const hash = fs.existsSync(file) ? sha256(fs.readFileSync(file)) : '';
                    if (path.basename(file) !== pin.file || hash !== pin.sha) {
                        problems.push(`${id}: the logo file is ${path.basename(file)} with SHA-256 ${hash} (the pin is ${pin.file}, ${pin.sha}).`);
                    }
                }
                if (toHex(entry.tileFill) !== pin.fill) problems.push(`${id}: the tile fill is ${toHex(entry.tileFill)} (the pin is ${pin.fill}).`);
                const borders = entry.borderColours.map(toHex);
                const lined = entry.borderWidths.every((width) => width > 0) && entry.borderStyles.every((style) => style === 'solid');
                if (!lined || borders.some((colour) => colour !== pin.border)) {
                    problems.push(`${id}: the tile border is ${borders.join(' ')} ${entry.borderStyles.join(' ')} (the pin is ${pin.border} solid on 4 edges).`);
                }
                const tile = entry.tileBox!;
                const width = at(tile.right - tile.left);
                const height = at(tile.bottom - tile.top);
                if (Math.abs(width - PAGE12_TILE_WIDTH_MM) > SIZE_TOLERANCE_MM || Math.abs(height - PAGE12_TILE_HEIGHT_MM) > SIZE_TOLERANCE_MM) {
                    problems.push(`${id}: the tile is ${width.toFixed(2)} mm x ${height.toFixed(2)} mm (the pin is 78.8 mm x 25.5 mm).`);
                }
                const across = at(Math.abs((tile.left + tile.right) / 2 - (entry.pageBox.left + entry.pageBox.right) / 2));
                if (across > CENTRE_TOLERANCE_MM) problems.push(`${id}: the tile centre is ${across.toFixed(2)} mm from the page centre (the pin is 1 mm).`);
                if (entry.wordRowBox) {
                    const gap = at(tile.top - entry.wordRowBox.bottom);
                    if (gap < CLEARANCE_MM) problems.push(`${id}: the tile is ${gap.toFixed(2)} mm below the word row (the pin is 5 mm or more).`);
                }
                const bottom = at(entry.pageBox.bottom - tile.bottom);
                if (bottom < CLEARANCE_MM) problems.push(`${id}: the tile is ${bottom.toFixed(2)} mm above the bottom edge (the pin is 5 mm or more).`);
                if (entry.footerBox && overlaps(tile, entry.footerBox)) problems.push(`${id}: the tile overlaps the footer.`);
                if (!entry.imageBox) {
                    problems.push(`${id}: the tile holds no image box.`);
                    continue;
                }
                const image = entry.imageBox;
                // The computed border width does not hold the scale of the a3-color page.
                const inner = tile.bottom - tile.top - (entry.borderWidths[0] + entry.borderWidths[2]) * scale;
                const fill = (image.bottom - image.top) / inner;
                if (fill < MIN_FILL || fill > MAX_FILL) {
                    problems.push(`${id}: the logo fills ${(fill * 100).toFixed(1)} % of the inner tile height (the pin is 78 % to 82 %).`);
                }
                const imageAcross = at(Math.abs((image.left + image.right) / 2 - (tile.left + tile.right) / 2));
                const imageDown = at(Math.abs((image.top + image.bottom) / 2 - (tile.top + tile.bottom) / 2));
                if (imageAcross > CENTRE_TOLERANCE_MM || imageDown > CENTRE_TOLERANCE_MM) {
                    problems.push(`${id}: the logo centre is ${imageAcross.toFixed(2)} mm across and ${imageDown.toFixed(2)} mm down from the tile centre (the pin is 1 mm).`);
                }
            }
        }
        console.log(`G5 page 12 checked ${checked}, problems ${problems.length}`);
        expect(checked, 'the check reads the page 12 of the 14 readers in the 2 outputs.').toBe(28);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('G6: the standing rules file holds the changed S1 and the page 12 scope of S2, S4, and S5', () => {
        const source = fs.readFileSync(STANDING_FILE, 'utf8');
        const markers = [
            'S1 changed 2026-11-11 (F1 F2)',
            'S2 changed 2026-11-11 (F1 F2)',
            'S4 changed 2026-11-11 (F1 F2)',
            'S5 changed 2026-11-11 (F1 F2)',
            'FRONT_KINDS',
            'page12',
        ];
        const missing = markers.filter((marker) => !source.includes(marker));
        expect(missing, `the standing rules file holds no ${missing.join(', ')}.`).toEqual([]);
    });
});

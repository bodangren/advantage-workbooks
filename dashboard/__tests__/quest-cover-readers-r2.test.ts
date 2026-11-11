// @vitest-environment jsdom
/**
 * Red of the r2 reader covers (track storytime_cover_options_20261106, Phase 2, the
 * Task (Red, readers r2) pair of 2026-11-11).
 *
 * The finding (orchestrator, 2026-11-11): the PM ordered a build of the reader covers with
 * `--top hlogo`. The flag never reaches the reader covers. `renderQuestCover` gives the top style
 * only to the book fronts and the book backs. The reader A3 body and the reader leaf body take no
 * top style. The build renders the reader pages without the top style. A build with `--top hlogo`
 * alone gives the old reader look.
 *
 * The owner order (the PM order of 2026-11-11, word for word): "PM: receipt received; all your
 * defaults are ACCEPTED. One order on the open part of Task 2.9: after your two record roles,
 * build the readers-a3 and readers-leaf covers with --top hlogo (the r2 tile) in the next free
 * slot, so that every cover of the 11-25 print order is r2. Same gates and MANIFEST rules; the PM
 * looks at the sheets before they go into the release proof."
 *
 * The design (the orchestrator decision of 2026-11-11; the PM looks at the sheets later):
 *   D1: With the top style `hlogo`, the A3 reader cover holds no `game-bar` part, no `band-word`
 *       part, and no `series-banner` part. It holds exactly one `logo-tile` part, drawn by the
 *       same tile as the books: the horizontal logo on its amber tile. The tile box is the new
 *       key `reader-a3:logo-tile` of `QUEST_BOXES`:
 *       `{ kind: 'reader-a3', leftMm: 126.4, topMm: 12, widthMm: 167.2, heightMm: 54 }`. It is the
 *       size of the A4 front tile, centered on the 420 mm page.
 *   D2: In that render, the art layer, the `week-pill` part, the `title-plaque` part, and the
 *       `role-bar` part keep the same HTML as in the default render.
 *   D3: The default render of the A3 reader (no top style, or `top: 'banner'`) stays byte equal
 *       to its render at the role base. The existing box keys of the A3 reader keep their values:
 *       `game-bar` 14/12/150/15, `band-word` 78/14/30/11, `series-banner` 274/12/132/20,
 *       `week-pill` 322/35/36/10, `title-plaque` 100/236/220/40, and `role-bar` 150/278/120/12.
 *       The tests F1 and F2 of `quest-cover-frame-r3.test.ts` keep the reader game bar in the
 *       default render, and they stay valid.
 *   D4: The leaf cover (`reader-leaf`, 198 x 148.5 mm, printed in black only) has no top chrome.
 *       Its render with `top: 'hlogo'` and its default render are byte equal to its default render
 *       at the role base.
 *   D5: `questReaderCoverPage(reader, { widthMm: 420, heightMm: 297 }, assets, { bleedMm: 0,
 *       top: 'hlogo' })` follows D1 and D2. Without the top style it is byte equal to its output
 *       at the role base.
 *   D6: The build passes its `--top` value to the A3 reader pages.
 *
 * The contract of this file:
 *   R1: The box table holds the key `reader-a3:logo-tile` with the D1 box. The 6 kept A3 reader
 *       box keys hold their D3 values.
 *   R2: For each of the 14 rows of `questReaders()`, the A3 render with the top style `hlogo` holds
 *       no `game-bar` part, no `band-word` part, and no `series-banner` part. It holds one
 *       `logo-tile` part. The tile holds one image, and the source of that image is the URL of the
 *       horizontal logo file. The text of the page holds no "Storytime Advantage".
 *   R3: For each of the 14 rows, the outer HTML of the art layer, the `week-pill` part, the
 *       `title-plaque` part, and the `role-bar` part is the same in the hlogo render and in the
 *       default render.
 *   R4: The default A3 render of each of the 14 rows, the default leaf render of each of the 14
 *       rows, the leaf render of each of the 14 rows with the top style `hlogo`, and the 2 default
 *       outputs of `questReaderCoverPage` hold their pins of the role base.
 *   R5: In Chrome, the tile of the hlogo render of the first row is centered on the page width
 *       within 0.5 mm. The logo image is centered in the tile on both axes within 0.25 mm. The
 *       tile takes the amber `#FCD34D` and the brown `#92400E`.
 *   R6: `questReaderCoverPage` with the A3 trim and the top style `hlogo` holds one `logo-tile`
 *       part and no `game-bar` part.
 *
 * The R7 test of rule D6 is not in this file. The build script has no exported function that holds
 * the render options of the reader pages. `planQuestBuild` holds the file paths, the art rows, and
 * the picture rows only. The gap is named in the handoff of this role.
 *
 * The pins of R4 are the SHA-256 of the renders at the role base `a6a3173e`, with the bleed 0 and
 * no top style. The 28 reader rows of the pin table are the 14 rows of `questReaders()` in their
 * order. The file reads no week file and prints no page. The 14 rows hold English titles only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from '@playwright/test';
import {
    QUEST_BOXES,
    questReaders,
    questReaderCoverPage,
    renderQuestCover,
    type QuestReaderRow,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The millimetres of one pixel: 96 px is 25.4 mm. */
const MM_PER_PX = 25.4 / 96;

/** The amber of the logo tile. */
const AMBER = '#fcd34d';

/** The brown of the logo edge. */
const BROWN = '#92400e';

/** The tolerance of the tile centring on the page width, in millimetres. */
const PAGE_CENTRE_TOLERANCE_MM = 0.5;

/** The tolerance of the logo centring in its tile, in millimetres. */
const TILE_CENTRE_TOLERANCE_MM = 0.25;

/** The width of the A3 reader page, in millimetres. */
const A3_PAGE_WIDTH_MM = 420;

/** The width of the leaf reader page, in millimetres. */
const LEAF_PAGE_WIDTH_MM = 198;

/** The height of the leaf reader page, in millimetres. */
const LEAF_PAGE_HEIGHT_MM = 148.5;

/** The repo root. */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The URL of the horizontal Storytime Advantage logo, the logo of the tile. */
const HORIZONTAL_LOGO_URL = pathToFileURL(
    path.join(repoRoot, 'content', 'storytime', 'covers', 'logos', 'storytime-advantage-horizontal.svg'),
).href;

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

/** The pins of the default A3 render of each row, at the role base `a6a3173e`. */
const A3_PINS: Record<string, string> = {
    'w01-1': 'c9aa5de6afa1b18b4e0a0530a6e9792243513e0fd0395344f2ac7d4bffe27f52',
    'w01-2': 'aa409176d61dd2d8e22f1d9b2efcdb23e07e5254b8c2c2e366fce443f4118be6',
    'w02-1': 'a1cfa0349af43fceb6d90a6621367b2e73f961d68fdc675985838724fbe0e605',
    'w02-2': '2cd0e4bb7a9d83e2f0101e695508358ef931feab13869c96ee4046df20e3a93b',
    'w03-1': '3786e785037e4c4af1e11dd26655c226a4bb97bcc03c894994f2ab4f08dec118',
    'w03-2': '340d03d7d423f69090005b0573ea1d14b037b4540591b07e1053643d981ca18b',
    'w04-1': '352e248aa74e893243ae52b2f0f109d153f218cfdc7a20b581713ce3fe6c6e29',
    'w04-2': 'f0480220f3e81af34e642768d97e006ecd73fa96be6bca967e167b63f75f6462',
    'w05-1': 'b4432ae3f60b2cdfa56456439618471ad38f3f35aeca09e8aa883e00ee375f45',
    'w05-2': 'b5de52066edbc492b29d6ad015925cd26b8928bc024e68b945d7dd7305832ba1',
    'w06-1': 'cca6cbbcc33e056c50fad81dd86869ac930a7e6d05c6ce5dfad1f5ed406ca645',
    'w06-2': '7b9a09a21da649b2f0e0c21d168688d13ccfa01b97af489d43f91d029f51ede5',
    'w07-1': '39a7db579aaa89dd8b4f85c29189d7ec9460ec2fae950391c354b15ff4e71fd1',
    'w07-2': '9572ca9689f90b27c2488bfae3a7a1e2b3c48f0660cfc6d7ca6b4754c612adf1',
};

/** The pins of the default leaf render of each row, at the role base `a6a3173e`. */
const LEAF_PINS: Record<string, string> = {
    'w01-1': 'd14213b57a92c1dc3eeb5504f1ac54a601423430b8724a70f5252983d40f26c6',
    'w01-2': 'b2cf0f1f5f6ce536064aeb453570424ff3e85d55ce2b76f97e9af676cf08ddd5',
    'w02-1': '94e30959cf4cf21bd7f3e7323a1e1c18cf65ce228860ed150c2199c439a40f3f',
    'w02-2': '39c5290d9998b6a5b42753fea6f0571f698e7d1a6b9dde04e51f8cfd346ff5a1',
    'w03-1': '22fb723259b61171b6e16d6b4d3fef2cc7b1f215b99ace5eacc51043955e3a06',
    'w03-2': 'dbafbc10fc53a0bc00da8a4c3a126bb8120efd0816ddf710e35b054b84b0ca55',
    'w04-1': '87bdaad39dcb2784c5e6eb844b15f800c0f815a786e8c61d3b7ada05e831af69',
    'w04-2': '43d78a754ea3722d8cee376fd4e296ddbcd80059b7d8e286e549075b12a46e19',
    'w05-1': '3c7678384d3ae3014ecaeb14f860e157888733bc2ecf078432cf15990da591a7',
    'w05-2': '959dc345f6c964acd43c4b5cd69fb31099f8fc2e4ceb7f86d8907f6d395caa8b',
    'w06-1': '79df65dd50d44c33a323018402435d498ff21770cf794c81dd0f8855c2a1a260',
    'w06-2': 'c737b40c3366c58557ebb32abe542ee12d4cfff53f6f8c073f83f60a191c4279',
    'w07-1': '687761ea1353fb9d5db6163032937777658fb9a61ec420347d0995485dffe52b',
    'w07-2': 'b109111c6d39113cd6921321180d7fa983bca23d6f9dab19a7b02be63faf3b7b',
};

/** The pin of the default `questReaderCoverPage` output of the first row, with the A3 trim. */
const PAGE_A3_PIN = '0b2978bb3960e1d53a3232688f060994e0b5c040eeba58ca0f4d48ba048fa606';

/** The pin of the default `questReaderCoverPage` output of the first row, with the leaf trim. */
const PAGE_LEAF_PIN = 'b65b537343c9f1369423ef42e6fc99f511ec49d20ca8e33c4f42e85df8de455a';

/** The D1 box of the A3 reader logo tile. */
const LOGO_TILE_BOX = { kind: 'reader-a3', leftMm: 126.4, topMm: 12, widthMm: 167.2, heightMm: 54 };

/** The D3 boxes of the 6 kept A3 reader parts, with their part names. */
const KEPT_BOXES: Record<string, { leftMm: number; topMm: number; widthMm: number; heightMm: number }> = {
    'game-bar': { leftMm: 14, topMm: 12, widthMm: 150, heightMm: 15 },
    'band-word': { leftMm: 78, topMm: 14, widthMm: 30, heightMm: 11 },
    'series-banner': { leftMm: 274, topMm: 12, widthMm: 132, heightMm: 20 },
    'week-pill': { leftMm: 322, topMm: 35, widthMm: 36, heightMm: 10 },
    'title-plaque': { leftMm: 100, topMm: 236, widthMm: 220, heightMm: 40 },
    'role-bar': { leftMm: 150, topMm: 278, widthMm: 120, heightMm: 12 },
};

/** The parts that R3 keeps, with their part names. */
const KEPT_PARTS = ['art', 'week-pill', 'title-plaque', 'role-bar'] as const;

/** The default render options: the look of the role base. */
const DEFAULT_OPTIONS: QuestRenderOptions = { bleedMm: 0 };

/** The render options of the named banner style: the look of the role base. */
const BANNER_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'banner' };

/** The render options of the r2 style: the horizontal logo on its tile. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

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

/** The measurement of the logo tile of the A3 reader cover. */
interface RawTile {
    /** The box of the page. */
    page: RawBox;
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
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the tile check. */
let browser: Browser | undefined;

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
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The rendered HTML parses.').toBeNull();
    return doc;
}

/**
 * Converts one computed color to a lower case hex value.
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
 * Reads the 14 reader rows of the shipped Level 2 weeks.
 * @returns The rows.
 */
function readerRows(): QuestReaderRow[] {
    const rows = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    return rows;
}

/**
 * Renders the A3 reader cover of one row.
 * @param row The reader row.
 * @param opts The render options.
 * @returns The rendered document.
 */
function a3Html(row: QuestReaderRow, opts: QuestRenderOptions): string {
    return renderQuestCover('reader-a3', row, { art: ART }, opts);
}

/**
 * Renders the leaf reader cover of one row.
 * @param row The reader row.
 * @param opts The render options.
 * @returns The rendered document.
 */
function leafHtml(row: QuestReaderRow, opts: QuestRenderOptions): string {
    return renderQuestCover('reader-leaf', row, { art: ART }, opts);
}

/**
 * Opens the hlogo render of one A3 reader cover in Chrome and measures the logo tile.
 * @param row The reader row.
 * @returns The measurement, or null when the page holds no logo tile.
 */
async function measureTile(row: QuestReaderRow): Promise<RawTile | null> {
    const active = browser;
    if (!active) throw new Error('the browser of the tile check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-readers-r2-'));
    scratch.push(folder);
    const file = path.join(folder, 'reader-a3.html');
    fs.writeFileSync(file, a3Html(row, HLOGO_OPTIONS));
    const context = await active.newContext({ viewport: { width: 1700, height: 1200 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        return await page.evaluate((): RawTile | null => {
            const tile = document.querySelector('[data-part="logo-tile"]');
            if (!tile) return null;
            const pageElement = document.querySelector('.quest-page');
            const style = window.getComputedStyle(tile);
            const rect = tile.getBoundingClientRect();
            const pageRect = pageElement
                ? pageElement.getBoundingClientRect()
                : { left: 0, top: 0, right: 0, bottom: 0 };
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
            return {
                page: { left: pageRect.left, top: pageRect.top, right: pageRect.right, bottom: pageRect.bottom },
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
            };
        });
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

describe('quest-cover-readers-r2: R1 to R6 (Red, the r2 readers)', () => {
    it('R1: the box table holds the A3 reader logo tile and the kept reader boxes do not change', () => {
        const tile = QUEST_BOXES['reader-a3:logo-tile'];
        expect(tile, 'the box table holds the key reader-a3:logo-tile.').toBeDefined();
        expect(tile!.kind, 'the kind of the A3 reader logo tile.').toBe('reader-a3');
        expect(tile!.leftMm, 'the left of the A3 reader logo tile is 126.4 mm.').toBe(LOGO_TILE_BOX.leftMm);
        expect(tile!.topMm, 'the top of the A3 reader logo tile is 12 mm.').toBe(LOGO_TILE_BOX.topMm);
        expect(tile!.widthMm, 'the width of the A3 reader logo tile is 167.2 mm.').toBe(LOGO_TILE_BOX.widthMm);
        expect(tile!.heightMm, 'the height of the A3 reader logo tile is 54 mm.').toBe(LOGO_TILE_BOX.heightMm);
        for (const [part, box] of Object.entries(KEPT_BOXES)) {
            const found = QUEST_BOXES[`reader-a3:${part}`];
            expect(found, `the box table holds reader-a3:${part}.`).toBeDefined();
            expect(found!.leftMm, `the left of reader-a3:${part}.`).toBe(box.leftMm);
            expect(found!.topMm, `the top of reader-a3:${part}.`).toBe(box.topMm);
            expect(found!.widthMm, `the width of reader-a3:${part}.`).toBe(box.widthMm);
            expect(found!.heightMm, `the height of reader-a3:${part}.`).toBe(box.heightMm);
        }
    });

    it('R2: with the top style hlogo, the A3 reader cover holds one logo tile and no top chrome', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            const doc = parseHtml(a3Html(row, HLOGO_OPTIONS));
            expect(
                doc.querySelectorAll('[data-part="game-bar"]').length,
                `the A3 reader cover ${id} holds no game bar.`,
            ).toBe(0);
            expect(
                doc.querySelectorAll('[data-part="band-word"]').length,
                `the A3 reader cover ${id} holds no band word.`,
            ).toBe(0);
            expect(
                doc.querySelectorAll('[data-part="series-banner"]').length,
                `the A3 reader cover ${id} holds no series banner.`,
            ).toBe(0);
            const tiles = doc.querySelectorAll('[data-part="logo-tile"]');
            expect(tiles.length, `the A3 reader cover ${id} holds one logo tile.`).toBe(1);
            const images = Array.from(tiles[0].querySelectorAll('img'));
            expect(images.length, `the logo tile of the A3 reader cover ${id} holds one image.`).toBe(1);
            expect(
                images[0].getAttribute('src') ?? '',
                `the logo tile of the A3 reader cover ${id} holds the horizontal logo.`,
            ).toBe(HORIZONTAL_LOGO_URL);
            const text = doc.body.textContent ?? '';
            expect(
                text.includes('Storytime Advantage'),
                `the text of the A3 reader cover ${id} holds no series name.`,
            ).toBe(false);
        }
    });

    it('R3: the art, the week pill, the title plaque, and the role bar keep their HTML', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            const plain = parseHtml(a3Html(row, DEFAULT_OPTIONS));
            const alt = parseHtml(a3Html(row, HLOGO_OPTIONS));
            for (const part of KEPT_PARTS) {
                const one = plain.querySelector(`[data-part="${part}"]`);
                expect(one, `the default A3 reader cover ${id} holds the part ${part}.`).not.toBeNull();
                const two = alt.querySelector(`[data-part="${part}"]`);
                expect(two, `the hlogo A3 reader cover ${id} holds the part ${part}.`).not.toBeNull();
                expect(
                    two!.outerHTML,
                    `the HTML of the part ${part} of the A3 reader cover ${id} is the same in both renders.`,
                ).toBe(one!.outerHTML);
            }
        }
    });

    it('R4: the default renders and the reader page outputs keep their pins', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            expect(
                hashOfText(a3Html(row, DEFAULT_OPTIONS)),
                `the SHA-256 of the default A3 render of the row ${id}.`,
            ).toBe(A3_PINS[id]);
            expect(
                hashOfText(a3Html(row, BANNER_OPTIONS)),
                `the SHA-256 of the top banner A3 render of the row ${id}.`,
            ).toBe(A3_PINS[id]);
            expect(
                hashOfText(leafHtml(row, DEFAULT_OPTIONS)),
                `the SHA-256 of the default leaf render of the row ${id}.`,
            ).toBe(LEAF_PINS[id]);
            expect(
                hashOfText(leafHtml(row, HLOGO_OPTIONS)),
                `the SHA-256 of the hlogo leaf render of the row ${id}.`,
            ).toBe(LEAF_PINS[id]);
        }
        const first = rows[0];
        const pageA3 = questReaderCoverPage(
            first,
            { widthMm: A3_PAGE_WIDTH_MM, heightMm: 297 },
            { art: ART },
            DEFAULT_OPTIONS,
        );
        expect(
            hashOfText(JSON.stringify(pageA3)),
            'the SHA-256 of the default A3 reader page of the first row.',
        ).toBe(PAGE_A3_PIN);
        const pageLeaf = questReaderCoverPage(
            first,
            { widthMm: LEAF_PAGE_WIDTH_MM, heightMm: LEAF_PAGE_HEIGHT_MM },
            { art: ART },
            DEFAULT_OPTIONS,
        );
        expect(
            hashOfText(JSON.stringify(pageLeaf)),
            'the SHA-256 of the default leaf reader page of the first row.',
        ).toBe(PAGE_LEAF_PIN);
    });

    it('R5: the logo tile of the A3 reader cover sits centered in the page', async () => {
        const rows = readerRows();
        const raw = await measureTile(rows[0]);
        expect(raw, 'the hlogo A3 reader cover of the first row holds a logo tile.').not.toBeNull();
        const tile = raw!;
        const pageWidthMm = (tile.page.right - tile.page.left) * MM_PER_PX;
        expect(pageWidthMm, 'the A3 reader page is 420 mm wide.').toBeCloseTo(A3_PAGE_WIDTH_MM, 1);
        const pageCentreMm = ((tile.page.left + tile.page.right) / 2) * MM_PER_PX;
        const tileCentreMm = ((tile.rect.left + tile.rect.right) / 2) * MM_PER_PX;
        expect(
            Math.abs(tileCentreMm - pageCentreMm),
            `the logo tile is centered on the page width: the tile centre is ${tileCentreMm.toFixed(2)} mm, ` +
                `the page centre is ${pageCentreMm.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        expect(tile.imgRect, 'the logo tile holds an image.').not.toBeNull();
        const img = tile.imgRect!;
        const innerLeft = (tile.rect.left + tile.borders.left) * MM_PER_PX;
        const innerRight = (tile.rect.right - tile.borders.right) * MM_PER_PX;
        const innerTop = (tile.rect.top + tile.borders.top) * MM_PER_PX;
        const innerBottom = (tile.rect.bottom - tile.borders.bottom) * MM_PER_PX;
        const leftGap = img.left * MM_PER_PX - innerLeft;
        const rightGap = innerRight - img.right * MM_PER_PX;
        const topGap = img.top * MM_PER_PX - innerTop;
        const bottomGap = innerBottom - img.bottom * MM_PER_PX;
        expect(
            Math.abs(leftGap - rightGap),
            `the logo is centered in its tile: the left gap is ${leftGap.toFixed(2)} mm, ` +
                `the right gap is ${rightGap.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(TILE_CENTRE_TOLERANCE_MM);
        expect(
            Math.abs(topGap - bottomGap),
            `the logo is centered in its tile: the top gap is ${topGap.toFixed(2)} mm, ` +
                `the bottom gap is ${bottomGap.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(TILE_CENTRE_TOLERANCE_MM);
        expect(toHex(tile.background), 'the background of the logo tile.').toBe(AMBER);
        expect(tile.borderColors.length, 'the logo tile holds a border.').toBeGreaterThanOrEqual(1);
        for (const colour of tile.borderColors) {
            expect(toHex(colour), 'every border color of the logo tile.').toBe(BROWN);
        }
    }, 300_000);

    it('R6: the reader page with the top style hlogo holds one logo tile and no game bar', () => {
        const rows = readerRows();
        const page = questReaderCoverPage(
            rows[0],
            { widthMm: A3_PAGE_WIDTH_MM, heightMm: 297 },
            { art: ART },
            HLOGO_OPTIONS,
        );
        const doc = parseHtml(page.body);
        expect(
            doc.querySelectorAll('[data-part="logo-tile"]').length,
            'the hlogo A3 reader page holds one logo tile.',
        ).toBe(1);
        expect(
            doc.querySelectorAll('[data-part="game-bar"]').length,
            'the hlogo A3 reader page holds no game bar.',
        ).toBe(0);
    });
});

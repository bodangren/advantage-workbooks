// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { fontFaceCss } from '../lib/storytime/print/print-fonts';
import {
    STORYTIME_CARD_COLOR_PATCH,
    STORYTIME_CARD_NUMBER_DOTS,
    compileStorytimeCardSheet,
    type StorytimeCard,
} from '../lib/storytime/print/card-kit';

/**
 * Phase 10, Red 1: the raster export of a family-word picture (spec FR 6, decisions H4 to H7).
 *
 * The file holds the cases R1-1 to R1-11 of the test strategy, section 5.4. The module
 * `lib/storytime/family-pictures.ts` and the script `scripts/storytime/set-family-pictures.ts` do not
 * exist before the Green task, so every new case fails inside its body. The case R1-1b reads the
 * shipped card kit, so it passes now. It is a characterization case.
 *
 * Every table below is written by hand. The test never reads a value from the code under test.
 */

/** The dashboard folder, so that the new modules are read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The module of the family pictures. The Green task writes it. */
const familyPicturesModule = path.join(dashboardRoot, 'lib/storytime/family-pictures.ts');

/** The script of the family pictures. The Green task writes it. */
const setFamilyPicturesModule = path.join(dashboardRoot, 'scripts/storytime/set-family-pictures.ts');

/** The source of a color patch. */
type PatchSource = { kind: 'patch'; word: string; hex: string };

/** The source of a number card. */
type DotsSource = { kind: 'dots'; word: string; count: number };

/** The source of a picture that the app renders. */
type PictureSource = PatchSource | DotsSource;

/** The module of the family pictures. */
interface FamilyPicturesModule {
    STORYTIME_APP_NUMBER_DOTS: Readonly<Record<string, number>>;
    familyCardPictureHtml(source: PictureSource): string;
    familyCardPageHtml(source: PictureSource): string;
    familyCardSourceName(source: PictureSource): string;
}

/** The script of the family pictures. */
interface SetFamilyPicturesModule {
    renderFamilyCardJpeg(source: PictureSource): Promise<{ jpeg: Buffer; quality: number }>;
}

/**
 * The 8 approved sRGB values of the color word cards. The values come from the owner decision of
 * 2026-11-06 (Daniel, PM relay). The card kit holds the same 8 values.
 */
const PATCH_HEX: Record<string, string> = {
    red: '#E53935',
    blue: '#1E88E5',
    yellow: '#FDD835',
    green: '#43A047',
    orange: '#FB8C00',
    pink: '#F48FB1',
    purple: '#8E24AA',
    brown: '#6D4C41',
};

/** The RGB triple of each hex value above, written by hand. */
const PATCH_RGB: Record<string, [number, number, number]> = {
    red: [229, 57, 53],
    blue: [30, 136, 229],
    yellow: [253, 216, 53],
    green: [67, 160, 71],
    orange: [251, 140, 0],
    pink: [244, 143, 177],
    purple: [142, 36, 170],
    brown: [109, 76, 65],
};

/** The dot count of each number word card of the print card kit. */
const CARD_DOTS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
};

/** The dot count of each number word of the app. The card of ten is added (decision H4). */
const APP_DOTS: Record<string, number> = { ...CARD_DOTS, ten: 10 };

/** The x centre of each dot of one row of the card of ten. */
const TEN_CX = [14, 32, 50, 68, 86];

/** The y centre of the first row and of the second row of the card of ten. */
const TEN_CY = [11, 33];

/** The radius of one dot of a number card, in the units of the view box. */
const DOT_RADIUS = 7;

/** The white of the page and of the paper around a picture. */
const WHITE: [number, number, number] = [255, 255, 255];

/** The largest byte length of one JPEG: 150 KB. */
const MAX_JPEG_BYTES = 153_600;

/** The smallest JPEG width and height of the app picture. */
const JPEG_SIZE = 800;

/** The smallest and the largest quality of one JPEG. */
const MIN_QUALITY = 75;
const MAX_QUALITY = 82;

/** The width of a round component of the dot mask, in device pixels. */
const ROUND_MIN_WIDTH = 90;
const ROUND_MAX_WIDTH = 120;

/** The smallest and the largest aspect of a round component of the dot mask. */
const ROUND_MIN_ASPECT = 0.9;
const ROUND_MAX_ASPECT = 1.1;

/**
 * The module of the family pictures. It does not exist before the Green task.
 * @returns The module.
 * @throws Error When the module file is missing. The message names the path.
 */
async function familyPictures(): Promise<FamilyPicturesModule> {
    if (!fs.existsSync(familyPicturesModule)) throw new Error(`Missing module: ${familyPicturesModule}`);
    return await import(familyPicturesModule) as FamilyPicturesModule;
}

/**
 * The script of the family pictures. It does not exist before the Green task.
 * @returns The script module.
 * @throws Error When the script file is missing. The message names the path.
 */
async function setFamilyPictures(): Promise<SetFamilyPicturesModule> {
    if (!fs.existsSync(setFamilyPicturesModule)) throw new Error(`Missing module: ${setFamilyPicturesModule}`);
    return await import(setFamilyPicturesModule) as SetFamilyPicturesModule;
}

/**
 * The index of the `</div>` that closes the div that starts at `start`.
 * @param html The markup.
 * @param start The index of the opening `<div`.
 * @returns The index of the closing `</div`, or -1 when the div does not close.
 */
function divEnd(html: string, start: number): number {
    let depth = 0;
    let index = start;
    while (index < html.length) {
        if (html.startsWith('<div', index)) {
            depth += 1;
            index += 4;
            continue;
        }
        if (html.startsWith('</div>', index)) {
            depth -= 1;
            if (depth === 0) return index;
            index += 6;
            continue;
        }
        index += 1;
    }
    return -1;
}

/**
 * The picture element that the card kit writes for one card.
 * @param label The word of the card.
 * @returns The element, from `<div class="card-picture` to the end of the card div.
 */
function cardPictureElement(label: string): string {
    const card: StorytimeCard = { kind: 'family-picture', label, size: 'A6', classSet: false };
    const { html } = compileStorytimeCardSheet([card], 'A6');
    const cardStart = html.indexOf('<div class="card" ');
    expect(cardStart, `the sheet holds the card of ${label}`).toBeGreaterThan(-1);
    const cardEnd = divEnd(html, cardStart);
    expect(cardEnd, `the card of ${label} closes`).toBeGreaterThan(-1);
    const pictureStart = html.indexOf('<div class="card-picture', cardStart);
    expect(pictureStart, `the card of ${label} holds a picture element`).toBeGreaterThan(-1);
    expect(pictureStart, `the picture element of ${label} sits inside the card`).toBeLessThan(cardEnd);
    const cut = html.slice(pictureStart, cardEnd);
    expect(cut.length, `the cut of the picture element of ${label} is not empty`).toBeGreaterThan(0);
    expect(cut.startsWith('<div class="card-picture'), `the cut of ${label} starts at the picture element`).toBe(true);
    return cut;
}

/** The rendered JPEG of each source, so that one word renders once in the file. */
const renders = new Map<string, { jpeg: Buffer; quality: number }>();

/**
 * The rendered JPEG of one source.
 * @param source The source of the picture.
 * @returns The JPEG buffer and the quality of the encode.
 */
async function renderJpeg(source: PictureSource): Promise<{ jpeg: Buffer; quality: number }> {
    const key = source.kind === 'patch'
        ? `patch:${source.word}:${source.hex}`
        : `dots:${source.word}:${source.count}`;
    const cached = renders.get(key);
    if (cached) return cached;
    const mod = await setFamilyPictures();
    expect(mod.renderFamilyCardJpeg, 'the script exports the renderer').toBeTypeOf('function');
    const result = await mod.renderFamilyCardJpeg(source);
    renders.set(key, result);
    return result;
}

/** The raw pixels of one image. */
interface RawPixels {
    data: Buffer;
    width: number;
    height: number;
}

/**
 * The raw pixels of one JPEG, with three channels per pixel.
 * @param jpeg The JPEG buffer.
 * @returns The pixels.
 */
async function rawPixels(jpeg: Buffer): Promise<RawPixels> {
    const { data, info } = await sharp(jpeg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
}

/**
 * The three channels of one pixel.
 * @param pixels The raw pixels.
 * @param x The column of the pixel.
 * @param y The row of the pixel.
 * @returns The red, green and blue value.
 */
function pixelAt(pixels: RawPixels, x: number, y: number): [number, number, number] {
    const offset = (y * pixels.width + x) * 3;
    return [pixels.data[offset], pixels.data[offset + 1], pixels.data[offset + 2]];
}

/**
 * The largest difference between a measured pixel and a wanted colour.
 * @param measured The measured pixel.
 * @param wanted The wanted colour.
 * @returns The gap in one channel value.
 */
function channelGap(measured: [number, number, number], wanted: [number, number, number]): number {
    return Math.max(
        Math.abs(measured[0] - wanted[0]),
        Math.abs(measured[1] - wanted[1]),
        Math.abs(measured[2] - wanted[2]),
    );
}

/** One connected group of dark pixels. */
interface DarkComponent {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

/**
 * The connected groups of the dark pixels of one image. The threshold is a luminance below 128.
 * The groups use the 8 neighbours, so a diagonal touch joins two groups.
 * @param pixels The raw pixels.
 * @returns The groups, each with its bounding box.
 */
function darkComponents(pixels: RawPixels): DarkComponent[] {
    const { width, height } = pixels;
    const mask = new Uint8Array(width * height);
    for (let index = 0; index < mask.length; index += 1) {
        const offset = index * 3;
        const luminance = 0.299 * pixels.data[offset]
            + 0.587 * pixels.data[offset + 1]
            + 0.114 * pixels.data[offset + 2];
        mask[index] = luminance < 128 ? 1 : 0;
    }
    const seen = new Uint8Array(width * height);
    const components: DarkComponent[] = [];
    const stack: number[] = [];
    for (let start = 0; start < mask.length; start += 1) {
        if (mask[start] === 0 || seen[start] === 1) continue;
        seen[start] = 1;
        stack.length = 0;
        stack.push(start);
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        while (stack.length > 0) {
            const index = stack.pop() as number;
            const x = index % width;
            const y = (index - x) / width;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            for (let stepY = -1; stepY <= 1; stepY += 1) {
                for (let stepX = -1; stepX <= 1; stepX += 1) {
                    if (stepX === 0 && stepY === 0) continue;
                    const nextX = x + stepX;
                    const nextY = y + stepY;
                    if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
                    const next = nextY * width + nextX;
                    if (mask[next] === 1 && seen[next] === 0) {
                        seen[next] = 1;
                        stack.push(next);
                    }
                }
            }
        }
        components.push({ minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });
    }
    return components;
}

/**
 * The round groups of the dot mask of one number card. A round group is wider than 90 px and
 * narrower than 120 px, and its aspect lies between 0.9 and 1.1.
 * @param pixels The raw pixels of the JPEG.
 * @returns The round groups, each with its centre.
 */
function roundDots(pixels: RawPixels): { x: number; y: number }[] {
    return darkComponents(pixels)
        .filter((component) => component.width >= ROUND_MIN_WIDTH && component.width <= ROUND_MAX_WIDTH)
        .filter((component) => {
            const aspect = component.width / component.height;
            return aspect >= ROUND_MIN_ASPECT && aspect <= ROUND_MAX_ASPECT;
        })
        .map((component) => ({
            x: (component.minX + component.maxX) / 2,
            y: (component.minY + component.maxY) / 2,
        }));
}

describe('the family picture markup (Phase 10, Red 1)', () => {
    it('R1-1 the picture markup of the app equals the picture element of the card kit', async () => {
        const mod = await familyPictures();
        expect(mod.familyCardPictureHtml, 'the module exports the picture markup').toBeTypeOf('function');
        const parityWords: string[] = [];
        for (const word of Object.keys(PATCH_HEX)) {
            parityWords.push(word);
            const source: PatchSource = { kind: 'patch', word, hex: PATCH_HEX[word] };
            expect(mod.familyCardPictureHtml(source), `the patch markup of ${word}`)
                .toBe(cardPictureElement(word));
        }
        for (const word of Object.keys(CARD_DOTS)) {
            parityWords.push(word);
            const source: DotsSource = { kind: 'dots', word, count: CARD_DOTS[word] };
            expect(mod.familyCardPictureHtml(source), `the dots markup of ${word}`)
                .toBe(cardPictureElement(word));
        }
        expect(parityWords, 'parity words: 17').toHaveLength(17);
    });

    it('R1-1b the card kit holds the 8 patch values and the 9 dot counts (characterization)', () => {
        expect(Object.keys(STORYTIME_CARD_COLOR_PATCH), 'the patch words of the card kit')
            .toEqual(Object.keys(PATCH_HEX));
        expect(STORYTIME_CARD_COLOR_PATCH, 'the patch values of the card kit').toEqual(PATCH_HEX);
        expect(Object.keys(STORYTIME_CARD_NUMBER_DOTS), 'the dot words of the card kit')
            .toEqual(Object.keys(CARD_DOTS));
        expect(STORYTIME_CARD_NUMBER_DOTS, 'the dot counts of the card kit').toEqual(CARD_DOTS);
        expect(Object.keys(STORYTIME_CARD_NUMBER_DOTS), 'the card kit has no card of ten')
            .not.toContain('ten');
    });

    it('R1-2 the app dot table holds the nine card counts and the count of ten', async () => {
        const mod = await familyPictures();
        expect(mod.STORYTIME_APP_NUMBER_DOTS, 'the module exports the app dot table').toBeDefined();
        expect(Object.keys(mod.STORYTIME_APP_NUMBER_DOTS), 'keys: 10').toHaveLength(10);
        expect(Object.keys(mod.STORYTIME_APP_NUMBER_DOTS), 'the app dot words')
            .toEqual(Object.keys(APP_DOTS));
        expect(mod.STORYTIME_APP_NUMBER_DOTS, 'the app dot counts').toEqual(APP_DOTS);
        const firstNine = Object.fromEntries(Object.entries(mod.STORYTIME_APP_NUMBER_DOTS).slice(0, 9));
        expect(firstNine, 'the first nine app entries equal the card counts').toEqual(STORYTIME_CARD_NUMBER_DOTS);
    });

    it('R1-3 the card of ten holds the numeral 10 and ten dots in two rows of five', async () => {
        const mod = await familyPictures();
        expect(mod.familyCardPictureHtml, 'the module exports the picture markup').toBeTypeOf('function');
        const html = mod.familyCardPictureHtml({ kind: 'dots', word: 'ten', count: 10 });
        const numeral = html.match(/<div[^>]*data-card-numeral[^>]*>([^<]*)</);
        expect(numeral, 'the numeral element sits in the markup of ten').not.toBeNull();
        expect(numeral?.[1], 'the numeral of ten').toBe('10');
        const circles = html.match(/<circle [^>]*>/g) ?? [];
        expect(circles, 'the dot count of ten').toHaveLength(10);
        for (const circle of circles) {
            expect(circle, 'each dot of ten carries its marker').toContain('data-number-dot="1"');
        }
        expect(circles.filter((circle) => circle.includes('data-row="0"')), 'the first row of ten')
            .toHaveLength(5);
        expect(circles.filter((circle) => circle.includes('data-row="1"')), 'the second row of ten')
            .toHaveLength(5);
        expect(html.match(/viewBox="([^"]*)"/)?.[1], 'the view box of the dots of ten').toBe('0 0 100 44');
        const cx = circles.map((circle) => Number(circle.match(/cx="([^"]*)"/)?.[1]));
        expect(cx.slice(0, 5), 'the x centres of the first row of ten').toEqual(TEN_CX);
        expect(cx.slice(5, 10), 'the x centres of the second row of ten').toEqual(TEN_CX);
        const cy = circles.map((circle) => Number(circle.match(/cy="([^"]*)"/)?.[1]));
        expect(cy.slice(0, 5), 'the y centres of the first row of ten')
            .toEqual([TEN_CY[0], TEN_CY[0], TEN_CY[0], TEN_CY[0], TEN_CY[0]]);
        expect(cy.slice(5, 10), 'the y centres of the second row of ten')
            .toEqual([TEN_CY[1], TEN_CY[1], TEN_CY[1], TEN_CY[1], TEN_CY[1]]);
        const radii = [...new Set(circles.map((circle) => circle.match(/r="([^"]*)"/)?.[1]))];
        expect(radii, 'the dot radius of ten').toEqual([String(DOT_RADIUS)]);
    });

    it('R1-4 the page holds the white background, the print face, and the picture markup', async () => {
        const mod = await familyPictures();
        expect(mod.familyCardPageHtml, 'the module exports the page').toBeTypeOf('function');
        const source: PatchSource = { kind: 'patch', word: 'red', hex: PATCH_HEX.red };
        const page = mod.familyCardPageHtml(source);
        expect(page, 'the page holds the white background').toContain('#FFFFFF');
        expect(page, 'the page holds the print face').toContain(fontFaceCss());
        expect(page, 'the page holds its size').toContain('400px');
        expect(page, 'the page holds the safe margin').toContain('4mm');
        expect(page, 'the page holds the picture markup').toContain(mod.familyCardPictureHtml(source));
    });

    it('R1-5 a hostile word is escaped in the picture markup and in the page', async () => {
        const mod = await familyPictures();
        expect(mod.familyCardPictureHtml, 'the module exports the picture markup').toBeTypeOf('function');
        expect(mod.familyCardPageHtml, 'the module exports the page').toBeTypeOf('function');
        const hostile = 'a"><script>';
        const patch = mod.familyCardPictureHtml({ kind: 'patch', word: hostile, hex: PATCH_HEX.red });
        const dots = mod.familyCardPictureHtml({ kind: 'dots', word: hostile, count: 1 });
        const page = mod.familyCardPageHtml({ kind: 'patch', word: hostile, hex: PATCH_HEX.red });
        for (const [name, html] of [['patch', patch], ['dots', dots], ['page', page]] as const) {
            expect(html, `the ${name} markup holds no script tag`).not.toContain('<script');
            expect(html, `the ${name} markup holds no raw hostile word`).not.toContain(hostile);
        }
        const attribute = patch.match(/data-card-patch="([^"]*)"/)?.[1] ?? '';
        expect(attribute, 'the patch attribute holds the word').toContain('a');
        expect(attribute, 'the patch attribute holds no raw quote').not.toContain('"');
        expect(attribute, 'the patch attribute holds no raw angle bracket').not.toMatch(/[<>]/);
        expect(dots, 'the dots markup was built').toContain('<circle');
        expect(dots, 'the dots markup holds the numeral').toContain('>1<');
        expect(page, 'the page was built').toContain('#FFFFFF');
    });

    it('R1-6 the source name of a patch and of a number card follows the provenance form', async () => {
        const mod = await familyPictures();
        expect(mod.familyCardSourceName, 'the module exports the source name').toBeTypeOf('function');
        expect(mod.familyCardSourceName({ kind: 'patch', word: 'red', hex: PATCH_HEX.red }), 'the name of red')
            .toBe('card-kit-patch-red-E53935');
        expect(mod.familyCardSourceName({ kind: 'patch', word: 'purple', hex: PATCH_HEX.purple }), 'the name of purple')
            .toBe('card-kit-patch-purple-8E24AA');
        expect(mod.familyCardSourceName({ kind: 'patch', word: 'red', hex: '#e53935' }), 'the name of a lower case hex')
            .toBe('card-kit-patch-red-E53935');
        expect(mod.familyCardSourceName({ kind: 'dots', word: 'ten', count: 10 }), 'the name of ten')
            .toBe('card-kit-dots-ten-10');
        expect(mod.familyCardSourceName({ kind: 'dots', word: 'one', count: 1 }), 'the name of one')
            .toBe('card-kit-dots-one-1');
    });
});

describe('the raster export of a family picture (Phase 10, Red 1)', () => {
    /**
     * The JPEG of one word, checked against the rules of decision H6.
     * @param jpeg The JPEG buffer.
     * @param quality The quality of the encode.
     */
    async function checkJpeg(jpeg: Buffer, quality: number): Promise<void> {
        expect(jpeg.slice(0, 2).toString('hex'), 'the JPEG start marker').toBe('ffd8');
        expect(jpeg.length, 'the byte length of the JPEG').toBeLessThanOrEqual(MAX_JPEG_BYTES);
        expect(Number.isInteger(quality), 'the quality is an integer').toBe(true);
        expect(quality, 'the quality is at least 75').toBeGreaterThanOrEqual(MIN_QUALITY);
        expect(quality, 'the quality is at most 82').toBeLessThanOrEqual(MAX_QUALITY);
        const metadata = await sharp(jpeg).metadata();
        expect(metadata.format, 'the format of the file').toBe('jpeg');
        expect(metadata.isProgressive, 'the file is a progressive JPEG').toBe(true);
        expect(metadata.space, 'the colour space of the file').toBe('srgb');
        expect(metadata.width, 'the width of the file').toBe(JPEG_SIZE);
        expect(metadata.height, 'the height of the file').toBe(JPEG_SIZE);
        expect(metadata.chromaSubsampling, 'the chroma subsampling of the file').toBe('4:2:0');
        expect(metadata.exif, 'the file holds no EXIF block').toBeUndefined();
        expect(metadata.icc, 'the file holds no ICC profile').toBeUndefined();
        expect(metadata.xmp, 'the file holds no XMP block').toBeUndefined();
    }

    it('R1-7 the render of the patch of red is a progressive JPEG of 800 x 800', async () => {
        const { jpeg, quality } = await renderJpeg({ kind: 'patch', word: 'red', hex: PATCH_HEX.red });
        await checkJpeg(jpeg, quality);
    }, 120_000);

    it('R1-7 the render of the patch of purple is a progressive JPEG of 800 x 800', async () => {
        const { jpeg, quality } = await renderJpeg({ kind: 'patch', word: 'purple', hex: PATCH_HEX.purple });
        await checkJpeg(jpeg, quality);
    }, 120_000);

    it('R1-7 the render of the card of one is a progressive JPEG of 800 x 800', async () => {
        const { jpeg, quality } = await renderJpeg({ kind: 'dots', word: 'one', count: 1 });
        await checkJpeg(jpeg, quality);
    }, 120_000);

    it('R1-7 the render of the card of ten is a progressive JPEG of 800 x 800', async () => {
        const { jpeg, quality } = await renderJpeg({ kind: 'dots', word: 'ten', count: 10 });
        await checkJpeg(jpeg, quality);
    }, 120_000);

    /**
     * The pixel positions follow the page geometry of decision H5. The page is 400 x 400 CSS px and
     * the device scale factor is 2, so the image is 800 x 800 device px. The safe margin of 4 mm is
     * 4 x 96 / 25.4 = 15.12 CSS px, so the patch starts at 30 device px. The corner radius of 6 mm
     * is 6 x 96 / 25.4 = 22.68 CSS px, so the arc of the corner has its centre at (75, 75). The pixel
     * (34, 34) lies 58 px from that centre, so it stays outside the radius of 45 px and stays white.
     * The pixel (76, 76) lies 1 px from that centre, so it shows the patch. The pixel (6, 6) lies 24 px
     * from the edge of the patch at 30 px, so the ringing of that edge does not reach it.
     */
    it('R1-8 the patch fills the area with its hex value and keeps the rounded corners', async () => {
        for (const word of ['red', 'purple']) {
            const { jpeg } = await renderJpeg({ kind: 'patch', word, hex: PATCH_HEX[word] });
            const pixels = await rawPixels(jpeg);
            expect(pixels.width, `the width of the image of ${word}`).toBe(JPEG_SIZE);
            expect(pixels.height, `the height of the image of ${word}`).toBe(JPEG_SIZE);
            const rgb = PATCH_RGB[word];
            const centre = pixelAt(pixels, 400, 400);
            expect(channelGap(centre, rgb), `the centre of ${word} is the patch colour: ${centre}`).toBeLessThanOrEqual(12);
            const corner = pixelAt(pixels, 6, 6);
            expect(channelGap(corner, WHITE), `the corner of ${word} is white: ${corner}`).toBeLessThanOrEqual(8);
            const outside = pixelAt(pixels, 34, 34);
            expect(channelGap(outside, WHITE), `the rounded corner of ${word} is white: ${outside}`).toBeLessThanOrEqual(8);
            const inside = pixelAt(pixels, 76, 76);
            expect(channelGap(inside, rgb), `the inside of the corner of ${word} is the patch colour: ${inside}`).toBeLessThanOrEqual(12);
        }
    }, 120_000);

    it('R1-9 the number cards keep a white background at the corner', async () => {
        for (const [word, count] of [['one', 1], ['ten', 10]] as const) {
            const { jpeg } = await renderJpeg({ kind: 'dots', word, count });
            const pixels = await rawPixels(jpeg);
            const corner = pixelAt(pixels, 6, 6);
            expect(channelGap(corner, WHITE), `the corner of ${word} is white: ${corner}`).toBeLessThanOrEqual(8);
        }
    }, 120_000);

    it('R1-10 the render of one, nine, and ten holds one, nine, and ten round dots', async () => {
        for (const [word, count] of [['one', 1], ['nine', 9], ['ten', 10]] as const) {
            const { jpeg } = await renderJpeg({ kind: 'dots', word, count });
            const pixels = await rawPixels(jpeg);
            const dots = roundDots(pixels);
            expect(dots.length, `the round dot count of ${word}`).toBe(count);
        }
        const { jpeg } = await renderJpeg({ kind: 'dots', word: 'ten', count: 10 });
        const pixels = await rawPixels(jpeg);
        const dots = roundDots(pixels).sort((left, right) => left.y - right.y);
        const rows: { x: number; y: number }[][] = [];
        for (const dot of dots) {
            const row = rows.find((group) => Math.abs(group[0].y - dot.y) <= 6);
            if (row) row.push(dot);
            else rows.push([dot]);
        }
        expect(rows.length, 'the ten card holds two rows of dots').toBe(2);
        expect(rows.map((row) => row.length), 'each row of the ten card holds five dots').toEqual([5, 5]);
        expect(Math.abs(rows[0][0].y - rows[1][0].y), 'the two rows of the ten card sit apart').toBeGreaterThan(6);
    }, 120_000);

    it('R1-11 two renders of the card of seven give the same bytes', async () => {
        const mod = await setFamilyPictures();
        expect(mod.renderFamilyCardJpeg, 'the script exports the renderer').toBeTypeOf('function');
        const source: DotsSource = { kind: 'dots', word: 'seven', count: 7 };
        const first = await mod.renderFamilyCardJpeg(source);
        const second = await mod.renderFamilyCardJpeg(source);
        expect(createHash('sha256').update(first.jpeg).digest('hex'), 'the hash of the first render')
            .toBe(createHash('sha256').update(second.jpeg).digest('hex'));
    }, 120_000);
});

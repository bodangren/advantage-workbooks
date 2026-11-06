// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import sharp from 'sharp';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { resolveStorytimePictureFiles } from '../lib/storytime/print/picture-check';
import type { StorytimePictureRow } from '../lib/storytime/print/pictures';
import * as cardKit from '../lib/storytime/print/card-kit';
import type { StorytimeKitItem } from '../lib/storytime/print/card-kit';

/**
 * Phase 8 of the print track, the owner request of 2026-11-06 (Daniel): the sticker pictures must
 * cover the whole 40 mm circle, so that no white space stays inside the circle.
 *
 * The test reads the 8 shipped week files of Level 2 and the 7 shipped cover pictures. It pins the
 * sticker layout of v2 (the place of the 8 stickers and the 40 mm cut circle), the new picture
 * contract (a 40 mm box at the sticker origin, a cover fit, a clip to the circle, the cut line above
 * the picture, the centre `50% 50%` with a per-sticker override), and the pixels of the rendered
 * sheet (almost no white inside each picture circle).
 *
 * The falsifier at the end measures the old v2 art (a 28 mm box at a 6 mm inset) and proves that the
 * same checker rejects it.
 */

/** The CSS pixels of one millimeter. */
const PX_PER_MM = 96 / 25.4;

/** The tolerance of a length check, in millimeters. */
const MM_TOLERANCE = 0.3;

/** The tolerance of a centre check, in percentage points. */
const CENTRE_TOLERANCE = 0.5;

/** The stickers of unit 1, in the printed order: the 7 decodable covers and unit 1. */
const STICKER_LABELS = [
    'Nan Can Nod', 'Can I?', 'The Pan', 'Pam', 'Sam and Pam', 'Tap, Tap!', 'The Top', 'unit 1',
];

/**
 * The place of each sticker on the A4 sheet, in millimeters, written by hand from the v2 layout:
 * the sheet is 210 mm wide, the sticker is 40 mm, the gutter is 6 mm, and there are 4 columns. The
 * grid is 4 x 40 + 3 x 6 = 178 mm wide, so the left margin is (210 - 178) / 2 = 16 mm. The 8
 * stickers stand in 2 rows; the grid is 2 x 40 + 1 x 6 = 86 mm high, so the top margin is
 * (297 - 86) / 2 = 105.5 mm. The step of a column and of a row is 40 + 6 = 46 mm.
 */
const STICKER_PLACES: { label: string; leftMm: number; topMm: number }[] = [
    { label: 'Nan Can Nod', leftMm: 16, topMm: 105.5 },
    { label: 'Can I?', leftMm: 62, topMm: 105.5 },
    { label: 'The Pan', leftMm: 108, topMm: 105.5 },
    { label: 'Pam', leftMm: 154, topMm: 105.5 },
    { label: 'Sam and Pam', leftMm: 16, topMm: 151.5 },
    { label: 'Tap, Tap!', leftMm: 62, topMm: 151.5 },
    { label: 'The Top', leftMm: 108, topMm: 151.5 },
    { label: 'unit 1', leftMm: 154, topMm: 151.5 },
];

/** The 7 picture stickers and the cover picture-list row of each one. */
const PICTURE_STICKERS = [
    { label: 'Nan Can Nod', rowId: 'l2-w01-cover-nan-can-nod' },
    { label: 'Can I?', rowId: 'l2-w02-cover-can-i' },
    { label: 'The Pan', rowId: 'l2-w03-cover-the-pan' },
    { label: 'Pam', rowId: 'l2-w04-cover-pam' },
    { label: 'Sam and Pam', rowId: 'l2-w05-cover-sam-and-pam' },
    { label: 'Tap, Tap!', rowId: 'l2-w06-cover-tap-tap' },
    { label: 'The Top', rowId: 'l2-w07-cover-the-top' },
];

/** The label of the sticker that prints no picture, and its printed text. */
const UNIT_STICKER_LABEL = 'unit 1';
const UNIT_STICKER_TEXT = 'Unit 1';

/** The default centre of a sticker picture: the centre of the picture. */
const DEFAULT_CENTRE = '50% 50%';

/** The diameter of the cut circle, in millimeters. */
const STICKER_DIAMETER_MM = 40;

/** The radius of the sampled area of the raster check, in millimeters: the circle less 1 mm. */
const RASTER_INNER_MM = 19;

/** The largest share of white pixels inside the circle of a picture sticker. */
const MAX_WHITE_SHARE = 0.01;

/** A pixel counts as white when every channel is above this value. */
const WHITE_LEVEL = 245;

/** A pixel counts as ink of the cut line when every channel is below this value. */
const INK_LEVEL = 60;

/** The number of points sampled on the cut line of one sticker. */
const RING_SAMPLES = 36;

/** The smallest share of the cut line points that must carry ink. */
const MIN_RING_INK_SHARE = 0.6;

/** The scale of the screenshot of the raster check. */
const RASTER_SCALE = 3;

/** One measured sticker of the rendered sheet. */
interface StickerReading {
    /** The label of the sticker, as the `data-label` attribute holds it. */
    label: string;
    /** The printed text of the sticker. */
    text: string;
    /** The place of the sticker on the sheet, in millimeters. */
    leftMm: number;
    topMm: number;
    /** The size of the sticker box, in millimeters. */
    widthMm: number;
    heightMm: number;
    /** The size of the cut circle box, in millimeters; 0 when the sticker holds no cut circle. */
    cutWidthMm: number;
    cutHeightMm: number;
    /** The place of the cut circle box, from the top left of the sticker, in millimeters. */
    cutLeftMm: number;
    cutTopMm: number;
    /** The radius of the cut line, in millimeters, from the geometry of the cut circle. */
    cutRadiusMm: number;
    /** The box of the sticker in CSS pixels, for the screenshot of the raster check. */
    boxPx: { x: number; y: number; width: number; height: number };
    /** True when the sticker shows a picture. */
    hasPicture: boolean;
    /** The picture box, relative to the top left of the sticker, in millimeters. */
    picture: { widthMm: number; heightMm: number; leftMm: number; topMm: number } | null;
    /** The fit of the picture: `cover` for a cover fit. */
    fit: string;
    /** The centre of the picture, as a percentage pair. */
    centre: string;
    /** True when the picture is clipped to a circle. */
    clipped: boolean;
}

/** The white share of the pixels inside the circle of one sticker. */
interface RasterReading {
    /** The label of the sticker. */
    label: string;
    /** The share of the sampled pixels that are white, from 0 to 1. */
    whiteShare: number;
    /** The number of the sampled pixels. */
    sampled: number;
    /** The share of the cut line points that carry ink. */
    ringInkShare: number;
}

/** The options of the sticker sheet, as the Red contract states them. */
interface StickerSheetOptions {
    /** The picture of a sticker, or undefined for a sticker of its text only. */
    pictureOf?: (item: StorytimeKitItem) => string | undefined;
    /** The centre of the picture of each sticker, by the sticker label. */
    centers?: Record<string, string>;
    /** The document title. */
    title?: string;
}

/** The parsed weeks of the shipped Level 2 folder. */
function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

/** The picture-list rows of Level 2. */
function pictureRows(): StorytimePictureRow[] {
    return JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8')) as StorytimePictureRow[];
}

/** The colour file of each cover picture of the shipped picture folder. */
let coverFiles: Map<string, string> | undefined;
function coverFileByRowId(): Map<string, string> {
    if (coverFiles) return coverFiles;
    const folder = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');
    const covers = pictureRows().filter((row) => row.use === 'cover');
    coverFiles = new Map(
        resolveStorytimePictureFiles(folder, covers, 'color').map((entry) => [entry.rowId, entry.file]),
    );
    return coverFiles;
}

/** The picture of each sticker of the kit: the colour file of its cover picture. */
function pictureOfSticker(item: StorytimeKitItem): string | undefined {
    const row = pictureRows().find((candidate) =>
        candidate.use === 'cover' && candidate.text.toLowerCase() === item.label.toLowerCase());
    if (!row) return undefined;
    return coverFileByRowId().get(row.id);
}

/** The HTML of the sticker sheet of the shipped weeks, with the shipped cover pictures. */
function shippedStickerHtml(extra?: Record<string, string>): string {
    const kit = cardKit.storytimeCardKit(weeks());
    const options: StickerSheetOptions = {
        pictureOf: pictureOfSticker,
        centers: { ...centreMap(), ...(extra ?? {}) },
        title: 'Storytime Advantage Card Kit, sticker sheet',
    };
    return cardKit.compileStorytimeStickerSheet(
        kit.items,
        options as unknown as Parameters<typeof cardKit.compileStorytimeStickerSheet>[1],
    ).html;
}

/** The browser of the measurements. */
let browser: Browser | undefined;

/** The Chrome browser of the measurements. */
async function chrome(): Promise<Browser> {
    if (browser) return browser;
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 120_000 });
    return browser;
}

afterAll(async () => {
    await browser?.close();
    browser = undefined;
});

/**
 * The script that reads every sticker of the sheet. It runs in the browser, so it is a string.
 */
const MEASURE_SCRIPT = `(() => {
    var MM = 96 / 25.4;
    var asPercent = function (raw, size) {
        if (raw === undefined || raw === null) return 50;
        raw = String(raw).trim();
        if (raw.endsWith('%')) return parseFloat(raw);
        if (raw === 'center') return 50;
        if (raw === 'left' || raw === 'top') return 0;
        if (raw === 'right' || raw === 'bottom') return 100;
        var px = parseFloat(raw);
        return isFinite(px) && size > 0 ? (px / size) * 100 : 50;
    };
    var asCentre = function (raw, width, height) {
        var parts = String(raw || '50% 50%').trim().split(/\\s+/);
        var x = asPercent(parts[0], width);
        var y = parts.length > 1 ? asPercent(parts[1], height) : 50;
        return x + '% ' + y + '%';
    };
    var isRound = function (style, box) {
        var corners = [style.borderTopLeftRadius, style.borderTopRightRadius,
            style.borderBottomRightRadius, style.borderBottomLeftRadius];
        var half = Math.min(box.width, box.height) / 2;
        return corners.every(function (corner) {
            if (String(corner).endsWith('%')) return parseFloat(corner) >= 50;
            var px = parseFloat(corner);
            return isFinite(px) && px >= half - 0.5;
        });
    };
    var readings = [];
    var stickers = Array.from(document.querySelectorAll('.sticker'));
    stickers.forEach(function (sticker) {
        var stickerBox = sticker.getBoundingClientRect();
        var cut = sticker.querySelector('.sticker-cut');
        if (!cut) {
            var svgs = Array.from(sticker.querySelectorAll('svg'));
            cut = svgs.length ? svgs[0] : null;
        }
        if (!cut) {
            var rounds = [sticker].concat(Array.from(sticker.querySelectorAll('*'))).filter(function (element) {
                var style = getComputedStyle(element);
                var width = parseFloat(style.borderTopWidth) || 0;
                return width > 0 && isRound(style, element.getBoundingClientRect());
            });
            cut = rounds.length ? rounds[rounds.length - 1] : null;
        }
        var cutBox = cut ? cut.getBoundingClientRect() : null;
        // The radius of the cut line, from the geometry of the cut circle itself.
        var cutRadiusMm = cutBox ? Math.min(cutBox.width, cutBox.height) / 2 / MM : 0;
        if (cut && cut.tagName.toLowerCase() === 'svg') {
            var circle = cut.querySelector('circle');
            var viewBox = cut.getAttribute('viewBox');
            if (circle && viewBox) {
                var parts = viewBox.trim().split(/[\\s,]+/);
                var span = parseFloat(parts[2]);
                var radius = parseFloat(circle.getAttribute('r'));
                if (isFinite(span) && span > 0 && isFinite(radius)) {
                    cutRadiusMm = Math.min(cutBox.width, cutBox.height) / MM * (radius / span);
                }
            }
        } else if (cut) {
            // A cut circle drawn as a border: the line sits half a border width inside the edge.
            var border = parseFloat(getComputedStyle(cut).borderTopWidth) || 0;
            cutRadiusMm = Math.min(cutBox.width, cutBox.height) / 2 / MM - border / 2 / MM;
        }
        var picture = sticker.querySelector('img');
        var fit = '';
        var centre = '';
        if (picture) {
            var imageStyle = getComputedStyle(picture);
            fit = imageStyle.objectFit;
            centre = asCentre(imageStyle.objectPosition, picture.getBoundingClientRect().width,
                picture.getBoundingClientRect().height);
        } else {
            var carriers = [sticker].concat(Array.from(sticker.querySelectorAll('*'))).filter(function (element) {
                return getComputedStyle(element).backgroundImage !== 'none';
            });
            var carrier = null;
            carriers.forEach(function (element) {
                var inner = carriers.some(function (other) {
                    return other !== element && element.contains(other);
                });
                if (!inner) carrier = element;
            });
            picture = carrier;
            if (carrier) {
                var carrierStyle = getComputedStyle(carrier);
                fit = carrierStyle.backgroundSize;
                centre = asCentre(carrierStyle.backgroundPosition, carrier.getBoundingClientRect().width,
                    carrier.getBoundingClientRect().height);
            }
        }
        var clipped = false;
        for (var node = picture; node; node = node.parentElement) {
            var nodeStyle = getComputedStyle(node);
            if (/circle\\(|ellipse\\(|round/.test(nodeStyle.clipPath)) { clipped = true; break; }
            var hidden = nodeStyle.overflowX === 'hidden' || nodeStyle.overflowY === 'hidden'
                || nodeStyle.overflowX === 'clip' || nodeStyle.overflowY === 'clip';
            if (isRound(nodeStyle, node.getBoundingClientRect()) && (hidden || node === picture)) {
                clipped = true;
                break;
            }
            if (node === sticker) break;
        }
        var pictureBox = picture ? picture.getBoundingClientRect() : null;
        readings.push({
            label: sticker.getAttribute('data-label') || '',
            text: (sticker.textContent || '').trim(),
            leftMm: stickerBox.left / MM,
            topMm: stickerBox.top / MM,
            widthMm: stickerBox.width / MM,
            heightMm: stickerBox.height / MM,
            cutWidthMm: cutBox ? cutBox.width / MM : 0,
            cutHeightMm: cutBox ? cutBox.height / MM : 0,
            cutLeftMm: cutBox ? (cutBox.left - stickerBox.left) / MM : 0,
            cutTopMm: cutBox ? (cutBox.top - stickerBox.top) / MM : 0,
            cutRadiusMm: cutRadiusMm,
            boxPx: {
                x: stickerBox.left,
                y: stickerBox.top,
                width: stickerBox.width,
                height: stickerBox.height,
            },
            hasPicture: picture !== null,
            picture: pictureBox ? {
                widthMm: pictureBox.width / MM,
                heightMm: pictureBox.height / MM,
                leftMm: (pictureBox.left - stickerBox.left) / MM,
                topMm: (pictureBox.top - stickerBox.top) / MM,
            } : null,
            fit: fit,
            centre: centre,
            clipped: clipped,
        });
    });
    return { readings: readings, scrollX: window.scrollX, scrollY: window.scrollY };
})()`;

/**
 * The white share inside the circle of one sticker and the ink share on its cut line, from a
 * screenshot of the sticker box.
 * @param png The bytes of the screenshot.
 * @param scale The device scale factor of the screenshot.
 * @param cutRadiusMm The radius of the cut line, in millimeters.
 * @returns The white share, the number of the sampled pixels, and the ink share of the cut line.
 */
async function circleReading(
    png: Buffer,
    scale: number,
    cutRadiusMm: number,
): Promise<{ whiteShare: number; sampled: number; ringInkShare: number }> {
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const centreX = info.width / 2;
    const centreY = info.height / 2;
    const inner = RASTER_INNER_MM * PX_PER_MM * scale;
    let sampled = 0;
    let white = 0;
    for (let y = Math.round(centreY - inner); y <= Math.round(centreY + inner); y += 1) {
        if (y < 0 || y >= info.height) continue;
        for (let x = Math.round(centreX - inner); x <= Math.round(centreX + inner); x += 1) {
            if (x < 0 || x >= info.width) continue;
            const dx = x - centreX;
            const dy = y - centreY;
            if (dx * dx + dy * dy > inner * inner) continue;
            const at = (y * info.width + x) * info.channels;
            sampled += 1;
            if (data[at] > WHITE_LEVEL && data[at + 1] > WHITE_LEVEL && data[at + 2] > WHITE_LEVEL) white += 1;
        }
    }
    const ring = cutRadiusMm * PX_PER_MM * scale;
    let ink = 0;
    for (let index = 0; index < RING_SAMPLES; index += 1) {
        const angle = (2 * Math.PI * index) / RING_SAMPLES;
        let darkest = 255;
        for (const offset of [-2, -1, 0, 1, 2]) {
            const x = Math.round(centreX + (ring + offset) * Math.cos(angle));
            const y = Math.round(centreY + (ring + offset) * Math.sin(angle));
            if (x < 0 || y < 0 || x >= info.width || y >= info.height) continue;
            const at = (y * info.width + x) * info.channels;
            darkest = Math.min(darkest, data[at], data[at + 1], data[at + 2]);
        }
        if (darkest < INK_LEVEL) ink += 1;
    }
    return {
        whiteShare: sampled > 0 ? white / sampled : 1,
        sampled,
        ringInkShare: RING_SAMPLES > 0 ? ink / RING_SAMPLES : 0,
    };
}

/**
 * The readings of one sticker sheet: the geometry of every sticker, the white share of the pixels
 * inside every picture circle, and the ink share of every cut line.
 * @param html The HTML of the sticker sheet.
 * @returns The readings of the sheet.
 */
async function measureStickerSheet(html: string): Promise<{ stickers: StickerReading[]; raster: RasterReading[] }> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-p8-stickers-'));
    const file = path.join(folder, 'stickers.html');
    fs.writeFileSync(file, html);
    const context = await (await chrome()).newContext({
        viewport: { width: 900, height: 1300 },
        deviceScaleFactor: RASTER_SCALE,
    });
    const page: Page = await context.newPage();
    try {
        page.setDefaultTimeout(120_000);
        await page.goto(pathToFileURL(file).href, { waitUntil: 'load', timeout: 120_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(
            () => Array.from(document.images).every((image) => image.complete),
            undefined,
            { timeout: 120_000 },
        );
        const measured = await page.evaluate(MEASURE_SCRIPT) as {
            readings: StickerReading[];
            scrollX: number;
            scrollY: number;
        };
        expect(measured.scrollX, 'the sheet does not scroll sideways').toBe(0);
        expect(measured.scrollY, 'the sheet does not scroll down').toBe(0);
        const raster: RasterReading[] = [];
        for (const sticker of measured.readings) {
            const png = await page.screenshot({
                clip: sticker.boxPx,
                animations: 'disabled',
            });
            const reading = await circleReading(png, RASTER_SCALE, sticker.cutRadiusMm);
            raster.push({ label: sticker.label, ...reading });
        }
        return { stickers: measured.readings, raster };
    } finally {
        await context.close();
        fs.rmSync(folder, { recursive: true, force: true });
    }
}

/** The measurement of the shipped sticker sheet, once per test file. */
let shippedMeasurement: Promise<{ stickers: StickerReading[]; raster: RasterReading[] }> | undefined;
function shippedSheet(): Promise<{ stickers: StickerReading[]; raster: RasterReading[] }> {
    shippedMeasurement ??= measureStickerSheet(shippedStickerHtml());
    return shippedMeasurement;
}

/** The reading of one sticker. */
function readingOf(stickers: StickerReading[], label: string): StickerReading {
    const found = stickers.find((sticker) => sticker.label === label);
    expect(found, `the sticker "${label}" is on the sheet`).toBeDefined();
    return found as StickerReading;
}

/** The two numbers of a centre value, in percentage points. */
function centreNumbers(value: string): [number, number] {
    const parts = value.trim().split(/\s+/);
    const read = (raw: string): number => (raw.endsWith('%') ? parseFloat(raw) : 50);
    return [read(parts[0] ?? '50%'), parts.length > 1 ? read(parts[1]) : 50];
}

/**
 * The centre map of the module, from the sticker label to the object-position value of that
 * sticker picture.
 * @returns The map; an empty map when the module has no export.
 */
function centreMap(): Record<string, string> {
    const overrides = (cardKit as unknown as Record<string, unknown>).STORYTIME_STICKER_CENTER_OVERRIDES;
    return (overrides ?? {}) as Record<string, string>;
}

/**
 * The centre of one sticker from the centre map. The key is the sticker label; the cover
 * picture-list row id of the same sticker is accepted as well.
 * @param map The centre map.
 * @param cover The picture sticker.
 * @returns The centre, or undefined when the map does not name the sticker.
 */
function centreOf(map: Record<string, string>, cover: { label: string; rowId: string }): string | undefined {
    return map[cover.label] ?? map[cover.rowId];
}

/**
 * The problems of one picture sticker: the box, the fit, and the clip.
 * @param sticker The reading of the sticker.
 * @returns The problems; an empty list means the sticker holds the contract.
 */
function pictureProblems(sticker: StickerReading): string[] {
    const problems: string[] = [];
    if (!sticker.hasPicture || !sticker.picture) {
        problems.push('the sticker shows no picture');
        return problems;
    }
    if (Math.abs(sticker.picture.widthMm - STICKER_DIAMETER_MM) > MM_TOLERANCE) {
        problems.push(`the picture box is ${sticker.picture.widthMm.toFixed(2)} mm wide, not ${STICKER_DIAMETER_MM} mm`);
    }
    if (Math.abs(sticker.picture.heightMm - STICKER_DIAMETER_MM) > MM_TOLERANCE) {
        problems.push(`the picture box is ${sticker.picture.heightMm.toFixed(2)} mm high, not ${STICKER_DIAMETER_MM} mm`);
    }
    if (Math.abs(sticker.picture.leftMm) > MM_TOLERANCE) {
        problems.push(`the picture box starts ${sticker.picture.leftMm.toFixed(2)} mm from the left of the sticker, not 0 mm`);
    }
    if (Math.abs(sticker.picture.topMm) > MM_TOLERANCE) {
        problems.push(`the picture box starts ${sticker.picture.topMm.toFixed(2)} mm from the top of the sticker, not 0 mm`);
    }
    if (sticker.fit !== 'cover') {
        problems.push(`the picture fit is "${sticker.fit}", not "cover"`);
    }
    if (!sticker.clipped) {
        problems.push('the picture is not clipped to the circle');
    }
    return problems;
}

/** The HTML of the old v2 art: a 28 mm picture box at a 6 mm inset inside the 40 mm sticker. */
function v2ArtHtml(pictureFile: string): string {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Storytime Advantage Card Kit, sticker sheet</title>
<style>
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; color: #000; background: #fff; }
.sheet { width: 210mm; height: 296.5mm; position: relative; overflow: hidden; }
.sticker { position: absolute; width: 40mm; height: 40mm; }
.sticker-cut { position: absolute; left: 0; top: 0; width: 40mm; height: 40mm; }
.sticker-art { position: absolute; left: 6mm; top: 6mm; width: 28mm; height: 28mm; display: flex; align-items: center; justify-content: center; }
.sticker-art img { max-width: 100%; max-height: 100%; width: auto; height: auto; }
</style></head>
<body><section class="sheet">
<div class="sticker" data-label="Nan Can Nod" style="left:16mm;top:105.5mm">
<svg class="sticker-cut" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="99" fill="none" stroke="#000" stroke-width="1"/></svg>
<div class="sticker-art"><img src="${pathToFileURL(pictureFile).href}" alt=""></div>
</div>
</section></body></html>`;
}

describe('Phase 8 sticker pictures cover the 40 mm circle (owner request 2026-11-06)', () => {
    it('G-P8-S11 constrains an unsafe centre override to its percentage pair', () => {
        const sticker: StorytimeKitItem = { kind: 'sticker', label: 'Nan Can Nod', week: 1, classSet: false };
        const html = cardKit.compileStorytimeStickerSheet([sticker], {
            pictureOf: () => '/tmp/nan-can-nod.png',
            centers: { 'Nan Can Nod': '50% 50%;background:url(evil)' },
        }).html;
        expect(html, 'the requested position remains a position pair').toContain('style="object-position:50% 50%"');
        expect(html, 'the injected declaration is absent').not.toContain('evil');
    });

    it('R-P8-S1 the sticker sheet holds 8 stickers: the 7 decodable covers and unit 1', () => {
        const kit = cardKit.storytimeCardKit(weeks());
        const stickers = kit.items.filter((item) => item.kind === 'sticker');
        expect(stickers.map((item) => item.label), 'the sticker labels').toEqual(STICKER_LABELS);
        expect(stickers, 'the number of stickers').toHaveLength(8);
    });

    it('R-P8-S2 the unit 1 sticker keeps its text and shows no picture', async () => {
        const { stickers } = await shippedSheet();
        expect(stickers, 'the number of stickers on the sheet').toHaveLength(8);
        const unit = readingOf(stickers, UNIT_STICKER_LABEL);
        expect(unit.text, 'the text of the unit 1 sticker').toBe(UNIT_STICKER_TEXT);
        expect(unit.hasPicture, 'the unit 1 sticker shows no picture').toBe(false);
        expect(unit.picture, 'the unit 1 sticker has no picture box').toBeNull();
    }, 240_000);

    it('R-P8-S3 the cut circle stays 40 mm and the sticker places stay as v2', async () => {
        const { stickers } = await shippedSheet();
        expect(stickers, 'the number of stickers on the sheet').toHaveLength(8);
        for (const place of STICKER_PLACES) {
            const sticker = readingOf(stickers, place.label);
            expect(Math.abs(sticker.leftMm - place.leftMm), `the left of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.topMm - place.topMm), `the top of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.widthMm - STICKER_DIAMETER_MM), `the width of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.heightMm - STICKER_DIAMETER_MM), `the height of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.cutWidthMm - STICKER_DIAMETER_MM), `the cut circle width of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.cutHeightMm - STICKER_DIAMETER_MM), `the cut circle height of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.cutLeftMm), `the cut circle starts at the left of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
            expect(Math.abs(sticker.cutTopMm), `the cut circle starts at the top of the sticker "${place.label}"`)
                .toBeLessThanOrEqual(MM_TOLERANCE);
        }
    }, 240_000);

    it('R-P8-S4 the picture of each picture sticker covers the whole 40 mm circle', async () => {
        const { stickers } = await shippedSheet();
        expect(stickers, 'the number of stickers on the sheet').toHaveLength(8);
        for (const cover of PICTURE_STICKERS) {
            const sticker = readingOf(stickers, cover.label);
            expect(pictureProblems(sticker), `the picture of the sticker "${cover.label}"`).toEqual([]);
        }
    }, 240_000);

    it('R-P8-S5 the cut line of every sticker stays visible above the picture', async () => {
        const { raster } = await shippedSheet();
        expect(raster, 'the number of the measured stickers').toHaveLength(8);
        for (const circle of raster) {
            expect(circle.ringInkShare, `the ink share on the cut line of the sticker "${circle.label}"`)
                .toBeGreaterThanOrEqual(MIN_RING_INK_SHARE);
        }
    }, 240_000);

    it('R-P8-S6 the centre map of the module holds one object position per sticker', () => {
        const overrides = (cardKit as unknown as Record<string, unknown>).STORYTIME_STICKER_CENTER_OVERRIDES;
        expect(overrides, 'the module exports STORYTIME_STICKER_CENTER_OVERRIDES').toBeDefined();
        expect(typeof overrides, 'the export is an object').toBe('object');
        const map = overrides as Record<string, string>;
        for (const [key, value] of Object.entries(map)) {
            const known = STICKER_LABELS.includes(key)
                || PICTURE_STICKERS.some((cover) => cover.rowId === key);
            expect(known, `the key "${key}" of the centre map names a sticker or a cover row`).toBe(true);
            expect(typeof value, `the centre of the sticker "${key}" is a string`).toBe('string');
            expect(value, `the centre of the sticker "${key}" is a percentage pair`).toMatch(/^\s*\d+(\.\d+)?%\s+\d+(\.\d+)?%\s*$/);
        }
    });

    it('R-P8-S7 the centre of every picture sticker is 50% 50%, unless the map names it', async () => {
        const map = centreMap();
        const { stickers } = await shippedSheet();
        for (const cover of PICTURE_STICKERS) {
            const sticker = readingOf(stickers, cover.label);
            const expected = centreOf(map, cover) ?? DEFAULT_CENTRE;
            const actual = centreNumbers(sticker.centre);
            const wanted = centreNumbers(expected);
            expect(Math.abs(actual[0] - wanted[0]), `the horizontal centre of the sticker "${cover.label}"`)
                .toBeLessThanOrEqual(CENTRE_TOLERANCE);
            expect(Math.abs(actual[1] - wanted[1]), `the vertical centre of the sticker "${cover.label}"`)
                .toBeLessThanOrEqual(CENTRE_TOLERANCE);
        }
    }, 240_000);

    it('R-P8-S8 a centre override moves one sticker only', async () => {
        const moved = '30% 70%';
        // The map may name the sticker by its label or by the cover picture-list row id, so the
        // override is offered under both names.
        const overridden = await measureStickerSheet(shippedStickerHtml({
            'Nan Can Nod': moved,
            'l2-w01-cover-nan-can-nod': moved,
        }));
        const plain = await shippedSheet();
        const movedSticker = readingOf(overridden.stickers, 'Nan Can Nod');
        const actual = centreNumbers(movedSticker.centre);
        expect(Math.abs(actual[0] - 30), 'the horizontal centre of the overridden sticker')
            .toBeLessThanOrEqual(CENTRE_TOLERANCE);
        expect(Math.abs(actual[1] - 70), 'the vertical centre of the overridden sticker')
            .toBeLessThanOrEqual(CENTRE_TOLERANCE);
        for (const cover of PICTURE_STICKERS) {
            if (cover.label === 'Nan Can Nod') continue;
            const before = centreNumbers(readingOf(plain.stickers, cover.label).centre);
            const after = centreNumbers(readingOf(overridden.stickers, cover.label).centre);
            expect(Math.abs(after[0] - before[0]), `the horizontal centre of the sticker "${cover.label}" stays`)
                .toBeLessThanOrEqual(CENTRE_TOLERANCE);
            expect(Math.abs(after[1] - before[1]), `the vertical centre of the sticker "${cover.label}" stays`)
                .toBeLessThanOrEqual(CENTRE_TOLERANCE);
        }
    }, 300_000);

    it('R-P8-S9 the pixels inside each picture circle hold almost no white', async () => {
        const { raster } = await shippedSheet();
        expect(raster, 'the number of the measured circles').toHaveLength(8);
        for (const cover of PICTURE_STICKERS) {
            const circle = raster.find((entry) => entry.label === cover.label);
            expect(circle, `the circle of the sticker "${cover.label}" was measured`).toBeDefined();
            const measured = circle as RasterReading;
            expect(measured.sampled, `the sampled pixels of the sticker "${cover.label}"`).toBeGreaterThan(10000);
            expect(measured.whiteShare, `the white share inside the circle of the sticker "${cover.label}"`)
                .toBeLessThanOrEqual(MAX_WHITE_SHARE);
        }
    }, 240_000);

    it('R-P8-S10 falsifier: the old 28 mm inset art fails the same check', async () => {
        const file = coverFileByRowId().get('l2-w01-cover-nan-can-nod');
        expect(file, 'the cover picture of the sticker "Nan Can Nod" is delivered').toBeDefined();
        const { stickers, raster } = await measureStickerSheet(v2ArtHtml(file as string));
        const old = readingOf(stickers, 'Nan Can Nod');
        expect(old.picture, 'the old art holds a picture box').not.toBeNull();
        expect(Math.abs((old.picture as { widthMm: number }).widthMm - 28), 'the old picture box is 28 mm wide')
            .toBeLessThanOrEqual(MM_TOLERANCE);
        expect(pictureProblems(old), 'the old art fails the picture contract').not.toEqual([]);
        const circle = raster.find((entry) => entry.label === 'Nan Can Nod') as RasterReading;
        expect(circle.whiteShare, 'the old art leaves white inside the circle')
            .toBeGreaterThan(MAX_WHITE_SHARE);
    }, 240_000);
});

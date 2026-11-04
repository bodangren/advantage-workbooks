import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/** Fix 4: each line of a practice text has one rule that spans the full width of the practice text box. */

const SCALE = 3;
/** A pixel counts as ink of a rule when its red channel is below this value (rule ink is #000). */
const DARK = 140;
/** A pixel row is a rule row when this share of the box width is dark; glyph rows stay far below it. */
const FULL_WIDTH_SHARE = 0.98;
/** The clip reaches this many CSS pixels under the box, because a rule may sit just under the last line. */
const CLIP_BELOW_PX = 10;

const scratch: string[] = [];
afterAll(() => {
    for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

interface PracticeBox {
    index: number;
    text: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
    lines: number;
}

function shippedHtml(): string {
    const weeks = Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(JSON.parse(
        fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8'),
    )));
    return compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html;
}

/**
 * Counts the pixel rows that form rules across a practice-text clip.
 * @param png The PNG of the clip.
 * @returns The number of separate rule bands and the thickness in device pixels of each band.
 */
async function ruleBands(png: Buffer): Promise<number[]> {
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const bands: number[] = [];
    let current = 0;
    for (let y = 0; y < info.height; y += 1) {
        let dark = 0;
        for (let x = 0; x < info.width; x += 1) if (data[(y * info.width + x) * info.channels] < DARK) dark += 1;
        if (dark >= FULL_WIDTH_SHARE * info.width) {
            current += 1;
        } else if (current > 0) {
            bands.push(current);
            current = 0;
        }
    }
    if (current > 0) bands.push(current);
    return bands;
}

describe('Storytime print practice rules (fix 4)', () => {
    it('R-P6-F4: each line of each practice text has one rule across the full width of the practice text box (Chrome, Andika loaded)', async () => {
        const html = shippedHtml();
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
        try {
            const folder = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-practice-rule-'));
            scratch.push(folder);
            const file = path.join(folder, 'student.html');
            fs.writeFileSync(file, html);
            const context = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: SCALE });
            const page = await context.newPage();
            await page.goto(pathToFileURL(file).href);
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.fonts.check('16px Andika')), 'the Andika print font loads in the browser').toBe(true);

            const boxes: PracticeBox[] = await page.evaluate(() => {
                const found: PracticeBox[] = [];
                document.querySelectorAll('[data-part="practice-text"]').forEach((el, index) => {
                    const box = el.getBoundingClientRect();
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    const tops: number[] = [];
                    for (const rect of Array.from(range.getClientRects())) {
                        if (rect.width > 0 && !tops.some((top) => Math.abs(top - rect.top) < 4)) tops.push(rect.top);
                    }
                    found.push({
                        index,
                        text: el.textContent ?? '',
                        left: box.left + window.scrollX,
                        right: box.right + window.scrollX,
                        top: box.top + window.scrollY,
                        bottom: box.bottom + window.scrollY,
                        lines: tops.length,
                    });
                });
                return found;
            });
            expect(boxes.length, 'practice texts in the 8-week book').toBeGreaterThanOrEqual(12);

            const problems: string[] = [];
            let wrapped = 0;
            for (const box of boxes) {
                if (box.lines > 1) wrapped += 1;
                const clip = { x: box.left, y: box.top - 2, width: box.right - box.left, height: box.bottom - box.top + 2 + CLIP_BELOW_PX };
                const png = await page.screenshot({ clip, fullPage: true });
                const bands = await ruleBands(png);
                if (bands.length !== box.lines) problems.push(`"${box.text}": ${box.lines} line(s), ${bands.length} full-width rule(s)`);
                for (const thickness of bands) {
                    if (thickness < 2 || thickness > 3 * SCALE * 2) problems.push(`"${box.text}": a rule band of ${thickness} device px`);
                }
            }
            expect(wrapped, 'at least one practice text wraps to 2 lines').toBeGreaterThanOrEqual(1);
            expect(problems).toEqual([]);
        } finally {
            await browser.close();
        }
    }, 180_000);
});

import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { coverBook } from '../lib/covers/catalogue';
import { PAGE_RATIO, composeSide, cutWide, placeArt } from '../lib/covers/compose';
import { FRONT_TEXT, coverDocument, frontPage } from '../lib/covers/template';

// Track book_covers_20261007: the picture part and the HTML of a cover side.
const solid = (width: number, height: number, background: { r: number; g: number; b: number; alpha?: number }) =>
    sharp({ create: { width, height, channels: 4, background: { alpha: 1, ...background } } }).png().toBuffer();

describe('cover compose', () => {
    it('cuts the middle two pages of a wide picture into the back (left) and the front (right)', async () => {
        const left = await solid(960, 1280, { r: 255, g: 0, b: 0 });
        const right = await solid(960, 1280, { r: 0, g: 0, b: 255 });
        const wide = await sharp({ create: { width: 1920, height: 1280, channels: 4, background: '#000' } })
            .composite([{ input: left, left: 0, top: 0 }, { input: right, left: 960, top: 0 }])
            .png()
            .toBuffer();
        const { back, front } = await cutWide(wide);
        const half = Math.floor(1280 * PAGE_RATIO);
        expect(await sharp(back).metadata()).toMatchObject({ width: half, height: 1280 });
        expect(await sharp(front).metadata()).toMatchObject({ width: half, height: 1280 });
        expect((await sharp(back).stats()).channels[0].mean).toBe(255);
        expect((await sharp(front).stats()).channels[2].mean).toBe(255);
        await expect(cutWide(await solid(1000, 1280, { r: 0, g: 0, b: 0 }))).rejects.toThrow('narrower than two pages');
    });

    it('places tall art at the top or in the middle', async () => {
        // Top 100 rows red, bottom 100 rows blue, page 100 x 100: the top shows red, the middle half of each.
        const art = await sharp({ create: { width: 100, height: 200, channels: 3, background: '#0000ff' } })
            .composite([{ input: await solid(100, 100, { r: 255, g: 0, b: 0 }), left: 0, top: 0 }])
            .png()
            .toBuffer();
        const top = await sharp(await placeArt(art, { width: 100, height: 100 }, 'top')).stats();
        const mid = await sharp(await placeArt(art, { width: 100, height: 100 }, 'center')).stats();
        expect(top.channels[0].mean).toBeGreaterThan(250);
        expect(mid.channels[0].mean).toBeGreaterThan(100);
        expect(mid.channels[0].mean).toBeLessThan(155);
    });

    it('stacks the layers on the art and gives an opaque JPEG', async () => {
        const art = await solid(40, 40, { r: 0, g: 255, b: 0 });
        const layer = await solid(40, 40, { r: 255, g: 255, b: 255, alpha: 0 });
        const out = await sharp(await composeSide(art, [layer])).metadata();
        expect(out).toMatchObject({ format: 'jpeg', width: 40, height: 40, channels: 3 });
    });
});

describe('cover template', () => {
    it('puts the level and the escaped title at the measured places', () => {
        const page = frontPage({ ...coverBook('quest-4'), name: 'Quest <4>' }, 'data:image/jpeg;base64,AAAA');
        expect(page).toContain(`x="${FRONT_TEXT.level.x}" y="${FRONT_TEXT.level.y}" font-size="${FRONT_TEXT.level.size}">4</text>`);
        expect(page).toContain('data-max-width="430">Quest &lt;4&gt;</text>');
        expect(page).toContain('font-family="League Spartan" font-weight="700"');
    });

    it('makes 210 x 285 mm pages with no transparency in the CSS', () => {
        const doc = coverDocument(['<div class="page front"></div>'], '@font-face {}');
        expect(doc).toContain('@page { size: 210mm 285mm; margin: 0; }');
        expect(doc).toContain('document.body.dataset.ready');
        expect(doc).not.toMatch(/rgba\(|opacity|box-shadow|gradient/);
    });
});

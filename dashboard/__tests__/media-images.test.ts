// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { CastSchema } from '../lib/media/cast';
import { promptProblems, castKey, sheetFor, imagePrompt, imageArgs, overlayLayout, overlayLayouts, overlaySvg, NO_TEXT, SIGN_TEXT, quotedTexts } from '../lib/media/images';
import { PackageImageSchema } from '../lib/lesson-package/schema';

const cast = CastSchema.parse({
    version: 1,
    style: '2D picture-book style.',
    sheet: 'Full body.',
    characters: [
        { name: 'tom', description: 'Tom, a boy with short brown hair.', source: { image: 'source/tom.jpg', from: 'O2' }, chosen: 'tom.jpg', chosenFrom: 'candidates/tom_002.jpg' },
        { name: 'pip', description: 'Pip, a small brown puppy. He sits and smiles.', look: 'Pip, a small brown puppy.', source: { image: 'source/pip.jpg', from: 'O3.1' } },
        { name: 'teacher-kim', description: 'Teacher Kim, a woman with a black bob.' },
    ],
});
const image = (over: Partial<Record<string, unknown>> = {}) =>
    PackageImageSchema.parse({ position: 'hero', prompt: 'Tom waves hello. Pip sits next to him.', characters: ['Tom', 'Pip'], caption: 'Hello!', ...over });

describe('image prompt rules', () => {
    it('finds skin, race, and nationality words, and lets hair, clothes, and white backgrounds pass', () => {
        expect(promptProblems('Tom, a nine-year-old Thai boy, waves.')).toEqual(['Thai']);
        expect(promptProblems('An Asian girl with light skin.')).toEqual(['Asian', 'skin']);
        expect(promptProblems('A boy with black hair in a white shirt, on a white background. A brown puppy.')).toEqual([]);
    });
});

describe('cast lookup', () => {
    it('turns a series-bible name into a cast key', () => {
        expect(castKey('Teacher Kim')).toBe('teacher-kim');
        expect(castKey('Tom')).toBe('tom');
    });

    it('uses the chosen sheet, then the printed source, then nothing', () => {
        expect(sheetFor(cast, 'Tom')).toBe('tom.jpg');
        expect(sheetFor(cast, 'Pip')).toBe('source/pip.jpg');
        expect(sheetFor(cast, 'Teacher Kim')).toBeUndefined();
        expect(sheetFor(cast, 'Nobody')).toBeUndefined();
    });
});

describe('image job', () => {
    it('builds the prompt from the style, the scene, the cast looks (no sheet pose), and the no-text rule', () => {
        expect(imagePrompt(cast, image())).toBe(
            `2D picture-book style. Tom waves hello. Pip sits next to him. Tom, a boy with short brown hair. Pip, a small brown puppy. ${NO_TEXT}`,
        );
    });

    it('asks for exact sign text when the prompt quotes it (Muse draws text; track editorial_prereview_20261003)', () => {
        const signed = image({ prompt: 'A white sign on the gate says "NO DOGS."' });
        const prompt = imagePrompt(cast, signed);
        expect(prompt).not.toContain(NO_TEXT);
        expect(prompt).toContain(SIGN_TEXT);
        expect(prompt).toContain('"NO DOGS."');
        expect(quotedTexts(signed.prompt)).toEqual(['NO DOGS.']);
        expect(quotedTexts('Tom waves.')).toEqual([]);
    });

    it('uses the text only by default (a reference gives a 3D look); with withSheets one reference per sheet', () => {
        const opts = { sheetsDir: '/s', outDir: '/m/candidates', prefix: 'hero-2', count: 2 };
        expect(imageArgs(cast, image({ characters: ['Tom', 'Pip'] }), opts)).not.toContain('--subject-ref');
        const args = imageArgs(cast, image({ characters: ['Tom', 'Pip', 'Teacher Kim'] }), { ...opts, withSheets: true });
        const refs = args.flatMap((a, i) => (a === '--subject-ref' ? [args[i + 1]] : []));
        expect(refs).toEqual(['type=character,image=/s/tom.jpg', 'type=character,image=/s/source/pip.jpg']);
        expect(args).toEqual(expect.arrayContaining(['--aspect-ratio', '1:1', '--n', '2', '--out-dir', '/m/candidates', '--out-prefix', 'hero-2']));
    });
});

describe('text overlay', () => {
    it('puts the text box at the bottom by default and fits the font to the box', () => {
        const layout = overlayLayout({ text: 'PARK' }, 1000, 1000);
        expect(layout.box).toEqual({ x: 100, y: 820, w: 800, h: 120 });
        expect(layout.fontSize).toBe(72);
        expect(layout.lines).toEqual(['PARK']);
        const long = overlayLayout({ text: 'Welcome to our very big school' }, 1000, 1000);
        expect(long.fontSize).toBeLessThan(72);
        for (const line of long.lines) expect(long.fontSize * 0.6 * line.length).toBeLessThanOrEqual(800 * 0.92);
        expect(long.lines.length * long.fontSize * 1.2).toBeLessThanOrEqual(120 * 0.9);
    });

    it('wraps a long text onto more lines in a tall box, with a bigger font than one line allows (track editorial_prereview_20261003)', () => {
        const text = 'Where is Pat\'s teddy? It is small and brown. It has got a red hat.';
        const tall = overlayLayout({ text, box: [0.6, 0.05, 0.3, 0.4] }, 1000, 1000);
        expect(tall.lines.length).toBeGreaterThan(2);
        expect(tall.lines.join(' ')).toBe(text);
        expect(tall.fontSize).toBeGreaterThan(Math.floor((300 * 0.92) / (text.length * 0.6)));
        for (const line of tall.lines) expect(tall.fontSize * 0.6 * line.length).toBeLessThanOrEqual(300 * 0.92);
        expect(tall.lines.length * tall.fontSize * 1.2).toBeLessThanOrEqual(400 * 0.9);
    });

    it('stacks overlays with no place in rows that do not overlap', () => {
        const layouts = overlayLayouts(Array.from({ length: 9 }, (_, i) => ({ text: `Line ${i + 1}` })), 1000, 1000);
        expect(layouts).toHaveLength(9);
        for (const l of layouts) {
            expect(l.box.y).toBeGreaterThanOrEqual(0);
            expect(l.box.y + l.box.h).toBeLessThanOrEqual(1000);
        }
        for (let i = 1; i < layouts.length; i++) expect(layouts[i].box.y).toBeGreaterThanOrEqual(layouts[i - 1].box.y + layouts[i - 1].box.h);
        const one = overlayLayouts([{ text: 'PARK' }], 1000, 1000);
        expect(one[0].box).toEqual({ x: 100, y: 820, w: 800, h: 120 });
    });

    it('draws a placed text on a plain panel and an unplaced text on a bordered sign, one tspan per line', () => {
        const svg = overlaySvg([{ text: 'NO DOGS', box: [0.1, 0.1, 0.3, 0.1] }, { text: 'OPEN' }], 1000, 1000);
        const rects = svg.match(/<rect [^>]*>/g) ?? [];
        expect(rects).toHaveLength(2);
        expect(rects[0]).not.toContain('stroke=');
        expect(rects[1]).toContain('stroke=');
        const wrapped = overlaySvg([{ text: 'Where is Pat\'s teddy? It is small and brown.', box: [0.6, 0.05, 0.3, 0.4] }], 1000, 1000);
        expect((wrapped.match(/<tspan /g) ?? []).length).toBeGreaterThan(1);
    });

    it('uses a given box and escapes the text for SVG', () => {
        const layout = overlayLayout({ text: 'A & B', box: [0.5, 0.1, 0.4, 0.1] }, 1024, 1024);
        expect(layout.box).toEqual({ x: 512, y: 102, w: 410, h: 102 });
        const svg = overlaySvg([{ text: 'Tom <3 & Pip', box: [0.5, 0.1, 0.4, 0.1] }], 1024, 1024);
        expect(svg).toContain('Tom &lt;3 &amp; Pip');
        expect(svg).toMatch(/^<svg [^>]*width="1024" height="1024"/);
        expect(svg).toContain('<rect');
    });
});

describe('final picture', () => {
    it('draws the sign on the picture and copies a picture without overlays', async () => {
        const sharp = (await import('sharp')).default;
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');
        const { renderImage } = await import('../lib/media/render');
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
        const raw = path.join(dir, 'hero.raw.jpg');
        await sharp({ create: { width: 200, height: 200, channels: 3, background: '#2060c0' } }).jpeg().toFile(raw);
        await renderImage(raw, path.join(dir, 'signed.jpg'), [{ text: 'PARK', box: [0.1, 0.1, 0.8, 0.3] }]);
        await renderImage(raw, path.join(dir, 'plain.jpg'), []);
        const pixel = async (file: string, x: number, y: number) => {
            const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
            const i = (y * info.width + x) * info.channels;
            return [data[i], data[i + 1], data[i + 2]];
        };
        // A corner of the sign is white; outside the sign the picture is unchanged (blue).
        expect((await pixel(path.join(dir, 'signed.jpg'), 30, 30)).every((v) => v > 200)).toBe(true);
        expect((await pixel(path.join(dir, 'signed.jpg'), 100, 180))[2]).toBeGreaterThan(150);
        expect((await pixel(path.join(dir, 'plain.jpg'), 30, 30))[2]).toBeGreaterThan(150);
        fs.rmSync(dir, { recursive: true, force: true });
    });
});

import path from 'path';
import type { Cast } from './cast';
import type { PackageImage } from '../lesson-package/schema';

/**
 * Lesson images (track lesson_media_20261001). Each image is made with mmx from the house style,
 * the scene prompt, and the character sheets as subject references. mmx cannot draw text, so text
 * on signs and labels is drawn on top afterwards (the overlay).
 */

/** The last sentence of every image prompt. */
export const NO_TEXT = 'No words, letters, or numbers anywhere in the picture.';
/**
 * The rule when the prompt quotes sign text: Muse draws text well (tested 2026-10-03 on a zoo with
 * four signs, a timetable, and a five-line poster). Check the spelling by eye.
 */
export const SIGN_TEXT = 'The only words in the picture are the sign texts in quotation marks. Write each one exactly as given, spelled correctly, in big, clear, simple print letters that a child can read. No other words, letters, or numbers anywhere.';

/**
 * The texts that a prompt asks the model to draw: every part in double quotation marks.
 * @param prompt An image prompt.
 * @returns The texts, in order.
 */
export function quotedTexts(prompt: string): string[] {
    return [...prompt.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Prompts describe hair and clothes, never skin, race, or nationality (series bible v1.2). The
 * picture-book look is race-agnostic on purpose.
 */
const BANNED = /\b(thai|asian|western|caucasian|european|african|american|indian|chinese|japanese|korean|ethnic|ethnicity|race|racial|skin|skinned|complexion)\b/gi;

/**
 * Words in a prompt that break the prompt rule.
 * @param prompt An image prompt.
 * @returns The words as written, once each, in order.
 */
export function promptProblems(prompt: string): string[] {
    return [...new Set(prompt.match(BANNED) ?? [])];
}

/**
 * The cast key for a series-bible name.
 * @param name For example `Teacher Kim`.
 * @returns For example `teacher-kim`.
 */
export function castKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * The reference image for a character: the chosen sheet, or else the printed source crop.
 * @param cast The cast file.
 * @param name A series-bible name.
 * @returns A path relative to the character-sheets folder, or undefined.
 */
export function sheetFor(cast: Cast, name: string): string | undefined {
    const c = cast.characters.find((x) => x.name === castKey(name));
    return c?.chosen ?? c?.source?.image;
}

/**
 * The full prompt for one image.
 * @param cast The cast file.
 * @param image The package image.
 * @returns Style, scene, the descriptions of the characters in it, and the no-text rule.
 */
export function imagePrompt(cast: Cast, image: PackageImage): string {
    const descriptions = image.characters.flatMap((n) => {
        const c = cast.characters.find((x) => x.name === castKey(n));
        return c ? [c.look ?? c.description] : [];
    });
    return [cast.style, image.prompt, ...descriptions, quotedTexts(image.prompt).length ? SIGN_TEXT : NO_TEXT].join(' ');
}

/**
 * Arguments for `mmx` to make candidates for one image.
 * @param cast The cast file.
 * @param image The package image.
 * @param opts Folders, the file prefix for this run, and the number of candidates.
 * @returns The argument list (without the `mmx` command).
 */
export function imageArgs(cast: Cast, image: PackageImage, opts: { sheetsDir: string; outDir: string; prefix: string; count: number; withSheets?: boolean }): string[] {
    const args = ['image', 'generate', '--prompt', imagePrompt(cast, image), '--aspect-ratio', '1:1', '--n', String(opts.count)];
    // A subject reference gives a 3D look (tests 2026-10-01); the flat style and the looks keep the cast the same.
    for (const name of opts.withSheets ? image.characters : []) {
        const sheet = sheetFor(cast, name);
        if (sheet) args.push('--subject-ref', `type=character,image=${path.join(opts.sheetsDir, sheet)}`);
    }
    args.push('--out-dir', opts.outDir, '--out-prefix', opts.prefix);
    return args;
}

export interface Overlay {
    text: string;
    /** x, y, width, height as fractions of the image size. */
    box?: [number, number, number, number];
}

/** A sign along the bottom when the plan gives no box. */
const DEFAULT_BOX: [number, number, number, number] = [0.1, 0.82, 0.8, 0.12];
/** 0.6 em is a safe mean advance for a bold sans. */
const ADVANCE = 0.6;
const LINE_HEIGHT = 1.2;

/** Words on lines of at most `max` characters (a longer word gets a line of its own). */
function wrapWords(text: string, max: number): string[] {
    const lines: string[] = [];
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const last = lines[lines.length - 1];
        if (last !== undefined && last.length + 1 + word.length <= max) lines[lines.length - 1] = `${last} ${word}`;
        else lines.push(word);
    }
    return lines.length ? lines : [''];
}

/**
 * Where one overlay goes, how its text wraps, and how big the text is: the largest font whose
 * lines fit 92% of the box width and 90% of its height (one line may use 60% of the height).
 * @param overlay The text and its box.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @returns The box in pixels, the font size, and the lines.
 */
export function overlayLayout(overlay: Overlay, width: number, height: number) {
    const [fx, fy, fw, fh] = overlay.box ?? DEFAULT_BOX;
    const box = { x: Math.round(fx * width), y: Math.round(fy * height), w: Math.round(fw * width), h: Math.round(fh * height) };
    for (let fontSize = Math.max(1, Math.floor(box.h * 0.6)); fontSize > 1; fontSize--) {
        const lines = wrapWords(overlay.text, Math.floor((box.w * 0.92) / (fontSize * ADVANCE)));
        const widest = Math.max(...lines.map((l) => l.length));
        const tallEnough = lines.length === 1 || lines.length * fontSize * LINE_HEIGHT <= box.h * 0.9;
        if (tallEnough && widest * fontSize * ADVANCE <= box.w * 0.92) return { box, fontSize, lines };
    }
    return { box, fontSize: 1, lines: [overlay.text] };
}

/**
 * The layouts of all overlays of one image. Overlays with no box stack in rows at the bottom, so
 * they never overlap (the first one on top); one such overlay keeps the default sign.
 * @param overlays The overlays.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @returns One layout per overlay, in order.
 */
export function overlayLayouts(overlays: Overlay[], width: number, height: number) {
    const loose = overlays.filter((o) => !o.box);
    const rowH = Math.min(DEFAULT_BOX[3], 0.86 / Math.max(1, loose.length) / 1.1);
    const bottom = DEFAULT_BOX[1] + DEFAULT_BOX[3];
    let row = 0;
    return overlays.map((o) => {
        if (o.box) return { ...overlayLayout(o, width, height), placed: true };
        const y = bottom - (loose.length - row) * rowH * 1.1 + rowH * 0.1;
        row++;
        const box: [number, number, number, number] = loose.length === 1 ? DEFAULT_BOX : [DEFAULT_BOX[0], y, DEFAULT_BOX[2], rowH];
        return { ...overlayLayout({ text: o.text, box }, width, height), placed: false };
    });
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * An SVG layer with every overlay of an image. A placed text sits on a plain white panel on the
 * blank sign of the picture; a text with no place gets a bordered white sign at the bottom.
 * @param overlays The overlays.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @returns SVG markup the size of the image.
 */
export function overlaySvg(overlays: Overlay[], width: number, height: number): string {
    const parts = overlayLayouts(overlays, width, height).map(({ box, fontSize, lines, placed }) => {
        const r = Math.round(Math.min(box.h, box.w) * (placed ? 0.08 : 0.25));
        const rect = placed
            ? `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${r}" fill="#ffffff" fill-opacity="0.9"/>`
            : `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${r}" fill="#ffffff" fill-opacity="0.92" stroke="#3b2f2f" stroke-width="3"/>`;
        const cx = box.x + box.w / 2;
        const top = box.y + box.h / 2 - ((lines.length - 1) * fontSize * LINE_HEIGHT) / 2;
        const spans = lines.map((line, i) => `<tspan x="${cx}" y="${Math.round(top + i * fontSize * LINE_HEIGHT)}">${escapeXml(line)}</tspan>`).join('');
        return (
            rect +
            `<text font-family="Noto Sans, DejaVu Sans, sans-serif" font-weight="700" font-size="${fontSize}" fill="#2b2222" text-anchor="middle" dominant-baseline="central">${spans}</text>`
        );
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

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
    return [cast.style, image.prompt, ...descriptions, NO_TEXT].join(' ');
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

/**
 * Where one overlay goes and how big its text is.
 * @param overlay The text and its box.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @returns The box in pixels and a font size that fits the text in it.
 */
export function overlayLayout(overlay: Overlay, width: number, height: number) {
    const [fx, fy, fw, fh] = overlay.box ?? DEFAULT_BOX;
    const box = { x: Math.round(fx * width), y: Math.round(fy * height), w: Math.round(fw * width), h: Math.round(fh * height) };
    // 0.6 em is a safe mean advance for a bold sans; 92% of the box width leaves a margin.
    const fontSize = Math.floor(Math.min(box.h * 0.6, (box.w * 0.92) / (Math.max(1, overlay.text.length) * 0.6)));
    return { box, fontSize };
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * An SVG layer with every overlay of an image: a white sign with dark text.
 * @param overlays The overlays.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @returns SVG markup the size of the image.
 */
export function overlaySvg(overlays: Overlay[], width: number, height: number): string {
    const parts = overlays.map((o) => {
        const { box, fontSize } = overlayLayout(o, width, height);
        const r = Math.round(box.h * 0.25);
        return (
            `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${r}" fill="#ffffff" fill-opacity="0.92" stroke="#3b2f2f" stroke-width="3"/>` +
            `<text x="${box.x + box.w / 2}" y="${box.y + box.h / 2}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-weight="700" font-size="${fontSize}" fill="#2b2222" text-anchor="middle" dominant-baseline="central">${escapeXml(o.text)}</text>`
        );
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

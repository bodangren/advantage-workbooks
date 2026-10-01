import { castPrompt, type Cast, type CastCharacter } from './cast';
import type { PackageImage } from '../lesson-package/schema';
import { imagePrompt, sheetFor } from './images';

/**
 * Lesson pictures with Meta Muse Image through the OpenRouter Image API (`POST /api/v1/images`).
 * Test on E12 (2026-10-01): with the chosen cast sheets as reference pictures, Muse keeps the
 * faces, hair, clothes, and the flat 2D style much closer to the sheets than mmx; about $0.01 and
 * 20–35 s per picture. Pure: the script `scripts/media/lesson-images.ts --model muse` sends the request.
 */

export const MUSE_MODEL = 'meta/muse-image';
export const OPENROUTER_IMAGES_URL = 'https://openrouter.ai/api/v1/images';

/**
 * The OpenRouter key. `.env.local` has it as `OPERNROUTER_API_KEY` (a spelling mistake), so both
 * names work.
 * @param env The environment.
 * @returns The key, or undefined.
 */
export function openRouterKey(env: Record<string, string | undefined>): string | undefined {
    return (env.OPENROUTER_API_KEY || env.OPERNROUTER_API_KEY)?.trim() || undefined;
}

/**
 * The prompt for one picture: which reference picture shows which character, then the mmx prompt.
 * @param cast The cast file.
 * @param image The package image.
 * @param refs The characters with a reference picture, in the order of the pictures.
 * @returns The prompt text.
 */
export function referencePrompt(cast: Cast, image: PackageImage, refs: string[]): string {
    const intro = refs.length
        ? `Reference pictures: ${refs.map((n, i) => `picture ${i + 1} is ${n}`).join(', ')}. Draw each character exactly as in the reference: the same face, hair, clothes, colors, and drawing style.`
        : '';
    return [intro, imagePrompt(cast, image)].filter(Boolean).join(' ');
}

const dataUrl = (data: Buffer) => ({ type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${data.toString('base64')}` } });

/**
 * The request body for one picture.
 * @param cast The cast file.
 * @param image The package image.
 * @param readSheet Reads a sheet file (path relative to the character-sheets folder).
 * @param opts The aspect ratio (Muse gives 1600×1600 for `1:1`, and 1920×1280 for `16:9`).
 * @returns The body and the characters that have a reference picture.
 */
export function museRequest(cast: Cast, image: PackageImage, readSheet: (rel: string) => Buffer, opts: { aspectRatio: string }) {
    const withSheet = image.characters.flatMap((name) => {
        const sheet = sheetFor(cast, name);
        return sheet ? [{ name, sheet }] : [];
    });
    const refs = withSheet.map((r) => r.name);
    const body: { model: string; prompt: string; aspect_ratio: string; input_references?: ReturnType<typeof dataUrl>[] } = {
        model: MUSE_MODEL,
        prompt: referencePrompt(cast, image, refs),
        aspect_ratio: opts.aspectRatio,
    };
    if (withSheet.length) body.input_references = withSheet.map((r) => dataUrl(readSheet(r.sheet)));
    return { body, refs };
}

/**
 * The pictures in an Image API response.
 * @param body The parsed JSON response.
 * @returns The image bytes with their media type, and the cost in USD. Throws on an API error or
 * when there is no image.
 */
export function imagesFromResponse(body: unknown): { images: { data: Buffer; mediaType: string }[]; cost?: number } {
    const b = (body ?? {}) as { error?: { message?: string; code?: number }; data?: { b64_json?: string; media_type?: string }[]; usage?: { cost?: number } };
    if (b.error) throw new Error(`${b.error.code ?? 'error'}: ${b.error.message ?? 'unknown'}`);
    const images = (b.data ?? []).filter((d) => d.b64_json).map((d) => ({ data: Buffer.from(d.b64_json!, 'base64'), mediaType: d.media_type ?? 'image/png' }));
    if (images.length === 0) throw new Error('no image in the response');
    return { images, cost: b.usage?.cost };
}

/**
 * The request body for one character sheet (Daniel, 2026-10-01: one style for the whole cast). The
 * anchor (`cast.anchor`) comes from its printed picture in that picture's style. Every other
 * character gets the anchor sheet as picture 1 (the style) and its printed picture, when it has one,
 * as picture 2 (the face, hair, and clothes).
 * @param cast The cast file.
 * @param character One character.
 * @param readFile Reads a file (path relative to the character-sheets folder).
 * @returns The body. Throws when the character needs the anchor sheet and it has no approved one.
 */
export function castMuseRequest(cast: Cast, character: CastCharacter, readFile: (rel: string) => Buffer) {
    const source = character.source?.image;
    const refs: string[] = [];
    let intro: string;
    if (!cast.anchor || character.name === cast.anchor) {
        if (source) refs.push(source);
        intro = source ? 'The reference picture shows this character in a printed book. Keep the face, hair, and clothes, and the drawing style of the picture.' : '';
    } else {
        const anchor = cast.characters.find((c) => c.name === cast.anchor);
        if (!anchor?.chosen || !anchor.approved) throw new Error(`Make and choose the sheet of ${cast.anchor} (the style anchor) first`);
        refs.push(anchor.chosen);
        // Without the second sentence, the anchor's clothes and eye color spread to the cast (Muse test 2026-10-01).
        intro = 'Picture 1 shows the house style only: copy its drawing style, line weight, colors, shading, eye shape, and proportions. Copy nothing else from picture 1: not its face, eye color, hair, or clothes. Draw a different character.';
        if (source) {
            refs.push(source);
            intro += ' Picture 2 shows this character in a printed book: keep the face, eye color, hair, and clothes.';
        }
    }
    const body: { model: string; prompt: string; aspect_ratio: string; input_references?: ReturnType<typeof dataUrl>[] } = {
        model: MUSE_MODEL,
        prompt: [intro, castPrompt(cast, character)].filter(Boolean).join(' '),
        aspect_ratio: '1:1',
    };
    if (refs.length) body.input_references = refs.map((r) => dataUrl(readFile(r)));
    return { body, refs };
}

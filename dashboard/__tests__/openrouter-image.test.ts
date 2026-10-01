// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { Cast } from '../lib/media/cast';
import type { PackageImage } from '../lib/lesson-package/schema';
import { MUSE_MODEL, imagesFromResponse, museRequest, openRouterKey, referencePrompt } from '../lib/media/openrouter-image';

const CAST: Cast = {
    version: 1,
    style: 'Flat 2D cartoon.',
    sheet: 'Full body.',
    characters: [
        { name: 'tom', description: 'Tom, a boy.', look: 'Tom, short brown hair, striped T-shirt.', candidates: [], chosen: 'tom.jpg' },
        { name: 'teacher-kim', description: 'Teacher Kim.', look: 'Teacher Kim, a bun, a green cardigan.', candidates: [], chosen: 'teacher-kim.jpg' },
        { name: 'squeaky', description: 'Squeaky, a mouse.', candidates: [] },
    ],
};

const image = (characters: string[]): PackageImage =>
    ({ position: 'hero', prompt: 'Tom waves in the classroom.', characters, candidates: [], overlay: [] }) as unknown as PackageImage;

describe('OpenRouter key', () => {
    it('reads OPENROUTER_API_KEY, else the name with the spelling mistake in .env.local', () => {
        expect(openRouterKey({ OPENROUTER_API_KEY: 'a', OPERNROUTER_API_KEY: 'b' })).toBe('a');
        expect(openRouterKey({ OPERNROUTER_API_KEY: ' b ' })).toBe('b');
        expect(openRouterKey({})).toBeUndefined();
    });
});

describe('Muse request', () => {
    it('names each reference picture in order, then gives the style, the scene, the looks, and the no-text rule', () => {
        const text = referencePrompt(CAST, image(['Tom', 'Teacher Kim']), ['Tom', 'Teacher Kim']);
        expect(text.startsWith('Reference pictures: picture 1 is Tom, picture 2 is Teacher Kim. Draw each character exactly as in the reference')).toBe(true);
        expect(text).toContain('Flat 2D cartoon. Tom waves in the classroom. Tom, short brown hair, striped T-shirt. Teacher Kim, a bun, a green cardigan.');
        expect(text.endsWith('No words, letters, or numbers anywhere in the picture.')).toBe(true);
    });

    it('sends the chosen sheets as data URLs and leaves out a character with no sheet', () => {
        const read = (rel: string) => Buffer.from(`jpg:${rel}`);
        const { body, refs } = museRequest(CAST, image(['Tom', 'Squeaky']), read, { aspectRatio: '1:1' });
        expect(refs).toEqual(['Tom']);
        expect(body).toMatchObject({ model: MUSE_MODEL, aspect_ratio: '1:1' });
        expect(body.input_references).toEqual([{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${Buffer.from('jpg:tom.jpg').toString('base64')}` } }]);
        expect(body.prompt).toContain('picture 1 is Tom.');
        expect(body.prompt).not.toContain('picture 2');
    });

    it('sends no reference part for a scene with no cast', () => {
        const { body, refs } = museRequest(CAST, image([]), () => Buffer.from(''), { aspectRatio: '1:1' });
        expect(refs).toEqual([]);
        expect(body.input_references).toBeUndefined();
        expect(body.prompt.startsWith('Flat 2D cartoon.')).toBe(true);
    });
});

describe('Muse response', () => {
    it('decodes the images and the cost', () => {
        const out = imagesFromResponse({ data: [{ b64_json: Buffer.from('webp').toString('base64'), media_type: 'image/webp' }], usage: { cost: 0.01 } });
        expect(out.images[0].data.toString()).toBe('webp');
        expect(out.images[0].mediaType).toBe('image/webp');
        expect(out.cost).toBe(0.01);
    });

    it('throws the API error message, and on a response with no image', () => {
        expect(() => imagesFromResponse({ error: { message: 'internal server error', code: 502 } })).toThrow(/502: internal server error/);
        expect(() => imagesFromResponse({ data: [] })).toThrow(/no image/);
    });
});

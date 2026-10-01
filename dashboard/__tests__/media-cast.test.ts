// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { castPrompt, castImageArgs, parseSavedFiles, CastSchema } from '../lib/media/cast';

const cast = CastSchema.parse({
    version: 1,
    style: '2D picture-book style. Not 3D.',
    sheet: 'Full body, plain white background. No words or letters.',
    rules: 'Hair and clothes only.',
    characters: [
        { name: 'pip', description: 'Pip, a small brown puppy with a red collar.', source: { image: 'source/pip.jpg', from: 'O3.1-04' }, candidates: [] },
        { name: 'may', description: 'May, a girl with a black ponytail.', candidates: [] },
    ],
});

describe('cast sheets', () => {
    it('builds the prompt from the style, the description, and the sheet rule', () => {
        expect(castPrompt(cast, cast.characters[0])).toBe(
            '2D picture-book style. Not 3D. Pip, a small brown puppy with a red collar. Full body, plain white background. No words or letters.',
        );
    });

    it('uses no subject reference by default; with withSource it passes the source image', () => {
        // A subject reference pulls MiniMax toward a 3D look, so a sheet uses the text only by default.
        expect(castImageArgs(cast, cast.characters[0], { dir: '/sheets', count: 4 })).not.toContain('--subject-ref');
        const withRef = castImageArgs(cast, cast.characters[0], { dir: '/sheets', count: 4, withSource: true });
        expect(withRef).toContain('--subject-ref');
        expect(withRef[withRef.indexOf('--subject-ref') + 1]).toBe('type=character,image=/sheets/source/pip.jpg');
        expect(withRef).toEqual(expect.arrayContaining(['image', 'generate', '--n', '4', '--out-dir', '/sheets/candidates', '--out-prefix', 'pip']));
        expect(castImageArgs(cast, cast.characters[1], { dir: '/sheets', count: 2 })).not.toContain('--subject-ref');
    });

    it('gives a later run its own file prefix, because mmx numbers files from 001 on every run', () => {
        const first = castImageArgs(cast, cast.characters[1], { dir: '/sheets', count: 2 });
        expect(first[first.indexOf('--out-prefix') + 1]).toBe('may');
        const later = castImageArgs({ ...cast }, { ...cast.characters[1], candidates: ['candidates/may_001.jpg', 'candidates/may_002.jpg'] }, { dir: '/sheets', count: 2 });
        expect(later[later.indexOf('--out-prefix') + 1]).toBe('may-3');
    });

    it('reads the saved file names from the mmx output', () => {
        const out = 'progress line\n{\n  "saved": [\n    "pip_001.jpg",\n    "pip_002.jpg"\n  ]\n}\n';
        expect(parseSavedFiles(out)).toEqual(['pip_001.jpg', 'pip_002.jpg']);
        expect(parseSavedFiles('error: rate limit')).toEqual([]);
    });

    it('rejects a character with no description', () => {
        expect(CastSchema.safeParse({ ...cast, characters: [{ name: 'x', description: '', candidates: [] }] }).success).toBe(false);
    });
});

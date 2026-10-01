// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { castPrompt, castImageArgs, chooseSheet, parseSavedFiles, CastSchema } from '../lib/media/cast';
import { castMuseRequest } from '../lib/media/openrouter-image';

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

describe('Muse cast sheets', () => {
    const muse = CastSchema.parse({
        ...cast,
        anchor: 'tom',
        characters: [
            { name: 'tom', description: 'Tom, a boy.', source: { image: 'source/tom.jpg', from: 'O3.1-10' }, candidates: [], chosen: 'tom.jpg', approved: '2026-10-02' },
            ...cast.characters,
        ],
    });
    const read = (rel: string) => Buffer.from(rel);
    const refsOf = (body: { input_references?: { image_url: { url: string } }[] }) =>
        (body.input_references ?? []).map((r) => Buffer.from(r.image_url.url.split(',')[1], 'base64').toString());

    it('makes the anchor from its printed picture, in the style of that picture', () => {
        const { body } = castMuseRequest(muse, muse.characters[0], read);
        expect(refsOf(body)).toEqual(['source/tom.jpg']);
        expect(body.prompt).toMatch(/^The reference picture shows this character in a printed book\. Keep the face and the drawing style of the picture\. Follow the description below for the eyes, hair, clothes, and colors\. 2D picture-book style/);
        expect(body.prompt).toContain('Tom, a boy. Full body, plain white background.');
    });

    it('gives every other character the anchor sheet as the style and its printed picture for the look', () => {
        const pip = castMuseRequest(muse, muse.characters[1], read).body;
        expect(refsOf(pip)).toEqual(['tom.jpg', 'source/pip.jpg']);
        expect(pip.prompt).toMatch(/^Picture 1 shows the house style only: copy its drawing style, line weight, colors, shading, eye shape, and proportions\. Copy nothing else from picture 1: not its face, eye color, hair, or clothes\. Draw a different character\. Picture 2 shows this character in a printed book: keep the face\. Follow the description below for the eyes, hair, clothes, and colors\./);
        const may = castMuseRequest(muse, muse.characters[2], read).body;
        expect(refsOf(may)).toEqual(['tom.jpg']);
        expect(may.prompt).not.toContain('Picture 2');
    });

    it('refuses another character while the anchor has no approved sheet (an old sheet is not the style)', () => {
        const noSheet = CastSchema.parse({ ...muse, characters: muse.characters.map((c) => ({ ...c, chosen: undefined })) });
        expect(() => castMuseRequest(noSheet, noSheet.characters[1], read)).toThrow(/tom/);
        const old = CastSchema.parse({ ...muse, characters: muse.characters.map((c) => ({ ...c, approved: undefined })) });
        expect(() => castMuseRequest(old, old.characters[1], read)).toThrow(/tom/);
    });
});

describe('choose a sheet', () => {
    it('copies the candidate to <name>.jpg and records it', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cast-'));
        fs.mkdirSync(path.join(dir, 'candidates'));
        fs.writeFileSync(path.join(dir, 'candidates', 'pip-3-muse_001.jpg'), 'new');
        const c = CastSchema.parse({ ...cast, characters: [{ ...cast.characters[0], candidates: ['candidates/pip-3-muse_001.jpg'] }] });
        chooseSheet(dir, c, 'pip', 'candidates/pip-3-muse_001.jpg', '2026-10-02');
        expect(fs.readFileSync(path.join(dir, 'pip.jpg'), 'utf8')).toBe('new');
        expect(c.characters[0]).toMatchObject({ chosen: 'pip.jpg', chosenFrom: 'candidates/pip-3-muse_001.jpg', approved: '2026-10-02' });
        expect(() => chooseSheet(dir, c, 'pip', 'candidates/other.jpg', '2026-10-02')).toThrow(/not a candidate/);
        expect(() => chooseSheet(dir, c, 'nobody', 'x', '2026-10-02')).toThrow(/No character/);
        fs.rmSync(dir, { recursive: true, force: true });
    });
});

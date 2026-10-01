import fs from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Character sheets for the series bible cast (track lesson_media_20261001).
 * `docs/content-plans/character-sheets/cast.json` holds one house style and one entry per character.
 * Sheets come from the printed story images; prompts describe hair and clothes, never skin or ethnicity.
 */

export const CastCharacterSchema = z.object({
    name: z.string().regex(/^[a-z-]+$/),
    /** The sheet prompt: look and a sheet pose. */
    description: z.string().min(1),
    /** Hair and clothes only, for scene prompts (no pose). Without it, scenes use the description. */
    look: z.string().optional(),
    source: z.object({ image: z.string().min(1), from: z.string().min(1) }).optional(),
    candidates: z.array(z.string()).default([]),
    /** The sheet file, named after the character. */
    chosen: z.string().optional(),
    /** The candidate that Daniel picked for the sheet. */
    chosenFrom: z.string().optional(),
    approved: z.string().optional(),
});

export const CastSchema = z.object({
    version: z.literal(1),
    style: z.string().min(1),
    sheet: z.string().min(1),
    rules: z.string().optional(),
    /** The character whose sheet is the style reference for every other sheet (Muse). */
    anchor: z.string().optional(),
    characters: z.array(CastCharacterSchema),
});

export type Cast = z.infer<typeof CastSchema>;
export type CastCharacter = z.infer<typeof CastCharacterSchema>;

/**
 * The image prompt for one character sheet.
 * @param cast The cast file.
 * @param character One character.
 * @returns Style, description, and sheet rule, in that order.
 */
export function castPrompt(cast: Cast, character: CastCharacter): string {
    return [cast.style, character.description, cast.sheet].join(' ');
}

/**
 * Arguments for `mmx` to make candidates for one character.
 * @param cast The cast file.
 * @param character One character.
 * @param opts `dir` is the character-sheets folder; `count` is the number of candidates.
 * @returns The argument list (without the `mmx` command).
 */
export function castImageArgs(cast: Cast, character: CastCharacter, opts: { dir: string; count: number; withSource?: boolean }): string[] {
    const args = ['image', 'generate', '--prompt', castPrompt(cast, character), '--aspect-ratio', '1:1', '--n', String(opts.count)];
    // A subject reference pulls MiniMax toward a 3D look (test 2026-10-01), so the text alone is the default.
    if (opts.withSource && character.source) args.push('--subject-ref', `type=character,image=${path.join(opts.dir, character.source.image)}`);
    // mmx numbers files from 001 on every run, so a later run needs its own prefix.
    const prefix = character.candidates.length ? `${character.name}-${character.candidates.length + 1}` : character.name;
    args.push('--out-dir', path.join(opts.dir, 'candidates'), '--out-prefix', prefix);
    return args;
}

/**
 * File names from the JSON that `mmx image generate` prints at the end.
 * @param stdout The command output.
 * @returns The saved file names, or an empty list.
 */
export function parseSavedFiles(stdout: string): string[] {
    const start = stdout.indexOf('{');
    if (start < 0) return [];
    try {
        const saved = (JSON.parse(stdout.slice(start)) as { saved?: unknown }).saved;
        return Array.isArray(saved) ? saved.filter((s): s is string => typeof s === 'string') : [];
    } catch {
        return [];
    }
}

/**
 * Makes a candidate the sheet of a character: copies it to `<name>.<ext>` and records it. The
 * caller writes the cast file.
 * @param dir The character-sheets folder.
 * @param cast The cast (changed in place).
 * @param name The character name.
 * @param candidate One of its candidates (relative to `dir`).
 * @param date The approval date (YYYY-MM-DD).
 * @returns The changed character. Throws for an unknown character or candidate.
 */
export function chooseSheet(dir: string, cast: Cast, name: string, candidate: string, date: string): CastCharacter {
    const character = cast.characters.find((c) => c.name === name);
    if (!character) throw new Error(`No character ${name}`);
    if (!character.candidates.includes(candidate)) throw new Error(`${candidate} is not a candidate for ${name}`);
    const sheet = `${character.name}${path.extname(candidate).toLowerCase()}`;
    fs.copyFileSync(path.join(dir, candidate), path.join(dir, sheet));
    character.chosen = sheet;
    character.chosenFrom = candidate;
    character.approved = date;
    return character;
}

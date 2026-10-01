import path from 'path';
import { z } from 'zod';

/**
 * Character sheets for the series bible cast (track lesson_media_20261001).
 * `docs/content-plans/character-sheets/cast.json` holds one house style and one entry per character.
 * Sheets come from the printed story images; prompts describe hair and clothes, never skin or ethnicity.
 */

export const CastCharacterSchema = z.object({
    name: z.string().regex(/^[a-z-]+$/),
    description: z.string().min(1),
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
export function castImageArgs(cast: Cast, character: CastCharacter, opts: { dir: string; count: number }): string[] {
    const args = ['image', 'generate', '--prompt', castPrompt(cast, character), '--aspect-ratio', '1:1', '--n', String(opts.count)];
    if (character.source) args.push('--subject-ref', `type=character,image=${path.join(opts.dir, character.source.image)}`);
    args.push('--out-dir', path.join(opts.dir, 'candidates'), '--out-prefix', character.name);
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

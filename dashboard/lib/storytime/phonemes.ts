/**
 * Daniel's phoneme recordings (decision S22, 2026-10-22): one mp3 for each of the 45 sounds in
 * `content/storytime/phonemes/daniel/`. A package names the recording wherever it names a sound: the week
 * sound, the sound cards of the review strip, the days of the sound game, and the benchmark sound cards and
 * blend words. The recordings replace any TTS phoneme audio.
 */
import { StorytimeWeekSchema, type StorytimeWeek } from './schema';

/** The bank folder under the Storytime content folder. */
export const PHONEME_BANK_DIR = 'phonemes/daniel';

/** The recordings of the bank. */
export interface PhonemeBank {
    /** A bank sound ("/a-short/") to its mp3 path under the Storytime content folder. */
    files: Map<string, string>;
}

/**
 * Reads the bank from its manifest.
 * @param manifest The parsed `manifest.json` of the bank (items with `sound` and `mp3`).
 * @param dir The bank folder under the Storytime content folder.
 * @returns The bank; throws when the manifest has no items.
 */
export function phonemeBankFrom(manifest: unknown, dir: string = PHONEME_BANK_DIR): PhonemeBank {
    const items = (manifest as { items?: { sound: string; mp3: string }[] }).items ?? [];
    if (!items.length) throw new Error('The phoneme bank manifest has no items');
    return { files: new Map(items.map((i) => [i.sound, `${dir}/${i.mp3}`])) };
}

/** A label of the packages to the bank sound when the two differ: the short vowels and the bank's spelled slugs. */
const ALIAS: Record<string, string> = {
    a: 'a-short',
    e: 'e-short',
    i: 'i-short',
    o: 'o-short',
    u: 'u-short',
    c: 'c-k',
    k: 'c-k',
    ck: 'c-k',
    x: 'x-ks',
    q: 'qu-kw',
    qu: 'qu-kw',
};

/**
 * The bank sound of a sound label of the packages: "/n/", a held sound "Nnn" or "nnn", or a sound card
 * letter "n". A single vowel is its short sound; c, k, and ck are "/c-k/".
 * @param label The label.
 * @returns The bank sound, as "/a-short/" (it can be a sound that the bank does not have).
 */
export function bankSound(label: string): string {
    let s = label.trim().replace(/^\/|\/$/g, '').toLowerCase();
    const held = /^([a-z])\1{2,}$/.exec(s);
    if (held) s = held[1];
    return `/${ALIAS[s] ?? s}/`;
}

/**
 * The sound labels of a teacher line, in the order that the teacher says them: "/t/" and held sounds such as
 * "Nnn" (three or more of one letter, which no English word has).
 * @param line The line.
 * @returns The labels.
 */
export function soundLabels(line: string): string[] {
    return [...line.matchAll(/\/[a-z-]+\/|\b([a-z])\1{2,}\b/gi)].map((m) => m[0]);
}

/** One package field that holds recordings. */
export interface PhonemeAudioField {
    /** The path of the field in the package, as ["review", 1, "cards", 0, "audio"]. */
    path: (string | number)[];
    /** The recording, one recording for each sound of a line, or (the sound game) one list for each day. */
    value: string | string[] | string[][];
}

/**
 * The recordings that the fields of a week must hold.
 * @param week The week.
 * @param bank The bank.
 * @returns The fields (a field with a sound that the bank does not have is left out) and those sounds.
 */
export function phonemeAudioFields(week: StorytimeWeek, bank: PhonemeBank): { fields: PhonemeAudioField[]; unresolved: string[] } {
    const fields: PhonemeAudioField[] = [];
    const unresolved: string[] = [];
    const add = (path: (string | number)[], labels: string[], list: boolean) => {
        const files = labels.map((l) => bank.files.get(bankSound(l)));
        const missing = labels.filter((_, i) => !files[i]);
        if (missing.length) unresolved.push(...missing.map((l) => `${l} (${path.join('.')})`));
        else fields.push({ path, value: list ? (files as string[]) : files[0]! });
    };
    if (week.focus.element) add(['focus', 'element', 'audio'], [week.focus.element.sound], false);
    week.review.forEach((strip, d) =>
        strip.cards.forEach((card, c) => {
            if (card.kind === 'sound') add(['review', d, 'cards', c, 'audio'], [card.text], false);
        }),
    );
    if (week.opening) {
        const days = week.opening.pa.map((line) => soundLabels(line.en).map((l) => bank.files.get(bankSound(l))));
        const missing = week.opening.pa.flatMap((line) => soundLabels(line.en).filter((l) => !bank.files.get(bankSound(l))));
        if (missing.length) unresolved.push(...missing.map((l) => `${l} (opening.audio)`));
        else fields.push({ path: ['opening', 'audio'], value: days as string[][] });
    }
    const one = week.benchmark?.oneToOne;
    if (one) {
        add(['benchmark', 'oneToOne', 'soundAudio'], one.sounds, true);
        one.blend.forEach((b, i) => add(['benchmark', 'oneToOne', 'blend', i, 'audio'], soundLabels(b.sounds), true));
    }
    return { fields, unresolved };
}

/** The value at a path of a package. */
function valueAt(obj: unknown, path: (string | number)[]): unknown {
    return path.reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), obj);
}

/**
 * What differs between the recordings of a week and the bank: a missing or different field, or a sound
 * that the bank does not have.
 * @param week The week.
 * @param bank The bank.
 * @returns The problems; empty when every field holds its recording.
 */
export function phonemeAudioProblems(week: StorytimeWeek, bank: PhonemeBank): string[] {
    const { fields, unresolved } = phonemeAudioFields(week, bank);
    const problems = unresolved.map((u) => `no recording for ${u}`);
    for (const { path, value } of fields) {
        const have = valueAt(week, path);
        if (have === undefined) problems.push(`${path.join('.')}: missing`);
        else if (JSON.stringify(have) !== JSON.stringify(value))
            problems.push(`${path.join('.')}: ${JSON.stringify(have)}, expected ${JSON.stringify(value)}`);
    }
    return problems;
}

/**
 * Sets the recordings of a week in its raw JSON (the package file), with the values of `phonemeAudioFields`.
 * @param raw The raw week; it changes in place.
 * @param bank The bank.
 * @param week The parsed week, when `raw` holds values that the schema cannot parse (raw JSON numbers).
 * @returns The number of fields set; throws when the week does not parse or a sound has no recording.
 */
export function setPhonemeAudio(raw: unknown, bank: PhonemeBank, week?: StorytimeWeek): number {
    // Parse a copy: the schema defaults must not go into the file.
    const { fields, unresolved } = phonemeAudioFields(week ?? StorytimeWeekSchema.parse(structuredClone(raw)), bank);
    if (unresolved.length) throw new Error(`no recording for ${unresolved.join(', ')}`);
    for (const { path, value } of fields) {
        const parent = valueAt(raw, path.slice(0, -1)) as Record<string | number, unknown>;
        parent[path[path.length - 1]] = value;
    }
    return fields.length;
}

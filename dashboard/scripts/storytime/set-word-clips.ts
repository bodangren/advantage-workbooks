import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';
import {
    planWordClips,
    wordClipStem,
    type BookWords,
} from '../../lib/storytime/word-clips';

/**
 * The word clip mapper of the Storytime app (Phase 11, spec FR 4, decisions K2 to K5). A run plans
 * the clip map of each book of one week, checks each key against the word bank, copies each bank mp3
 * into the media folder of the week, removes a stale clip, and writes the two maps of the week file
 * by a text edit. The bank is the single source: this script never makes audio.
 */

/** The usage text of the script. */
const USAGE = `Sets the word clips of one Storytime week (Phase 11, spec FR 4).

Usage: npx tsx scripts/storytime/set-word-clips.ts --level <n> --week <n> [--check]

--level  The level of the week.
--week   The week.
--check  Prints one line for each key of each book and writes no file. The exit code is 1 when a
         line is not ok.

A run copies each bank mp3 of content/storytime/words/ into the media folder of the week, byte for
byte. It removes each words/wa-*.mp3 file of the week that no key names. It writes the maps by a text
edit and parses the new week before the first write. A key with no bank row stops the run.`;

/** The row of the word bank that this script reads (K6). */
interface BankRow {
    id: string;
    word: string;
    file: string;
    mp3: string;
    sha256: string;
}

/** The options of a run (spec FR 4). */
export interface SetWordClipsOptions {
    /** The week file to edit. */
    weekFile: string;
    /** The content root. */
    contentRoot: string;
    /** The bank folder, `content/storytime/words`. */
    bankFolder: string;
    /** Prints one line for each key and writes no file. */
    check?: boolean;
}

/** The result of a run. */
export interface SetWordClipsResult {
    /** The key slots: one slot for each key of each book. */
    keys: number;
    /** The distinct clip files of the week. */
    files: number;
    /** The clips that this run removed, relative to the content root. */
    removed: string[];
    /** The printed lines of the run. */
    lines: string[];
}

/**
 * The two digits of a week.
 * @param week The week.
 * @returns The week with a leading zero when it is below 10.
 */
function weekDigits(week: number): string {
    return String(week).padStart(2, '0');
}

/**
 * The SHA-256 of a file.
 * @param file The path of the file.
 * @returns The hash, in lower-case hex.
 */
function fileHash(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The fault of one key against the bank, or `ok` (K5).
 * @param key The word key.
 * @param rows The bank rows, by word.
 * @param bankFolder The bank folder.
 * @returns `ok`, `no bank row`, `no bank file`, or `bank SHA-256 differs`.
 */
function bankFaultOf(key: string, rows: Map<string, BankRow>, bankFolder: string): string {
    const row = rows.get(key);
    if (!row) return 'no bank row';
    const mp3 = path.join(bankFolder, row.mp3);
    if (!fs.existsSync(mp3)) return 'no bank file';
    const wav = path.join(bankFolder, row.file);
    if (!fs.existsSync(wav) || fileHash(wav) !== row.sha256) return 'bank SHA-256 differs';
    return 'ok';
}

/** The range of one `"audio": {` block of the week text. */
interface AudioBlock {
    /** The index of the line that opens the object. */
    start: number;
    /** The index of the line that closes the object. */
    end: number;
    /** The indent of the opening line. */
    indent: string;
}

/**
 * The range of the `books` array of the week text.
 * @param lines The lines of the week file.
 * @returns The first and the last line of the array, or undefined when the week has no books array.
 */
function booksRange(lines: readonly string[]): { start: number; end: number } | undefined {
    const start = lines.findIndex((line) => /^(\s*)"books":\s*\[\s*$/.exec(line) !== null);
    if (start < 0) return undefined;
    const indent = /^(\s*)/.exec(lines[start])?.[1] ?? '';
    const close = new RegExp(`^${indent}\\],?$`);
    let end = start + 1;
    while (end < lines.length && !close.test(lines[end])) end += 1;
    return { start, end };
}

/**
 * The ranges of the audio objects of the week text, in document order.
 * @param lines The lines of the week file.
 * @returns The range of each audio object.
 */
function audioBlocks(lines: readonly string[]): AudioBlock[] {
    const books = booksRange(lines);
    if (!books) return [];
    const blocks: AudioBlock[] = [];
    for (let index = books.start; index <= books.end; index += 1) {
        const open = /^(\s*)"audio":\s*\{\s*$/.exec(lines[index]);
        if (!open) continue;
        const indent = open[1];
        const close = new RegExp(`^${indent}\\},?$`);
        let end = index + 1;
        while (end < books.end && !close.test(lines[end])) end += 1;
        blocks.push({ start: index, end, indent });
        index = end;
    }
    return blocks;
}

/**
 * The escaped form of a text for a regular expression.
 * @param text The text.
 * @returns The text with each regular-expression character escaped.
 */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Writes the clip map of one book into the audio block of the week text (K4). An existing map is
 * replaced. Else the map goes after the last key of the object, and the line of that key gains a
 * comma when it needs one.
 * @param lines The lines of the week file.
 * @param block The range of the audio object.
 * @param map The clip map of the book, sorted by key.
 * @returns The lines of the audio object, with the map.
 */
function editAudioBlock(lines: readonly string[], block: AudioBlock, map: Record<string, string>): string[] {
    const keyIndent = `${block.indent}  `;
    const keys = Object.keys(map);
    const body = [...lines.slice(block.start + 1, block.end)];
    const blockLines = [
        `${keyIndent}"wordClips": {`,
        ...keys.map((key, index) => `${keyIndent}  ${JSON.stringify(key)}: ${JSON.stringify(map[key])}${index < keys.length - 1 ? ',' : ''}`),
        `${keyIndent}}`,
    ];
    const openPattern = new RegExp(`^${escapeRegExp(keyIndent)}"wordClips":\\s*\\{\\s*$`);
    const open = body.findIndex((line) => openPattern.test(line));
    if (open >= 0) {
        const close = body.findIndex((line, index) => index > open && line.trimEnd().startsWith(`${keyIndent}}`));
        if (close < 0) throw new Error('word clip: the wordClips block has no closing line');
        const comma = body[close].trimEnd().endsWith(',') ? ',' : '';
        const last = blockLines.length - 1;
        return [
            lines[block.start],
            ...body.slice(0, open),
            ...blockLines.slice(0, last),
            `${blockLines[last]}${comma}`,
            ...body.slice(close + 1),
            lines[block.end],
        ];
    }
    // The last key of the object ends on the line before the closing brace.
    const lastValue = body.length - 1;
    if (lastValue < 0) throw new Error('word clip: the audio object is empty');
    if (!body[lastValue].trimEnd().endsWith(',')) body[lastValue] = `${body[lastValue]},`;
    return [lines[block.start], ...body, ...blockLines, lines[block.end]];
}

/**
 * Parses a new week text before the first write (FR 4).
 * @param text The new text.
 * @throws Error When the text is not valid JSON, or the parsed week fails the schema.
 */
function parseWeekText(text: string): void {
    let week: unknown;
    try {
        week = JSON.parse(text);
    } catch (error) {
        throw new Error(`word clip: the new week text is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    StorytimeWeekSchema.parse(week);
}

/**
 * Sets the word clips of one week (spec FR 4, K3 to K5).
 * @param options The week file, the content root, the bank folder, and the check flag.
 * @returns The key slots, the distinct files, the removed clips, and the printed lines.
 * @throws Error When a key has no bank row or bank file, or a bank WAV differs from its row.
 */
export function setWordClips(options: SetWordClipsOptions): SetWordClipsResult {
    const weekText = fs.readFileSync(options.weekFile, 'utf8');
    const week = JSON.parse(weekText) as {
        meta?: { level?: number; week?: number };
        books?: { audio?: BookWords }[];
    };
    const level = Number(week.meta?.level);
    const weekNumber = Number(week.meta?.week);
    if (!Number.isInteger(level) || !Number.isInteger(weekNumber)) {
        throw new Error('word clip: the week file has no meta level and week');
    }
    const books = (week.books ?? []).map((book) => book.audio ?? {});
    const plan = planWordClips({ level, week: weekNumber, books: books.map((audio) => ({ audio })) });
    const manifest = JSON.parse(fs.readFileSync(path.join(options.bankFolder, 'manifest.json'), 'utf8')) as { items: BankRow[] };
    const rows = new Map(manifest.items.map((row) => [row.word, row]));

    // Every key slot is checked before the first write (FR 4).
    const slots = plan.maps.flatMap((map, book) => Object.keys(map).map((key) => ({ book, key })));
    const lines: string[] = [];
    if (options.check) {
        for (const slot of slots) {
            const fault = bankFaultOf(slot.key, rows, options.bankFolder);
            lines.push([String(slot.book), slot.key, rows.get(slot.key)?.id ?? `wa-${wordClipStem(slot.key)}`, fault].join('\t'));
        }
        return { keys: slots.length, files: plan.files.length, removed: [], lines };
    }
    for (const slot of slots) {
        const fault = bankFaultOf(slot.key, rows, options.bankFolder);
        if (fault !== 'ok') throw new Error(`word clip: ${slot.key}: ${fault}`);
    }

    // The audio blocks and the dry-edited week text are checked before the first copy, removal, or
    // write (K4, K5, FR 4, review A F1). A fault of the week structure leaves the media folder and
    // the week file byte equal.
    const linesOfText = weekText.split('\n');
    const blocks = audioBlocks(linesOfText);
    if (blocks.length !== plan.maps.length) {
        throw new Error(`word clip: the week file has ${blocks.length} audio objects; expected ${plan.maps.length}`);
    }
    let edited = [...linesOfText];
    for (let index = plan.maps.length - 1; index >= 0; index -= 1) {
        const block = blocks[index];
        const body = editAudioBlock(edited, block, plan.maps[index]);
        edited = [...edited.slice(0, block.start), ...body.slice(0, -1), ...edited.slice(block.end)];
    }
    const updatedText = edited.join('\n');
    parseWeekText(updatedText);

    const wordsFolder = path.join(options.contentRoot, `l${level}/media/w${weekDigits(weekNumber)}/words`);
    const removed: string[] = [];
    for (const file of plan.files) {
        const target = path.join(options.contentRoot, file);
        const bankMp3 = path.join(options.bankFolder, path.basename(file));
        if (fs.existsSync(target) && fileHash(target) === fileHash(bankMp3)) continue;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(bankMp3, target);
    }
    if (fs.existsSync(wordsFolder)) {
        for (const name of fs.readdirSync(wordsFolder).sort()) {
            if (!/^wa-.*\.mp3$/.test(name)) continue;
            const relative = `l${level}/media/w${weekDigits(weekNumber)}/words/${name}`;
            if (plan.files.includes(relative)) continue;
            fs.rmSync(path.join(wordsFolder, name), { force: true });
            removed.push(relative);
        }
    }

    // The maps go in by the text edit that passed the parse above (K4, FR 4).
    if (updatedText !== weekText) fs.writeFileSync(options.weekFile, updatedText);
    for (const file of removed) lines.push(`removed ${file}`);
    lines.push(`keys: ${slots.length}`, `files: ${plan.files.length}`);
    return { keys: slots.length, files: plan.files.length, removed, lines };
}

/**
 * Runs the script with the arguments of the command line.
 * @param argv The arguments after the file name.
 * @returns The exit code: 0 for success, 1 for a data error or a failed check line, 2 for a usage error.
 */
export function main(argv: string[]): number {
    if (argv.includes('--help') || argv.includes('-h')) {
        console.log(USAGE);
        return 0;
    }
    const value = (flag: string): string | undefined => {
        const at = argv.indexOf(flag);
        return at >= 0 ? argv[at + 1] : undefined;
    };
    const level = Number(value('--level'));
    const week = Number(value('--week'));
    if (!Number.isInteger(level) || level < 1 || level > 4 || !Number.isInteger(week) || week < 1 || week > 99) {
        console.error(USAGE);
        return 2;
    }
    const check = argv.includes('--check');
    try {
        const result = setWordClips({
            weekFile: path.join(STORYTIME_ROOT, `l${level}/w${weekDigits(week)}.json`),
            contentRoot: STORYTIME_ROOT,
            bankFolder: path.join(STORYTIME_ROOT, 'words'),
            check,
        });
        for (const line of result.lines) console.log(line);
        if (check) return result.lines.every((line) => line.split('\t')[3] === 'ok') ? 0 : 1;
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main(process.argv.slice(2));
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';
import { planSentenceClips, type SentenceKind } from '../../lib/storytime/sentence-clips';

/**
 * The sentence clip mapper of the Storytime app (Phase 12, spec FR 6, decisions L7 and L17; Phase 13
 * adds the kinds, decision M3). A run writes the `sentenceClips` array of each book of the selected
 * kinds of one week into the week file by a text edit: the array holds one `{ sentence, file }` item
 * per sentence, in the order of `audio.sentences`. Before the first write, the run checks each clip
 * file of the selected kinds against the provenance file `sentences/manifest.json` of the week: the
 * file must exist, and its SHA-256 must equal the provenance row. A book of another kind keeps its
 * block, and the run reads none of its clips. This script never makes audio.
 */

/** The usage text of the script. */
const USAGE = `Sets the sentence clips of one Storytime week (Phase 12, spec FR 6; Phase 13 adds --kind).

Usage: npx tsx scripts/storytime/set-sentence-clips.ts --level <n> --week <n> [--kind <decodable|readalong|all>] [--check]

--level  The level of the week.
--week   The week.
--kind   The book kind of the run: decodable (default), readalong, or all (both kinds).
--check  Prints one line for each sentence clip and writes no file. The exit code is 1 when a
         line is not ok.

A run reads the provenance file content/storytime/l2/media/w<nn>/sentences/manifest.json, checks
each clip file of the kind against its row, and writes the sentenceClips arrays of the books of the
kind by a text edit. It parses the new week text before the first write. A missing file or a
differing hash stops the run.`;

/** The book kinds of the flag `--kind` (Phase 13 decision M3). */
const KIND_FLAG: Readonly<Record<string, readonly SentenceKind[]>> = {
    decodable: ['decodable'],
    readalong: ['readalong'],
    all: ['decodable', 'readalong'],
};

/** The options of a run (spec FR 6). */
export interface SetSentenceClipsOptions {
    /** The week file to edit. */
    weekFile: string;
    /** The content root. */
    contentRoot: string;
    /** The book kinds of the run (Phase 13 decision M3). The default is `['decodable']`. */
    kinds?: readonly SentenceKind[];
    /** Prints one line for each clip and writes no file. */
    check?: boolean;
}

/** The provenance item that this script reads (L8). */
interface ProvenanceItem {
    book?: number;
    n?: number;
    text?: string;
    file?: string;
    sha256?: string;
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
 * The escaped form of a text for a regular expression.
 * @param text The text.
 * @returns The text with each regular-expression character escaped.
 */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Writes the sentence clip array of one decodable book into the audio block of the week text
 * (L17). An existing array is replaced. Else the array goes after the last key of the object, and
 * the line of that key gains a comma when it needs one.
 * @param lines The lines of the week file.
 * @param block The range of the audio object.
 * @param items The clip items of the book, in the order of the sentences.
 * @returns The lines of the audio object, with the array.
 */
function editAudioBlock(lines: readonly string[], block: AudioBlock, items: readonly { sentence: string; file: string }[]): string[] {
    const keyIndent = `${block.indent}  `;
    const blockLines: string[] = [`${keyIndent}"sentenceClips": [`];
    items.forEach((item, index) => {
        blockLines.push(
            `${keyIndent}  {`,
            `${keyIndent}    "sentence": ${JSON.stringify(item.sentence)},`,
            `${keyIndent}    "file": ${JSON.stringify(item.file)}`,
            index < items.length - 1 ? `${keyIndent}  },` : `${keyIndent}  }`,
        );
    });
    blockLines.push(`${keyIndent}]`);
    const body = [...lines.slice(block.start + 1, block.end)];
    const openPattern = new RegExp(`^${escapeRegExp(keyIndent)}"sentenceClips":\\s*\\[\\s*$`);
    const open = body.findIndex((line) => openPattern.test(line));
    if (open >= 0) {
        const close = body.findIndex((line, index) => index > open && line.trimEnd().startsWith(`${keyIndent}]`));
        if (close < 0) throw new Error('sentence clips: the sentenceClips block has no closing line');
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
    if (lastValue < 0) throw new Error('sentence clips: the audio object is empty');
    if (!body[lastValue].trimEnd().endsWith(',')) body[lastValue] = `${body[lastValue]},`;
    return [lines[block.start], ...body, ...blockLines, lines[block.end]];
}

/**
 * Parses a new week text before the first write (FR 6).
 * @param text The new text.
 * @throws Error When the text is not valid JSON, or the parsed week fails the schema.
 */
function parseWeekText(text: string): void {
    let week: unknown;
    try {
        week = JSON.parse(text);
    } catch (error) {
        throw new Error(`sentence clips: the new week text is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    StorytimeWeekSchema.parse(week);
}

/**
 * Sets the sentence clips of the books of the selected kinds of one week (spec FR 6, L7, L17; Phase
 * 13 decision M3). A clip of a kind that the run did not select is not read, so a bad clip of that
 * kind does not stop the run.
 * @param options The week file, the content root, the book kinds, and the check flag.
 * @returns The printed lines of the run.
 * @throws Error When a clip file is absent or its SHA-256 differs from the provenance row.
 */
export function setSentenceClips(options: SetSentenceClipsOptions): { lines: string[] } {
    const weekText = fs.readFileSync(options.weekFile, 'utf8');
    const week = JSON.parse(weekText) as {
        meta?: { level?: number; week?: number };
        books?: { kind?: string; audio?: { sentences?: { sentence?: string }[] } }[];
    };
    const level = Number(week.meta?.level);
    const weekNumber = Number(week.meta?.week);
    if (!Number.isInteger(level) || !Number.isInteger(weekNumber)) {
        throw new Error('sentence clips: the week file has no meta level and week');
    }
    const plan = planSentenceClips({ level, week: weekNumber, books: week.books ?? [], kinds: options.kinds });
    const provenanceFile = path.join(
        options.contentRoot,
        `l${level}/media/w${weekDigits(weekNumber)}/sentences/manifest.json`,
    );
    if (!fs.existsSync(provenanceFile)) {
        throw new Error(`sentence clips: no provenance file: ${provenanceFile}`);
    }
    const provenance = JSON.parse(fs.readFileSync(provenanceFile, 'utf8')) as { items?: ProvenanceItem[] };
    const byFile = new Map((provenance.items ?? []).map((item) => [String(item.file), item]));

    // Every clip is checked before the first write (FR 6).
    const lines: string[] = [];
    for (const item of plan) {
        const clip = path.join(options.contentRoot, item.file);
        if (!fs.existsSync(clip)) {
            lines.push([String(item.book), item.file, 'missing'].join('\t'));
            if (!options.check) throw new Error(`sentence clips: ${item.file}: missing file`);
            continue;
        }
        const row = byFile.get(item.file);
        if (!row || row.sha256 !== fileHash(clip)) {
            lines.push([String(item.book), item.file, 'sha256 differs'].join('\t'));
            if (!options.check) throw new Error(`sentence clips: ${item.file}: sha256 differs from the provenance row`);
            continue;
        }
        lines.push([String(item.book), item.file, 'ok'].join('\t'));
    }
    if (options.check) return { lines };

    // The audio blocks and the dry-edited week text are checked before the write (L17). A fault
    // of the week structure leaves the week file byte equal.
    const linesOfText = weekText.split('\n');
    const blocks = audioBlocks(linesOfText);
    const kinds: readonly string[] = options.kinds ?? KIND_FLAG.decodable;
    const selected = (week.books ?? []).map((book, index) => ({ book, index }))
        .filter(({ book }) => typeof book?.kind === 'string' && kinds.includes(book.kind));
    if (blocks.length !== (week.books ?? []).length) {
        throw new Error(`sentence clips: the week file has ${blocks.length} audio objects; expected ${(week.books ?? []).length}`);
    }
    const byBook = new Map<number, { sentence: string; file: string }[]>();
    for (const item of plan) {
        const list = byBook.get(item.book) ?? [];
        list.push({ sentence: item.text, file: item.file });
        byBook.set(item.book, list);
    }
    let edited = [...linesOfText];
    for (let at = selected.length - 1; at >= 0; at -= 1) {
        const { index } = selected[at];
        const block = blocks[index];
        const items = byBook.get(index) ?? [];
        const body = editAudioBlock(edited, block, items);
        edited = [...edited.slice(0, block.start), ...body.slice(0, -1), ...edited.slice(block.end)];
    }
    const updatedText = edited.join('\n');
    parseWeekText(updatedText);
    if (updatedText !== weekText) fs.writeFileSync(options.weekFile, updatedText);
    return { lines };
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
    const kindValue = argv.includes('--kind') ? value('--kind') ?? '' : 'decodable';
    const kinds = Object.keys(KIND_FLAG).includes(kindValue) ? KIND_FLAG[kindValue] : undefined;
    if (!Number.isInteger(level) || level < 1 || level > 4 || !Number.isInteger(week) || week < 1 || week > 99 || !kinds) {
        console.error(USAGE);
        return 2;
    }
    const check = argv.includes('--check');
    try {
        const result = setSentenceClips({
            weekFile: path.join(STORYTIME_ROOT, `l${level}/w${weekDigits(week)}.json`),
            contentRoot: STORYTIME_ROOT,
            kinds,
            check,
        });
        for (const line of result.lines) console.log(line);
        if (check) return result.lines.every((line) => line.split('\t')[2] === 'ok') ? 0 : 1;
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main(process.argv.slice(2));
}

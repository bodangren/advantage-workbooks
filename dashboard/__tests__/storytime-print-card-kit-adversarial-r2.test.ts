import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterAll, describe, expect, it } from 'vitest';
import { readLevelCardPictures, readLevelWeeks, STORYTIME_ROOT } from '../lib/storytime/files';
import {
    compileStorytimeCardSheet,
    compileStorytimeStickerSheet,
    STORYTIME_CARD_COLOR_PATCH,
    STORYTIME_CARD_NUMBER_DOTS,
    STORYTIME_STICKER_CENTER_OVERRIDES,
    storytimeCardKit,
    storytimeCardMatchCounts,
    storytimeCardPictureMatchLines,
    storytimeDeliveredPictures,
    type StorytimeCard,
    type StorytimeCardKind,
    type StorytimeKitItem,
} from '../lib/storytime/print/card-kit';
import { storytimeCardPictureRows, type StorytimePictureRow } from '../lib/storytime/print/pictures';

/**
 * Phase 8 adversarial tests, run 2 (spec FR-7, FR-9): the card kit color patches and number dots,
 * the sticker centre overrides, the version 7 card rows, `storytimeDeliveredPictures`, the match
 * counts, and the stage 1 batch check with a row class of each week selected on its own.
 * Each test attacks the shipped implementation with hostile or edge input. A test that exposes a
 * defect is marked `it.fails` and stays here for Green. No test changes production code.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const pictureBatchCliPath = path.join(dashboardRoot, 'scripts/storytime/check-storytime-pictures.ts');
const scratch: string[] = [];

/** A scratch folder under /tmp/opencode; the file removes it after the run. */
function temp(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const dir = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-p8-adv2-'));
    scratch.push(dir);
    return dir;
}

afterAll(() => {
    for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

/** The SHA-256 of one file, in lower-case hex. */
const hashOf = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** One shipped picture-list row, as far as the batch fixture needs it. */
type ListRow = { id: string; week: number; use: string; width: number; height: number; text: string; fileName: string; lineArtFileName: string };

/** The 227 shipped rows of `content/storytime/l2/print/pictures.json`. */
function shippedRows(): ListRow[] {
    return JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8')) as ListRow[];
}

/** The shipped card rows of one week. */
const cardRowsOf = (week: number): ListRow[] => shippedRows().filter((row) => row.use === 'card' && row.week === week);

/** The shipped book rows of one week. */
const bookRowsOf = (week: number): ListRow[] => shippedRows().filter((row) => row.use !== 'card' && row.week === week);

/**
 * Writes a 1-bit grayscale PNG (colour type 0, bit depth 1): black bars on white. Forge makes the
 * line art 1-bit, so the stage 1 check must accept it (same writer as the readers test).
 * @param file The file to write.
 * @param width The pixel width.
 * @param height The pixel height.
 */
function writeGray1LinePng(file: string, width: number, height: number): void {
    const crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c;
    }
    const crc32 = (buf: Buffer): number => {
        let c = 0xffffffff;
        for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type: string, data: Buffer): Buffer => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(body));
        return Buffer.concat([len, body, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 1;
    ihdr[9] = 0;
    const rowBytes = Math.ceil(width / 8);
    const raw = Buffer.alloc((rowBytes + 1) * height, 0);
    for (let y = 0; y < height; y++) {
        const rowStart = y * (rowBytes + 1);
        for (let x = 0; x < width; x++) {
            const inBar = (y >= 500 && y < 524 && x >= 500 && x < 1000) || (x >= 500 && x < 524 && y >= 500 && y < 1000);
            if (!inBar) raw[rowStart + 1 + (x >> 3)] |= 0x80 >> (x & 7);
        }
    }
    fs.writeFileSync(file, Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]));
}

/** One Forge manifest job for the stage 1 fixtures; the job id is free, so a test can break it. */
function forgeJob(jobId: string, week: number, colorFile: string, colorSha: string, lineFile: string, lineSha: string, width: number, height: number): Record<string, unknown> {
    return {
        id: jobId, week, bookKind: 'readalong', bookTitle: 'Hello!', page: 1,
        text: 'Hello!', sourcePrompt: 'fixture prompt', characters: ['Pat'],
        sourcePackage: 'w01.json', sourceSha256: '0'.repeat(64),
        slug: jobId, directory: `jobs/${jobId}`, use: 'readalong', size: 'story',
        selectedVersion: 1, selectedFile: colorFile, selectedSha256: colorSha, status: 'ready',
        candidates: [{
            jobId, version: 1, file: colorFile, fileSha256: colorSha, status: 'ready',
            structural: { valid: true, width, height, sha256: colorSha, errors: [] },
            reviews: {}, failures: [],
            lineArt: {
                file: lineFile, fileSha256: lineSha, colorFile,
                renderEvidenceFile: `jobs/${jobId}/render-evidence-v1.json`, status: 'ready',
                structural: { valid: true, width, height, sha256: lineSha, errors: [] },
                formatVersion: 'storytime-lineart-provisional-v1',
                technique: 'song-page-form-edges-viewdepth-1bit-v2', errors: [],
            },
        }],
    };
}

/** The base files of a batch, written once for each pixel size and copied for each row. */
const baseFiles = new Map<string, { color: string; line: string; colorSha: string; lineSha: string }>();

/** A color PNG and a 1-bit line-art PNG of one pixel size, cached for the run. */
async function baseFilesOf(width: number, height: number): Promise<{ color: string; line: string; colorSha: string; lineSha: string }> {
    const key = `${width}x${height}`;
    const known = baseFiles.get(key);
    if (known) return known;
    const folder = temp();
    const sharp = (await import('sharp')).default;
    const color = path.join(folder, 'base.png');
    const line = path.join(folder, 'base-line.png');
    await sharp({ create: { width, height, channels: 3, background: '#3b6ea5' } }).png().toFile(color);
    writeGray1LinePng(line, width, height);
    const made = { color, line, colorSha: hashOf(color), lineSha: hashOf(line) };
    baseFiles.set(key, made);
    return made;
}

/**
 * A stage 1 batch folder. Each row gets a color file and a line-art file that follow the delivery
 * contract; the job id of a row is the row id unless `jobIdOf` returns another one.
 * @param rows The rows to deliver.
 * @param jobIdOf The job id of a row; the default is the row id.
 * @returns The batch folder.
 */
async function batchOf(rows: ListRow[], jobIdOf: (row: ListRow) => string = (row) => row.id): Promise<string> {
    const dir = temp();
    const rowsFolder = path.join(dir, 'w01', 'rows');
    fs.mkdirSync(rowsFolder, { recursive: true });
    const jobs: Record<string, unknown>[] = [];
    for (const row of rows) {
        const base = await baseFilesOf(row.width, row.height);
        const colorName = `${row.id}-v1.png`;
        const lineName = `${row.id}-line-v1.png`;
        fs.copyFileSync(base.color, path.join(rowsFolder, colorName));
        fs.copyFileSync(base.line, path.join(rowsFolder, lineName));
        jobs.push(forgeJob(jobIdOf(row), row.week, `w01/rows/${colorName}`, base.colorSha, `w01/rows/${lineName}`, base.lineSha, row.width, row.height));
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ version: 1, batchHashAlgorithm: 'sha256', jobs, batches: [] }));
    return dir;
}

/** Runs the stage 1 CLI on a batch for the given weeks. */
function runPictureCli(batch: string, weeks: string): { status: number | null; stdout: string; stderr: string } {
    const run = spawnSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--batch', batch, '--level', '2', '--weeks', weeks], {
        encoding: 'utf8', timeout: 120_000,
    });
    return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

/** The lines of an output that start with a prefix. */
const linesWith = (output: string, prefix: string): string[] => output.split('\n').filter((line) => line.startsWith(prefix));

/** One card for the sheet fixtures. */
function card(label: string, kind: StorytimeCardKind = 'picture'): StorytimeCard {
    return { kind, label, size: 'A6', classSet: false };
}

/** One picture-list row of a card, for the match fixtures. */
function listRow(id: string, text: string, use: StorytimePictureRow['use'], week = 1): StorytimePictureRow {
    return {
        id, week, use, text, prompt: '', caption: '', objectCounts: {}, sizeClass: 'C',
        fileName: `${id}-v1.png`, lineArtFileName: `${id}-line-v1.png`, width: 1500, height: 1500,
    };
}

describe('the stage 1 batch check: each row class of each week on its own', () => {
    it('R2-1 fails a job whose id differs from the row id by a trailing space or by case', async () => {
        const cards = cardRowsOf(1);
        expect(cards.length, 'week 1 has card rows').toBeGreaterThanOrEqual(3);
        const [spaced, upper] = cards;
        const batch = await batchOf(cards, (row) => (row === spaced ? `${row.id} ` : row === upper ? row.id.toUpperCase() : row.id));
        const run = runPictureCli(batch, '1');
        const output = `${run.stdout}\n${run.stderr}`;
        expect(run.status, output).toBe(1);
        expect(run.stdout, 'the trailing-space job is not the job of the row').toContain(`fail  ${spaced.id}:`);
        expect(run.stdout, 'the upper-case job is not the job of the row').toContain(`fail  ${upper.id}:`);
        expect(run.stdout).not.toContain(`pass  ${spaced.id}\n`);
        expect(run.stdout).not.toContain(`pass  ${upper.id}\n`);
        expect(linesWith(run.stdout, 'pass  '), 'the other card rows pass').toHaveLength(cards.length - 2);
        expect(run.stdout, 'the summary counts the requested card rows').toContain(`${cards.length - 2} of ${cards.length} rows pass stage 1`);
    }, 120_000);

    it('R2-2 requests both classes of week 1 when no job id equals a row id', async () => {
        const cards = cardRowsOf(1);
        const batch = await batchOf(cards, (row) => row.id.toUpperCase());
        const run = runPictureCli(batch, '1');
        const requested = bookRowsOf(1).length + cards.length;
        expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(1);
        expect(linesWith(run.stdout, 'pass  '), 'a wrong-case job passes no row').toHaveLength(0);
        expect(linesWith(run.stdout, 'fail  '), 'every book row and card row of week 1 fails').toHaveLength(requested);
        expect(run.stdout, 'the summary total equals the requested rows').toContain(`0 of ${requested} rows pass stage 1`);
        expect(run.stdout, 'no class is skipped when no job matches').not.toContain('skip  ');
    }, 120_000);

    it('R2-3 ignores a job of a week that --weeks does not request', async () => {
        const week1Books = bookRowsOf(1);
        const week2Cards = cardRowsOf(2);
        expect(week2Cards.length, 'week 2 has card rows').toBeGreaterThan(0);
        const run = runPictureCli(await batchOf([...week1Books, ...week2Cards]), '1');
        expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(0);
        expect(run.stdout, 'a row of week 2 never appears for --weeks 1').not.toMatch(/l2-w02-/);
        expect(linesWith(run.stdout, 'pass  '), 'the book rows of week 1 pass').toHaveLength(week1Books.length);
        expect(run.stdout).toContain('skip  card rows of week 1: the batch holds no job for them');
        expect(run.stdout, 'the summary counts the requested rows only').toContain(`${week1Books.length} of ${week1Books.length} rows pass stage 1`);
    }, 120_000);

    it('R2-4 gives each class of each week a result line or a skip line for the book rows of week 1 and the card rows of week 2', async () => {
        const week1Books = bookRowsOf(1);
        const week2Cards = cardRowsOf(2);
        const run = runPictureCli(await batchOf([...week1Books, ...week2Cards]), '1,2');
        const requested = week1Books.length + week2Cards.length;
        expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(0);
        expect(linesWith(run.stdout, 'pass  '), 'the requested rows pass').toHaveLength(requested);
        expect(run.stdout, 'the card rows of week 1 are skipped').toContain('skip  card rows of week 1: the batch holds no job for them');
        expect(run.stdout, 'the book rows of week 2 are skipped').toContain('skip  book rows of week 2: the batch holds no job for them');
        expect(linesWith(run.stdout, 'skip  '), 'exactly the two skip lines').toHaveLength(2);
        expect(run.stdout, 'the summary total equals the requested rows').toContain(`${requested} of ${requested} rows pass stage 1`);
        expect(run.stdout, 'no skipped row is checked').not.toMatch(/(?:pass|fail)  l2-w01-card-/);
        expect(run.stdout).not.toMatch(/(?:pass|fail)  l2-w02-(?:story-page|cover|check-row|practice-line|d4-prompt)-/);
    }, 120_000);

    it('R2-5 fails a missing week 2 card row beside complete week 1 books and counts it in the total', async () => {
        const week1Books = bookRowsOf(1);
        const week2Cards = cardRowsOf(2);
        const missing = week2Cards[week2Cards.length - 1];
        const run = runPictureCli(await batchOf([...week1Books, ...week2Cards.filter((row) => row !== missing)]), '1,2');
        const requested = week1Books.length + week2Cards.length;
        expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(1);
        expect(run.stdout).toContain(`fail  ${missing.id}`);
        expect(run.stdout, 'the missing row counts in the total').toContain(`${requested - 1} of ${requested} rows pass stage 1`);
    }, 120_000);
});

describe('the card rows of picture list version 7', () => {
    it('R2-6 gives a word with no letter or digit the fallback slug and rejects a second fallback word of the week', () => {
        const rows = storytimeCardPictureRows([{ word: '!!!', week: 1, prompt: 'a mark' }], 2);
        expect(rows[0].id, 'the slug falls back to picture').toBe('l2-w01-card-picture');
        expect(rows[0].fileName).toBe('l2-w01-card-picture-v1.png');
        expect(rows[0].lineArtFileName).toBe('l2-w01-card-picture-line-v1.png');
        expect(() => storytimeCardPictureRows([
            { word: '!!!', week: 1, prompt: 'a' }, { word: '???', week: 1, prompt: 'b' },
        ], 2), 'two fallback words of one week make one id').toThrow(/"!!!" and "\?\?\?" make the same row id/);
        expect(() => storytimeCardPictureRows([
            { word: 'picture', week: 3, prompt: 'a' }, { word: '...', week: 3, prompt: 'b' },
        ], 2), 'the real word picture and a fallback word of one week collide').toThrow(/"picture" and "\.\.\." make the same row id/);
        const apart = storytimeCardPictureRows([
            { word: '!!!', week: 1, prompt: 'a' }, { word: '???', week: 2, prompt: 'b' },
        ], 2);
        expect(apart.map((row) => row.id), 'the week keeps the ids of two fallback words apart').toEqual(['l2-w01-card-picture', 'l2-w02-card-picture']);
    });

    it('R2-7 rejects a word that differs by case or by padding, in any week', () => {
        for (const second of ['FAN', 'Fan', '  fan  ', 'fAn']) {
            expect(() => storytimeCardPictureRows([
                { word: 'fan', week: 1, prompt: 'a' }, { word: second, week: 7, prompt: 'b' },
            ], 2), `"${second}" repeats the word fan`).toThrow(/card picture word repeat/);
        }
        expect(() => storytimeCardPictureRows([
            { word: 'ice cream', week: 2, prompt: 'a' }, { word: 'ice-cream', week: 2, prompt: 'b' },
        ], 2), 'two spellings with one slug in one week').toThrow(/make the same row id/);
        const rows = storytimeCardPictureRows([
            { word: 'ice cream', week: 2, prompt: 'a' }, { word: 'ice-cream', week: 3, prompt: 'b' },
        ], 2);
        expect(new Set(rows.map((row) => row.fileName)).size, 'two weeks give two files').toBe(2);
    });
});

describe('the match counts', () => {
    /**
     * A line of the match report has four tab columns. A line with fewer than three columns names
     * no row and no source, so it must not count as a picture match.
     */
    it('X-P8-12 does not count a malformed match line as a picture match', () => {
        const counts = storytimeCardMatchCounts(['picture\tfan', '', 'x']);
        expect(counts.picture, 'a line with fewer than 3 columns is not a picture').toBe(0);
    });

    it('R2-8 counts the lines of the shipped kit by source and the four counts add up', () => {
        const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []))
            .filter((week) => week.meta.unit === 1);
        expect(weeks.length, 'the shipped weeks 1 to 8 parse').toBe(8);
        const kit = storytimeCardKit(weeks);
        const rows = shippedRows() as unknown as StorytimePictureRow[];
        const pictureCards = kit.cards.filter((entry) => ['picture', 'sound-picture', 'family-picture'].includes(entry.kind));
        const none = storytimeCardPictureMatchLines(kit.cards, rows, new Set<string>(), new Map());
        expect(none, 'one line for each picture-type card').toHaveLength(pictureCards.length);
        const wantPatch = pictureCards.filter((entry) => Object.hasOwn(STORYTIME_CARD_COLOR_PATCH, entry.label.toLowerCase())).length;
        const wantDots = pictureCards.filter((entry) => Object.hasOwn(STORYTIME_CARD_NUMBER_DOTS, entry.label.toLowerCase())).length;
        expect(wantPatch, 'the 8 color words print as patches').toBeGreaterThan(0);
        expect(wantDots, 'the number words print as dots').toBeGreaterThan(0);
        const counts = storytimeCardMatchCounts(none);
        expect(counts.patch).toBe(wantPatch);
        expect(counts.dots).toBe(wantDots);
        expect(counts.picture, 'no row is delivered').toBe(0);
        expect(counts.patch + counts.dots + counts.none + counts.picture, 'the four counts add up to the lines').toBe(none.length);
        // With every row delivered the patch and the dot cards still print no picture.
        const everyRow = new Set(rows.map((row) => row.id));
        const delivered = storytimeCardPictureMatchLines(kit.cards, rows, everyRow, new Map());
        const deliveredCounts = storytimeCardMatchCounts(delivered);
        expect(deliveredCounts.patch, 'a delivered row does not turn a patch into a picture').toBe(wantPatch);
        expect(deliveredCounts.dots).toBe(wantDots);
        expect(deliveredCounts.patch + deliveredCounts.dots + deliveredCounts.none + deliveredCounts.picture).toBe(delivered.length);
    });
});

describe('the number dot cards and the color patch cards', () => {
    /** The HTML of one picture card on an A6 sheet. */
    const sheetOf = (label: string, kind: StorytimeCardKind = 'picture', pictureOf?: () => string | undefined): string =>
        compileStorytimeCardSheet([card(label, kind)], 'A6', { pictureOf }).html;

    it('R2-9 draws exactly the dot count of each number word, in rows of at most 5 dots, inside the view box', () => {
        for (const [word, count] of Object.entries(STORYTIME_CARD_NUMBER_DOTS)) {
            const html = sheetOf(word);
            const circles = [...html.matchAll(/<circle data-number-dot="1" data-row="(\d+)" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\/>/g)]
                .map((match) => ({ row: Number(match[1]), cx: Number(match[2]), cy: Number(match[3]), r: Number(match[4]) }));
            expect(circles, `${word} draws ${count} dots`).toHaveLength(count);
            expect(html, `${word} shows the numeral ${count}`).toMatch(new RegExp(`data-card-numeral[^>]*>${count}</div>`));
            const perRow = new Map<number, number>();
            for (const dot of circles) perRow.set(dot.row, (perRow.get(dot.row) ?? 0) + 1);
            for (const [row, inRow] of perRow) expect(inRow, `${word} row ${row} holds at most 5 dots`).toBeLessThanOrEqual(5);
            expect(perRow.size, `${word} uses ${Math.ceil(count / 5)} rows`).toBe(Math.ceil(count / 5));
            const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);
            expect(box, `${word} has a view box`).not.toBeNull();
            const [width, height] = [Number(box![1]), Number(box![2])];
            for (const dot of circles) {
                expect(dot.cx - dot.r, `${word} dot left edge`).toBeGreaterThanOrEqual(0);
                expect(dot.cx + dot.r, `${word} dot right edge`).toBeLessThanOrEqual(width);
                expect(dot.cy - dot.r, `${word} dot top edge`).toBeGreaterThanOrEqual(0);
                expect(dot.cy + dot.r, `${word} dot bottom edge`).toBeLessThanOrEqual(height);
            }
            for (let a = 0; a < circles.length; a++) {
                for (let b = a + 1; b < circles.length; b++) {
                    const distance = Math.hypot(circles[a].cx - circles[b].cx, circles[a].cy - circles[b].cy);
                    expect(distance, `${word} dots ${a} and ${b} do not overlap`).toBeGreaterThanOrEqual(circles[a].r + circles[b].r);
                }
            }
            expect(html, `${word} prints no picture file and no empty box`).not.toMatch(/<img|card-picture-empty/);
        }
        expect(sheetOf('Nine'), 'a capital letter does not change the dot count').toContain('data-row="1"');
        expect(sheetOf('NINE').match(/data-number-dot/g), 'an upper-case label draws nine dots').toHaveLength(9);
    });

    it('R2-10 treats a label that is an Object.prototype name as a plain picture card', () => {
        for (const label of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
            let html = '';
            expect(() => { html = sheetOf(label); }, `the label ${label} does not crash the sheet`).not.toThrow();
            expect(html, `${label} is not a patch`).not.toContain('data-card-patch');
            expect(html, `${label} is not a dot card`).not.toContain('data-number-dot');
            expect(html, `${label} prints the empty labelled box`).toContain('card-picture-empty');
            const lines = storytimeCardPictureMatchLines([card(label)], [], new Set<string>(), new Map());
            expect(lines, `${label} has no row`).toEqual([`picture\t${label}\tnone\tnone: no row`]);
        }
    });

    it('R2-11 prints a color patch and no picture, even when a card row is delivered for that word', () => {
        const rows = [listRow('l2-w05-card-red', 'red', 'card', 5), listRow('l2-w05-check-row-red', 'red', 'check-row', 5)];
        const delivered = new Set(rows.map((row) => row.id));
        const html = sheetOf('Red', 'picture', () => '/tmp/opencode/red.png');
        expect(html, 'the patch box prints').toContain('data-card-patch="red"');
        expect(html).toContain(`data-color="${STORYTIME_CARD_COLOR_PATCH.red}"`);
        expect(html, 'the patch card never prints the picture file').not.toContain('<img');
        const lines = storytimeCardPictureMatchLines([card('Red'), card('red', 'sound-picture')], rows, delivered, new Map());
        expect(lines, 'the report names the patch in the third and the fourth column').toEqual([
            'picture\tRed\tpatch\tpatch',
            'sound-picture\tred\tpatch\tpatch',
        ]);
        expect(storytimeCardMatchCounts(lines)).toEqual({ picture: 0, patch: 2, dots: 0, none: 0 });
        const soundHtml = compileStorytimeCardSheet([{ kind: 'sound', label: 'red', size: 'A5', classSet: false }], 'A5').html;
        expect(soundHtml, 'a sound card of the letters r-e-d is not a patch card').not.toContain('data-card-patch');
    });
});

describe('the sticker centre overrides', () => {
    /** One sticker item. */
    const sticker = (label: string): StorytimeKitItem => ({ kind: 'sticker', label, week: 1, classSet: false });
    /** The `object-position` values of a sheet, by sticker label. */
    function positions(items: StorytimeKitItem[], centers?: Record<string, string>): Map<string, string> {
        const html = compileStorytimeStickerSheet(items, { pictureOf: () => '/tmp/opencode/x.png', centers }).html;
        const map = new Map<string, string>();
        for (const match of html.matchAll(/data-label="([^"]*)"[\s\S]*?object-position:([^"]*)"/g)) map.set(match[1], match[2]);
        return map;
    }

    it('R2-12 ignores an override for a label that is not on the sheet and a value that is not two percentages', () => {
        const items = [sticker('Unit 1'), sticker('Can I?'), sticker('Hello')];
        const baseline = positions(items);
        expect(baseline.get('Can I?'), 'the module override moves the Can I? picture').toBe(STORYTIME_STICKER_CENTER_OVERRIDES['Can I?']);
        expect(baseline.get('Hello')).toBe('50% 50%');
        const extra = positions(items, { 'Not on the sheet': '10% 10%' });
        expect([...extra.entries()], 'a label that is not on the sheet changes no sticker').toEqual([...baseline.entries()]);
        expect(extra.size).toBe(3);
        for (const bad of ['url(x) 5%', '30% 50%; background:red', '30 50', '30%', '-5% 5%', '', '50%50%', '1e2% 5%', '10% 10% 10%']) {
            const got = positions(items, { Hello: bad, 'Can I?': bad });
            expect(got.get('Hello'), `"${bad}" falls back to the default centre`).toBe('50% 50%');
            expect(got.get('Can I?'), `"${bad}" also replaces the module override with the default`).toBe('50% 50%');
        }
        expect(positions(items, { Hello: '  20% 80%  ' }).get('Hello'), 'a padded valid pair is trimmed').toBe('20% 80%');
        expect(positions(items, { 'Can I?': '10% 10%' }).get('Can I?'), 'the caller map wins over the module map').toBe('10% 10%');
        expect(positions(items, { 'can i?': '10% 10%' }).get('Can I?'), 'the label match is exact: another case changes nothing').toBe(STORYTIME_STICKER_CENTER_OVERRIDES['Can I?']);
    });

    /**
     * The centre map is a plain object, so `centres['constructor']` is the inherited function and
     * `raw.trim()` throws. A sticker whose label is an Object.prototype name must print at the
     * default centre.
     */
    it('X-P8-13 prints a sticker whose label is an Object.prototype name at the default centre', () => {
        for (const label of ['constructor', 'toString', '__proto__']) {
            const got = positions([sticker(label)]);
            expect(got.get(label), `${label} keeps the default centre`).toBe('50% 50%');
        }
    });
});

describe('storytimeDeliveredPictures', () => {
    it('R2-13 does not deliver a row that has a color file and no line-art file, and keeps the rows around it', async () => {
        const rows = bookRowsOf(1).slice(0, 3);
        expect(rows).toHaveLength(3);
        const batch = await batchOf(rows);
        // The row in the middle loses its line-art file; the manifest still names it.
        fs.rmSync(path.join(batch, 'w01', 'rows', `${rows[1].id}-line-v1.png`));
        const result = storytimeDeliveredPictures(batch, rows as unknown as StorytimePictureRow[]);
        expect([...result.delivered].sort(), 'the rows with both files are delivered').toEqual([rows[0].id, rows[2].id].sort());
        expect(result.files.has(rows[1].id), 'the color file of the half-delivered row is not offered to a card').toBe(false);
        expect(result.reasons.get(rows[1].id) ?? '', 'the reason names the missing line-art file').toContain(`${rows[1].id}-line-v1.png`);
        expect(result.reasons.size, 'only the half-delivered row has a reason').toBe(1);
        // A card row with a missing line-art file is skipped, so the book picture of the word serves the card.
        const list: StorytimePictureRow[] = [
            listRow('l2-w01-card-fan', 'fan', 'card'),
            listRow('l2-w01-check-row-fan', 'fan', 'check-row'),
        ];
        const folder = await batchOf([
            { ...rows[0], id: list[0].id }, { ...rows[0], id: list[1].id },
        ]);
        fs.rmSync(path.join(folder, 'w01', 'rows', 'l2-w01-card-fan-line-v1.png'));
        const delivered = storytimeDeliveredPictures(folder, list);
        expect([...delivered.delivered], 'only the check row is delivered').toEqual(['l2-w01-check-row-fan']);
        const lines = storytimeCardPictureMatchLines([card('fan')], list, delivered.delivered, delivered.reasons);
        expect(lines, 'the card falls back to the delivered check row').toEqual(['picture\tfan\tl2-w01-check-row-fan\ttext']);
    }, 120_000);
});

describe('the card picture file stays the source of the card rows', () => {
    it('R2-14 builds the 31 shipped card rows with one id and one file for each word', () => {
        const entries = readLevelCardPictures(STORYTIME_ROOT, 2);
        const rows = storytimeCardPictureRows(entries, 2);
        expect(rows).toHaveLength(entries.length);
        expect(new Set(rows.map((row) => row.id)).size, 'every card row has its own id').toBe(rows.length);
        expect(new Set(rows.map((row) => row.lineArtFileName)).size, 'every card row has its own line-art file').toBe(rows.length);
        const shipped = shippedRows().filter((row) => row.use === 'card');
        expect(shipped.map((row) => row.id), 'pictures.json holds exactly the generated card rows, in order').toEqual(rows.map((row) => row.id));
    });
});

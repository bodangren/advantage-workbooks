// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';

/**
 * Phase 10, Red 2: the mapping of the family words, the script that writes their pictures, and the
 * check of the package (spec FR 2 to FR 6, decisions H2, H3, H7 to H9).
 *
 * The file holds the cases R2-1 to R2-18 of the test strategy, section 5.6. The script of the
 * Green 1 task holds the renderer only. The setter and the check of the Green 2 task do not exist
 * yet, so the cases that need them fail inside their body.
 *
 * Every table below is written by hand. The test never reads a value from the code under test.
 * The test reads the shipped week files and the shipped card manifest. It writes only into
 * temporary copies under a temporary folder, and it removes them at the end.
 */

/** The dashboard folder, so that the new modules are read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The module of the family pictures. */
const familyPicturesModule = path.join(dashboardRoot, 'lib/storytime/family-pictures.ts');

/** The script of the family pictures. */
const setFamilyPicturesModule = path.join(dashboardRoot, 'scripts/storytime/set-family-pictures.ts');

/** The script of the week checks. */
const checkWeeksModule = path.join(dashboardRoot, 'scripts/storytime/check-weeks.ts');

/** The folder of the card pictures of the hand-off. */
const CARD_FOLDER = path.join(os.homedir(), 'Desktop/handoff/storytime-l2-card-pictures');

/** The folder of the Forge pictures of the hand-off. */
const FORGE_FOLDER = path.join(os.homedir(), 'Desktop/handoff/storytime-l2-family-word-pictures');

/** The root of the temporary copies of the tests. */
const TEMP_ROOT = '/tmp/opencode';

/** The width and the height of a source picture, in pixels. */
const PNG_SIZE = 1500;

/** The byte length of one JPEG of the app: 150 KB. */
const MAX_JPEG_BYTES = 153_600;

/** The width and the height of one JPEG of the app, in pixels. */
const JPEG_SIZE = 800;

/** The smallest and the largest quality of one JPEG. */
const MIN_QUALITY = 75;
const MAX_QUALITY = 82;

/** The label of the check row of the family pictures (decision H9). */
const CHECK_LABEL = 'The family-word pictures named in the package exist';

/** The source of a color patch. */
type PatchSource = { kind: 'patch'; word: string; hex: string };

/** The source of a number card. */
type DotsSource = { kind: 'dots'; word: string; count: number };

/** The source of a picture that the app renders. */
type PictureSource = PatchSource | DotsSource;

/** The module of the family pictures. */
interface FamilyPicturesModule {
    STORYTIME_APP_NUMBER_DOTS: Readonly<Record<string, number>>;
    familyCardPictureHtml(source: PictureSource): string;
    familyCardPageHtml(source: PictureSource): string;
    familyCardSourceName(source: PictureSource): string;
    storytimeFamilyPicturePath(level: number, week: number, word: string): string;
    storytimeFamilyPictureSource(input: {
        level: number;
        week: number;
        word: string;
        cardEntries: readonly { word: string; week: number }[];
        cardFiles: ReadonlySet<string>;
        forgeFiles: ReadonlySet<string>;
    }): { kind: string; word: string; hex?: string; count?: number; fileName?: string };
}

/** The options of the setter of the script. */
interface SetFamilyPicturesOptions {
    weekFile: string;
    contentRoot: string;
    cardsFolder: string;
    cardRowsFile?: string;
    forgeFolder?: string;
    partial?: boolean;
    check?: boolean;
    render?: (source: PictureSource) => Promise<{ jpeg: Buffer; quality: number }>;
}

/** The result of the setter of the script. */
interface SetFamilyPicturesResult {
    mapped: number;
    skipped: string[];
    lines: string[];
}

/** The script of the family pictures. */
interface SetFamilyPicturesModule {
    renderFamilyCardJpeg(source: PictureSource): Promise<{ jpeg: Buffer; quality: number }>;
    setFamilyPictures?: (options: SetFamilyPicturesOptions) => Promise<SetFamilyPicturesResult>;
    main(argv: string[]): number | Promise<number>;
}

/** The row of a check. */
interface CheckRow {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail?: string;
}

/** The script of the week checks. */
interface CheckWeeksModule {
    checkFamilyPictures?: (week: any, contentRoot?: string) => CheckRow | undefined;
}

/**
 * One row of the mapping table of the addendum: the week, the word, the kind of the source, and
 * the value of the source.
 */
interface TableRow {
    week: number;
    word: string;
    kind: 'card' | 'forge' | 'patch' | 'dots';
    value: string;
}

/**
 * The 51 rows of the mapping table of the addendum, written by hand. The card rows name the color
 * file of the card folder. The forge rows name the fake color file of the test, because the Forge
 * folder arrives later. The patch rows name the hex value. The dots rows name the dot count.
 */
const TABLE: TableRow[] = [
    { week: 1, word: 'hello', kind: 'card', value: 'l2-w01-card-hello-v1.png' },
    { week: 1, word: 'goodbye', kind: 'card', value: 'l2-w01-card-goodbye-v1.png' },
    { week: 1, word: 'boy', kind: 'card', value: 'l2-w01-card-boy-v1.png' },
    { week: 1, word: 'girl', kind: 'card', value: 'l2-w01-card-girl-v1.png' },
    { week: 1, word: 'friend', kind: 'forge', value: 'l2-w01-card-friend-v2.png' },
    { week: 1, word: 'teacher', kind: 'card', value: 'l2-w01-card-teacher-v1.png' },
    { week: 2, word: 'one', kind: 'dots', value: '1' },
    { week: 2, word: 'two', kind: 'dots', value: '2' },
    { week: 2, word: 'three', kind: 'dots', value: '3' },
    { week: 2, word: 'four', kind: 'dots', value: '4' },
    { week: 2, word: 'five', kind: 'dots', value: '5' },
    { week: 2, word: 'six', kind: 'dots', value: '6' },
    { week: 2, word: 'seven', kind: 'dots', value: '7' },
    { week: 2, word: 'eight', kind: 'dots', value: '8' },
    { week: 2, word: 'nine', kind: 'dots', value: '9' },
    { week: 2, word: 'ten', kind: 'dots', value: '10' },
    { week: 3, word: 'red', kind: 'patch', value: '#E53935' },
    { week: 3, word: 'blue', kind: 'patch', value: '#1E88E5' },
    { week: 3, word: 'yellow', kind: 'patch', value: '#FDD835' },
    { week: 3, word: 'green', kind: 'patch', value: '#43A047' },
    { week: 3, word: 'orange', kind: 'patch', value: '#FB8C00' },
    { week: 3, word: 'pink', kind: 'patch', value: '#F48FB1' },
    { week: 3, word: 'purple', kind: 'patch', value: '#8E24AA' },
    { week: 4, word: 'mom', kind: 'card', value: 'l2-w04-card-mom-v1.png' },
    { week: 4, word: 'dad', kind: 'card', value: 'l2-w04-card-dad-v1.png' },
    { week: 4, word: 'brother', kind: 'card', value: 'l2-w04-card-brother-v1.png' },
    { week: 4, word: 'sister', kind: 'card', value: 'l2-w04-card-sister-v1.png' },
    { week: 4, word: 'grandma', kind: 'card', value: 'l2-w04-card-grandma-v1.png' },
    { week: 4, word: 'grandpa', kind: 'card', value: 'l2-w04-card-grandpa-v1.png' },
    { week: 4, word: 'family', kind: 'forge', value: 'l2-w04-card-family-v2.png' },
    { week: 5, word: 'eyes', kind: 'forge', value: 'l2-w05-card-eyes-v2.png' },
    { week: 5, word: 'ears', kind: 'forge', value: 'l2-w05-card-ears-v2.png' },
    { week: 5, word: 'nose', kind: 'forge', value: 'l2-w05-card-nose-v2.png' },
    { week: 5, word: 'hands', kind: 'forge', value: 'l2-w05-card-hands-v2.png' },
    { week: 5, word: 'arms', kind: 'forge', value: 'l2-w05-card-arms-v2.png' },
    { week: 5, word: 'legs', kind: 'forge', value: 'l2-w05-card-legs-v2.png' },
    { week: 5, word: 'feet', kind: 'forge', value: 'l2-w05-card-feet-v2.png' },
    { week: 6, word: 'cat', kind: 'forge', value: 'l2-w06-card-cat-v2.png' },
    { week: 6, word: 'dog', kind: 'forge', value: 'l2-w06-card-dog-v2.png' },
    { week: 6, word: 'bird', kind: 'forge', value: 'l2-w06-card-bird-v2.png' },
    { week: 6, word: 'fish', kind: 'forge', value: 'l2-w06-card-fish-v2.png' },
    { week: 6, word: 'frog', kind: 'forge', value: 'l2-w06-card-frog-v2.png' },
    { week: 6, word: 'duck', kind: 'forge', value: 'l2-w06-card-duck-v2.png' },
    { week: 6, word: 'horse', kind: 'forge', value: 'l2-w06-card-horse-v2.png' },
    { week: 7, word: 'ball', kind: 'forge', value: 'l2-w07-card-ball-v2.png' },
    { week: 7, word: 'doll', kind: 'card', value: 'l2-w07-card-doll-v1.png' },
    { week: 7, word: 'car', kind: 'card', value: 'l2-w07-card-car-v1.png' },
    { week: 7, word: 'kite', kind: 'forge', value: 'l2-w07-card-kite-v2.png' },
    { week: 7, word: 'drum', kind: 'forge', value: 'l2-w07-card-drum-v2.png' },
    { week: 7, word: 'train', kind: 'card', value: 'l2-w07-card-train-v1.png' },
    { week: 7, word: 'teddy', kind: 'card', value: 'l2-w07-card-teddy-v1.png' },
];

/** The 7 sRGB values of the color words of week 3, written by hand. */
const PATCH_HEX: Record<string, string> = {
    red: '#E53935',
    blue: '#1E88E5',
    yellow: '#FDD835',
    green: '#43A047',
    orange: '#FB8C00',
    pink: '#F48FB1',
    purple: '#8E24AA',
};

/** The dot count of each number word of week 2, written by hand. */
const DOT_COUNT: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
};

/** The card words of each week: the card folder holds a color file of each. */
const CARD_WORDS: Record<number, string[]> = {
    1: ['hello', 'goodbye', 'boy', 'girl', 'teacher'],
    4: ['mom', 'dad', 'brother', 'sister', 'grandma', 'grandpa'],
    7: ['doll', 'car', 'train', 'teddy'],
};

/** The Forge words of each week: the Forge folder holds a color file of each. */
const FORGE_WORDS: Record<number, string[]> = {
    1: ['friend'],
    4: ['family'],
    5: ['eyes', 'ears', 'nose', 'hands', 'arms', 'legs', 'feet'],
    6: ['cat', 'dog', 'bird', 'fish', 'frog', 'duck', 'horse'],
    7: ['ball', 'kite', 'drum'],
};

/** The temporary folders of the tests. */
const scratch: string[] = [];

/**
 * The hash of a buffer or of a text.
 * @param data The bytes or the text.
 * @returns The SHA-256 of the data.
 */
function sha256(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * The hash of a file.
 * @param file The path of the file.
 * @returns The SHA-256 of the file.
 */
function fileHash(file: string): string {
    return sha256(fs.readFileSync(file));
}

/**
 * A temporary folder under the temporary root of the machine.
 * @param prefix The prefix of the name of the folder.
 * @returns The path of the folder.
 */
function tempFolder(prefix: string): string {
    fs.mkdirSync(TEMP_ROOT, { recursive: true });
    const folder = fs.mkdtempSync(path.join(TEMP_ROOT, prefix));
    scratch.push(folder);
    return folder;
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
 * The folder of a hand-off that the test reads. The test never skips a case.
 * @param folder The path of the folder.
 * @returns The path of the folder.
 * @throws Error When the folder is absent. The message names the path.
 */
function requireFolder(folder: string): string {
    if (!fs.existsSync(folder)) throw new Error(`Missing folder: ${folder}`);
    return folder;
}

/**
 * The lines of a manifest file, in the form `<sha256>  <file name>`.
 * @param file The path of the manifest.
 * @returns The lines, each with its hash and its name.
 */
function manifestLines(file: string): { hash: string; name: string }[] {
    const lines: { hash: string; name: string }[] = [];
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const match = line.match(/^([0-9a-f]{64})  (.+)$/);
        if (match) lines.push({ hash: match[1], name: match[2] });
    }
    return lines;
}

/**
 * Writes the lines of a manifest file.
 * @param file The path of the manifest.
 * @param lines The lines, each with its hash and its name.
 */
function writeManifest(file: string, lines: { hash: string; name: string }[]): void {
    fs.writeFileSync(file, lines.map((line) => `${line.hash}  ${line.name}`).join('\n') + '\n');
}

/**
 * Adds a line to a manifest file.
 * @param file The path of the manifest.
 * @param name The name of the file.
 * @param hash The hash of the file.
 */
function appendManifest(file: string, name: string, hash: string): void {
    const lines = manifestLines(file);
    lines.push({ hash, name });
    writeManifest(file, lines);
}

/**
 * Replaces the hash of one line of a manifest file.
 * @param file The path of the manifest.
 * @param name The name of the file.
 * @param hash The new hash of the file.
 */
function setManifestHash(file: string, name: string, hash: string): void {
    writeManifest(file, manifestLines(file).map((line) => (line.name === name ? { hash, name } : line)));
}

/**
 * Removes one line of a manifest file.
 * @param file The path of the manifest.
 * @param name The name of the file.
 */
function removeManifestLine(file: string, name: string): void {
    writeManifest(file, manifestLines(file).filter((line) => line.name !== name));
}

/**
 * A solid color picture of 1500 x 1500 pixels, in RGB.
 * @param colour The red, green, and blue value.
 * @returns The bytes of the file.
 */
async function solidPng(colour: [number, number, number]): Promise<Buffer> {
    return await sharp({
        create: {
            width: PNG_SIZE,
            height: PNG_SIZE,
            channels: 3,
            background: { r: colour[0], g: colour[1], b: colour[2] },
        },
    }).png().toBuffer();
}

/**
 * Writes a solid color picture of 1500 x 1500 pixels, in RGB.
 * @param file The path of the file.
 * @param colour The red, green, and blue value.
 * @returns The hash of the file.
 */
async function writeSolidPng(file: string, colour: [number, number, number]): Promise<string> {
    const bytes = await solidPng(colour);
    fs.writeFileSync(file, bytes);
    return sha256(bytes);
}

/** The table of the CRC-32 of the PNG chunks. */
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
        let value = index;
        for (let bit = 0; bit < 8; bit += 1) {
            value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }
        table[index] = value >>> 0;
    }
    return table;
})();

/**
 * The CRC-32 of a buffer, as the PNG chunks use it.
 * @param bytes The bytes.
 * @returns The checksum.
 */
function crc32(bytes: Buffer): number {
    let value = 0xffffffff;
    for (const byte of bytes) {
        value = (CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8)) >>> 0;
    }
    return (value ^ 0xffffffff) >>> 0;
}

/**
 * One chunk of a PNG file.
 * @param type The type of the chunk.
 * @param data The bytes of the chunk.
 * @returns The bytes of the chunk.
 */
function pngChunk(type: string, data: Buffer): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeBytes = Buffer.from(type, 'ascii');
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([length, typeBytes, data, checksum]);
}

/**
 * A PNG file of 16 bits per channel, in RGB. The sharp library writes no 16-bit PNG, so the test
 * builds one: the depth rule of the delivery check needs a file that sharp reads as `ushort`.
 * @param width The width in pixels.
 * @param height The height in pixels.
 * @returns The bytes of the file.
 */
function png16(width: number, height: number): Buffer {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 16;
    header[9] = 2;
    const stride = 1 + width * 6;
    const raw = Buffer.alloc(height * stride);
    for (let y = 0; y < height; y += 1) {
        const rowStart = y * stride;
        for (let x = 0; x < width; x += 1) {
            const pixel = rowStart + 1 + x * 6;
            raw[pixel] = 0x20;
            raw[pixel + 1] = 0x40;
            raw[pixel + 2] = 0x60;
            raw[pixel + 3] = 0x80;
            raw[pixel + 4] = 0x00;
            raw[pixel + 5] = 0x10;
        }
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk('IHDR', header),
        pngChunk('IDAT', zlib.deflateSync(raw)),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
}

/**
 * The JPEG files of a folder and of its subfolders, in path order.
 * @param folder The folder to read.
 * @returns The paths of the JPEG files.
 */
function jpegFiles(folder: string): string[] {
    if (!fs.existsSync(folder)) return [];
    const out: string[] = [];
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) out.push(...jpegFiles(full));
        else if (entry.name.endsWith('.jpg')) out.push(full);
    }
    return out.sort();
}

/**
 * The hash of every file of a folder, with its path relative to the folder.
 * @param root The folder to read.
 * @returns The hashes, keyed by the relative path.
 */
function treeHashes(root: string): Record<string, string> {
    const out: Record<string, string> = {};
    const walk = (folder: string): void => {
        const entries = fs.readdirSync(folder, { withFileTypes: true })
            .sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) walk(full);
            else out[path.relative(root, full)] = fileHash(full);
        }
    };
    walk(root);
    return out;
}

/**
 * The provenance lines of a run, one array of fields per line.
 * @param contentRoot The content root of the run.
 * @param week The week.
 * @returns The lines of the provenance file.
 */
function provenanceLines(contentRoot: string, week: number): string[][] {
    const file = path.join(contentRoot, `l2/media/w${weekDigits(week)}/family/pictures.sha256`);
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => line.split('\t'));
}

/**
 * The line diff of two texts, with the least edit script.
 * @param before The lines of the first text.
 * @param after The lines of the second text.
 * @returns The removed lines, the added lines, and the count of the equal lines at each end.
 */
function lineDiff(before: string[], after: string[]): { removed: string[]; added: string[]; prefix: number; suffix: number } {
    const n = before.length;
    const m = after.length;
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i -= 1) {
        for (let j = m - 1; j >= 0; j -= 1) {
            table[i * width + j] = before[i] === after[j]
                ? table[(i + 1) * width + (j + 1)] + 1
                : Math.max(table[(i + 1) * width + j], table[i * width + (j + 1)]);
        }
    }
    const removed: string[] = [];
    const added: string[] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (before[i] === after[j]) {
            i += 1;
            j += 1;
            continue;
        }
        if (table[(i + 1) * width + j] >= table[i * width + (j + 1)]) {
            removed.push(before[i]);
            i += 1;
        } else {
            added.push(after[j]);
            j += 1;
        }
    }
    while (i < n) {
        removed.push(before[i]);
        i += 1;
    }
    while (j < m) {
        added.push(after[j]);
        j += 1;
    }
    let prefix = 0;
    while (prefix < removed.length && prefix < added.length && removed[prefix] === added[prefix]) prefix += 1;
    let suffix = 0;
    while (
        suffix < removed.length - prefix
        && suffix < added.length - prefix
        && removed[removed.length - 1 - suffix] === added[added.length - 1 - suffix]
    ) suffix += 1;
    return { removed, added, prefix, suffix };
}

/**
 * Runs an action and returns the lines that it prints to the console.
 * @param action The action.
 * @returns The printed lines, joined by a newline.
 */
async function captureLog(action: () => Promise<void>): Promise<string> {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]): void => {
        lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
        await action();
    } finally {
        console.log = original;
    }
    return lines.join('\n');
}

/**
 * The module of the family pictures.
 * @returns The module.
 * @throws Error When the module file is missing. The message names the path.
 */
async function familyPictures(): Promise<FamilyPicturesModule> {
    if (!fs.existsSync(familyPicturesModule)) throw new Error(`Missing module: ${familyPicturesModule}`);
    return await import(familyPicturesModule) as FamilyPicturesModule;
}

/**
 * The script of the family pictures.
 * @returns The script module.
 * @throws Error When the script file is missing. The message names the path.
 */
async function setFamilyPictures(): Promise<SetFamilyPicturesModule> {
    if (!fs.existsSync(setFamilyPicturesModule)) throw new Error(`Missing module: ${setFamilyPicturesModule}`);
    return await import(setFamilyPicturesModule) as SetFamilyPicturesModule;
}

/**
 * The setter of the script of the family pictures. The Green 2 task writes it.
 * @returns The setter.
 */
async function familyPictureSetter(): Promise<(options: SetFamilyPicturesOptions) => Promise<SetFamilyPicturesResult>> {
    const mod = await setFamilyPictures();
    expect(mod.setFamilyPictures, 'the script exports the setter').toBeTypeOf('function');
    return mod.setFamilyPictures as (options: SetFamilyPicturesOptions) => Promise<SetFamilyPicturesResult>;
}

/**
 * The script of the week checks.
 * @returns The script module.
 * @throws Error When the script file is missing. The message names the path.
 */
async function checkWeeks(): Promise<CheckWeeksModule> {
    if (!fs.existsSync(checkWeeksModule)) throw new Error(`Missing module: ${checkWeeksModule}`);
    return await import(checkWeeksModule) as CheckWeeksModule;
}

/** The rendered JPEG of the fake renderer, so that the file renders it once. */
let fakeJpeg: Buffer | undefined;

/**
 * The fake renderer of the logic cases. It returns a small JPEG, so that no case starts Chrome.
 * @returns The JPEG buffer and the quality of the encode.
 */
async function fakeRender(): Promise<{ jpeg: Buffer; quality: number }> {
    if (!fakeJpeg) {
        fakeJpeg = await sharp({
            create: { width: 16, height: 16, channels: 3, background: { r: 30, g: 60, b: 90 } },
        }).jpeg().toBuffer();
    }
    return { jpeg: fakeJpeg, quality: 82 };
}

/** The temporary tree of one run of the script. */
interface TempTree {
    folder: string;
    contentRoot: string;
    weekFile: string;
    cardRowsFile: string;
    cardsFolder: string;
    forgeFolder: string;
}

/**
 * A temporary copy of a week file, of the card rows, of a card folder, and of a Forge folder. The
 * source pictures are solid color files of 1500 x 1500 pixels, and the manifest of each folder
 * lists them with their real hash.
 * @param week The week.
 * @param options The `forge` flag says that the Forge folder holds a color file of each Forge word.
 * @returns The paths of the copy.
 */
async function tempTree(week: number, options: { forge?: boolean } = {}): Promise<TempTree> {
    const folder = tempFolder('storytime-family-');
    const contentRoot = path.join(folder, 'content');
    const name = `w${weekDigits(week)}.json`;
    const weekFile = path.join(contentRoot, 'l2', name);
    fs.mkdirSync(path.dirname(weekFile), { recursive: true });
    fs.copyFileSync(path.join(STORYTIME_ROOT, 'l2', name), weekFile);
    const cardRowsFile = path.join(folder, 'card-pictures.json');
    fs.copyFileSync(path.join(STORYTIME_ROOT, 'l2/print/card-pictures.json'), cardRowsFile);

    const cardsFolder = path.join(folder, 'cards');
    fs.mkdirSync(cardsFolder, { recursive: true });
    const cardLines: { hash: string; name: string }[] = [];
    for (const word of CARD_WORDS[week] ?? []) {
        const fileName = `l2-w${weekDigits(week)}-card-${word}-v1.png`;
        const hash = await writeSolidPng(path.join(cardsFolder, fileName), [200, 100, 50]);
        cardLines.push({ hash, name: fileName });
    }
    writeManifest(path.join(cardsFolder, 'MANIFEST.txt'), cardLines);

    const forgeFolder = path.join(folder, 'forge');
    fs.mkdirSync(forgeFolder, { recursive: true });
    const forgeLines: { hash: string; name: string }[] = [];
    if (options.forge !== false) {
        for (const word of FORGE_WORDS[week] ?? []) {
            const fileName = `l2-w${weekDigits(week)}-card-${word}-v1.png`;
            const hash = await writeSolidPng(path.join(forgeFolder, fileName), [60, 140, 200]);
            forgeLines.push({ hash, name: fileName });
        }
    }
    writeManifest(path.join(forgeFolder, 'MANIFEST.txt'), forgeLines);

    return { folder, contentRoot, weekFile, cardRowsFile, cardsFolder, forgeFolder };
}

/**
 * The source file of a provenance line, in the card folder or in the Forge folder.
 * @param tree The temporary tree.
 * @param sourceName The name of the source file.
 * @returns The path of the source file.
 * @throws Error When the source file is in neither folder.
 */
function sourceFile(tree: TempTree, sourceName: string): string {
    const inCards = path.join(tree.cardsFolder, sourceName);
    if (fs.existsSync(inCards)) return inCards;
    const inForge = path.join(tree.forgeFolder, sourceName);
    if (fs.existsSync(inForge)) return inForge;
    throw new Error(`Missing source file: ${sourceName}`);
}

/**
 * The options of a run of the setter on a temporary tree.
 * @param tree The temporary tree.
 * @param options The flags of the run.
 * @returns The options of the setter.
 */
function runOptions(tree: TempTree, options: { partial?: boolean; check?: boolean; forge?: boolean } = {}): SetFamilyPicturesOptions {
    return {
        weekFile: tree.weekFile,
        contentRoot: tree.contentRoot,
        cardsFolder: tree.cardsFolder,
        cardRowsFile: tree.cardRowsFile,
        forgeFolder: options.forge === false ? undefined : tree.forgeFolder,
        partial: options.partial,
        check: options.check,
        render: fakeRender,
    };
}

/**
 * One exit-1 case of the delivery check of a source folder.
 */
interface H8Case {
    name: string;
    token: RegExp;
    names: string[];
    fault: (tree: TempTree) => Promise<void>;
}

/** The card file that the exit-1 cases break. It is the last word of week 1. */
const LAST_CARD_FILE = 'l2-w01-card-teacher-v1.png';

/** The exit-1 cases of the delivery check of a source folder. */
const H8_CASES: H8Case[] = [
    {
        name: 'a card file that the manifest does not list',
        token: /not in MANIFEST/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            removeManifestLine(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE);
        },
    },
    {
        name: 'a card file whose hash differs from the manifest',
        token: /SHA-256 differs from MANIFEST/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, '0'.repeat(64));
        },
    },
    {
        name: 'a JPEG named as a PNG',
        token: /not a PNG/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            const bytes = await sharp({
                create: { width: PNG_SIZE, height: PNG_SIZE, channels: 3, background: { r: 10, g: 20, b: 30 } },
            }).jpeg().toBuffer();
            fs.writeFileSync(path.join(tree.cardsFolder, LAST_CARD_FILE), bytes);
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, sha256(bytes));
        },
    },
    {
        name: 'a PNG with an alpha channel',
        token: /has an alpha channel/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            const bytes = await sharp({
                create: {
                    width: PNG_SIZE,
                    height: PNG_SIZE,
                    channels: 4,
                    background: { r: 10, g: 20, b: 30, alpha: 0.5 },
                },
            }).png().toBuffer();
            fs.writeFileSync(path.join(tree.cardsFolder, LAST_CARD_FILE), bytes);
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, sha256(bytes));
        },
    },
    {
        name: 'a PNG of 16 bits',
        token: /not 8-bit sRGB with 3 channels/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            const bytes = png16(PNG_SIZE, PNG_SIZE);
            fs.writeFileSync(path.join(tree.cardsFolder, LAST_CARD_FILE), bytes);
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, sha256(bytes));
        },
    },
    {
        name: 'a grey PNG',
        token: /not 8-bit sRGB with 3 channels/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            const bytes = await sharp({
                create: { width: PNG_SIZE, height: PNG_SIZE, channels: 3, background: { r: 90, g: 90, b: 90 } },
            }).toColourspace('b-w').png().toBuffer();
            fs.writeFileSync(path.join(tree.cardsFolder, LAST_CARD_FILE), bytes);
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, sha256(bytes));
        },
    },
    {
        name: 'a PNG of 1499 x 1500 pixels',
        token: /not 1500 x 1500/i,
        names: [LAST_CARD_FILE],
        fault: async (tree) => {
            const bytes = await sharp({
                create: { width: PNG_SIZE - 1, height: PNG_SIZE, channels: 3, background: { r: 70, g: 70, b: 70 } },
            }).png().toBuffer();
            fs.writeFileSync(path.join(tree.cardsFolder, LAST_CARD_FILE), bytes);
            setManifestHash(path.join(tree.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, sha256(bytes));
        },
    },
    {
        name: 'a Forge folder with only the line file of the word',
        token: /no color file/i,
        names: ['friend'],
        fault: async (tree) => {
            fs.rmSync(path.join(tree.forgeFolder, 'l2-w01-card-friend-v1.png'));
            const lineName = 'l2-w01-card-friend-line-v1.png';
            const hash = await writeSolidPng(path.join(tree.forgeFolder, lineName), [120, 120, 120]);
            appendManifest(path.join(tree.forgeFolder, 'MANIFEST.txt'), lineName, hash);
        },
    },
    {
        name: 'two color files for one Forge word',
        token: /two color files|2 color files/i,
        names: ['friend', 'l2-w01-card-friend-v1.png'],
        fault: async (tree) => {
            const name = 'l2-w01-card-friend-v2.png';
            const hash = await writeSolidPng(path.join(tree.forgeFolder, name), [80, 80, 80]);
            appendManifest(path.join(tree.forgeFolder, 'MANIFEST.txt'), name, hash);
        },
    },
    {
        name: 'a manifest line with a hostile name',
        token: /not in MANIFEST|SHA-256 differs from MANIFEST|not a PNG|not 8-bit sRGB with 3 channels|has an alpha channel|not 1500 x 1500|-line- name|no color file|two color files|2 color files/i,
        names: [],
        fault: async (tree) => {
            const outside = path.join(tree.folder, 'x.png');
            const bytes = await solidPng([1, 2, 3]);
            fs.writeFileSync(outside, bytes);
            const manifest = path.join(tree.cardsFolder, 'MANIFEST.txt');
            const lines = manifestLines(manifest);
            lines.push({ hash: sha256(bytes), name: '../x.png' });
            lines.push({ hash: sha256(bytes), name: 'l2-w01-card-teacher v1.png' });
            writeManifest(manifest, lines);
        },
    },
];

/** The hash of the 7 shipped week files, taken before the first case runs. */
const SHIPPED_WEEK_HASHES: Record<string, string> = (() => {
    const hashes: Record<string, string> = {};
    for (let week = 1; week <= 7; week += 1) {
        const name = `w${weekDigits(week)}.json`;
        hashes[name] = fileHash(path.join(STORYTIME_ROOT, 'l2', name));
    }
    return hashes;
})();

/** The needle of a track path of the measure folder. The test file holds no such path. */
const TRACK_PATH_NEEDLE = ['measure', 'tracks'].join('/');

afterAll(() => scratch.forEach((folder) => fs.rmSync(folder, { recursive: true, force: true })));

describe('the mapping of the 51 family words (Phase 10, Red 2)', () => {
    it('R2-1 the mapping table of the spec gives the source of every word', async () => {
        const mod = await familyPictures();
        expect(mod.storytimeFamilyPictureSource, 'the module exports the source rule').toBeTypeOf('function');
        const cardRows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/print/card-pictures.json'), 'utf8'));
        const cardEntries = cardRows.map((row: any) => ({ word: row.word, week: row.week }));
        const manifest = requireFolder(CARD_FOLDER);
        const cardFiles = new Set(manifestLines(path.join(manifest, 'MANIFEST.txt')).map((line) => line.name));
        const forgeFiles = new Set(TABLE.filter((row) => row.kind === 'forge').map((row) => row.value));

        const shipped: string[] = [];
        for (let week = 1; week <= 7; week += 1) {
            const file = path.join(STORYTIME_ROOT, `l2/w${weekDigits(week)}.json`);
            const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
            for (const word of parsed.focus.family.words) shipped.push(`${week}:${word.word}`);
        }
        const table = TABLE.map((row) => `${row.week}:${row.word}`);
        expect(table, 'rows: 51').toHaveLength(51);
        expect(table, 'the table holds the words of the shipped weeks, in their order').toEqual(shipped);

        const kinds = { card: 0, forge: 0, patch: 0, dots: 0 };
        for (const row of TABLE) {
            const source = mod.storytimeFamilyPictureSource({
                level: 2,
                week: row.week,
                word: row.word,
                cardEntries,
                cardFiles,
                forgeFiles,
            });
            kinds[row.kind] += 1;
            expect(source.kind, `the kind of ${row.word}`).toBe(row.kind);
            if (row.kind === 'card' || row.kind === 'forge') {
                expect(source.fileName, `the file name of ${row.word}`).toBe(row.value);
            } else if (row.kind === 'patch') {
                expect(source.hex, `the hex value of ${row.word}`).toBe(row.value);
            } else {
                expect(Number(row.value), `the dot count of ${row.word}`).toBe(DOT_COUNT[row.word]);
                expect(source.count, `the dot count of ${row.word}`).toBe(Number(row.value));
            }
        }
        expect(kinds.card, 'card words: 15').toBe(15);
        expect(kinds.forge, 'forge words: 19').toBe(19);
        expect(kinds.patch, 'patch words: 7').toBe(7);
        expect(kinds.dots, 'dots words: 10').toBe(10);
        expect(Object.keys(DOT_COUNT), 'the dot words of the table: 10').toHaveLength(10);
        expect(Object.keys(PATCH_HEX), 'the color words of the table: 7').toHaveLength(7);
    });

    it('R2-2 the source rule takes the patch, then the dots, then the card, then the Forge file', async () => {
        const mod = await familyPictures();
        expect(mod.storytimeFamilyPictureSource, 'the module exports the source rule').toBeTypeOf('function');
        const rule = mod.storytimeFamilyPictureSource;
        const patch = rule({
            level: 2,
            week: 3,
            word: 'red',
            cardEntries: [{ word: 'red', week: 3 }],
            cardFiles: new Set(['l2-w03-card-red-v1.png']),
            forgeFiles: new Set(['l2-w03-card-red-v2.png']),
        });
        expect(patch.kind, 'the color patch wins over the card file').toBe('patch');
        const dots = rule({
            level: 2,
            week: 2,
            word: 'one',
            cardEntries: [{ word: 'one', week: 2 }],
            cardFiles: new Set(['l2-w02-card-one-v1.png']),
            forgeFiles: new Set<string>(),
        });
        expect(dots.kind, 'the number card wins over the card file').toBe('dots');
        const friend = rule({
            level: 2,
            week: 1,
            word: 'friend',
            cardEntries: [],
            cardFiles: new Set<string>(),
            forgeFiles: new Set(['l2-w01-card-friend-v2.png']),
        });
        expect(friend.kind, 'a word with no card row is a Forge word').toBe('forge');
        const family = rule({
            level: 2,
            week: 4,
            word: 'family',
            cardEntries: [{ word: 'family', week: 4 }],
            cardFiles: new Set<string>(),
            forgeFiles: new Set(['l2-w04-card-family-v2.png']),
        });
        expect(family.kind, 'a word with no card file is a Forge word').toBe('forge');
    });

    it('R2-3 the Forge rule takes one color file of the week and refuses the rest', async () => {
        const mod = await familyPictures();
        expect(mod.storytimeFamilyPictureSource, 'the module exports the source rule').toBeTypeOf('function');
        const rule = mod.storytimeFamilyPictureSource;
        const base = { level: 2, week: 1, word: 'friend', cardEntries: [] as { word: string; week: number }[] };
        const tenth = rule({ ...base, cardFiles: new Set<string>(), forgeFiles: new Set(['l2-w01-card-friend-v10.png']) });
        expect(tenth.fileName, 'a version of ten is accepted').toBe('l2-w01-card-friend-v10.png');
        for (const name of ['l2-w01-card-friend-v0.png', 'l2-w01-card-friend-v01.png']) {
            const source = rule({ ...base, cardFiles: new Set<string>(), forgeFiles: new Set([name]) });
            expect(source.fileName, `the name ${name} is refused`).toBeUndefined();
        }
        const otherWord = rule({ ...base, word: 'ear', cardFiles: new Set<string>(), forgeFiles: new Set(['l2-w01-card-ears-v1.png']) });
        expect(otherWord.fileName, 'the file of another word is not used').toBeUndefined();
        const otherWeek = rule({ ...base, cardFiles: new Set<string>(), forgeFiles: new Set(['l2-w02-card-friend-v1.png']) });
        expect(otherWeek.fileName, 'the file of another week is not used').toBeUndefined();
        const line = rule({ ...base, cardFiles: new Set<string>(), forgeFiles: new Set(['l2-w01-card-friend-line-v1.png']) });
        expect(line.fileName, 'the line file is never a color file').toBeUndefined();
        let thrown: Error | undefined;
        try {
            rule({
                ...base,
                cardFiles: new Set<string>(),
                forgeFiles: new Set(['l2-w01-card-friend-v1.png', 'l2-w01-card-friend-v2.png']),
            });
        } catch (error) {
            thrown = error as Error;
        }
        expect(thrown, 'two color files throw').toBeInstanceOf(Error);
        expect(thrown?.message ?? '', 'the error of two color files starts with the family picture prefix')
            .toMatch(/^family picture:/);
        const none = rule({ ...base, cardFiles: new Set<string>(), forgeFiles: new Set<string>() });
        expect(none.fileName, 'a Forge word with no file has no file name').toBeUndefined();
    });

    it('R2-4 the package path of a family picture follows the path rule', async () => {
        const mod = await familyPictures();
        expect(mod.storytimeFamilyPicturePath, 'the module exports the path rule').toBeTypeOf('function');
        expect(mod.storytimeFamilyPicturePath(2, 1, 'hello'), 'the path of hello in week 1')
            .toBe('l2/media/w01/family/hello.jpg');
        expect(mod.storytimeFamilyPicturePath(2, 10, 'ten'), 'the path of ten in week 10')
            .toBe('l2/media/w10/family/ten.jpg');
        for (const word of ['Nan', 'a1', 'a/b', '..', '']) {
            expect(() => mod.storytimeFamilyPicturePath(2, 1, word), `the word ${word} is refused`).toThrow();
        }
        for (const week of [0, 100]) {
            expect(() => mod.storytimeFamilyPicturePath(2, week, 'hello'), `the week ${week} is refused`).toThrow();
        }
    });
});

describe('the family picture script (Phase 10, Red 2)', () => {
    it('R2-5 the script writes six pictures, six provenance lines, and six file lines', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        const result = await setter(runOptions(tree));
        expect(result.mapped, 'mapped pictures: 6').toBe(6);
        const folder = path.join(tree.contentRoot, 'l2/media/w01/family');
        expect(jpegFiles(folder), 'the run writes six JPEGs').toHaveLength(6);
        const lines = provenanceLines(tree.contentRoot, 1);
        expect(lines, 'provenance lines: 6').toHaveLength(6);
        for (const line of lines) {
            expect(line.length, 'each provenance line holds six fields').toBe(6);
            const [outputPath, outputHash, sourceName, sourceHash, quality, sharpVersion] = line;
            const output = path.join(tree.contentRoot, outputPath);
            expect(fs.existsSync(output), `the file ${outputPath} exists`).toBe(true);
            expect(fileHash(output), `the hash of ${outputPath}`).toBe(outputHash);
            expect(fileHash(sourceFile(tree, sourceName)), `the hash of the source ${sourceName}`).toBe(sourceHash);
            expect(Number(quality), `the quality of ${outputPath}`).toBeGreaterThanOrEqual(MIN_QUALITY);
            expect(Number(quality), `the quality of ${outputPath}`).toBeLessThanOrEqual(MAX_QUALITY);
            expect(sharpVersion, `the sharp version of ${outputPath}`).toBe(sharp.versions.sharp);
        }
        const week = JSON.parse(fs.readFileSync(tree.weekFile, 'utf8'));
        const files = week.focus.family.words.map((word: any) => word.image.file);
        expect(files, 'the week file holds six file lines').toHaveLength(6);
        for (const file of files) {
            expect(file, 'the file line holds the package path').toMatch(/^l2\/media\/w01\/family\/[a-z]+\.jpg$/);
        }
    });

    it('R2-6 the week file gains a file line after each caption and changes nothing else', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        await setter(runOptions(tree));
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        const diff = lineDiff(beforeLines, afterLines);
        expect(diff.removed, 'deleted lines: 6').toHaveLength(6);
        expect(diff.added, 'added lines: 12').toHaveLength(12);
        for (const removed of diff.removed) {
            expect(removed, 'each deleted line is a caption line').toMatch(/^\s*"caption": "[a-z]+"$/);
            expect(diff.added, `the caption line ${removed} gains a comma`).toContain(`${removed},`);
        }
        const week = JSON.parse(before);
        const words: string[] = week.focus.family.words.map((word: any) => word.word);
        for (const word of words) {
            const index = afterLines.findIndex((line) => line.includes(`"caption": "${word}"`));
            expect(index, `the caption of ${word} is in the file`).toBeGreaterThan(-1);
            const captionLine = afterLines[index];
            const fileLine = afterLines[index + 1];
            expect(captionLine, `the caption of ${word} gains a comma`).toMatch(/,$/);
            expect(fileLine, `the file line of ${word} follows its caption`)
                .toContain(`"file": "l2/media/w01/family/${word}.jpg"`);
            expect(fileLine.match(/^\s*/)?.[0], `the file line of ${word} has the indent of its caption`)
                .toBe(captionLine.match(/^\s*/)?.[0]);
        }
        const beforeWeek = JSON.parse(before);
        const afterWeek = JSON.parse(after);
        expect(
            afterWeek.focus.family.words.map((word: any) => word.image.caption),
            'every caption value keeps its text',
        ).toEqual(beforeWeek.focus.family.words.map((word: any) => word.image.caption));
        const parsed = StorytimeWeekSchema.parse(afterWeek);
        for (const word of parsed.focus.family.words) {
            expect(word.image?.file, `the file of ${word.word}`).toBe(`l2/media/w01/family/${word.word}.jpg`);
        }
        const bookFiles = (text: string): string[] => text.split('\n')
            .filter((line) => /"file": "l2\/media\/w01\/books\/[^"]*\.jpg"/.test(line));
        expect(bookFiles(before), 'the book file lines: 18').toHaveLength(18);
        expect(bookFiles(after), 'the book file lines stay 18').toHaveLength(18);
        expect(bookFiles(after), 'the book file lines keep their values').toEqual(bookFiles(before));
        const familyEnd = (lines: string[]): number => {
            const start = lines.findIndex((line) => line.trim() === '"family": {');
            if (start < 0) return -1;
            const indent = lines[start].match(/^\s*/)?.[0] ?? '';
            for (let index = start + 1; index < lines.length; index += 1) {
                if (lines[index] === `${indent}},`) return index;
            }
            return -1;
        };
        const beforeEnd = familyEnd(beforeLines);
        const afterEnd = familyEnd(afterLines);
        expect(beforeEnd, 'the family block of the first text ends').toBeGreaterThan(-1);
        expect(afterEnd, 'the family block of the second text ends').toBeGreaterThan(-1);
        const beforeTail = beforeLines.slice(beforeEnd + 1);
        const afterTail = afterLines.slice(afterEnd + 1);
        expect(beforeTail.length, 'the tail of the week file is not empty').toBeGreaterThan(0);
        expect(afterTail, 'the lines after the family block are unchanged').toEqual(beforeTail);
    });

    it.each(H8_CASES)('R2-7 the script stops before any write: $name', async (testCase) => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        await testCase.fault(tree);
        const before = treeHashes(tree.folder);
        let thrown: Error | undefined;
        try {
            await setter(runOptions(tree));
        } catch (error) {
            thrown = error as Error;
        }
        expect(thrown, `the run of ${testCase.name} throws`).toBeInstanceOf(Error);
        const message = thrown?.message ?? '';
        expect(message, `the error of ${testCase.name} holds the rule token`).toMatch(testCase.token);
        for (const name of testCase.names) {
            expect(message, `the error of ${testCase.name} names ${name}`).toContain(name);
        }
        expect(treeHashes(tree.folder), `the run of ${testCase.name} writes no file`).toEqual(before);
    });

    it('R2-8 a line file next to a color file does not stop the run', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        const lineName = 'l2-w01-card-friend-line-v1.png';
        const hash = await writeSolidPng(path.join(tree.forgeFolder, lineName), [120, 120, 120]);
        appendManifest(path.join(tree.forgeFolder, 'MANIFEST.txt'), lineName, hash);
        const result = await setter(runOptions(tree));
        expect(result.mapped, 'mapped pictures: 6').toBe(6);
        const lines = provenanceLines(tree.contentRoot, 1);
        const friend = lines.find((line) => line[0] === 'l2/media/w01/family/friend.jpg');
        expect(friend, 'the provenance holds the line of friend').toBeDefined();
        expect(friend?.[2], 'the line of friend names the color file').toBe('l2-w01-card-friend-v1.png');
        expect(lines.filter((line) => line[2].includes('-line-')), 'the provenance holds no line file').toHaveLength(0);
    });

    it('R2-9 the partial run skips a Forge word with no file and keeps the card rule', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: false });
        let result: SetFamilyPicturesResult | undefined;
        const printed = await captureLog(async () => {
            result = await setter(runOptions(tree, { partial: true }));
        });
        expect(result?.mapped, 'mapped pictures: 5').toBe(5);
        expect(result?.skipped.some((entry) => entry.includes('friend')), 'the skipped list names friend')
            .toBe(true);
        if (printed.trim().length > 0) {
            expect(printed, 'the run prints the skip line').toContain('skip friend: no Forge file');
        }
        const folder = path.join(tree.contentRoot, 'l2/media/w01/family');
        expect(jpegFiles(folder), 'the run writes five JPEGs').toHaveLength(5);
        expect(provenanceLines(tree.contentRoot, 1), 'provenance lines: 5').toHaveLength(5);
        const week = JSON.parse(fs.readFileSync(tree.weekFile, 'utf8'));
        const files = week.focus.family.words.map((word: any) => word.image.file).filter(Boolean);
        expect(files, 'the week file holds five file lines').toHaveLength(5);

        const strict = await tempTree(1, { forge: false });
        const beforeStrict = treeHashes(strict.folder);
        await expect(setter(runOptions(strict))).rejects.toThrow();
        expect(treeHashes(strict.folder), 'the run without the partial flag writes no file').toEqual(beforeStrict);

        const broken = await tempTree(1, { forge: false });
        removeManifestLine(path.join(broken.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE);
        const beforeBroken = treeHashes(broken.folder);
        await expect(setter(runOptions(broken, { partial: true }))).rejects.toThrow();
        expect(treeHashes(broken.folder), 'the partial flag does not skip a broken card file')
            .toEqual(beforeBroken);
    });

    it('R2-10 the provenance keeps the lines of the words that a run skips', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: false });
        await setter(runOptions(tree, { partial: true }));
        const earlyLines = provenanceLines(tree.contentRoot, 1);
        expect(earlyLines, 'the first run holds five lines').toHaveLength(5);
        const earlyFiles = jpegFiles(path.join(tree.contentRoot, 'l2/media/w01/family'));
        const earlyHashes = Object.fromEntries(earlyFiles.map((file) => [file, fileHash(file)]));

        const friendName = 'l2-w01-card-friend-v1.png';
        const hash = await writeSolidPng(path.join(tree.forgeFolder, friendName), [60, 140, 200]);
        appendManifest(path.join(tree.forgeFolder, 'MANIFEST.txt'), friendName, hash);
        const result = await setter(runOptions(tree));
        expect(result.mapped, 'mapped pictures: 6').toBe(6);
        const lines = provenanceLines(tree.contentRoot, 1);
        expect(lines, 'the second run holds six lines').toHaveLength(6);
        for (const line of earlyLines) {
            expect(lines, `the line ${line[0]} stays`).toContainEqual(line);
        }
        for (const file of earlyFiles) {
            expect(fileHash(file), `the file ${file} keeps its bytes`).toBe(earlyHashes[file]);
        }

        const before = treeHashes(tree.contentRoot);
        const later = await setter(runOptions(tree, { partial: true, forge: false }));
        expect(later.skipped.some((entry) => entry.includes('friend')), 'the later run skips friend').toBe(true);
        expect(provenanceLines(tree.contentRoot, 1), 'the later run keeps six lines').toHaveLength(6);
        expect(jpegFiles(path.join(tree.contentRoot, 'l2/media/w01/family')), 'the later run keeps six files')
            .toHaveLength(6);
        expect(treeHashes(tree.contentRoot), 'the later run changes no byte').toEqual(before);
    });

    it('R2-11 the check mode prints one line per word and writes nothing', async () => {
        const script = await setFamilyPictures();
        const tree = await tempTree(1, { forge: true });
        const weekFile = path.join(STORYTIME_ROOT, 'l2/w01.json');
        const before = fileHash(weekFile);
        let code = 0;
        const printed = await captureLog(async () => {
            code = await script.main([
                '--level', '2', '--week', '1',
                '--cards', tree.cardsFolder,
                '--forge', tree.forgeFolder,
                '--check',
            ]);
        });
        expect(code, 'the check run of a complete week exits 0').toBe(0);
        const lines = printed.split('\n').filter((line) => line.trim().length > 0);
        expect(lines, 'the check run prints six lines').toHaveLength(6);
        const words = ['hello', 'goodbye', 'boy', 'girl', 'friend', 'teacher'];
        for (const word of words) {
            const line = lines.find((entry) => entry.split('\t')[0] === word);
            expect(line, `the check run prints a line for ${word}`).toBeDefined();
            const fields = (line ?? '').split('\t');
            expect(fields.length, `the line of ${word} holds four fields`).toBe(4);
            expect(fields[1], `the kind of ${word}`).toMatch(/^(card|forge|patch|dots)$/);
            expect(fields[2], `the source name of ${word}`).toMatch(/\.png$/);
            expect(fields[3], `the state of ${word}`).toBe('ok');
        }
        expect(fileHash(weekFile), 'the check run writes no week file').toBe(before);

        const broken = await tempTree(1, { forge: true });
        setManifestHash(path.join(broken.cardsFolder, 'MANIFEST.txt'), LAST_CARD_FILE, '0'.repeat(64));
        const beforeBroken = fileHash(weekFile);
        let brokenCode = 0;
        const brokenPrinted = await captureLog(async () => {
            brokenCode = await script.main([
                '--level', '2', '--week', '1',
                '--cards', broken.cardsFolder,
                '--forge', broken.forgeFolder,
                '--check',
            ]);
        });
        expect(brokenCode, 'the check run of a broken source exits 1').toBe(1);
        expect(brokenPrinted, 'the failed line holds the rule token').toMatch(/SHA-256 differs from MANIFEST/i);
        expect(fileHash(weekFile), 'the failed check run writes no week file').toBe(beforeBroken);

        for (const partial of [false, true]) {
            const missing = await tempTree(1, { forge: false });
            const beforeMissing = fileHash(weekFile);
            let missingCode = 0;
            const missingPrinted = await captureLog(async () => {
                const argv = [
                    '--level', '2', '--week', '1',
                    '--cards', missing.cardsFolder,
                    '--check',
                ];
                if (partial) argv.push('--partial');
                missingCode = await script.main(argv);
            });
            expect(missingCode, `the check run without the Forge file exits 1 (partial: ${partial})`).toBe(1);
            const failed = missingPrinted.split('\n').filter((line) => line.trim().length > 0)
                .find((line) => line.split('\t')[0] === 'friend');
            expect(failed, `the failed line of friend exists (partial: ${partial})`).toBeDefined();
            expect(failed ?? '', `the failed line of friend holds the rule token (partial: ${partial})`)
                .toMatch(/no color file/i);
            expect(fileHash(weekFile), 'the check run writes no week file').toBe(beforeMissing);
        }
    });

    it('R2-12 the script changes a file line with another value and keeps a file line with the same value', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        await setter(runOptions(tree));
        const first = fs.readFileSync(tree.weekFile, 'utf8');
        const changed = first.replace(
            '"file": "l2/media/w01/family/hello.jpg"',
            '"file": "l2/media/w01/family/other.jpg"',
        );
        expect(changed, 'the copy holds another value').not.toBe(first);
        fs.writeFileSync(tree.weekFile, changed);
        await setter(runOptions(tree));
        const second = fs.readFileSync(tree.weekFile, 'utf8');
        const diff = lineDiff(changed.split('\n'), second.split('\n'));
        expect(diff.removed, 'one line is removed').toHaveLength(1);
        expect(diff.added, 'one line is added').toHaveLength(1);
        expect(diff.added[0], 'the line holds the right value').toContain('"file": "l2/media/w01/family/hello.jpg"');
        const before = fs.statSync(tree.weekFile);
        await setter(runOptions(tree));
        const after = fs.statSync(tree.weekFile);
        expect(fs.readFileSync(tree.weekFile, 'utf8'), 'the week file keeps its bytes').toBe(second);
        expect(after.mtimeMs, 'the week file is not rewritten').toBe(before.mtimeMs);
    });

    it('R2-13 a second run changes no byte', async () => {
        const setter = await familyPictureSetter();
        const tree = await tempTree(1, { forge: true });
        await setter(runOptions(tree));
        const before = treeHashes(tree.contentRoot);
        const result = await setter(runOptions(tree));
        expect(result.mapped, 'mapped pictures: 6').toBe(6);
        expect(treeHashes(tree.contentRoot), 'the second run changes no byte').toEqual(before);
    });

    it('R2-14 the script refuses a week with nothing to map', async () => {
        const setter = await familyPictureSetter();
        const script = await setFamilyPictures();
        const tree = await tempTree(8, { forge: false });
        const before = treeHashes(tree.folder);
        let thrown: Error | undefined;
        try {
            await setter(runOptions(tree));
        } catch (error) {
            thrown = error as Error;
        }
        expect(thrown, 'the run of week 8 throws').toBeInstanceOf(Error);
        expect(thrown?.message ?? '', 'the error names the empty plan').toMatch(/^family picture: nothing to map/);
        expect(treeHashes(tree.folder), 'the run of week 8 writes no file').toEqual(before);
        const weekFile = path.join(STORYTIME_ROOT, 'l2/w08.json');
        const weekHash = fileHash(weekFile);
        const code = await script.main(['--level', '2', '--week', '8', '--cards', tree.cardsFolder]);
        expect(code, 'the command of week 8 exits 1').toBe(1);
        expect(fileHash(weekFile), 'the command of week 8 writes no week file').toBe(weekHash);
    });

    it('R2-15 the live run of the color patches of week 3 writes seven pictures', async () => {
        const setter = await familyPictureSetter();
        const mod = await familyPictures();
        const tree = await tempTree(3, { forge: false });
        const result = await setter({
            weekFile: tree.weekFile,
            contentRoot: tree.contentRoot,
            cardsFolder: tree.cardsFolder,
            cardRowsFile: tree.cardRowsFile,
        });
        expect(result.mapped, 'mapped pictures: 7').toBe(7);
        const folder = path.join(tree.contentRoot, 'l2/media/w03/family');
        const files = jpegFiles(folder);
        expect(files, 'the run writes seven JPEGs').toHaveLength(7);
        for (const file of files) {
            const metadata = await sharp(file).metadata();
            expect(metadata.format, `the format of ${file}`).toBe('jpeg');
            expect(metadata.isProgressive, `the file ${file} is progressive`).toBe(true);
            expect(metadata.space, `the colour space of ${file}`).toBe('srgb');
            expect(metadata.width, `the width of ${file}`).toBe(JPEG_SIZE);
            expect(metadata.height, `the height of ${file}`).toBe(JPEG_SIZE);
            expect(fs.statSync(file).size, `the byte length of ${file}`).toBeLessThanOrEqual(MAX_JPEG_BYTES);
        }
        const lines = provenanceLines(tree.contentRoot, 3);
        expect(lines, 'provenance lines: 7').toHaveLength(7);
        for (const line of lines) {
            const word = path.basename(line[0], '.jpg');
            expect(line[2], `the source name of ${word}`).toBe(`card-kit-patch-${word}-${PATCH_HEX[word].slice(1)}`);
            const page = mod.familyCardPageHtml({ kind: 'patch', word, hex: PATCH_HEX[word] });
            expect(line[3], `the source hash of ${word}`).toBe(sha256(page));
        }
        const before = treeHashes(tree.contentRoot);
        await setter({
            weekFile: tree.weekFile,
            contentRoot: tree.contentRoot,
            cardsFolder: tree.cardsFolder,
            cardRowsFile: tree.cardRowsFile,
        });
        expect(treeHashes(tree.contentRoot), 'the second run changes no byte').toEqual(before);
    }, 240_000);

    it('R2-16 the usage errors of the script return the exit code 2', async () => {
        const script = await setFamilyPictures();
        expect(await script.main(['--help']), 'the help exits 0').toBe(0);
        expect(await script.main(['--level', '2']), 'a missing week is a usage error').toBe(2);
        expect(await script.main(['--level', '2', '--week', '0']), 'the week 0 is a usage error').toBe(2);
        expect(await script.main(['--level', '2', '--week', '1']), 'a missing cards folder is a usage error').toBe(2);
    });
});

describe('the family picture check (Phase 10, Red 2)', () => {
    it('R2-17 the check gives pass, warn, and fail', async () => {
        const mod = await checkWeeks();
        expect(mod.checkFamilyPictures, 'the check script exports the family check').toBeTypeOf('function');
        const check = mod.checkFamilyPictures as (week: any, contentRoot?: string) => CheckRow | undefined;
        const contentRoot = tempFolder('storytime-family-check-');
        const week = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/w02.json'), 'utf8'));
        const fileOf = (word: string): string => `l2/media/w02/family/${word}.jpg`;
        for (const word of week.focus.family.words) {
            word.image.file = fileOf(word.word);
            const file = path.join(contentRoot, fileOf(word.word));
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, 'x');
        }
        const pass = check(week, contentRoot);
        expect(pass?.id, 'the id of the check').toBe('family-pictures');
        expect(pass?.label, 'the label of the check').toBe(CHECK_LABEL);
        expect(pass?.status, 'the status of a complete week').toBe('pass');
        expect(pass?.detail, 'a pass has no detail').toBeUndefined();

        fs.rmSync(path.join(contentRoot, fileOf('one')));
        const fail = check(week, contentRoot);
        expect(fail?.status, 'the status of a missing file').toBe('fail');
        expect(fail?.detail, 'the detail of a missing file').toBe(`missing: ${fileOf('one')}`);

        fs.writeFileSync(path.join(contentRoot, fileOf('one')), 'x');
        delete week.focus.family.words[2].image.file;
        const warn = check(week, contentRoot);
        expect(warn?.status, 'the status of a word with no file').toBe('warn');
        expect(warn?.detail, 'the detail of a word with no file').toBe('no file: three');

        week.focus.family.words[2].image.file = '';
        const empty = check(week, contentRoot);
        expect(empty?.status, 'the status of a word with an empty file').toBe('warn');
        expect(empty?.detail, 'the detail of a word with an empty file').toBe('no file: three');

        fs.rmSync(path.join(contentRoot, fileOf('two')));
        const both = check(week, contentRoot);
        expect(both?.status, 'the status of a missing file and of a word with no file').toBe('fail');
        expect(both?.detail, 'the detail of a missing file and of a word with no file')
            .toBe(`missing: ${fileOf('two')}`);

        const week8 = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/w08.json'), 'utf8'));
        expect(check(week8, contentRoot), 'a week with no family image has no row').toBeUndefined();
    });
});

describe('the guards of the family picture tests (Phase 10, Red 2)', () => {
    it('R2-18 the tests write no shipped file and name no track path', () => {
        const hashes: Record<string, string> = {};
        for (let week = 1; week <= 7; week += 1) {
            const name = `w${weekDigits(week)}.json`;
            hashes[name] = fileHash(path.join(STORYTIME_ROOT, 'l2', name));
        }
        expect(hashes, 'the seven shipped week files keep their hash').toEqual(SHIPPED_WEEK_HASHES);
        const repository = path.resolve(STORYTIME_ROOT, '..', '..');
        expect(CARD_FOLDER.startsWith(repository), 'the card folder is outside the repository').toBe(false);
        expect(FORGE_FOLDER.startsWith(repository), 'the Forge folder is outside the repository').toBe(false);
        const source = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
        expect(source.includes(TRACK_PATH_NEEDLE), 'the file names no track path').toBe(false);
        expect(
            source.match(/\b(it|test|describe)\.(skip|todo|only)\b/g),
            'the file holds no skipped and no focused case',
        ).toBeNull();
    });
});

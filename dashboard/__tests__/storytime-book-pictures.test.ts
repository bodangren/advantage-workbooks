import fs from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { checkBookPictures } from '../scripts/storytime/check-weeks';
import { main, setBookPictures } from '../scripts/storytime/set-book-pictures';

const WEEK_FILE = path.join(STORYTIME_ROOT, 'l2/w01.json');
const PICTURE_FOLDER = path.join(STORYTIME_ROOT, 'l2/print/pictures');
const OUTPUT_FOLDER = path.join(STORYTIME_ROOT, 'l2/media/w01/books');
const ROWS_FILE = path.join(STORYTIME_ROOT, 'l2/print/pictures.json');
const WORDS = '"Both ok" (2026-11-02 07:00 ICT); "Looks good" (2026-11-02 14:28 ICT); "Yes" (2026-11-03 11:54 ICT); "The book seems fine." (2026-11-05 ICT)';
const scratch: string[] = [];

function temp(): string {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-book-pictures-'));
    scratch.push(folder);
    return folder;
}

function hash(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * A temporary copy of a week file, of its output folders, and of the picture list. The print
 * pictures stay read only, so a run on the copy writes nothing into `content/storytime/`.
 * @param week The week number.
 * @returns The paths of the copy.
 */
function tempWeek(week: number): { weekFile: string; contentRoot: string; rowsFile: string } {
    const folder = temp();
    const contentRoot = path.join(folder, 'content');
    const name = `w${String(week).padStart(2, '0')}.json`;
    const weekFile = path.join(contentRoot, `l2/${name}`);
    fs.mkdirSync(path.dirname(weekFile), { recursive: true });
    fs.copyFileSync(path.join(STORYTIME_ROOT, `l2/${name}`), weekFile);
    const rowsFile = path.join(folder, 'pictures.json');
    fs.copyFileSync(ROWS_FILE, rowsFile);
    return { weekFile, contentRoot, rowsFile };
}

/**
 * The provenance lines of a run, one array of fields per line.
 * @param contentRoot The content root of the run.
 * @param week The week number.
 * @returns The lines of the provenance file.
 */
function provenanceLines(contentRoot: string, week: number): string[][] {
    const file = path.join(contentRoot, `l2/media/w${String(week).padStart(2, '0')}/books/pictures.sha256`);
    return fs.readFileSync(file, 'utf8').trim().split('\n').map((line) => line.split('\t'));
}

/**
 * The JPEG files of a folder and of its subfolders, in path order.
 * @param folder The folder to read.
 * @returns The paths of the JPEG files.
 */
function jpegFiles(folder: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) out.push(...jpegFiles(full));
        else if (entry.name.endsWith('.jpg')) out.push(full);
    }
    return out.sort();
}

afterAll(() => scratch.forEach((folder) => fs.rmSync(folder, { recursive: true, force: true })));

describe('Storytime app book pictures', () => {
    // The case reads the 18 JPEGs of week 1 and their hashes; it took 3.0 to 3.5 s in 4 runs and timed out at the 5 s default once.
    it('sets the 18 app pictures with valid JPEGs and complete provenance', async () => {
        const week = JSON.parse(fs.readFileSync(WEEK_FILE, 'utf8'));
        const pictures = week.books.flatMap((book: any) => [book.cover, ...book.pages.map((page: any) => page.image)]);
        expect(pictures).toHaveLength(18);
        for (const image of pictures) {
            expect(image.file).toMatch(/^l2\/media\/w01\/books\/[a-z0-9-]+\/(cover|p0[1-8])\.jpg$/);
            const file = path.join(STORYTIME_ROOT, image.file);
            expect(fs.existsSync(file)).toBe(true);
            const info = await sharp(file).metadata();
            expect(info.format).toBe('jpeg');
            expect(Math.max(info.width!, info.height!)).toBe(1600);
            expect(fs.statSync(file).size).toBeLessThanOrEqual(400 * 1024);
        }

        const provenance = fs.readFileSync(path.join(OUTPUT_FOLDER, 'pictures.sha256'), 'utf8').trim().split('\n');
        expect(provenance).toHaveLength(18);
        expect(provenance.map((line) => line.split('\t')[0])).toEqual([...provenance.map((line) => line.split('\t')[0])].sort());
        for (const line of provenance) {
            const [outputPath, outputHash, sourceName, sourceHash, quality, sharpVersion] = line.split('\t');
            expect(hash(path.join(STORYTIME_ROOT, outputPath))).toBe(outputHash);
            expect(sourceName).toMatch(/-v\d+\.png$/);
            expect(hash(path.join(PICTURE_FOLDER, sourceName))).toBe(sourceHash);
            expect(Number(quality)).toBeGreaterThanOrEqual(75);
            expect(Number(quality)).toBeLessThanOrEqual(82);
            expect(sharp.versions.sharp).toBe('0.35.5');
            expect(sharpVersion).toBe(sharp.versions.sharp);
        }

        expect(pictures.map((image: any) => image.caption)).toEqual(['Hello!', ...Array(8).fill(''), 'Nan Can Nod', ...Array(8).fill('')]);
        expect(week.approval.images).toMatchObject({ status: 'approved', date: '2026-11-05', words: WORDS });
        expect(week.approval.audio).toMatchObject({ status: 'approved', date: '2026-11-04' });
        expect(week.approval.song).toMatchObject({ status: 'approved', date: '2026-11-04' });
        expect(week.meta.status).toBe('published');
        const check = checkBookPictures(week, STORYTIME_ROOT);
        expect(check).toMatchObject({ id: 'book-pictures', status: 'pass' });
    }, 20000);

    it('fails the picture check when a named file is missing', () => {
        const folder = temp();
        const week = JSON.parse(fs.readFileSync(WEEK_FILE, 'utf8'));
        const first = week.books[0].cover;
        first.file = 'l2/media/w01/books/1-hello/cover.jpg';
        const check = checkBookPictures(week, folder);
        expect(check).toMatchObject({ id: 'book-pictures', status: 'fail' });
        expect(check?.detail).toContain(first.file);
    });

    it.each(['zero matching rows', 'two matching rows', 'resolver error'])('rejects a %s before it writes files', async (fault) => {
        const folder = temp();
        const weekFile = path.join(folder, 'w01.json');
        const contentRoot = path.join(folder, 'content');
        const pictureFolder = path.join(contentRoot, 'l2/print/pictures');
        const rowsFile = path.join(contentRoot, 'l2/print/pictures.json');
        fs.mkdirSync(pictureFolder, { recursive: true });
        fs.mkdirSync(path.dirname(rowsFile), { recursive: true });
        fs.copyFileSync(WEEK_FILE, weekFile);
        fs.copyFileSync(path.join(PICTURE_FOLDER, 'manifest.json'), path.join(pictureFolder, 'manifest.json'));
        const rows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/print/pictures.json'), 'utf8'));
        if (fault === 'zero matching rows') fs.writeFileSync(rowsFile, '[]');
        else if (fault === 'two matching rows') {
            const target = rows.find((row: any) => row.week === 1 && row.use === 'cover' && row.text === 'Hello!');
            fs.writeFileSync(rowsFile, JSON.stringify([...rows, target]));
        } else {
            fs.writeFileSync(rowsFile, JSON.stringify(rows));
            fs.writeFileSync(path.join(pictureFolder, 'manifest.json'), '{ invalid json');
        }
        await expect(setBookPictures({ weekFile, pictureFolder, contentRoot, rowsFile })).rejects.toThrow();
        expect(fs.existsSync(path.join(contentRoot, 'l2/media/w01/books'))).toBe(false);
    });

    it('runs the week command successfully on the shipped w01', async () => {
        expect(await main(['--level', '2', '--week', '1'])).toBe(0);
    }, 20000);

    it('gives the w02 pages with a repeated text the base row and the second row (E7 case a)', async () => {
        const { weekFile, contentRoot, rowsFile } = tempWeek(2);
        const week = JSON.parse(fs.readFileSync(weekFile, 'utf8'));
        const decodable = week.books.find((book: any) => book.kind === 'decodable');
        const stem = path.basename(decodable.audio.file, '.mp3');
        expect(stem, 'The w02 decodable book stem comes from its audio file.').toBe('2-can-i');

        expect(await setBookPictures({ weekFile, pictureFolder: PICTURE_FOLDER, contentRoot, rowsFile })).toBe(18);

        const booksFolder = path.join(contentRoot, 'l2/media/w02/books');
        expect(fs.existsSync(booksFolder), 'The run writes the JPEGs.').toBe(true);
        expect(jpegFiles(booksFolder)).toHaveLength(18);
        const lines = provenanceLines(contentRoot, 2);
        expect(lines).toHaveLength(18);
        const sourceOf = (name: string) => lines.find((line) => line[0] === `l2/media/w02/books/${stem}/${name}`)?.[2] ?? '';
        expect(sourceOf('p01.jpg'), 'Page 1 takes the base row of "Nan can."').toMatch(/^l2-w02-story-page-nan-can-v/);
        expect(sourceOf('p02.jpg'), 'Page 2 takes the base row of "Can I?"').toMatch(/^l2-w02-story-page-can-i-v/);
        expect(sourceOf('p03.jpg'), 'Page 3 takes the base row of "I can!"').toMatch(/^l2-w02-story-page-i-can-v/);
        expect(sourceOf('p04.jpg'), 'Page 4 takes the second row of "Nan can."').toMatch(/^l2-w02-story-page-nan-can-b-/);
        expect(sourceOf('p05.jpg'), 'Page 5 takes the second row of "Can I?"').toMatch(/^l2-w02-story-page-can-i-b-/);
        expect(sourceOf('p06.jpg'), 'Page 6 takes the second row of "I can!"').toMatch(/^l2-w02-story-page-i-can-b-/);

        const updated = JSON.parse(fs.readFileSync(weekFile, 'utf8'));
        const images = updated.books.flatMap((book: any) => [book.cover, ...book.pages.map((page: any) => page.image)]);
        expect(images).toHaveLength(18);
        for (const image of images) {
            expect(image.file).toMatch(/^l2\/media\/w02\/books\/[a-z0-9-]+\/(cover|p0[1-8])\.jpg$/);
            expect(fs.existsSync(path.join(contentRoot, image.file)), `The file ${image.file} exists.`).toBe(true);
        }
    }, 180000);

    it('gives the w06 pages with a repeated text the base row and the second row (E7 case b)', async () => {
        const { weekFile, contentRoot, rowsFile } = tempWeek(6);
        const week = JSON.parse(fs.readFileSync(weekFile, 'utf8'));
        const decodable = week.books.find((book: any) => book.kind === 'decodable');
        const stem = path.basename(decodable.audio.file, '.mp3');
        expect(stem, 'The w06 decodable book stem comes from its audio file.').toBe('2-tap-tap');

        expect(await setBookPictures({ weekFile, pictureFolder: PICTURE_FOLDER, contentRoot, rowsFile })).toBe(18);

        const booksFolder = path.join(contentRoot, 'l2/media/w06/books');
        expect(fs.existsSync(booksFolder), 'The run writes the JPEGs.').toBe(true);
        expect(jpegFiles(booksFolder)).toHaveLength(18);
        const lines = provenanceLines(contentRoot, 6);
        expect(lines).toHaveLength(18);
        const sourceOf = (name: string) => lines.find((line) => line[0] === `l2/media/w06/books/${stem}/${name}`)?.[2] ?? '';
        expect(sourceOf('p03.jpg'), 'Page 3 takes the base row of "Tap, tap, tap!"').toMatch(/^l2-w06-story-page-tap-tap-tap-v/);
        expect(sourceOf('p06.jpg'), 'Page 6 takes the second row of "Tap, tap, tap!"').toMatch(/^l2-w06-story-page-tap-tap-tap-b-/);
    }, 180000);

    it('stops with a picture match error when a row of a repeated text is missing (E7 case c)', async () => {
        const { weekFile, contentRoot, rowsFile } = tempWeek(2);
        const rows = JSON.parse(fs.readFileSync(rowsFile, 'utf8')).filter((row: any) => row.id !== 'l2-w02-story-page-nan-can-b');
        fs.writeFileSync(rowsFile, JSON.stringify(rows));
        const before = fs.readFileSync(weekFile);

        // The error names the group of the removed row, so the case fails before the count rule of E9.
        await expect(setBookPictures({ weekFile, pictureFolder: PICTURE_FOLDER, contentRoot, rowsFile })).rejects.toThrow(/^picture match:.*"Nan can\."/);

        expect(fs.existsSync(path.join(contentRoot, 'l2/media/w02/books')), 'The run writes no JPEG.').toBe(false);
        expect(fs.existsSync(path.join(contentRoot, 'l2/media/w02/books/pictures.sha256')), 'The run writes no provenance file.').toBe(false);
        expect(fs.readFileSync(weekFile).equals(before), 'The run changes no byte of the week file.').toBe(true);
    }, 180000);
});

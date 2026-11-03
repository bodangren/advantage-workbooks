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
const WORDS = '"Both ok" (2026-11-02 07:00 ICT); "Looks good" (2026-11-02 14:28 ICT); "Yes" (2026-11-03 11:54 ICT)';
const scratch: string[] = [];

function temp(): string {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-book-pictures-'));
    scratch.push(folder);
    return folder;
}

function hash(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

afterAll(() => scratch.forEach((folder) => fs.rmSync(folder, { recursive: true, force: true })));

describe('Storytime app book pictures', () => {
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
            expect(sharpVersion).toBe(sharp.versions.sharp);
        }

        expect(pictures.map((image: any) => image.caption)).toEqual(['Hello!', ...Array(8).fill(''), 'Nan Can Nod', ...Array(8).fill('')]);
        expect(week.approval.images).toMatchObject({ status: 'approved', date: '2026-11-03', words: WORDS });
        expect(week.approval.audio.status).toBe('draft');
        expect(week.approval.song.status).toBe('draft');
        expect(week.meta.status).toBe('published');
        const check = checkBookPictures(week, STORYTIME_ROOT);
        expect(check).toMatchObject({ id: 'book-pictures', status: 'pass' });
    });

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
});

// @vitest-environment jsdom
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeReaders } from '../lib/storytime/print/readers';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

type CoverData = {
    title: string;
    band: string;
    frontArt: string;
    backArt: string;
};

type TeacherCoverApi = {
    checkTeacherBookCoverData: (data: CoverData) => string[];
    checkTeacherBookCoverCopy: (pageText: string) => string[];
    checkStorytimeReaderCoverCopy: (pageText: string) => string[];
    composeTeacherBookCoverSide: (
        art: Buffer,
        layers: Buffer[],
        trim: { widthMm: number; heightMm: number },
    ) => Promise<Buffer>;
    TEACHER_BOOK_COVER_TRIM: { widthMm: number; heightMm: number };
};

const modulePath = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard/lib/storytime/print/teacher-book-cover.ts');
const scratch: string[] = [];

function tempFolder(): string {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-print-covers-'));
    scratch.push(folder);
    return folder;
}

function shippedWeeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_, index) => {
        const file = storytimeWeekFile(STORYTIME_ROOT, 2, index + 1);
        return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
    });
}

async function teacherCover(): Promise<TeacherCoverApi> {
    expect(fs.existsSync(modulePath), 'Missing module: lib/storytime/print/teacher-book-cover.ts').toBe(true);
    return await import(modulePath) as TeacherCoverApi;
}

afterAll(() => scratch.forEach((folder) => fs.rmSync(folder, { recursive: true, force: true })));

describe('Storytime week 1 covers', () => {
    it('rejects an unknown teacher-book band in a copied cover data file', async () => {
        const api = await teacherCover();
        const source: CoverData = {
            title: 'Storytime Advantage, Level 2, Unit 1, Teacher Book',
            band: 'Sprout',
            frontArt: 'content/storytime/l2/media/w01/forge/cast/sprout-nan/front.png',
            backArt: 'content/storytime/l2/media/w01/forge/cast/sprout-sam/front.png',
        };
        const folder = tempFolder();
        const copy = path.join(folder, 'teacher-book-cover.json');
        fs.writeFileSync(copy, JSON.stringify(source));
        const valid = JSON.parse(fs.readFileSync(copy, 'utf8')) as CoverData;
        expect(api.checkTeacherBookCoverData(valid), 'The copied teacher-book cover data is valid.').toEqual([]);

        const mutated = { ...valid, band: 'Unknown band' };
        fs.writeFileSync(copy, JSON.stringify(mutated));
        const problems = api.checkTeacherBookCoverData(JSON.parse(fs.readFileSync(copy, 'utf8')) as CoverData);
        expect(problems, 'The copied cover rejects a band outside the supported band list.').not.toEqual([]);
    });

    it('applies the cover-track copy check to teacher cover text and catches the specified bypasses', async () => {
        const api = await teacherCover();
        const forbidden = ['CEFR', 'Pre-A1', 'Starters', 'Primary Advantage'];
        for (const word of forbidden) {
            const folder = tempFolder();
            const copy = path.join(folder, 'cover-copy.txt');
            fs.writeFileSync(copy, `Storytime Advantage ${word}`);
            const text = fs.readFileSync(copy, 'utf8');
            expect(api.checkTeacherBookCoverCopy(text), `The copied cover rejects ${word}.`).not.toEqual([]);
        }

        const missingSeriesFolder = tempFolder();
        const missingSeries = path.join(missingSeriesFolder, 'cover-copy.txt');
        fs.writeFileSync(missingSeries, 'Level 2, Unit 1, Teacher Book');
        expect(api.checkTeacherBookCoverCopy(fs.readFileSync(missingSeries, 'utf8')), 'A copied cover requires the series name.').not.toEqual([]);

        const lowerCase = path.join(tempFolder(), 'copy.txt');
        fs.writeFileSync(lowerCase, 'Storytime Advantage cefr');
        expect(api.checkTeacherBookCoverCopy(fs.readFileSync(lowerCase, 'utf8')), 'Lower-case cefr does not bypass the check.').not.toEqual([]);

        const nonBreakingHyphen = path.join(tempFolder(), 'copy.txt');
        fs.writeFileSync(nonBreakingHyphen, 'Storytime Advantage Pre‑A1');
        expect(api.checkTeacherBookCoverCopy(fs.readFileSync(nonBreakingHyphen, 'utf8')), 'U+2011 Pre‑A1 does not bypass the check.').not.toEqual([]);

        const nonBreakingSpace = path.join(tempFolder(), 'copy.txt');
        fs.writeFileSync(nonBreakingSpace, 'Storytime Advantage Primary\u00a0Advantage');
        expect(api.checkTeacherBookCoverCopy(fs.readFileSync(nonBreakingSpace, 'utf8')), 'U+00A0 is normalized by the cover-track check.').not.toEqual([]);
    });

    // changed 2026-11-11 (F5, PM look): page 1 is the quest reader cover, and the reader cover check forbids every band word; a copied cover with "SPROUT" fails.
    it('checks each shipped week 1 reader cover for no band word and catches a copied cover mutation', async () => {
        const api = await teacherCover();
        const [week] = shippedWeeks();
        const html = compileStorytimeReaders([week], {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
            output: 'workbook',
        }).html;
        const pages = Array.from(
            new DOMParser().parseFromString(html, 'text/html').querySelectorAll<HTMLElement>('.reader-page[data-page-number="1"]'),
            (entry) => entry.textContent ?? '',
        );
        expect(pages, 'The shipped week 1 file renders two reader cover pages.').toHaveLength(2);
        for (const page of pages) {
            expect(page, 'Each shipped reader cover shows the series name.').toContain('Storytime Advantage');
            expect(api.checkStorytimeReaderCoverCopy(page), 'Each shipped reader cover copy passes.').toEqual([]);
        }

        const folder = tempFolder();
        const copy = path.join(folder, 'reader-cover.html');
        fs.writeFileSync(copy, `${pages[0]}\nSPROUT`);
        expect(
            api.checkStorytimeReaderCoverCopy(fs.readFileSync(copy, 'utf8')),
            'The copied reader cover fails when it shows the band word.',
        ).not.toEqual([]);
    });

    it('composes each teacher-book side as an opaque 300 ppi image at the specified trim', async () => {
        const api = await teacherCover();
        expect(api.TEACHER_BOOK_COVER_TRIM, 'The teacher book uses the specified A4 trim.').toEqual({ widthMm: 210, heightMm: 297 });
        const trim = api.TEACHER_BOOK_COVER_TRIM;
        const width = Math.round((trim.widthMm / 25.4) * 300);
        const height = Math.round((trim.heightMm / 25.4) * 300);
        const folder = tempFolder();
        const alphaLayerPath = path.join(folder, 'translucent-layer.png');
        await sharp({ create: { width: 12, height: 12, channels: 4, background: { r: 68, g: 119, b: 170, alpha: 0.5 } } })
            .png()
            .toFile(alphaLayerPath);
        const art = fs.readFileSync(alphaLayerPath);
        const composed = await api.composeTeacherBookCoverSide(art, [], trim);
        const metadata = await sharp(composed).metadata();
        expect(metadata.channels, 'The composed side has no alpha channel.').toBe(3);
        expect(metadata.width, 'The composed side uses 300 ppi across the A4 trim.').toBe(width);
        expect(metadata.height, 'The composed side uses 300 ppi along the A4 trim.').toBe(height);
        expect(metadata.density, 'The composed side records 300 ppi.').toBe(300);
    });
});

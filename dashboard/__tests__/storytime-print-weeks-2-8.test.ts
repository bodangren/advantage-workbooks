// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { jobsFor, writePictureFolder } from './fixtures/storytime-picture-folder';

const dashboard = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentPath = path.join(dashboard, 'lib/storytime/print/student-book.ts');
const cliPath = path.join(dashboard, 'lib/storytime/print/student-book-cli.ts');
const readerPath = path.join(dashboard, 'lib/storytime/print/readers.ts');
const pendingWeek8 = [
    'l2-w08-check-row-moon', 'l2-w08-check-row-mango',
    'l2-w08-check-row-ostrich', 'l2-w08-check-row-drum',
];

function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

function temporaryRepo(): { root: string; pictures: string } {
    const root = fs.mkdtempSync('/tmp/opencode/storytime-p7-');
    const pictures = path.join(root, 'content/storytime/l2/print/pictures');
    fs.mkdirSync(pictures, { recursive: true });
    for (let week = 1; week <= 8; week++) {
        fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), path.join(root, `content/storytime/l2/w0${week}.json`));
    }
    return { root, pictures };
}

describe('Storytime student book, weeks 1 to 8', () => {
    it('R-P7-1 compiles every teaching week and week 8 review pages in order', async () => {
        const { compileStorytimeStudentBook } = await import(studentPath);
        const { html } = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        expect(doc.querySelectorAll('[data-page-kind="practice"]')).toHaveLength(7);
        expect(doc.querySelectorAll('[data-page-kind="writing"]')).toHaveLength(7);
        expect(doc.querySelectorAll('[data-page-kind="check"]')).toHaveLength(7);
        expect(doc.querySelectorAll('[data-page-kind="review"]')).toHaveLength(5);
        expect(doc.querySelectorAll('[data-page-kind="benchmark"]')).toHaveLength(1);
        expect(doc.querySelectorAll('[data-page-kind="reader"]')).toHaveLength(84);
        const pageNumbers = Array.from(doc.querySelectorAll('.student-page'), (page) => Number(page.getAttribute('data-page-number')));
        expect(pageNumbers).toEqual(pageNumbers.map((_n, index) => index + 1));
        expect(doc.querySelectorAll('[data-sticker]')).toHaveLength(8);
    });

    it('R-P7-2 renders all week 8 circle-picture rows, picture sorts, and seven empty letter boxes', async () => {
        const { compileStorytimeStudentBook } = await import(studentPath);
        const { html } = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const benchmark = doc.querySelector('[data-page-kind="benchmark"]')!;
        expect(benchmark.querySelectorAll('[data-part="check-row"]')).toHaveLength(8);
        expect(benchmark.querySelectorAll('[data-picture-id]')).toHaveLength(24);
        expect(benchmark.querySelectorAll('[data-part="check-write-letter"]')).toHaveLength(7);
        expect(benchmark.querySelectorAll('[data-answer], [data-correct], .answer, .correct')).toHaveLength(0);
        expect(doc.querySelectorAll('[data-page-kind="review"] [data-part="picture-sort"]')).toHaveLength(5);
    });

    it('R-P7-3 tests each week 2 to 7 reader plan and text across six A5 leaves', async () => {
        const { compileStorytimeReaders } = await import(readerPath);
        const teachingWeeks = weeks().slice(1, 7);
        const { html } = compileStorytimeReaders(teachingWeeks, {
            profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook',
        });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        for (const week of teachingWeeks) {
            const weekBooks = week.books;
            expect(weekBooks).toHaveLength(2);
            let weekLeaves = 0;
            for (const book of weekBooks) {
                const leaves = doc.querySelectorAll(`[data-reader-leaf][data-reader-title="${book.title}"]`);
                expect(leaves).toHaveLength(3);
                weekLeaves += leaves.length;
                const bookHtml = Array.from(doc.querySelectorAll(`[data-reader-leaf][data-reader-title="${book.title}"]`), (el) => el.textContent ?? '').join(' ');
                expect(bookHtml).toContain(book.title);
                for (const page of book.pages) expect(bookHtml).toContain(page.text);
                for (const word of book.backWords) expect(bookHtml).toContain(word);
            }
            expect(weekLeaves, `week ${week.meta.week} has six reader leaves`).toBe(6);
        }
        expect(doc.querySelectorAll('[data-part="fold-line"]')).toHaveLength(72);
        expect(doc.querySelectorAll('[data-part="perforation"]')).toHaveLength(72);
    });

    it('R-P7-4 parses the named pending picture ids and rejects an empty value', async () => {
        const { parseStorytimeStudentBookArgs } = await import(cliPath);
        const home = '/tmp/opencode/storytime-p7-home';
        const parsed = parseStorytimeStudentBookArgs([
            '--level', '2', '--weeks', '1,2,3,4,5,6,7,8', '--final',
            '--pending-pictures', pendingWeek8.join(','),
        ], home, 1);
        expect(parsed.pendingPictures).toEqual(pendingWeek8);
        expect(() => parseStorytimeStudentBookArgs([
            '--level', '2', '--weeks', '1', '--final', '--pending-pictures', '',
        ], home, 1)).toThrow(/pending/i);
    });

    it('R-P7-5 uses placeholders only for named pending rows and still rejects an unnamed missing picture', async () => {
        const saved = process.env.WORKBOOKS_ROOT;
        const { root, pictures } = temporaryRepo();
        process.env.WORKBOOKS_ROOT = root;
        vi.resetModules();
        try {
            const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
            const allWeeks = weeks();
            const rows = storytimePrintPictures(allWeeks);
            const missingId = pendingWeek8[0];
            writePictureFolder(pictures, jobsFor(rows.filter((row) => row.id !== missingId).map((row) => row.id)));
            const { compileStorytimeStudentBook } = await import(studentPath);
            const result = compileStorytimeStudentBook(allWeeks, {
                profile: STORYTIME_PRINT_PROFILE, mode: 'final', pendingPictures: [missingId],
            });
            const doc = new DOMParser().parseFromString(result.html, 'text/html');
            expect(doc.querySelector(`[data-picture-id="${missingId}"]`)?.textContent).toContain('PICTURE MISSING');
            expect(doc.querySelectorAll('[data-picture-id="l2-w08-check-row-mango"] img')).toHaveLength(1);
            expect(() => compileStorytimeStudentBook(allWeeks, {
                profile: STORYTIME_PRINT_PROFILE, mode: 'final',
            })).toThrow(/picture missing: .*l2-w08-check-row-moon/);
        } finally {
            if (saved === undefined) delete process.env.WORKBOOKS_ROOT;
            else process.env.WORKBOOKS_ROOT = saved;
            vi.resetModules();
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

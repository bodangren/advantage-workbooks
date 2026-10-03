import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium, type Browser } from '@playwright/test';
import { LessonPackageSchema } from '../../lib/lesson-package/schema';
import { buildWorkbookLesson } from '../../lib/lesson-package/build';
import { renderMultipleLessons } from '../../lib/template-renderer';
import { wrapSingleLessonDocument } from '../../lib/workbook-document-wrapper';
import { answerKeyEntry } from '../../lib/document-wrapper/sections/answer-key';
import { listLessons, readLesson, readProjectMetadata } from '../../lib/filesystem';
import { lessonPdfName, localPictures } from '../../lib/print/lesson-pdf';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import type { WorkbookLesson } from '../../lib/workbook-schema';

const USAGE = `Makes one A4 PDF for each lesson of the Primary books, for teachers and parents to print
(Daniel, 2026-10-03). The lesson pages come first; the lesson's answer key is the last page.

Usage: npx tsx scripts/print/make-lesson-pdfs.ts [<book>...] [--out <dir>] [--lesson <n>]

  <book>     origins-1 origins-2 origins-3.1 origins-3.2 quest-4 (default: all of them)
  --out      Output folder (default ~/Desktop/print-ready/lessons); one subfolder per book
  --lesson   Only this lesson number

A book with a dashboard project (primary/<project>) uses the project's lesson files, the same as
the compile page; Origins 1 has none and uses its lesson packages. Bank lessons are online only and
have no PDF. Bucket pictures are cached in ~/.cache/workbooks-print/images. Needs system Chrome and
poppler (pdfinfo, pdffonts, pdftotext).

Checks for each file: A4 pages, every font embedded, no Type 3 font, the answer key on the last page.
Exit code 1 when a check fails.`;

const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');
const BOOKS: Record<string, { project?: string; name?: string }> = {
    'origins-1': { name: 'Origins 1' },
    'origins-2': { project: 'origins-2-a0' },
    'origins-3.1': { project: 'origins-3.1-a0' },
    'origins-3.2': { project: 'origins-3.2-a0' },
    'quest-4': { project: 'quest-4-a1' },
};
/** A4 in points, and how far a page may be from it. */
const A4 = { width: 595.28, height: 841.89, slack: 2 };

interface BookLessons {
    name: string;
    level: string;
    lessons: { number: number; lesson: WorkbookLesson }[];
}

function run(cmd: string, args: string[]): string {
    const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) throw new Error(`${cmd}: ${r.error.message}`);
    if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${(r.stderr || r.stdout).trim().split('\n').slice(-3).join('\n')}`);
    return r.stdout;
}

/** The lessons of a book: from its dashboard project, or else from its lesson packages. */
async function bookLessons(book: string): Promise<BookLessons> {
    const { project, name } = BOOKS[book];
    if (project) {
        const meta = await readProjectMetadata(project);
        if (!meta) throw new Error(`${project}: no project.json`);
        const files = await listLessons(project);
        const lessons = await Promise.all(files.map(async (f, i) => ({ number: i + 1, lesson: await readLesson(project, f.id) })));
        return { name: `${meta.seriesName}${meta.levelNumber ? ` ${meta.levelNumber}` : ''}`, level: meta.cefrLevel ?? '', lessons };
    }
    const dir = path.join(CONTENT, book);
    const packages = fs.readdirSync(dir)
        .filter((f) => /^l\d+\.json$/.test(f))
        .map((f) => LessonPackageSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))))
        .sort((a, b) => a.meta.number - b.meta.number);
    const lessons = packages.map((p) => ({ number: p.meta.number, lesson: buildWorkbookLesson(p, { mediaBase: `file://${CONTENT}/` }) }));
    return { name: name ?? book, level: packages[0]?.meta.cefrLevel ?? '', lessons };
}

/** Downloads the bucket pictures that the cache does not have yet (three tries each). */
async function download(files: { url: string; file: string }[]): Promise<void> {
    for (const { url, file } of files) {
        if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        let last = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                fs.writeFileSync(`${file}.part`, Buffer.from(await res.arrayBuffer()));
                fs.renameSync(`${file}.part`, file);
                last = '';
                break;
            } catch (e) {
                last = e instanceof Error ? e.message : String(e);
            }
        }
        if (last) throw new Error(`picture download failed: ${url} (${last})`);
    }
}

/** Renders one HTML file with Paged.js in Chrome and prints it to PDF; returns the page count. */
async function renderPdf(browser: Browser, htmlFile: string, pdfFile: string, pagedSrc: string): Promise<number> {
    const page = await browser.newPage();
    try {
        page.setDefaultTimeout(300_000);
        await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 180_000 });
        await page.addScriptTag({ content: 'window.PagedConfig = { auto: false };' });
        await page.addScriptTag({ content: pagedSrc });
        await page.evaluate('(async () => { await document.fonts.ready; await window.PagedPolyfill.preview(); await document.fonts.ready; })()');
        const pages = (await page.evaluate('document.querySelectorAll(".pagedjs_page").length')) as number;
        // As in Chrome's print dialog: Paged.js lays out the pages, then the print CSS applies.
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: pdfFile, preferCSSPageSize: true, printBackground: true });
        return pages;
    } finally {
        await page.close();
    }
}

/** The failed checks of a lesson PDF (empty when it is good). */
function checkPdf(file: string): string[] {
    const problems: string[] = [];
    const info = parsePdfinfo(run('pdfinfo', ['-box', file]));
    if (Math.abs(info.width - A4.width) > A4.slack || Math.abs(info.height - A4.height) > A4.slack) problems.push(`page size ${info.width} x ${info.height} pt is not A4`);
    const fonts = parsePdffonts(run('pdffonts', [file]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    const last = run('pdftotext', ['-f', String(info.pages), '-l', String(info.pages), file, '-']);
    if (!/Answer Key/.test(last)) problems.push('the last page is not the answer key');
    return problems;
}

async function main(argv: string[]): Promise<number> {
    const books: string[] = [];
    let out = path.join(os.homedir(), 'Desktop', 'print-ready', 'lessons');
    let only: number | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--lesson') only = Number(argv[++i]);
        else if (BOOKS[a]) books.push(a);
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    const cache = path.join(os.homedir(), '.cache', 'workbooks-print', 'images');
    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-pdf-'));
    const browser = await chromium.launch({ channel: 'chrome' });
    let made = 0;
    let failed = 0;
    try {
        for (const book of books.length ? books : Object.keys(BOOKS)) {
            const { name, level, lessons } = await bookLessons(book);
            const dir = path.join(out, name.replace(/\s+/g, '-'));
            fs.mkdirSync(dir, { recursive: true });
            for (const { number, lesson } of lessons) {
                if (only !== undefined && number !== only) continue;
                const label = `${book} lesson ${number}`;
                try {
                    const lessonHtml = await renderMultipleLessons([lesson], { type: 'primary', seriesName: name, seriesLevel: level, firstLessonNumber: number });
                    const doc = wrapSingleLessonDocument(lessonHtml, answerKeyEntry(lesson, number), { seriesName: name, seriesLevel: level, seriesTagline: '', type: 'primary' });
                    const local = localPictures(doc.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, ''), cache, CONTENT);
                    await download(local.downloads);
                    const htmlFile = path.join(tmp, `${book}-${number}.html`);
                    fs.writeFileSync(htmlFile, local.html);
                    const pdfFile = path.join(dir, lessonPdfName(name, number, lesson.lesson_title));
                    const pages = await renderPdf(browser, htmlFile, pdfFile, pagedSrc);
                    const problems = checkPdf(pdfFile);
                    if (problems.length) {
                        failed++;
                        console.log(`FAIL  ${label}: ${problems.join('; ')}`);
                    } else {
                        made++;
                        console.log(`done  ${label}: ${path.relative(out, pdfFile)} (${pages} pages)`);
                    }
                } catch (e) {
                    failed++;
                    console.log(`FAIL  ${label}: ${e instanceof Error ? e.message : e}`);
                }
            }
        }
    } finally {
        await browser.close();
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    console.log(`${made} PDF(s) in ${out}${failed ? `, ${failed} failed` : ''}`);
    return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

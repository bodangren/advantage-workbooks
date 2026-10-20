import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from '@playwright/test';
import { listLessons, readLesson, readProjectMetadata } from '../../lib/filesystem';
import { CONTENT_ROOT } from '../../lib/lesson-package/files';
import { localPictures } from '../../lib/print/lesson-pdf';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import { downloadPictures, renderPagedPdf, run } from '../../lib/print/render';
import { compileTeacherManual } from '../../lib/teacher-manual/compiler';
import type { AppVariant } from '../../lib/teacher-manual/app-section';
import type { SupportedLanguage } from '../../lib/teacher-manual/i18n';
import type { WorkbookLesson } from '../../lib/workbook-schema';

const USAGE = `Makes the office-print PDF of a book's Teacher's Manual: A4, 18 mm margins, static print fonts,
laid out by Paged.js (from node_modules) in system Chrome, background graphics on
(track teacher_manual_app_20261020).

Usage: npx tsx scripts/print/make-teacher-manual-pdf.ts <project> [--lang th|en] [--signin live|new]
       [--reset live|new] [--out <file.pdf>]

  <project>   A dashboard project in primary/ (for example origins-3.1-a0)
  --lang      The manual language (default th)
  --signin    The teacher sign-in in the app section: live (English form words, the default) or
              new (Thai labels, after the fix a492b16c1 is live)
  --reset     The class-sheet part: live ("print 2 copies", the default) or new (the "New password"
              button for one student, after the fix d9c02df5b is live)
  --out       Output file (default ~/Desktop/print-ready/teacher-manual/
              Primary-Advantage-<Book>-Teachers-Manual-<LANG>.pdf)

Run it under the heavy-job lock: flock ~/Desktop/primary-parity-progress/heavy.lock npx tsx ...
Exit code 1 when a page is not A4, a font is not embedded, the PDF has a Type 3 font, or the app
section has a screen placeholder (a retake that is not done).`;

/** A4 in points, and how far a page may be from it. */
const A4 = { width: 595.28, height: 841.89, slack: 2 };

/**
 * The file name of a manual PDF.
 * @param bookName The book name with its number ("Origins 3.1").
 * @param lang The manual language.
 * @returns For example "Primary-Advantage-Origins-3.1-Teachers-Manual-TH.pdf".
 */
function manualPdfName(bookName: string, lang: SupportedLanguage): string {
    const words = bookName.replace(/['’]/g, '').replace(/[^A-Za-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
    return `Primary-Advantage-${words}-Teachers-Manual-${lang.toUpperCase()}.pdf`;
}

async function main(argv: string[]): Promise<number> {
    let project: string | undefined;
    let out: string | undefined;
    let lang: SupportedLanguage = 'th';
    const app: AppVariant = { signin: 'live', reset: 'live' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i] ?? '');
        else if (a === '--lang') {
            const v = argv[++i];
            if (v !== 'th' && v !== 'en') {
                console.error(`--lang must be th or en\n\n${USAGE}`);
                return 2;
            }
            lang = v;
        } else if (a === '--signin' || a === '--reset') {
            const v = argv[++i];
            if (v !== 'live' && v !== 'new') {
                console.error(`${a} must be live or new\n\n${USAGE}`);
                return 2;
            }
            app[a === '--signin' ? 'signin' : 'reset'] = v;
        } else if (!a.startsWith('-') && !project) project = a.replace(/^primary\//, '');
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (!project) {
        console.error(USAGE);
        return 2;
    }

    // The same lessons and names as the manual route (app/api/projects/[projectId]/teacher-manual/route.ts).
    const [files, metadata] = await Promise.all([listLessons(project), readProjectMetadata(project)]);
    if (files.length === 0) {
        console.error(`${project}: no lessons`);
        return 1;
    }
    const lessons: WorkbookLesson[] = [];
    for (const f of files) lessons.push((await readLesson(project, f.id)) as WorkbookLesson);
    const seriesName = metadata?.seriesName || 'Primary Advantage';
    const levelNumber = metadata?.levelNumber || '';
    const bookName = `${seriesName}${levelNumber ? ` ${levelNumber}` : ''}`;
    // The series and the level apart: the route passes "Origins 3.1" and "3.1", and the preface then
    // says "Origins 3.1 3.1".
    const result = compileTeacherManual(lessons, levelNumber ? seriesName : bookName, levelNumber, metadata?.cefrLevel || 'A1', metadata?.type || 'primary', lang, 'a4', app);

    out ??= path.join(os.homedir(), 'Desktop', 'print-ready', 'teacher-manual', manualPdfName(bookName, lang));
    const cache = path.join(os.homedir(), '.cache', 'workbooks-print', 'images');
    const local = localPictures(result.html.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, ''), cache, CONTENT_ROOT);
    await downloadPictures(local.downloads);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-manual-pdf-'));
    const htmlFile = path.join(tmp, `${project}-${lang}.html`);
    fs.writeFileSync(htmlFile, local.html);
    fs.mkdirSync(path.dirname(out), { recursive: true });

    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const browser = await chromium.launch({ channel: 'chrome' });
    let pages: number;
    try {
        pages = await renderPagedPdf(browser, htmlFile, out, pagedSrc);
    } finally {
        await browser.close();
        fs.rmSync(tmp, { recursive: true, force: true });
    }

    const problems: string[] = [];
    const info = parsePdfinfo(run('pdfinfo', [out]));
    // Every page, not only the first: "Page    N size: 595.28 x 841.89 pts (A4)".
    const sizes = [...run('pdfinfo', ['-f', '1', '-l', String(info.pages), out]).matchAll(/^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)/gm)];
    const notA4 = sizes.filter((m) => Math.abs(Number(m[2]) - A4.width) > A4.slack || Math.abs(Number(m[3]) - A4.height) > A4.slack);
    if (sizes.length !== info.pages) problems.push(`pdfinfo gave ${sizes.length} page sizes for ${info.pages} pages`);
    if (notA4.length) problems.push(`${notA4.length} pages are not A4 (first: page ${notA4[0][1]}, ${notA4[0][2]} x ${notA4[0][3]} pt)`);
    const fonts = parsePdffonts(run('pdffonts', [out]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    const placeholders = result.html.match(/class="tm-app-placeholder"/g)?.length ?? 0;
    if (placeholders) problems.push(`${placeholders} screen placeholders in the app section`);
    const families = [...new Set(fonts.map((f) => f.name.replace(/^[A-Z]{6}\+/, '')))].join(', ');
    console.log(`${problems.length ? 'FAIL' : 'done'}  ${project} (${lang}, sign-in ${app.signin}, reset ${app.reset}): ${out} (${result.lessonCount} lessons, ${pages} pages; fonts: ${families}${problems.length ? `; ${problems.join('; ')}` : ''})`);
    return problems.length ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

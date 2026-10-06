import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from '@playwright/test';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/projects/[projectId]/compile/route';
import { CONTENT_ROOT } from '../../lib/lesson-package/files';
import { localPictures } from '../../lib/print/lesson-pdf';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import { downloadPictures, renderPagedPdf, run } from '../../lib/print/render';

const USAGE = `Makes the Chrome PDF of a whole workbook: the same document as the compile page, laid out by
Paged.js in system Chrome and printed as Chrome's "Save as PDF" does (background graphics on).

Usage: npx tsx scripts/print/make-book-pdf.ts <project> [--out <file.pdf>] [<section>=true|false ...]

  <project>   A dashboard project in primary/ (for example quest-4-a1)
  --out       Output file (default ~/Desktop/print-ready/chrome/<project>.pdf)
  <section>   A compile-page toggle, for example includeFlashcards=true. Without one, the compile
              page's defaults apply (progress tracker, certificate, and spelling practice on).

For the printer, convert the output with scripts/print/make-pdfx.ts. Bucket pictures are cached as
JPEG in ~/.cache/workbooks-print/images. Exit code 1 when the page is not 210 x 285 mm (the book page)
or the PDF has a Type 3 font
or a font that is not embedded.`;

/** The book page in points: the printer's 210 x 285 mm (`getPrintStyles`), and how far a page may be from it. */
const PAGE = { width: 595.28, height: 807.87, slack: 2 };

async function main(argv: string[]): Promise<number> {
    let project: string | undefined;
    let out: string | undefined;
    const query = new URLSearchParams();
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i]);
        else if (/^include\w+=(true|false)$/.test(a)) query.set(...(a.split('=') as [string, string]));
        else if (!a.startsWith('-') && !project) project = a;
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (!project) {
        console.error(USAGE);
        return 2;
    }
    out ??= path.join(os.homedir(), 'Desktop', 'print-ready', 'chrome', `${project}.pdf`);

    const res = await GET(new NextRequest(`http://localhost/api/projects/${encodeURIComponent(project)}/compile?${query}`), { params: Promise.resolve({ projectId: project }) });
    const data = (await res.json()) as { html?: string; lessonCount?: number; error?: string };
    if (!res.ok || !data.html) {
        console.error(`${project}: ${data.error ?? `compile failed (${res.status})`}`);
        return 1;
    }
    const cache = path.join(os.homedir(), '.cache', 'workbooks-print', 'images');
    const local = localPictures(data.html.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, ''), cache, CONTENT_ROOT);
    await downloadPictures(local.downloads);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'book-pdf-'));
    const htmlFile = path.join(tmp, `${project}.html`);
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
    const info = parsePdfinfo(run('pdfinfo', ['-box', out]));
    if (Math.abs(info.width - PAGE.width) > PAGE.slack || Math.abs(info.height - PAGE.height) > PAGE.slack) problems.push(`page size ${info.width} x ${info.height} pt is not 210 x 285 mm`);
    const fonts = parsePdffonts(run('pdffonts', [out]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    console.log(`${problems.length ? 'FAIL' : 'done'}  ${project}: ${out} (${data.lessonCount} lessons, ${pages} pages${problems.length ? `; ${problems.join('; ')}` : ''})`);
    return problems.length ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

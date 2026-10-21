import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from '@playwright/test';
import { formatPackageReports } from '../../lib/lesson-package/report';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import { renderPagedPdf, run } from '../../lib/print/render';
import { checkStorytimeWeek } from '../../lib/storytime/checks';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { compileStorytimeManual } from '../../lib/storytime/manual';
import { StorytimeWeekSchema, type StorytimeWeek } from '../../lib/storytime/schema';
import type { SupportedLanguage } from '../../lib/teacher-manual/i18n';

const USAGE = `Makes the office-print PDF of a Storytime Advantage teacher's book: A4, laid out by Paged.js
(from node_modules) in system Chrome (track storytime_week_package_20261022). It prints the check
report of every week first.

Usage: npx tsx scripts/storytime/make-manual-pdf.ts (--level <n> | --file <week.json>...) [--lang th|en] [--out <file.pdf>]

  --level   Every week file of content/storytime/l<n>/
  --file    One week file (repeat for more), e.g. a test week
  --lang    The book language (default th)
  --out     Output file (default ~/Desktop/print-ready/storytime/Storytime-Advantage-Level-<n>-Teachers-Book-<LANG>.pdf)

Run it under the heavy-job lock: flock ~/Desktop/primary-parity-progress/heavy.lock npx tsx ...
Exit code 1 when a week does not parse, a page is not A4, or a font is not embedded. A failed
design check is reported, but the book is still made, so that a draft week can be read on paper.`;

const A4 = { width: 595.28, height: 841.89, slack: 2 };

async function main(argv: string[]): Promise<number> {
    let level: number | undefined;
    const files: string[] = [];
    let lang: SupportedLanguage = 'th';
    let out: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') level = Number(argv[++i]);
        else if (a === '--file') files.push(path.resolve(argv[++i] ?? ''));
        else if (a === '--out') out = path.resolve(argv[++i] ?? '');
        else if (a === '--lang') {
            const v = argv[++i];
            if (v !== 'th' && v !== 'en') {
                console.error(`--lang must be th or en\n\n${USAGE}`);
                return 2;
            }
            lang = v;
        } else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if ((level === undefined) === (files.length === 0) || (level !== undefined && !(level >= 1 && level <= 4))) {
        console.error(USAGE);
        return 2;
    }

    const read = level !== undefined
        ? readLevelWeeks(STORYTIME_ROOT, level)
        : files.map((file) => {
              const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
              const parsed = StorytimeWeekSchema.safeParse(raw);
              return { file, raw, week: parsed.success ? parsed.data : undefined, error: parsed.success ? undefined : parsed.error.issues[0].message };
          });
    if (read.length === 0) {
        console.error('No week files');
        return 1;
    }
    console.log(formatPackageReports(read.map((r) => ({ ...checkStorytimeWeek(r.raw), file: path.relative(process.cwd(), r.file) }))));
    const broken = read.filter((r) => !r.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((r) => `${r.file} (${r.error})`).join('; ')}`);
        return 1;
    }
    const weeks = read.map((r) => r.week) as StorytimeWeek[];
    const result = compileStorytimeManual(weeks, { lang, paper: 'a4' });
    const n = weeks[0].meta.level;
    out ??= path.join(os.homedir(), 'Desktop', 'print-ready', 'storytime', `Storytime-Advantage-Level-${n}-Teachers-Book-${lang.toUpperCase()}.pdf`);

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-pdf-'));
    const htmlFile = path.join(tmp, `level-${n}-${lang}.html`);
    fs.writeFileSync(htmlFile, result.html.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, ''));
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
    const sizes = [...run('pdfinfo', ['-f', '1', '-l', String(info.pages), out]).matchAll(/^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)/gm)];
    const notA4 = sizes.filter((m) => Math.abs(Number(m[2]) - A4.width) > A4.slack || Math.abs(Number(m[3]) - A4.height) > A4.slack);
    if (notA4.length) problems.push(`${notA4.length} pages are not A4`);
    const fonts = parsePdffonts(run('pdffonts', [out]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    const families = [...new Set(fonts.map((f) => f.name.replace(/^[A-Z]{6}\+/, '')))].join(', ');
    console.log(`${problems.length ? 'FAIL' : 'done'}  Level ${n} (${lang}): ${out} (${result.weekCount} weeks, ${pages} pages; fonts: ${families}${problems.length ? `; ${problems.join('; ')}` : ''})`);
    return problems.length ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

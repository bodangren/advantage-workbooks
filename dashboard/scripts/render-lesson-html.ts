import fs from 'fs';
import path from 'path';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { renderMultipleLessons } from '../lib/template-renderer';
import { wrapWorkbookDocument } from '../lib/workbook-document-wrapper';

const USAGE = `Renders lesson packages to print HTML with Paged.js (lesson pages only).

Usage: npx tsx scripts/render-lesson-html.ts <package.json>... --out <file.html> [options]

Options:
  --first-number <n>   Number of the first lesson (default: the first package's meta.number)
  --strip <text>       A line above the first lesson's header (for example the insert label)
  --series <name>      Series line in the header (default "Primary Advantage"). An insert uses the
                       book's project.json values (Origins 3.1: --series Origins --level A0)
  --level <text>       Level in the header (default: meta.cefrLevel)

Pictures load from content/primary as file:// URLs. Open the file in Chrome and print, or use
the PDF check in measure/tracks/print_layout_audit_20261001.`;

async function main(argv: string[]): Promise<number> {
    const files: string[] = [];
    let out: string | undefined;
    let first: number | undefined;
    let strip: string | undefined;
    let series = 'Primary Advantage';
    let levelText: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--first-number') first = Number(argv[++i]);
        else if (a === '--strip') strip = argv[++i];
        else if (a === '--series') series = argv[++i];
        else if (a === '--level') levelText = argv[++i];
        else if (!a.startsWith('--')) files.push(path.resolve(a));
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (files.length === 0 || !out) {
        console.error(USAGE);
        return 2;
    }
    const packages = files.map((f) => LessonPackageSchema.parse(JSON.parse(fs.readFileSync(f, 'utf8'))));
    const mediaBase = `file://${path.dirname(path.dirname(files[0]))}/`;
    const lessons = packages.map((p) => buildWorkbookLesson(p, { mediaBase }));
    const level = levelText ?? packages[0].meta.cefrLevel;
    const html = await renderMultipleLessons(lessons, {
        type: 'primary',
        seriesName: series,
        seriesLevel: level,
        firstLessonNumber: first ?? packages[0].meta.number,
        headerStrip: strip,
    });
    fs.writeFileSync(out, wrapWorkbookDocument(html, [], { seriesName: series, seriesLevel: level, seriesTagline: '', type: 'primary', lessonsOnly: true }));
    console.log(`Wrote ${path.relative(process.cwd(), out)} (${packages.length} lesson(s))`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

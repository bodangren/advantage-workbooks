import fs from 'fs';
import path from 'path';
import { PRINT_BOOKS, bookLessons, bookPackages } from '../../lib/print/book-lessons';
import { lessonDocument, printExport } from '../../lib/print/print-export';

const USAGE = `Exports the print data of each lesson of the printed Primary books for the monorepo print kit
(track primary_parity_print_lesson_20261011, 2026-10-12): the lesson that make-lesson-pdfs.ts renders,
with public bucket pictures, the series name and level, the lesson number, and the package key.

Usage: npx tsx scripts/print/export-print-data.ts [<book>...] [--golden <book>:<n>]

  <book>     origins-1 origins-2 origins-3.1 origins-3.2 quest-4 (default: all of them)
  --golden   Also render that lesson from its export to <book>/print/golden/lesson-NN.html (with the
             answer key page) and lesson-NN-no-key.html (without it)

Output: content/primary/<book>/print/<package file name>, for example origins-3.2/print/p05.json.
The class-books import reads only the top-level *.json files of a book folder, so it does not read print/.
Exit code 1 when a lesson has no package, or a picture has no bucket object.`;

const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');

async function main(argv: string[]): Promise<number> {
    const books: string[] = [];
    let golden: { book: string; number: number } | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--golden') {
            const [book, n] = (argv[++i] ?? '').split(':');
            if (!PRINT_BOOKS[book] || !Number(n)) {
                console.error(`--golden needs <book>:<n>\n\n${USAGE}`);
                return 2;
            }
            golden = { book, number: Number(n) };
        } else if (PRINT_BOOKS[a]) books.push(a);
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    let written = 0;
    for (const book of books.length ? books : Object.keys(PRINT_BOOKS)) {
        const { name, level, lessons } = await bookLessons(book, CONTENT);
        const packages = new Map(bookPackages(CONTENT, book).map((p) => [p.pkg.meta.number, p]));
        const dir = path.join(CONTENT, book, 'print');
        fs.mkdirSync(dir, { recursive: true });
        for (const { number, lesson } of lessons) {
            const found = packages.get(number);
            if (!found) throw new Error(`${book} lesson ${number}: no package`);
            if (found.pkg.meta.title !== lesson.lesson_title) throw new Error(`${book} lesson ${number}: the package is "${found.pkg.meta.title}", the lesson is "${lesson.lesson_title}"`);
            const record = printExport({ name, level, number, lesson, pkg: found.pkg });
            fs.writeFileSync(path.join(dir, found.file), `${JSON.stringify(record, null, 2)}\n`);
            written++;
            if (golden?.book === book && golden.number === number) {
                const gdir = path.join(dir, 'golden');
                const base = `lesson-${String(number).padStart(2, '0')}`;
                fs.mkdirSync(gdir, { recursive: true });
                fs.writeFileSync(path.join(gdir, `${base}.html`), await lessonDocument(record.lesson, number, name, level));
                fs.writeFileSync(path.join(gdir, `${base}-no-key.html`), await lessonDocument(record.lesson, number, name, level, { answerKey: false }));
                console.log(`golden  ${path.relative(REPO, gdir)}/${base}.html, ${base}-no-key.html`);
            }
        }
        console.log(`${book}: ${lessons.length} lesson(s) → ${path.relative(REPO, dir)}/`);
    }
    console.log(`${written} file(s)`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);

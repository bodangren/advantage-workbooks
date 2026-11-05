import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import { resolveStorytimePictureFiles } from '../../lib/storytime/print/picture-check';

const USAGE = `Sets the approved color print pictures on the Storytime book pages and covers.

Usage: npx tsx scripts/storytime/set-book-pictures.ts --level <n> --week <n>`;
const MAX_BYTES = 400 * 1024;

type PictureRow = { id: string; use: string; text: string; week: number };
type BookImage = { caption: string; file?: string };
type Options = { weekFile: string; pictureFolder: string; contentRoot: string; rowsFile?: string };
type PlannedImage = { outputPath: string; outputFile: string; sourceFile: string; sourceName: string; quality: number; bytes: Buffer };

function sha256(bytes: Buffer): string {
    return createHash('sha256').update(bytes).digest('hex');
}

function imagesOf(week: any): Array<{ image: BookImage; bookStem: string; page: number | 'cover'; text: string; use: 'cover' | 'story-page' }> {
    return week.books.flatMap((book: any) => {
        const bookStem = path.basename(book.audio.file, '.mp3');
        return [
            { image: book.cover, bookStem, page: 'cover' as const, text: book.title, use: 'cover' as const },
            ...book.pages.map((page: any, index: number) => ({
                image: page.image,
                bookStem,
                page: index + 1,
                text: page.text,
                use: 'story-page' as const,
            })),
        ];
    });
}

/**
 * Resolves every week book picture and prepares deterministic JPEG and JSON outputs.
 * @param options The week, picture-list, print-picture, and content paths.
 * @returns The number of pictures set.
 * @throws Error When a picture match, source, or JPEG output is invalid.
 */
export async function setBookPictures(options: Options): Promise<number> {
    const weekText = fs.readFileSync(options.weekFile, 'utf8');
    const week = JSON.parse(weekText);
    const images = imagesOf(week);
    const rowsPath = options.rowsFile ?? path.join(path.dirname(options.pictureFolder), 'pictures.json');
    const rows = JSON.parse(fs.readFileSync(rowsPath, 'utf8')) as PictureRow[];
    // E9: the n-th book picture with the same use and text takes the n-th row with that week,
    // use and text, in the file order of pictures.json. A different count of rows is a data error.
    const groupRows = new Map<string, PictureRow[]>();
    for (const row of rows.filter((row) => row.week === week.meta.week)) {
        const key = JSON.stringify([row.use, row.text]);
        const list = groupRows.get(key);
        if (list) list.push(row);
        else groupRows.set(key, [row]);
    }
    const groupPictures = new Map<string, number>();
    for (const item of images) {
        const key = JSON.stringify([item.use, item.text]);
        groupPictures.set(key, (groupPictures.get(key) ?? 0) + 1);
    }
    for (const [key, count] of groupPictures) {
        const rowCount = groupRows.get(key)?.length ?? 0;
        if (rowCount !== count) {
            const [use, text] = JSON.parse(key) as [string, string];
            throw new Error(`picture match: ${use} "${text}" has ${count} pictures and ${rowCount} rows`);
        }
    }
    const usedRows = new Map<string, number>();
    const matched = images.map((item) => {
        const key = JSON.stringify([item.use, item.text]);
        const list = groupRows.get(key) ?? [];
        const index = usedRows.get(key) ?? 0;
        usedRows.set(key, index + 1);
        return { item, row: list[index] };
    });
    const resolved = resolveStorytimePictureFiles(options.pictureFolder, matched.map(({ row }) => row), 'color');
    if (resolved.length !== images.length) throw new Error(`picture resolver: expected ${images.length} files, got ${resolved.length}`);

    const planned: PlannedImage[] = [];
    for (const [index, { item }] of matched.entries()) {
        const source = resolved[index];
        if (!fs.statSync(source.file).isFile()) throw new Error(`picture source is not a file: ${source.fileName}`);
        const suffix = item.page === 'cover' ? 'cover' : `p${String(item.page).padStart(2, '0')}`;
        const outputPath = `l${week.meta.level}/media/w${String(week.meta.week).padStart(2, '0')}/books/${item.bookStem}/${suffix}.jpg`;
        if (!/^[A-Za-z0-9._/-]+$/.test(outputPath)) throw new Error(`invalid picture output path: ${outputPath}`);
        let bytes: Buffer | undefined;
        let quality = 82;
        for (; quality >= 75; quality--) {
            const encoded = await sharp(source.file)
                .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality, progressive: true })
                .toBuffer();
            if (encoded.length <= MAX_BYTES) {
                bytes = encoded;
                break;
            }
        }
        if (!bytes) throw new Error(`picture exceeds 400 KB at quality 75: ${source.fileName}`);
        planned.push({
            outputPath,
            outputFile: path.join(options.contentRoot, outputPath),
            sourceFile: source.file,
            sourceName: source.fileName,
            quality,
            bytes,
        });
    }

    const booksStart = weekText.indexOf('"books"');
    const songStart = weekText.indexOf('"song"', booksStart);
    if (booksStart < 0 || songStart < 0) throw new Error('week file has no books and song sections');
    const booksText = weekText.slice(booksStart, songStart);
    let imageIndex = 0;
    const captionLine = /(^[ \t]*"caption"\s*:\s*"(?:[^"\\]|\\.)*",?)(?:\r?\n[ \t]*"file"\s*:\s*"[^"]*",?)?(?=\r?$)/gm;
    const updatedBooksText = booksText.replace(captionLine, (line, caption: string) => {
        const image = images[imageIndex];
        const output = planned[imageIndex];
        if (!image || !output) throw new Error('week file has an unexpected book image caption');
        imageIndex++;
        const indent = caption.match(/^\s*/)?.[0] ?? '';
        const captionWithComma = caption.endsWith(',') ? caption : `${caption},`;
        return `${captionWithComma}\n${indent}"file": "${output.outputPath}"`;
    });
    if (imageIndex !== images.length) throw new Error(`week file has ${imageIndex} book captions; expected ${images.length}`);
    const updatedWeekText = weekText.slice(0, booksStart) + updatedBooksText + weekText.slice(songStart);
    const provenancePath = path.join(options.contentRoot, `l${week.meta.level}/media/w${String(week.meta.week).padStart(2, '0')}/books/pictures.sha256`);
    const provenance = planned
        .map((entry) => [entry.outputPath, sha256(entry.bytes), entry.sourceName, sha256(fs.readFileSync(entry.sourceFile)), entry.quality, sharp.versions.sharp].join('\t'))
        .sort((a, b) => a.localeCompare(b))
        .join('\n') + '\n';

    for (const entry of planned) {
        fs.mkdirSync(path.dirname(entry.outputFile), { recursive: true });
        fs.writeFileSync(entry.outputFile, entry.bytes);
    }
    fs.mkdirSync(path.dirname(provenancePath), { recursive: true });
    fs.writeFileSync(provenancePath, provenance);
    if (updatedWeekText !== weekText) fs.writeFileSync(options.weekFile, updatedWeekText);
    return planned.length;
}

/**
 * Runs the command-line interface for one Storytime level and week.
 * @param argv The command-line arguments without the executable name.
 * @returns The process exit code.
 */
export async function main(argv: string[]): Promise<number> {
    const value = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
    const level = Number(value('--level'));
    const week = Number(value('--week'));
    if (argv.includes('--help') || !Number.isInteger(level) || level < 1 || level > 4 || !Number.isInteger(week) || week < 1) {
        console.log(USAGE);
        return argv.includes('--help') ? 0 : 2;
    }
    const weekFile = path.join(STORYTIME_ROOT, `l${level}/w${String(week).padStart(2, '0')}.json`);
    const pictureFolder = path.join(STORYTIME_ROOT, `l${level}/print/pictures`);
    try {
        const count = await setBookPictures({ weekFile, pictureFolder, contentRoot: STORYTIME_ROOT });
        console.log(`set ${count} book pictures in ${path.relative(process.cwd(), weekFile)}`);
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
    main(process.argv.slice(2)).then((code) => {
        process.exitCode = code;
    });
}

import path from 'path';
import { pathToFileURL } from 'node:url';
import { generateQRCode } from '../../qr-generator';
import { STORYTIME_ROOT, storytimeQrUrl } from '../files';
import type { StorytimeWeek } from '../schema';
import { edgeFilledArtPathSync } from './art-edge-fill';
import {
    HORIZONTAL_LOGO_ASPECT,
    HORIZONTAL_LOGO_URL,
    K_LOGO_URL,
    questFontFaces,
    questReaderCoverPage,
    questReaderPageCss,
    type QuestReaderRow,
} from './cover-quest';
import { storytimePrintPictures, type StorytimePictureRow } from './pictures';
import { resolveStorytimePictureFiles, type StorytimePictureFile } from './picture-check';
import type { StorytimePrintProfile } from './profile';
import { fontFaceCss } from './print-fonts';
import { STORYTIME_READER_PAGE_OFFSET, type StorytimeIcon } from './step-map';

/**
 * The reader pages of a Storytime week (spec FR-5): the 7 read-along readers and the 7 decodable
 * readers of weeks 1 to 7. One page layout serves both kinds, and it makes two outputs from the
 * same 12 pages:
 *
 * - `workbook`: each reader uses three perforated A4 leaves. Each side holds two landscape pages
 *   one above the other (the front pages turned 180 degrees except page 12, the back pages upright), a fold line,
 *   and a leaf mark. The child folds each leaf and staples the fold at the top. The workbook prints
 *   line art (FR-9);
 * - `a3-color`: one reader page on each A3 landscape page, scaled 2.0 with 12 mm white bands at the
 *   left and the right, as an sRGB PDF for office printers, not PDF/X (FR-5.8).
 *
 * The mode follows FR-5.6: a `final` build resolves each row through the `manifest.json` of the
 * picture folder and stops with the row id when a file breaks a stage 1 rule or is missing; a
 * `proof` build prints "PICTURE MISSING" in the picture box.
 */

/**
 * The page pairs of the 3 nested leaves (top then bottom, FR-5.1, changed 2026-11-04). The leaf turns
 * over on its vertical spine edge, so a back side keeps the top and the bottom of its front. The
 * fold is at the top of the closed reader: page 1 is the top half of the leaf 1 front.
 */
const LEAF_PAGES: Array<{ front: [number, number]; back: [number, number] }> = [
    { front: [1, 12], back: [2, 11] },
    { front: [3, 10], back: [4, 9] },
    { front: [5, 8], back: [6, 7] },
];

/**
 * The CSS angle of the half turn of a front page. An exact 180 degree turn makes Chrome write a transparency
 * group on every page, and the PDF/X-1a conversion then flattens the pages into images (measured 2026-11-04:
 * 179.99 gives no group). The 0.01 degree difference moves the far edge of a page by 0.03 mm.
 */
const TURN_180_DEG = 179.99;

/** The turn of a printed page in degrees: a front page turns 180 and a back page is upright (the top fold, FR-5.1). */
const PAGE_TURN_DEG = { front: 180, back: 0 } as const;

/** The back cover. The child reads it by turning the closed reader over like a book, the fold still at the top, so it prints upright (Daniel 2026-11-04, fix 5). */
const BACK_COVER_PAGE = 12;

/**
 * The print turn of one reader page.
 * @param side The printed face of the leaf side.
 * @param pageNumber The reader page number from 1 to 12.
 * @returns 0 for the back cover; otherwise 180 on a front and 0 on a back.
 */
function pageTurnDeg(side: 'front' | 'back', pageNumber: number): number {
    return pageNumber === BACK_COVER_PAGE ? 0 : PAGE_TURN_DEG[side];
}

/** The copy rule of the reader covers (spec FR-6.3, AC-6): no CEFR words on a reader cover. */
const COVER_COPY_RULE = /\bCEFR\b|\bPre[\s\-‐‑]?A1\b|\bStarters\b|\bReading\s+A[\s\-‐‑]?Z\b/i;

/** The number of pages of a reader (FR-5.2 and FR-5.3): cover, 8 story pages, 3 more, back cover. */
const READER_PAGES = 12;

/** The A3 landscape page in PDF points, as `pdfinfo` reports it (FR-5.8). */
const A3_PAGE_SIZE = '1190.55 x 841.89 pts (A3)';

/** The scale of a reader page on an A3 page (297 / 148.5 = 2.0, FR-5.8). */
const A3_SCALE = 2;

/** The trim of the colour A3 page, in millimetres: the page that holds one reader page (D6). */
const A3_PAGE_TRIM = { widthMm: 420, heightMm: 297 };

/**
 * What a reader build makes: the workbook leaves (line art), or the color A3 pages of the teacher.
 */
export type StorytimeReaderOutput = 'workbook' | 'a3-color';

/** The options of one reader build. */
export interface StorytimeReaderOptions {
    /** The print profile: the leaf trim, the perforation, and the reader page size (P2, P15). */
    profile: StorytimePrintProfile;
    /** `proof` prints the picture placeholders; `final` needs the picture files (FR-5.6). */
    mode: 'proof' | 'final';
    /** The output: the workbook leaves, or the color A3 pages. */
    output: StorytimeReaderOutput;
    /** One reader only, by title; the default is every reader of the weeks (the CLI writes one A3 file for each reader). */
    bookTitle?: string;
}

/** One page of a reader, before the imposition. */
interface ReaderPageSpec {
    /** The 1-based page number of the reader, from 1 to 12. */
    number: number;
    /** The page body. */
    body: string;
    /** The footer text (the book title and the level), or none on the cover. */
    footer?: string;
    /** Whether the page prints its number at the bottom right (pages 2 to 11). */
    numbered: boolean;
}

/** HTML-escapes a text of the week packages. */
const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The folder that holds the Forge picture files of a level (spec FR-2, FR-9). */
const pictureDirOf = (week: StorytimeWeek): string => path.join(STORYTIME_ROOT, `l${week.meta.level}`, 'print', 'pictures');

/** The reader kind of the page plan (FR-5.2 decodable, FR-5.3 read-along). */
const isDecodable = (book: StorytimeWeek['books'][number]): boolean => book.kind === 'decodable';

/** The QR page path of a reader: the read-along part, or the decodable part (spec P4). */
const qrPathOf = (week: StorytimeWeek, book: StorytimeWeek['books'][number]): string =>
    `/th/st/${week.meta.level}/${week.meta.week}?part=${isDecodable(book) ? 'decodable' : 'book'}`;

/**
 * The picture element of a picture-list row in a reader page. Proof mode prints the placeholder
 * with the list name. Final mode prints the file that the picture folder manifest resolves into:
 * the workbook prints the line art and the color A3 pages print the color file (FR-9). The source
 * is a percent-encoded `file:` URL of the resolved path, and the attribute values are
 * HTML-escaped, so a folder name with `"`, `<`, `>`, `#`, `?`, `%`, or a space cannot add
 * markup or give a wrong URL (B-P4-1).
 * @param row The picture-list row of the page.
 * @param o The build options.
 * @param files The resolved picture files of the week, by row id; the map is empty in proof mode.
 * @returns The HTML.
 * @throws Error When final mode holds no file for the row (FR-5.6).
 */
function pictureElement(row: StorytimePictureRow, o: StorytimeReaderOptions, files: Map<string, StorytimePictureFile>): string {
    const listName = o.output === 'workbook' ? row.lineArtFileName : row.fileName;
    if (o.mode === 'final') {
        const entry = files.get(row.id);
        if (!entry) throw new Error(`picture missing: ${row.id} (${listName})`);
        return `<div class="reader-picture" data-picture-id="${esc(row.id)}" data-picture-file="${esc(entry.fileName)}"><img src="${esc(pathToFileURL(entry.file).href)}" alt=""></div>`;
    }
    return `<div class="reader-picture" data-picture-id="${row.id}" data-picture-file="${listName}">PICTURE MISSING</div>`;
}

/** The picture rows of each book of a week, in the list order of `storytimePrintPictures`. */
function rowsByBook(week: StorytimeWeek): { pages: StorytimePictureRow[]; cover: StorytimePictureRow }[] {
    const rows = storytimePrintPictures([week]);
    const story = rows.filter((row) => row.use === 'story-page');
    const covers = rows.filter((row) => row.use === 'cover');
    let storyIndex = 0;
    let coverIndex = 0;
    return week.books.map((book) => {
        const pages = book.pages.map(() => story[storyIndex++]);
        return { pages, cover: covers[coverIndex++] };
    });
}

/**
 * The picture rows that a build requests, in build order: the cover and the 8 story pages of each
 * reader, and only the readers of `bookTitle` when the caller gives one.
 * @param week The week of the readers.
 * @param o The build options.
 * @returns The rows in build order.
 */
function requestedRows(week: StorytimeWeek, o: StorytimeReaderOptions): StorytimePictureRow[] {
    const all = rowsByBook(week);
    const rows: StorytimePictureRow[] = [];
    week.books.forEach((book, index) => {
        if (o.bookTitle && book.title !== o.bookTitle) return;
        rows.push(all[index].cover, ...all[index].pages);
    });
    return rows;
}

/**
 * The resolved picture files of a week, by row id (plan Phase 4 Red 4g). Final mode reads the
 * `manifest.json` of the picture folder of the level and resolves each requested row through it;
 * proof mode returns an empty map.
 * @param week The week of the readers.
 * @param o The build options.
 * @returns The file of each requested row, by row id.
 * @throws Error When final mode finds a picture problem in the folder.
 */
function pictureFilesOf(week: StorytimeWeek, o: StorytimeReaderOptions): Map<string, StorytimePictureFile> {
    if (o.mode !== 'final') return new Map();
    const kind = o.output === 'workbook' ? 'line' : 'color';
    return new Map(resolveStorytimePictureFiles(pictureDirOf(week), requestedRows(week, o), kind).map((entry) => [entry.rowId, entry]));
}

/**
 * The picture files that a build requests, in build order (FR-5.6, FR-9): the cover and the 8
 * story pages of each reader, as the line art for the workbook and as the color file for the A3
 * pages. Final mode resolves each row through the `manifest.json` of the picture folder (plan
 * Phase 4 Red 4g), so the file name is the name of the accepted delivery; proof mode gives the
 * picture-list names. The caller checks every file of this list before it writes anything, so that
 * a missing picture leaves no output folder and no half-written file (C-P4-2).
 * @param weeks The parsed weeks in week order.
 * @param o The build options; `bookTitle` limits the list to one reader.
 * @returns Each row id with its file name part and the path of the file.
 * @throws Error When final mode finds a picture problem in the folder.
 */
export function storytimeReaderPictureFiles(weeks: StorytimeWeek[], o: StorytimeReaderOptions): StorytimePictureFile[] {
    const files: StorytimePictureFile[] = [];
    for (const week of weeks) {
        const rows = requestedRows(week, o);
        if (o.mode === 'final') {
            files.push(...resolveStorytimePictureFiles(pictureDirOf(week), rows, o.output === 'workbook' ? 'line' : 'color'));
            continue;
        }
        for (const row of rows) {
            const name = o.output === 'workbook' ? row.lineArtFileName : row.fileName;
            files.push({ rowId: row.id, fileName: name, file: path.join(pictureDirOf(week), name) });
        }
    }
    return files;
}

/** The role of a reader and its mark on the cover: listen and read, sound it out, or say the first sound (A-48 B17). A decodable sound book is a listen-and-read book (A-48 part F E2). */
function roleOf(book: StorytimeWeek['books'][number]): { label: string; icons: StorytimeIcon[] } {
    if (book.soundBook && isDecodable(book)) return { label: 'Listen and read.', icons: ['ear', 'read'] };
    if (book.soundBook) return { label: 'Say the first sound.', icons: ['ear', 'mouth'] };
    if (isDecodable(book)) return { label: 'Sound it out.', icons: ['read', 'mouth'] };
    return { label: 'Listen and read.', icons: ['ear', 'read'] };
}

/**
 * The reader cover page (FR-5.5, the PM look of 2026-11-11, F5 and D6): the quest reader cover of
 * `questReaderCoverPage` with the top style hlogo, on the page trim of the output. The leaf design
 * takes the 198 x 148.5 mm page with the line art on `workbook`, and the A3 design takes the full
 * 420 x 297 mm page with the colour art on `a3-color`, with no 2.0 scale. One element of the page
 * holds `data-picture-id` and `data-picture-file` and wraps the quest page, so the picture lists keep
 * the cover row. Proof mode prints the quest chrome and the text PICTURE MISSING, and holds no image.
 * No band word shows on the page.
 * @param week The week of the reader.
 * @param book The reader.
 * @param cover The picture row of the cover.
 * @param o The build options.
 * @param files The resolved picture files of the week, by row id; empty in proof mode.
 * @returns The page.
 * @throws Error When the quest row is missing, a cover text breaks the copy rule (FR-6.3), or final
 *   mode holds no picture file for the row (FR-5.6).
 */
function coverPage(week: StorytimeWeek, book: StorytimeWeek['books'][number], cover: StorytimePictureRow, o: StorytimeReaderOptions, files: Map<string, StorytimePictureFile>): ReaderPageSpec {
    const copy = [book.title, 'Storytime Advantage', `Week ${week.meta.week}`];
    const banned = copy.filter((line) => COVER_COPY_RULE.test(line));
    if (banned.length) throw new Error(`reader cover copy (FR-6.3): ${banned.join('; ')}`);
    const row: QuestReaderRow = {
        title: book.title,
        kind: book.kind,
        week: week.meta.week,
        weekText: `Week ${week.meta.week}`,
        litBand: String(week.meta.band).toLowerCase(),
        roleLabel: roleOf(book).label,
        level: week.meta.level,
        slug: '',
        picture: { fileName: cover.fileName, lineArtFileName: cover.lineArtFileName },
    };
    const listName = o.output === 'workbook' ? cover.lineArtFileName : cover.fileName;
    let art = '';
    let fileName = listName;
    if (o.mode === 'final') {
        const entry = files.get(cover.id);
        if (!entry) throw new Error(`picture missing: ${cover.id} (${listName})`);
        // The colour art of the A3 page takes the print copy with the mirror fill (D-F7-5); the
        // workbook leaf keeps the line art source. The picture check ran on the source file.
        const artFile = o.output === 'a3-color' ? edgeFilledArtPathSync(entry.file, entry.fileName) : entry.file;
        art = pathToFileURL(artFile).href;
        fileName = entry.fileName;
    }
    const trim = o.output === 'workbook' ? { widthMm: o.profile.readerPage.widthMm, heightMm: o.profile.readerPage.heightMm } : A3_PAGE_TRIM;
    const leafMark = o.output === 'workbook' ? `${book.title} \u00b7 sheet 1 of ${LEAF_PAGES.length}` : '';
    const page = questReaderCoverPage(row, trim, { art }, { bleedMm: 0, top: 'hlogo', leafMark });
    const body =
        `<div class="quest-cover-picture" data-picture-id="${esc(cover.id)}" ` +
        `data-picture-file="${esc(fileName)}">\n${page.body}\n</div>`;
    return { number: 1, body, numbered: false };
}

/** The QR code of a reader page (FR-5.3: the title page; FR-5.2: the page before the back cover). */
function qrBlock(week: StorytimeWeek, book: StorytimeWeek['books'][number]): string {
    const address = storytimeQrUrl(qrPathOf(week, book));
    const svg = generateQRCode(address);
    if (!svg) throw new Error(`QR code failed for ${address}`);
    return `<div class="reader-qr" data-qr-input="${esc(address)}">${svg}<p class="reader-qr-label">${isDecodable(book) && !book.soundBook ? 'Listen and read the book' : 'Listen to the book'}</p></div>`;
}

/** The "Sounds in this book" page of a decodable reader (FR-5.2); the week 1 first-sound book says "The first sound in this book" (A-48 E23). */
function soundsPage(book: StorytimeWeek['books'][number]): string {
    const sounds = book.soundsPage;
    if (!sounds) throw new Error(`the decodable reader "${book.title}" has no sounds page`);
    const words = sounds.words.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    const tricky = sounds.tricky.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    return `<h2 class="reader-heading">${book.soundBook ? 'The first sound in this book' : 'Sounds in this book'}</h2>
<p class="reader-sound" data-part="reader-sound">${esc(sounds.element)}</p>
<div class="reader-word-row">${words}</div>
<p class="reader-heading">Tricky words</p>
<div class="reader-word-row">${tricky}</div>`;
}

/** The title page of a read-along reader, with the QR code (FR-5.3). */
function titlePage(week: StorytimeWeek, book: StorytimeWeek['books'][number]): string {
    return `<h2 class="reader-heading">${esc(book.title)}</h2>
<p class="reader-series">Storytime Advantage</p>
${qrBlock(week, book)}`;
}

/** The last page before the back cover: the frame and the family words, or the QR code. */
function closingPage(week: StorytimeWeek, book: StorytimeWeek['books'][number]): string {
    if (isDecodable(book)) return qrBlock(week, book);
    const family = week.focus.family;
    const words = family.words.map((entry) => `<span class="reader-word">${esc(entry.word)}</span>`).join('');
    // A family word that the story does not use sits under "More words", not under the family name (A-48 E52).
    const storyWords = new Set(book.pages.flatMap((page) => page.text.toLowerCase().match(/[a-z']+/g) ?? []));
    const allUsed = family.words.every((entry) => storyWords.has(entry.word.toLowerCase()));
    return `<p class="reader-frame" data-part="reader-frame">${esc(week.focus.frame)}</p>
<p class="reader-heading">${allUsed ? esc(family.name.en) : 'More words'}</p>
<div class="reader-word-row">${words}</div>`;
}

/**
 * The width of the page 12 logo tile at reader page scale, in millimetres (the look of 2026-11-11,
 * F2: the horizontal logo moves off the front kinds and onto the back cover of each reader).
 */
const BACK_LOGO_TILE_WIDTH_MM = 78.8;

/** The height of the page 12 logo tile at reader page scale, in millimetres. */
const BACK_LOGO_TILE_HEIGHT_MM = 25.5;

/** The border of the page 12 logo tile, in millimetres: the border of the cover logo tile. */
const BACK_LOGO_TILE_BORDER_MM = 0.6;

/** The corner radius of the page 12 logo tile, in millimetres. */
const BACK_LOGO_TILE_RADIUS_MM = 3;

/**
 * The distance of the top edge of the page 12 logo tile from the top edge of the reader page, in
 * millimetres. The word row ends above 48 mm, so the tile stands more than 5 mm below it; the tile
 * bottom stands 20 mm above the page bottom and clear of the footer text.
 */
const BACK_LOGO_TILE_TOP_MM = 103;

/** The share of the inner height of the page 12 logo tile that the logo image fills. */
const BACK_LOGO_FILL_SHARE = 0.8;

/** The fill, the border, and the logo source of the page 12 tile of each reader output. */
const BACK_LOGO_COLOURS: Record<StorytimeReaderOutput, { fill: string; border: string; src: string }> = {
    'a3-color': { fill: '#FCD34D', border: '#92400E', src: HORIZONTAL_LOGO_URL },
    workbook: { fill: '#D2D2D2', border: '#4E4E4E', src: K_LOGO_URL },
};

/**
 * The logo tile of the back cover of a reader (the look of 2026-11-11, F2). The colour A3 pages
 * take the colour logo on the amber tile with the brown border; the workbook takes the K logo on
 * the gray tile with the gray border. The tile is 78.8 mm by 25.5 mm at reader page scale, centred
 * across the page, with a 3 mm radius and hidden overflow. The logo image fills 80 % of the inner
 * height and follows the viewBox aspect of the horizontal logo. The CSS of the page holds the place
 * of the tile; this function sets the colours of the output.
 * @param output The reader output.
 * @returns The HTML of the tile.
 */
function backLogoTile(output: StorytimeReaderOutput): string {
    const colours = BACK_LOGO_COLOURS[output];
    return (
        `<div data-part="logo-tile" class="reader-logo-tile" style="background-color:${colours.fill};` +
        `border:${BACK_LOGO_TILE_BORDER_MM}mm solid ${colours.border}">` +
        `<img src="${esc(colours.src)}" alt=""></div>`
    );
}

/**
 * The back cover: the word list of the reader (FR-5.2 and FR-5.3, `backWords`), and the logo tile
 * of the round of 2026-11-11 (F2). The band line is gone, because standing rule 5 forbids a band
 * word on every page; the series line, the heading, and the word row stay.
 * @param book The reader.
 * @param output The reader output: the colour pages take the colour logo, the workbook the K logo.
 * @returns The HTML.
 */
function backPage(book: StorytimeWeek['books'][number], output: StorytimeReaderOutput): string {
    const words = book.backWords.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    return `<h2 class="reader-heading">Words in this book</h2>
<div class="reader-word-row" data-part="reader-back-words">${words}</div>
${backLogoTile(output)}`;
}

/**
 * The 12 pages of one reader, in reading order (FR-5.2 and FR-5.3): cover; the sounds page of a
 * decodable or the title page of a read-along; the 8 story pages; the closing page; the back
 * cover. The page text is the master (FR-5.7): each story page prints `pages[i].text`. The round of
 * 2026-11-11 (F2) gives the back cover the logo tile of its output.
 * @param week The week of the reader.
 * @param book The reader.
 * @param rows The picture rows of this reader.
 * @param o The build options.
 * @param files The resolved picture files of the week, by row id; empty in proof mode.
 * @returns The 12 pages in reading order.
 */
function readerPages(week: StorytimeWeek, book: StorytimeWeek['books'][number], rows: { pages: StorytimePictureRow[]; cover: StorytimePictureRow }, o: StorytimeReaderOptions, files: Map<string, StorytimePictureFile>): ReaderPageSpec[] {
    if (book.pages.length !== 8) throw new Error(`the reader "${book.title}" has ${book.pages.length} story pages; FR-5.2 and FR-5.3 give 8`);
    const footer = `${book.title} \u2022 Level ${week.meta.level}`;
    const story = book.pages.map((page, i) => ({
        number: i + 1 + STORYTIME_READER_PAGE_OFFSET,
        body: `<div class="reader-story">${pictureElement(rows.pages[i], o, files)}<p class="reader-text" data-part="reader-text">${esc(page.text)}</p></div>`,
        footer,
        numbered: true,
    }));
    const pages: ReaderPageSpec[] = [
        coverPage(week, book, rows.cover, o, files),
        { number: 2, body: isDecodable(book) ? soundsPage(book) : titlePage(week, book), footer, numbered: true },
        ...story,
        { number: 11, body: closingPage(week, book), footer, numbered: true },
        { number: 12, body: backPage(book, o.output), footer, numbered: false },
    ];
    if (pages.length !== READER_PAGES) throw new Error(`the reader "${book.title}" has ${pages.length} pages; a reader has 12`);
    return pages;
}

/**
 * One reader page as HTML, with the page size of the profile (R-P4-1): the body, the footer at the
 * bottom left (every page but the cover), and the page number at the bottom right (pages 2 to 11).
 */
function readerPageHtml(page: ReaderPageSpec, profile: StorytimePrintProfile): string {
    const footer = page.footer ? `<p class="reader-footer" data-part="reader-footer">${esc(page.footer)}</p>` : '';
    const number = page.numbered ? `<p class="reader-number" data-part="reader-number">${page.number}</p>` : '';
    return `<div class="reader-page" data-reader-page data-page-number="${page.number}" data-width-mm="${profile.readerPage.widthMm}" data-height-mm="${profile.readerPage.heightMm}">${page.body}${footer}${number}</div>`;
}

/**
 * The content scale of a reader page against the former 99 × 140 mm layout. The text sizes of the A5
 * page of 2026-11-03 (a scale of 1.414) stay, because the same page now lies on its side: the scale
 * compares the short side with 99 mm and the long side with 140 mm.
 * @param profile The print profile that holds the reader page size.
 * @returns The smaller page ratio.
 */
function readerContentScale(profile: StorytimePrintProfile): number {
    const { widthMm, heightMm } = profile.readerPage;
    return Math.min(Math.min(widthMm, heightMm) / 99, Math.max(widthMm, heightMm) / 140);
}

/** The space of a landscape reader page in millimeters (spec FR-5.1, Daniel's reference of 2026-11-04). */
const READER_SPACE = {
    /** The page margin at the left and at the right. */
    marginX: 20,
    /** The page margin at the top. */
    marginTop: 6,
    /** The gap between the picture and the text. */
    gap: 3.5,
    /** The aspect of the picture box: between 4:3 and 4:2.7, so that the 4:3 art loses at most 4.9 percent at each edge. */
    aspect: 1.4766,
    /** The distance of the footer and of the page number from the bottom edge. */
    bottom: 5.2,
} as const;
/**
 * The style of one landscape reader page (FR-5.1, Daniel's reference of 2026-11-04): the page box, one framed
 * picture across the top (aspect between 4:3 and 4:2.7, the art cropped at the edges), one or two large text
 * lines under the picture and left-aligned with it, the page number at the bottom right, and a small footer at
 * the bottom left. A page that is turned 180 degrees (`data-turn-deg="180"`, a front page) turns about its center.
 * The student workbook appends this rule set to its own style, so the reader pages look the same in the
 * workbook and in the readers build (Red 4c). The round of 2026-11-11 (F2) adds the page 12 logo tile:
 * 78.8 mm by 25.5 mm at reader page scale, centred across the page, 103 mm from the top edge, with the
 * logo at 80 % of the inner height.
 * @param profile The print profile that holds the reader page size (P15).
 * @returns The CSS text of the reader page rules.
 */
export function readerPageCss(profile: StorytimePrintProfile, trim: { widthMm: number; heightMm: number } = profile.readerPage): string {
    const scale = readerContentScale(profile);
    const mm = (value: number): string => `${Math.round(value * scale * 1000) / 1000}mm`;
    const pt = (value: number): string => `${Math.round(value * scale * 1000) / 1000}pt`;
    const { marginX, marginTop, gap, aspect, bottom } = READER_SPACE;
    const pictureWidth = profile.readerPage.widthMm - 2 * marginX;
    const pictureHeight = Math.round((pictureWidth / aspect) * 10) / 10;
    const textTop = Math.round((marginTop + pictureHeight + gap) * 10) / 10;
    const round = (value: number): number => Math.round(value * 1000) / 1000;
    const tileInnerMm = BACK_LOGO_TILE_HEIGHT_MM - 2 * BACK_LOGO_TILE_BORDER_MM;
    const tileImageHeightMm = round(tileInnerMm * BACK_LOGO_FILL_SHARE);
    const tileImageWidthMm = round(tileImageHeightMm * HORIZONTAL_LOGO_ASPECT);
    return `.reader-page { width: ${profile.readerPage.widthMm}mm; height: ${profile.readerPage.heightMm}mm; padding: ${marginTop}mm ${marginX}mm 0 ${marginX}mm; position: relative; overflow: hidden; }
.reader-page[data-turn-deg="180"] { transform: rotate(${TURN_180_DEG}deg); transform-origin: center; }
.reader-picture { position: absolute; left: ${marginX}mm; top: ${marginTop}mm; width: ${pictureWidth}mm; height: ${pictureHeight}mm; border: 0.3mm solid #000; display: flex; align-items: center; justify-content: center; font-size: ${pt(7)}; overflow: hidden; }
.reader-picture img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.reader-text { position: absolute; left: ${marginX}mm; top: ${textTop}mm; width: ${pictureWidth}mm; font-size: ${pt(17)}; line-height: 1.15; text-align: left; }
.reader-footer { position: absolute; left: ${marginX}mm; bottom: ${bottom}mm; font-size: ${pt(5)}; line-height: 1.2; white-space: nowrap; }
.reader-number { position: absolute; right: ${marginX}mm; bottom: ${bottom}mm; font-size: ${pt(9)}; line-height: 1; }
.reader-cover { text-align: left; padding-top: ${Math.round((pictureHeight + gap) * 10) / 10}mm; display: flex; flex-wrap: wrap; align-items: baseline; column-gap: ${mm(3)}; }
.reader-title { order: -1; flex: 0 0 100%; font-size: ${pt(21)}; font-weight: 700; line-height: 1.15; }
.reader-band { font-size: ${pt(9)}; letter-spacing: ${mm(0.4)}; text-transform: uppercase; line-height: 1.2; margin-top: ${mm(1)}; }
.reader-series { font-size: ${pt(9)}; line-height: 1.2; margin-top: ${mm(1)}; }
.reader-week { font-size: ${pt(10)}; line-height: 1.2; margin-top: ${mm(1)}; }
.reader-role { display: flex; align-items: center; gap: ${mm(1)}; font-size: ${pt(9)}; line-height: 1.2; margin-top: ${mm(1)}; }
.reader-role-icon { width: ${mm(4)}; height: ${mm(4)}; display: block; flex: none; }
.reader-heading { font-size: ${pt(11)}; font-weight: 700; margin-top: ${mm(3)}; }
.reader-sound { font-size: ${pt(30)}; font-weight: 700; text-align: center; margin-top: ${mm(3)}; }
.reader-word-row { display: flex; flex-wrap: wrap; gap: ${mm(2)} ${mm(4)}; margin-top: ${mm(2)}; font-size: ${pt(12)}; }
.reader-frame { font-size: ${pt(13)}; margin-top: ${mm(3)}; }
.reader-qr { text-align: center; margin-top: ${mm(4)}; }
.reader-qr svg { width: ${mm(34)}; height: ${mm(34)}; }
.reader-qr-label { font-size: ${pt(8)}; }
.reader-logo-tile { position: absolute; left: calc(50% - ${round(BACK_LOGO_TILE_WIDTH_MM / 2)}mm); top: ${BACK_LOGO_TILE_TOP_MM}mm; width: ${BACK_LOGO_TILE_WIDTH_MM}mm; height: ${BACK_LOGO_TILE_HEIGHT_MM}mm; border-radius: ${BACK_LOGO_TILE_RADIUS_MM}mm; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.reader-logo-tile img { width: ${tileImageWidthMm}mm; height: ${tileImageHeightMm}mm; display: block; }
.quest-cover-picture { position: absolute; left: 0; top: 0; }
.quest-cover-picture .quest-reader-page { background: transparent; }
.reader-page > .quest-cover-picture { width: ${profile.readerPage.widthMm}mm; height: ${profile.readerPage.heightMm}mm; }
.a3-page > .reader-page { width: ${A3_PAGE_TRIM.widthMm}mm; height: ${A3_PAGE_TRIM.heightMm}mm; }
.a3-page > .reader-page > .quest-cover-picture { width: ${A3_PAGE_TRIM.widthMm}mm; height: ${A3_PAGE_TRIM.heightMm}mm; }
${questFontFaces()}
${questReaderPageCss(trim)}`;
}

/**
 * The style of the two outputs. The workbook has A4 leaf sides; the color A3 page is landscape, 420 × 297 mm,
 * with one reader page scaled 2.0 and centered between 12 mm white bands at the left and the right. The print font is Andika.
 * @param o The build options.
 * @returns The CSS text.
 */
function readerCss(o: StorytimeReaderOptions): string {
    const { widthMm, heightMm } = o.profile.trim;
    const page = o.output === 'workbook' ? `${widthMm}mm ${heightMm}mm` : '420mm 297mm';
    const { perforationMm } = o.profile;
    const leafWidth = widthMm - perforationMm;
    return `${fontFaceCss()}
@page { size: ${page}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #000; background: #fff; }
.reader-leaf { break-after: page; page-break-after: always; }
.reader-leaf:last-of-type { break-after: auto; page-break-after: auto; }
.reader-side { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; break-after: page; page-break-after: always; overflow: hidden; }
.reader-side:last-child { break-after: auto; page-break-after: auto; }
${readerPageCss(o.profile, o.output === 'workbook' ? o.profile.readerPage : A3_PAGE_TRIM)}
.reader-side > .reader-page { position: absolute; }
.reader-side[data-leaf-side="front"] > .reader-page { left: ${perforationMm}mm; }
.reader-side[data-leaf-side="back"] > .reader-page { left: 0; }
.reader-side > .reader-page:nth-of-type(1) { top: 0; }
.reader-side > .reader-page:nth-of-type(2) { top: ${o.profile.readerPage.heightMm}mm; }
.fold-line { position: absolute; z-index: 4; left: 0; width: 100%; top: ${o.profile.trim.heightMm / 2}mm; border-top: 0.3mm dashed #000; }
.leaf-mark { position: absolute; z-index: 5; top: 2mm; left: ${leafWidth / 2}mm; transform: translateX(-50%); white-space: nowrap; font-size: 5pt; }
.reader-side[data-leaf-side="front"] .leaf-mark { left: ${perforationMm + leafWidth / 2}mm; }
${readerLeafMarkCss(o.profile)}
.a3-page { width: 420mm; height: 297mm; position: relative; break-after: page; page-break-after: always; }
.a3-page:last-of-type { break-after: auto; page-break-after: auto; }
.a3-scale { position: absolute; left: 12mm; top: 0; width: ${o.profile.readerPage.widthMm}mm; height: ${o.profile.readerPage.heightMm}mm; transform: scale(${A3_SCALE}); transform-origin: 0 0; }
.a3-scale .reader-picture { border: 0.15mm solid #000; }
`;
}

/**
 * One printed side of one reader leaf (FR-5.1): the two reader pages of that side and their
 * HTML, from the shared page renderer. `student-book.ts` uses this HTML, so
 * the workbook prints the same reader pages as the readers build (Red 4c, R-P4-10).
 */
export interface StorytimeReaderLeafSide {
    /** The reader kind: `readalong` or `decodable`. */
    kind: StorytimeWeek['books'][number]['kind'];
    /** The reader title. */
    title: string;
    /** The leaf number, from 1 to 3. */
    leaf: number;
    /** The side: `front` holds the pages 1 and 12 (the top fold; page 1 turned 180 degrees, page 12 upright), `back` holds the pairs 2|11 and the inner ones (upright). */
    side: 'front' | 'back';
    /** The page numbers of the top and bottom halves. */
    pages: number[];
    /** The HTML of the two reader pages. */
    html: string;
    /** The line art file name of the cover picture of the reader, or empty (Q5 of 2026-11-12). */
    lineArtFileName?: string;
}

/**
 * The leaf sides of the readers of a week, in reader and leaf order. Each leaf has front then back.
 * @param week The week of the readers.
 * @param o The print profile and the mode (and, for one A3 file, the reader title).
 * @returns The sides in the leaf order; each side holds the HTML of its two reader pages.
 * @throws Error When a reader has no 8 story pages or a cover text breaks the copy rule (FR-6.3).
 */
export function storytimeReaderLeafSides(week: StorytimeWeek, o: StorytimeReaderOptions): StorytimeReaderLeafSide[] {
    const rows = rowsByBook(week);
    const files = pictureFilesOf(week, o);
    const sides: StorytimeReaderLeafSide[] = [];
    week.books.forEach((book, i) => {
        if (o.bookTitle && book.title !== o.bookTitle) return;
        const pages = readerPages(week, book, rows[i], o, files);
        for (let leaf = 1; leaf <= LEAF_PAGES.length; leaf++) {
            const { front, back } = LEAF_PAGES[leaf - 1];
            for (const [side, numbers] of [['front', front], ['back', back]] as const) {
                sides.push({
                    kind: book.kind,
                    title: book.title,
                    leaf,
                    side,
                    pages: [...numbers],
                    lineArtFileName: rows[i].cover.lineArtFileName,
                    html: numbers.map((number, index) => readerPageHtml(pages[number - 1], o.profile)
                        .replace('data-reader-page', `data-reader-page data-half="${index === 0 ? 'top' : 'bottom'}" data-turn-deg="${pageTurnDeg(side, number)}"`)).join(''),
                });
            }
        }
    });
    return sides;
}

/**
 * The style of the marks on a reader leaf side that are not the pages (fix 6, Daniel 2026-11-04). The fold line is the only
 * dashed line. The tear-out place is two short solid ticks (the `perforation` element keeps its place 12 mm from the bound edge
 * and prints no line itself) and a scissors mark with a label in the 12 mm strip. The fold line says "fold" at both ends.
 * @param profile The print profile that holds the leaf trim and the perforation distance.
 * @returns The CSS text, for the readers build and for the student workbook.
 */
export function readerLeafMarkCss(profile: StorytimePrintProfile): string {
    const foldTop = Math.round((profile.trim.heightMm / 2 - 1.5) * 10) / 10;
    const foldCentre = Math.round((profile.trim.heightMm / 2) * 10) / 10;
    return `.perforation.reader-tear { position: absolute; top: 0; width: 0; height: 100%; border: 0; }
.tear-tick { position: absolute; left: -0.2mm; width: 0; height: 5mm; border-left: 0.4mm solid #000; }
.tear-tick-top { top: 0; }
.tear-tick-bottom { bottom: 0; }
.tear-label { position: absolute; top: 24mm; width: ${profile.perforationMm}mm; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
.tear-label svg { width: 4mm; height: 4mm; flex: none; }
.tear-text { writing-mode: vertical-rl; white-space: nowrap; font-size: 6pt; line-height: 1; }
.fold-label { position: absolute; z-index: 5; top: ${foldTop}mm; height: 3mm; line-height: 3mm; padding: 0 1mm; background: #fff; font-size: 6pt; white-space: nowrap; }
.fold-labels-below-fold .fold-label { top: ${foldCentre + 0.2}mm; height: 2.5mm; line-height: 2.5mm; }
.tear-text [lang="th"], .fold-label [lang="th"] { font-family: 'Sarabun', 'Andika', sans-serif; }`;
}

/**
 * The tear-out place of a reader leaf side (fix 6): the `perforation` element at the perforation distance from the bound edge
 * with its two solid ticks (5 mm long, one at the top edge and one at the bottom edge), and the scissors mark with its label inside the strip.
 * The strip stays in the book; nothing of it reaches a reader page.
 * @param edge The bound edge of the side: `left` for a front, `right` for a back.
 * @param profile The print profile that holds the perforation distance.
 * @returns The HTML of the perforation element and the label.
 */
export function readerTearOutHtml(edge: 'left' | 'right', profile: StorytimePrintProfile): string {
    const scissors = '<svg class="scissors" data-part="scissors" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="3" fill="none" stroke="#000" stroke-width="1.6"/><circle cx="18" cy="6" r="3" fill="none" stroke="#000" stroke-width="1.6"/><path d="M8 8.2 L18 22 M16 8.2 L6 22" fill="none" stroke="#000" stroke-width="1.6"/></svg>';
    return `<div class="perforation reader-tear" data-part="perforation" data-distance-mm="${profile.perforationMm}" data-spine-edge="${edge}" style="position:absolute;top:0;${edge}:${profile.perforationMm}mm;"><span class="tear-tick tear-tick-top" data-part="tear-tick"></span><span class="tear-tick tear-tick-bottom" data-part="tear-tick"></span></div>
<div class="tear-label" data-part="tear-label" data-spine-edge="${edge}" style="${edge}:0;">${scissors}<span class="tear-text"><span lang="th">ตัดออกจากเล่ม</span> / cut out of the book</span></div>`;
}

/**
 * The two "fold" labels of a reader leaf side (fix 6): one at each end of the fold line, inside the leaf, on the line.
 * A side that holds page 1 takes the labels below the fold (the quest cover art reaches the fold),
 * inside the page 12 half, still within 3 mm of the fold and clear of the page content.
 * @param edge The bound edge of the side: `left` for a front, `right` for a back.
 * @param profile The print profile that holds the perforation distance.
 * @param belowFold True when the side holds page 1: the labels move into the page 12 half.
 * @returns The HTML of the two labels.
 */
export function readerFoldLabelsHtml(edge: 'left' | 'right', profile: StorytimePrintProfile, belowFold = false): string {
    const near = `${profile.perforationMm + 1}mm`;
    const [leftPlace, rightPlace] = edge === 'left' ? [`left:${near}`, 'right:1mm'] : ['left:1mm', `right:${near}`];
    const label = (place: string): string => `<span class="fold-label" data-part="fold-label" style="${place};"><span lang="th">พับ</span> / fold</span>`;
    const labels = `${label(leftPlace)}${label(rightPlace)}`;
    return belowFold ? `<div class="fold-labels-below-fold">${labels}</div>` : labels;
}



/**
 * The leaf mark of one side (spec FR-5.1). A side that holds page 1 of a reader takes the white strip
 * of Q5 (the PM answer of 2026-11-12), because the quest cover art fills the page; every other side
 * keeps the plain mark of the page margin.
 * @param entry The leaf side.
 * @param profile The print profile.
 * @returns The HTML of the mark.
 */
function markHtml(entry: StorytimeReaderLeafSide): string {
    if (entry.pages.includes(1)) return '';
    return `<span class="leaf-mark" data-part="leaf-mark">${esc(entry.title)} &middot; sheet ${entry.leaf} of 3</span>`;
}

/**
 * One workbook leaf: two sides, each with two landscape pages, the fold line, and a leaf mark.
 * @param leaf The 1-based leaf number.
 * @param sides The four sides of the two strips: front, back, front, back.
 * @param profile The print profile.
 * @returns The HTML of the leaf (its two A4 sides).
 */
function leafHtml(sides: StorytimeReaderLeafSide[], profile: StorytimePrintProfile): string {
    const html = sides.map((entry) => {
        const front = entry.side === 'front';
        const edge = front ? 'left' : 'right';
        return `<div class="reader-side" data-leaf-side="${entry.side}">
${entry.html}
<div class="fold-line" data-part="fold-line" data-position-mm="148.5"></div>
${readerFoldLabelsHtml(edge, profile, entry.pages.includes(1))}
${markHtml(entry)}
${readerTearOutHtml(edge, profile)}
</div>`;
    }).join('');
    return `<div class="reader-leaf" data-reader-leaf data-reader-title="${esc(sides[0].title)}" data-leaf-number="${sides[0].leaf}">${html}</div>`;
}

/**
 * Compiles the reader pages of the given weeks (spec FR-5) to one print HTML document.
 * @param weeks The parsed weeks in week order; each week has its 2 readers.
 * @param o The print profile, the mode, and the output (`workbook` leaves or `a3-color` pages).
 * @returns The HTML of the reader document.
 * @throws Error When a week has no readers, a reader has no 8 story pages, a cover text breaks
 *   the copy rule (FR-6.3), or (final mode) the picture folder breaks a stage 1 rule or a file is
 *   missing (FR-5.6).
 */
export function compileStorytimeReaders(weeks: StorytimeWeek[], o: StorytimeReaderOptions): { html: string } {
    if (!weeks.length) throw new Error('no weeks');
    const body: string[] = [];
    for (const week of weeks) {
        if (!week.books.length) throw new Error(`week ${week.meta.week} has no readers`);
        const all = rowsByBook(week);
        const files = pictureFilesOf(week, o);
        const books = week.books
            .map((book, i) => ({ book, rows: all[i] }))
            .filter(({ book }) => !o.bookTitle || book.title === o.bookTitle)
            .map(({ book, rows }) => ({ book, rows, pages: readerPages(week, book, rows, o, files) }));
        if (!books.length) throw new Error(`week ${week.meta.week} has no reader "${o.bookTitle ?? ''}"`);
        if (o.output === 'a3-color') {
            for (const entry of books) {
                body.push(`<section class="reader-book" data-reader-title="${esc(entry.book.title)}" data-reader-output="a3-color">${entry.pages
                    .map((page) => page.number === 1
                        ? `<section class="a3-page" data-a3-page data-page-size="${A3_PAGE_SIZE}" data-page-number="1">${readerPageHtml(page, o.profile)}</section>`
                        : `<section class="a3-page" data-a3-page data-page-size="${A3_PAGE_SIZE}" data-page-number="${page.number}"><div class="a3-scale" data-scale="2" data-white-left-mm="12" data-white-right-mm="12">${readerPageHtml(page, o.profile)}</div></section>`)
                    .join('')}</section>`);
            }
            continue;
        }
        // FR-5.1: each reader has three leaves, and both readers use separate leaves.
        const sides = storytimeReaderLeafSides(week, o);
        for (let leaf = 0; leaf < sides.length; leaf += 2) {
            body.push(leafHtml(sides.slice(leaf, leaf + 2), o.profile));
        }
    }
    return {
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Storytime Advantage readers</title>
<style>
${readerCss(o)}
</style>
</head>
<body>
${body.join('\n')}
</body>
</html>`,
    };
}

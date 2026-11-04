import path from 'path';
import { pathToFileURL } from 'node:url';
import { generateQRCode } from '../../qr-generator';
import { STORYTIME_ROOT, storytimeQrUrl } from '../files';
import type { StorytimeWeek } from '../schema';
import { storytimePrintPictures, type StorytimePictureRow } from './pictures';
import { resolveStorytimePictureFiles, type StorytimePictureFile } from './picture-check';
import type { StorytimePrintProfile } from './profile';
import { fontFaceCss } from './print-fonts';

/**
 * The reader pages of a Storytime week (spec FR-5): the 7 read-along readers and the 7 decodable
 * readers of weeks 1 to 7. One page layout serves both kinds, and it makes two outputs from the
 * same 12 pages:
 *
 * - `workbook`: each reader uses three perforated A4 leaves. Each side holds two landscape pages
 *   one above the other (the front pages turned 180 degrees, the back pages upright), a fold line,
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

/** The copy rule of the reader covers (spec FR-6.3, AC-6): no CEFR words on a reader cover. */
const COVER_COPY_RULE = /\bCEFR\b|\bPre[\s\-‐‑]?A1\b|\bStarters\b|\bReading\s+A[\s\-‐‑]?Z\b/i;

/** The number of pages of a reader (FR-5.2 and FR-5.3): cover, 8 story pages, 3 more, back cover. */
const READER_PAGES = 12;

/** The A3 landscape page in PDF points, as `pdfinfo` reports it (FR-5.8). */
const A3_PAGE_SIZE = '1190.55 x 841.89 pts (A3)';

/** The scale of a reader page on an A3 page (297 / 148.5 = 2.0, FR-5.8). */
const A3_SCALE = 2;

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

/** The reader cover page (FR-5.5): the title, the band "Sprout", the series, and the week number. */
function coverPage(week: StorytimeWeek, book: StorytimeWeek['books'][number], cover: StorytimePictureRow, o: StorytimeReaderOptions, files: Map<string, StorytimePictureFile>): ReaderPageSpec {
    const copy = [book.title, 'Sprout', 'Storytime Advantage', `Week ${week.meta.week}`];
    const banned = copy.filter((line) => COVER_COPY_RULE.test(line));
    if (banned.length) throw new Error(`reader cover copy (FR-6.3): ${banned.join('; ')}`);
    const body = `<div class="reader-cover">
  ${pictureElement(cover, o, files)}
  <p class="reader-band">Sprout</p>
  <h1 class="reader-title" data-part="reader-cover-title">${esc(book.title)}</h1>
  <p class="reader-series">Storytime Advantage</p>
  <p class="reader-week">Week ${week.meta.week}</p>
</div>`;
    return { number: 1, body, numbered: false };
}

/** The QR code of a reader page (FR-5.3: the title page; FR-5.2: the page before the back cover). */
function qrBlock(week: StorytimeWeek, book: StorytimeWeek['books'][number]): string {
    const address = storytimeQrUrl(qrPathOf(week, book));
    const svg = generateQRCode(address);
    if (!svg) throw new Error(`QR code failed for ${address}`);
    return `<div class="reader-qr" data-qr-input="${esc(address)}">${svg}<p class="reader-qr-label">${isDecodable(book) ? 'Listen and read the book' : 'Listen to the book'}</p></div>`;
}

/** The "Sounds in this book" page of a decodable reader (FR-5.2). */
function soundsPage(book: StorytimeWeek['books'][number]): string {
    const sounds = book.soundsPage;
    if (!sounds) throw new Error(`the decodable reader "${book.title}" has no sounds page`);
    const words = sounds.words.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    const tricky = sounds.tricky.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    return `<h2 class="reader-heading">Sounds in this book</h2>
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
    return `<p class="reader-frame" data-part="reader-frame">${esc(week.focus.frame)}</p>
<p class="reader-heading">${esc(family.name.en)}</p>
<div class="reader-word-row">${words}</div>`;
}

/** The back cover: the word list of the reader (FR-5.2 and FR-5.3, `backWords`). */
function backPage(book: StorytimeWeek['books'][number]): string {
    const words = book.backWords.map((word) => `<span class="reader-word">${esc(word)}</span>`).join('');
    return `<p class="reader-band">Sprout</p>
<p class="reader-series">Storytime Advantage</p>
<h2 class="reader-heading">Words in this book</h2>
<div class="reader-word-row" data-part="reader-back-words">${words}</div>`;
}

/**
 * The 12 pages of one reader, in reading order (FR-5.2 and FR-5.3): cover; the sounds page of a
 * decodable or the title page of a read-along; the 8 story pages; the closing page; the back
 * cover. The page text is the master (FR-5.7): each story page prints `pages[i].text`.
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
        number: i + 3,
        body: `<div class="reader-story">${pictureElement(rows.pages[i], o, files)}<p class="reader-text" data-part="reader-text">${esc(page.text)}</p></div>`,
        footer,
        numbered: true,
    }));
    const pages: ReaderPageSpec[] = [
        coverPage(week, book, rows.cover, o, files),
        { number: 2, body: isDecodable(book) ? soundsPage(book) : titlePage(week, book), footer, numbered: true },
        ...story,
        { number: 11, body: closingPage(week, book), footer, numbered: true },
        { number: 12, body: backPage(book), footer, numbered: false },
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
 * workbook and in the readers build (Red 4c).
 * @param profile The print profile that holds the reader page size (P15).
 * @returns The CSS text of the reader page rules.
 */
export function readerPageCss(profile: StorytimePrintProfile): string {
    const scale = readerContentScale(profile);
    const mm = (value: number): string => `${Math.round(value * scale * 1000) / 1000}mm`;
    const pt = (value: number): string => `${Math.round(value * scale * 1000) / 1000}pt`;
    const { marginX, marginTop, gap, aspect, bottom } = READER_SPACE;
    const pictureWidth = profile.readerPage.widthMm - 2 * marginX;
    const pictureHeight = Math.round((pictureWidth / aspect) * 10) / 10;
    const textTop = Math.round((marginTop + pictureHeight + gap) * 10) / 10;
    return `.reader-page { width: ${profile.readerPage.widthMm}mm; height: ${profile.readerPage.heightMm}mm; padding: ${marginTop}mm ${marginX}mm 0 ${marginX}mm; position: relative; overflow: hidden; }
.reader-page[data-turn-deg="180"] { transform: rotate(${TURN_180_DEG}deg); transform-origin: center; }
.reader-picture { position: absolute; left: ${marginX}mm; top: ${marginTop}mm; width: ${pictureWidth}mm; height: ${pictureHeight}mm; border: 0.4mm dashed #000; display: flex; align-items: center; justify-content: center; font-size: ${pt(7)}; overflow: hidden; }
.reader-picture img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.reader-text { position: absolute; left: ${marginX}mm; top: ${textTop}mm; width: ${pictureWidth}mm; font-size: ${pt(17)}; line-height: 1.15; text-align: left; }
.reader-footer { position: absolute; left: ${marginX}mm; bottom: ${bottom}mm; font-size: ${pt(5)}; line-height: 1.2; white-space: nowrap; }
.reader-number { position: absolute; right: ${marginX}mm; bottom: ${bottom}mm; font-size: ${pt(9)}; line-height: 1; }
.reader-cover { text-align: left; padding-top: ${Math.round((pictureHeight + gap) * 10) / 10}mm; }
.reader-band { display: inline-block; font-size: ${pt(9)}; letter-spacing: ${mm(0.4)}; text-transform: uppercase; margin-top: ${mm(1.5)}; margin-right: ${mm(3)}; }
.reader-title { font-size: ${pt(21)}; font-weight: 700; }
.reader-series { display: inline-block; font-size: ${pt(9)}; margin-right: ${mm(3)}; }
.reader-week { display: inline-block; font-size: ${pt(10)}; }
.reader-heading { font-size: ${pt(11)}; font-weight: 700; margin-top: ${mm(3)}; }
.reader-sound { font-size: ${pt(30)}; font-weight: 700; text-align: center; margin-top: ${mm(3)}; }
.reader-word-row { display: flex; flex-wrap: wrap; gap: ${mm(2)} ${mm(4)}; margin-top: ${mm(2)}; font-size: ${pt(12)}; }
.reader-frame { font-size: ${pt(13)}; margin-top: ${mm(3)}; }
.reader-qr { text-align: center; margin-top: ${mm(4)}; }
.reader-qr svg { width: ${mm(34)}; height: ${mm(34)}; }
.reader-qr-label { font-size: ${pt(8)}; }`;
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
${readerPageCss(o.profile)}
.reader-side > .reader-page { position: absolute; }
.reader-side[data-leaf-side="front"] > .reader-page { left: ${perforationMm}mm; }
.reader-side[data-leaf-side="back"] > .reader-page { left: 0; }
.reader-side > .reader-page:nth-of-type(1) { top: 0; }
.reader-side > .reader-page:nth-of-type(2) { top: ${o.profile.readerPage.heightMm}mm; }
.fold-line { position: absolute; z-index: 4; left: 0; width: 100%; top: ${o.profile.trim.heightMm / 2}mm; border-top: 0.3mm dashed #000; }
.leaf-mark { position: absolute; z-index: 5; top: 2mm; left: ${leafWidth / 2}mm; transform: translateX(-50%); white-space: nowrap; font-size: 5pt; }
.reader-side[data-leaf-side="front"] .leaf-mark { left: ${perforationMm + leafWidth / 2}mm; }
.perforation { position: absolute; top: 0; height: 100%; width: 0; border-left: 0.4mm dashed #000; }
.a3-page { width: 420mm; height: 297mm; position: relative; break-after: page; page-break-after: always; }
.a3-page:last-of-type { break-after: auto; page-break-after: auto; }
.a3-scale { position: absolute; left: 12mm; top: 0; width: ${o.profile.readerPage.widthMm}mm; height: ${o.profile.readerPage.heightMm}mm; transform: scale(${A3_SCALE}); transform-origin: 0 0; }
.a3-scale .reader-picture { border: 0.15mm dashed #000; }
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
    /** The side: `front` holds the pages 1 and 12 (the top fold, turned 180 degrees), `back` holds the pairs 2|11 and the inner ones (upright). */
    side: 'front' | 'back';
    /** The page numbers of the top and bottom halves. */
    pages: number[];
    /** The HTML of the two reader pages. */
    html: string;
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
                    html: numbers.map((number, index) => readerPageHtml(pages[number - 1], o.profile)
                        .replace('data-reader-page', `data-reader-page data-half="${index === 0 ? 'top' : 'bottom'}" data-turn-deg="${PAGE_TURN_DEG[side]}"`)).join(''),
                });
            }
        }
    });
    return sides;
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
<span class="leaf-mark" data-part="leaf-mark">${esc(entry.title)} &middot; leaf ${entry.leaf} of 3</span>
<div class="perforation" data-part="perforation" data-distance-mm="${profile.perforationMm}" data-spine-edge="${edge}" style="${edge}:${profile.perforationMm}mm;"></div>
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
                    .map((page) => `<section class="a3-page" data-a3-page data-page-size="${A3_PAGE_SIZE}" data-page-number="${page.number}"><div class="a3-scale" data-scale="2" data-white-left-mm="12" data-white-right-mm="12">${readerPageHtml(page, o.profile)}</div></section>`)
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

import fs from 'fs';
import path from 'path';
import { generateQRCode } from '../../qr-generator';
import { STORYTIME_ROOT, storytimeQrUrl } from '../files';
import type { StorytimeWeek } from '../schema';
import { storytimePrintPictures, type StorytimePictureRow } from './pictures';
import type { StorytimePrintProfile } from './profile';
import { fontFaceCss } from './print-fonts';

/**
 * The reader pages of a Storytime week (spec FR-5): the 7 read-along readers and the 7 decodable
 * readers of weeks 1 to 7. One page layout serves both kinds, and it makes two outputs from the
 * same 12 pages:
 *
 * - `workbook`: the reader pages of the week imposed on A4 leaves for the workbook (FR-5.1). Each
 *   reader is 3 half-sheet strips of 198 × 140 mm (two reader pages of 99 × 140 mm side by side);
 *   two strips sit on each A4 leaf, one for each reader of the week, with a dashed cut line at
 *   the middle of the leaf. The child tears out the leaves on the perforation 12 mm from the
 *   spine, cuts on the line, nests the 3 strips, folds them, and staples them. The workbook
 *   prints line art (FR-9);
 * - `a3-color`: one reader page on each A3 portrait page (297 × 420 mm, the reader page scaled
 *   3.0), an sRGB PDF for office printers, not PDF/X (FR-5.8).
 *
 * The mode follows FR-5.6: a `final` build stops with the picture id when a picture file is
 * missing, and a `proof` build prints "PICTURE MISSING" in the picture box.
 */

/** The page pairs of the 3 strips of a reader (FR-5.1): front side, then duplex back side. */
const STRIP_PAGES: [number[], number[]][] = [
    [[12, 1], [2, 11]],
    [[10, 3], [4, 9]],
    [[8, 5], [6, 7]],
];

/** The copy rule of the reader covers (spec FR-6.3, AC-6): no CEFR words on a reader cover. */
const COVER_COPY_RULE = /\bCEFR\b|\bPre[\s\-‐‑]?A1\b|\bStarters\b|\bReading\s+A[\s\-‐‑]?Z\b/i;

/** The number of pages of a reader (FR-5.2 and FR-5.3): cover, 8 story pages, 3 more, back cover. */
const READER_PAGES = 12;

/** The A3 page in PDF points, as `pdfinfo` reports it (FR-5.8). */
const A3_PAGE_SIZE = '841.89 x 1190.55 pts (A3)';

/** The scale of a reader page on an A3 page (297 / 99 = 3.0, FR-5.8). */
const A3_SCALE = 3;

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
 * The picture element of a picture-list row in a reader page. Proof mode prints the placeholder;
 * final mode stops with the picture id when the file is missing (FR-5.6). The workbook prints the
 * line art and the color A3 pages print the color file (FR-9).
 * @param row The picture-list row of the page.
 * @param week The week that needs the picture.
 * @param o The build options.
 * @returns The HTML.
 */
function pictureElement(row: StorytimePictureRow, week: StorytimeWeek, o: StorytimeReaderOptions): string {
    const lineArt = o.output === 'workbook';
    const name = lineArt ? row.lineArtFileName : row.fileName;
    const file = path.join(pictureDirOf(week), name);
    if (o.mode === 'final') {
        if (!fs.existsSync(file)) throw new Error(`picture missing: ${row.id} (${name})`);
        return `<div class="reader-picture" data-picture-id="${row.id}" data-picture-file="${name}"><img src="file://${file}" alt=""></div>`;
    }
    return `<div class="reader-picture" data-picture-id="${row.id}" data-picture-file="${name}">PICTURE MISSING</div>`;
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
 * The picture files that a build requests, in build order (FR-5.6, FR-9): the cover and the 8
 * story pages of each reader, as the line art for the workbook and as the color file for the A3
 * pages. The final mode checks every file of this list before it writes anything, so that a
 * missing picture leaves no output folder and no half-written file (C-P4-2).
 * @param weeks The parsed weeks in week order.
 * @param o The build options; `bookTitle` limits the list to one reader.
 * @returns Each row id with its file name and its path in the picture folder.
 */
export function storytimeReaderPictureFiles(weeks: StorytimeWeek[], o: StorytimeReaderOptions): { rowId: string; fileName: string; file: string }[] {
    const files: { rowId: string; fileName: string; file: string }[] = [];
    for (const week of weeks) {
        const all = rowsByBook(week);
        week.books.forEach((book, index) => {
            if (o.bookTitle && book.title !== o.bookTitle) return;
            const lineArt = o.output === 'workbook';
            for (const row of [all[index].cover, ...all[index].pages]) {
                const name = lineArt ? row.lineArtFileName : row.fileName;
                files.push({ rowId: row.id, fileName: name, file: path.join(pictureDirOf(week), name) });
            }
        });
    }
    return files;
}

/** The reader cover page (FR-5.5): the title, the band "Sprout", the series, and the week number. */
function coverPage(week: StorytimeWeek, book: StorytimeWeek['books'][number], cover: StorytimePictureRow, o: StorytimeReaderOptions): ReaderPageSpec {
    const copy = [book.title, 'Sprout', 'Storytime Advantage', `Week ${week.meta.week}`];
    const banned = copy.filter((line) => COVER_COPY_RULE.test(line));
    if (banned.length) throw new Error(`reader cover copy (FR-6.3): ${banned.join('; ')}`);
    const body = `<div class="reader-cover">
  ${pictureElement(cover, week, o)}
  <p class="reader-band">Sprout</p>
  <h1 class="reader-title" data-part="reader-cover-title">${esc(book.title)}</h1>
  <p class="reader-series">Storytime Advantage</p>
  <p class="reader-week">Week ${week.meta.week}</p>
</div>`;
    return { number: 1, body };
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
 * @returns The 12 pages in reading order.
 */
function readerPages(week: StorytimeWeek, book: StorytimeWeek['books'][number], rows: { pages: StorytimePictureRow[]; cover: StorytimePictureRow }, o: StorytimeReaderOptions): ReaderPageSpec[] {
    if (book.pages.length !== 8) throw new Error(`the reader "${book.title}" has ${book.pages.length} story pages; FR-5.2 and FR-5.3 give 8`);
    const story = book.pages.map((page, i) => ({
        number: i + 3,
        body: `<div class="reader-story">${pictureElement(rows.pages[i], week, o)}<p class="reader-text" data-part="reader-text">${esc(page.text)}</p></div>`,
    }));
    const pages = [
        coverPage(week, book, rows.cover, o),
        { number: 2, body: isDecodable(book) ? soundsPage(book) : titlePage(week, book) },
        ...story,
        { number: 11, body: closingPage(week, book) },
        { number: 12, body: backPage(book) },
    ];
    if (pages.length !== READER_PAGES) throw new Error(`the reader "${book.title}" has ${pages.length} pages; a reader has 12`);
    return pages;
}

/** One reader page as HTML, with the page size of the profile (R-P4-1). */
function readerPageHtml(page: ReaderPageSpec, profile: StorytimePrintProfile): string {
    return `<div class="reader-page" data-reader-page data-page-number="${page.number}" data-width-mm="${profile.readerPage.widthMm}" data-height-mm="${profile.readerPage.heightMm}">${page.body}</div>`;
}

/**
 * The style of one reader page (FR-5.1): the page box, the picture box of about 90 × 67 mm, and
 * the text. The student workbook appends this rule set to its own style, so the reader pages look
 * the same in the workbook and in the readers build (Red 4c).
 * @param profile The print profile that holds the reader page size (P15).
 * @returns The CSS text of the reader page rules.
 */
export function readerPageCss(profile: StorytimePrintProfile): string {
    return `.reader-page { width: ${profile.readerPage.widthMm}mm; height: ${profile.readerPage.heightMm}mm; padding: 5mm; position: relative; overflow: hidden; }
.reader-picture { width: 89mm; height: 66mm; border: 0.4mm dashed #000; display: flex; align-items: center; justify-content: center; font-size: 7pt; }
.reader-picture img { width: 100%; height: 100%; object-fit: contain; }
.reader-text { font-size: 17pt; margin-top: 5mm; }
.reader-cover { text-align: center; }
.reader-band { font-size: 9pt; letter-spacing: 0.4mm; text-transform: uppercase; margin-top: 2mm; }
.reader-title { font-size: 21pt; font-weight: 700; margin-top: 2mm; }
.reader-series { font-size: 9pt; }
.reader-week { font-size: 10pt; margin-top: 1mm; }
.reader-heading { font-size: 11pt; font-weight: 700; margin-top: 3mm; }
.reader-sound { font-size: 30pt; font-weight: 700; text-align: center; margin-top: 3mm; }
.reader-word-row { display: flex; flex-wrap: wrap; gap: 2mm 4mm; margin-top: 2mm; font-size: 12pt; }
.reader-frame { font-size: 13pt; margin-top: 3mm; }
.reader-qr { text-align: center; margin-top: 4mm; }
.reader-qr svg { width: 34mm; height: 34mm; }
.reader-qr-label { font-size: 8pt; }`;
}

/**
 * The style of the two outputs. The workbook page is A4 with the reader strips; the color A3 page
 * is 297 × 420 mm with one reader page scaled 3.0. The English print font is Andika (FR-3).
 * @param o The build options.
 * @returns The CSS text.
 */
function readerCss(o: StorytimeReaderOptions): string {
    const { widthMm, heightMm } = o.profile.trim;
    const page = o.output === 'workbook' ? `${widthMm}mm ${heightMm}mm` : '297mm 420mm';
    return `${fontFaceCss()}
@page { size: ${page}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #000; background: #fff; }
.reader-side { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; break-after: page; page-break-after: always; }
.reader-leaf:last-of-type .reader-side:last-of-type { break-after: auto; page-break-after: auto; }
.reader-strip { position: absolute; display: flex; flex-direction: row; height: ${o.profile.readerPage.heightMm}mm; }
${readerPageCss(o.profile)}
.strip-mark { position: absolute; top: 0.5mm; left: 1mm; font-size: 5pt; }
.cut-line { position: absolute; left: 0; width: 100%; border-top: 0.3mm dashed #000; }
.perforation { position: absolute; top: 0; height: 100%; width: 0; border-left: 0.4mm dashed #000; }
.a3-page { width: 297mm; height: 420mm; position: relative; break-after: page; page-break-after: always; }
.a3-page:last-of-type { break-after: auto; page-break-after: auto; }
.a3-scale { width: ${o.profile.readerPage.widthMm}mm; height: ${o.profile.readerPage.heightMm}mm; transform: scale(${A3_SCALE}); transform-origin: 0 0; }
.a3-scale .reader-picture { border: 0.15mm dashed #000; }
`;
}

/**
 * One printed side of one strip of a reader (FR-5.1): the two reader pages of that side and their
 * HTML, from the one page renderer. `student-book.ts` fills its reader strips with this HTML, so
 * the workbook prints the same reader pages as the readers build (Red 4c, R-P4-10).
 */
export interface StorytimeReaderStripSide {
    /** The reader kind: `readalong` or `decodable`. */
    kind: StorytimeWeek['books'][number]['kind'];
    /** The reader title. */
    title: string;
    /** The strip number, from 1 to 3. */
    strip: number;
    /** The side: `front` holds the outer pages 12 and 1, `back` holds the two inner pairs. */
    side: 'front' | 'back';
    /** The page numbers of the two pages, in printed order. */
    pages: number[];
    /** The HTML of the two reader pages. */
    html: string;
}

/**
 * The strip sides of the readers of a week, in the R32 leaf order (FR-5.1; the default for
 * Daniel's look at the Phase 6 proof): strip 1 to 3 of the first reader, then strip 1 to 3 of the
 * second reader, each with its front and its duplex back. Two sides of one strip belong to the
 * same physical strip, so a leaf holds strip 1 and 2, then strip 3 and the next reader's strip 1,
 * and so on.
 * @param week The week of the readers.
 * @param o The print profile and the mode (and, for one A3 file, the reader title).
 * @returns The sides in the leaf order; each side holds the HTML of its two reader pages.
 * @throws Error When a reader has no 8 story pages or a cover text breaks the copy rule (FR-6.3).
 */
export function storytimeReaderStripSides(week: StorytimeWeek, o: StorytimeReaderOptions): StorytimeReaderStripSide[] {
    const rows = rowsByBook(week);
    const sides: StorytimeReaderStripSide[] = [];
    week.books.forEach((book, i) => {
        if (o.bookTitle && book.title !== o.bookTitle) return;
        const pages = readerPages(week, book, rows[i], o);
        for (let strip = 1; strip <= STRIP_PAGES.length; strip++) {
            const [front, back] = STRIP_PAGES[strip - 1];
            for (const [side, numbers] of [['front', front], ['back', back]] as const) {
                sides.push({
                    kind: book.kind,
                    title: book.title,
                    strip,
                    side,
                    pages: [...numbers],
                    html: numbers.map((number) => readerPageHtml(pages[number - 1], o.profile)).join(''),
                });
            }
        }
    });
    return sides;
}

/**
 * One leaf of the workbook: two strips on each side, with the marks and the cut line (FR-5.1).
 * @param leaf The 1-based leaf number.
 * @param sides The four sides of the two strips: front, back, front, back.
 * @param profile The print profile.
 * @returns The HTML of the leaf (its two A4 sides).
 */
function leafHtml(leaf: number, sides: StorytimeReaderStripSide[], profile: StorytimePrintProfile): string {
    const leafWidth = 2 * profile.readerPage.widthMm;
    const stripTop = (profile.trim.heightMm / 2 - profile.readerPage.heightMm) / 2;
    const html = [0, 1].map((side) => {
        const front = side === 0;
        const edge = front ? 'left' : 'right';
        const stripHtml = [sides[side], sides[2 + side]].map((strip, slot) => {
            const top = slot === 0 ? stripTop : profile.trim.heightMm / 2 + stripTop;
            const left = front ? profile.perforationMm : 0;
            return `<div class="reader-strip" data-reader-strip data-reader-title="${esc(strip.title)}" data-slot="${slot === 0 ? 'top' : 'bottom'}" data-width-mm="${leafWidth}" style="left:${left}mm;top:${top}mm;width:${leafWidth}mm;">${strip.html}<span class="strip-mark" data-part="strip-mark">${esc(strip.title)} &middot; strip ${strip.strip} of 3</span></div>`;
        }).join('');
        return `<div class="reader-side" data-leaf-side="${front ? 'front' : 'back'}">
<div class="perforation" data-part="perforation" data-distance-mm="${profile.perforationMm}" data-spine-edge="${edge}" style="${edge}:${profile.perforationMm}mm;"></div>
<div class="cut-line" data-part="cut-line" data-position-mm="${profile.trim.heightMm / 2}" style="top:${profile.trim.heightMm / 2}mm;"></div>
${stripHtml}
</div>`;
    });
    return `<div class="reader-leaf" data-reader-leaf data-leaf="${leaf}">${html.join('')}</div>`;
}

/**
 * Compiles the reader pages of the given weeks (spec FR-5) to one print HTML document.
 * @param weeks The parsed weeks in week order; each week has its 2 readers.
 * @param o The print profile, the mode, and the output (`workbook` leaves or `a3-color` pages).
 * @returns The HTML of the reader document.
 * @throws Error When a week has no readers, a reader has no 8 story pages, a cover text breaks
 *   the copy rule (FR-6.3), or (final mode) a picture file is missing (FR-5.6).
 */
export function compileStorytimeReaders(weeks: StorytimeWeek[], o: StorytimeReaderOptions): { html: string } {
    if (!weeks.length) throw new Error('no weeks');
    const body: string[] = [];
    for (const week of weeks) {
        if (!week.books.length) throw new Error(`week ${week.meta.week} has no readers`);
        const all = rowsByBook(week);
        const books = week.books
            .map((book, i) => ({ book, rows: all[i] }))
            .filter(({ book }) => !o.bookTitle || book.title === o.bookTitle)
            .map(({ book, rows }) => ({ book, rows, pages: readerPages(week, book, rows, o) }));
        if (!books.length) throw new Error(`week ${week.meta.week} has no reader "${o.bookTitle ?? ''}"`);
        if (o.output === 'a3-color') {
            for (const entry of books) {
                body.push(`<section class="reader-book" data-reader-title="${esc(entry.book.title)}" data-reader-output="a3-color">${entry.pages
                    .map((page) => `<section class="a3-page" data-a3-page data-page-size="${A3_PAGE_SIZE}" data-page-number="${page.number}"><div class="a3-scale">${readerPageHtml(page, o.profile)}</div></section>`)
                    .join('')}</section>`);
            }
            continue;
        }
        // FR-5.1 and R32: 3 strips for each reader, 2 strips on each A4 leaf. The leaf holds strip
        // 1 and 2, then strip 3 and the next reader's strip 1, and then the last two strips, so the
        // two readers of a week fill 3 leaves.
        const sides = storytimeReaderStripSides(week, o);
        for (let leaf = 0; leaf < sides.length / 4; leaf++) {
            body.push(leafHtml(leaf + 1, sides.slice(leaf * 4, leaf * 4 + 4), o.profile));
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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateQRCode } from '../../qr-generator';
import { THAI } from '../../document-wrapper/print-fonts';
import { STORYTIME_ROOT } from '../files';
import type { StorytimeCheckItem, StorytimeWeek } from '../schema';
import { storytimePrintPictures, type StorytimePictureRow } from './pictures';
import type { StorytimePrintProfile } from './profile';

/**
 * The student workbook template (spec FR-3, design §8): one black-and-white A4 book per unit,
 * built from the week packages. Every physical side is a `.student-page` with its
 * `data-page-kind` and 1-based `data-page-number`; printed elements carry stable `data-part`
 * hooks. The weekly spread starts on a left page (a blank aligns it when needed), the home-card
 * leaf carries no student work, and every tear-out leaf is perforated 12 mm from the
 * parity-dependent spine (P2). The reader leaves hold empty strip boxes until Phase 4 adds the
 * reader content (plan, Phase 2 Red contract). All ink is black on white: no gray fill, because
 * the print profile converts a gray to four-color black (strategy 5.1).
 */

/** One side of a physical sheet before the page numbers are assigned. */
interface PageSpec {
    kind: string;
    body: string;
}

export interface StorytimeStudentBookOptions {
    profile: StorytimePrintProfile;
    mode: 'proof' | 'final';
}

/** The P11 default title of the unit book (spec P11: release 1 is unit 1 only). */
const studentBookTitle = (week: StorytimeWeek): string =>
    `Storytime Advantage, Level ${week.meta.level}, Unit ${week.meta.unit}, Student Book`;

/** The teaching weeks of a unit: 7 decodable readers plus the unit sticker (spec P1, D2 item 1). */
const DECODABLE_WEEKS_PER_UNIT = 7;

/** The folder that holds the Forge picture files for a level (spec FR-2, FR-9). */
const pictureDirOf = (week: StorytimeWeek): string => path.join(STORYTIME_ROOT, `l${week.meta.level}`, 'print', 'pictures');

/** HTML-escapes a text of the week packages. */
const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Wraps each run between spaces of a Thai text in a `white-space: nowrap` span, so that Chrome
 * breaks the line between runs and never inside a compound word (lessons-learned, 2026-10-07).
 * The joined text of the runs equals the whitespace-normalized source.
 * @param text The Thai text.
 * @returns The HTML.
 */
const thaiText = (text: string): string =>
    text.split(/\s+/).filter(Boolean).map((run) => `<span class="th-run">${esc(run)}</span>`).join(' ');

interface PrintFace {
    family: 'Andika' | 'Sarabun';
    weight: number;
    file: string;
    format: 'truetype' | 'opentype' | 'woff' | 'woff2';
    unicodeRange?: string;
}

/**
 * The static OFL faces of the workbook (spec FR-3: Andika for English, Sarabun for Thai; no
 * package change). One face per weight in use, so Chrome embeds no synthesized face (which
 * would become a Type 3 font in the PDF/X file, lessons-learned 2026-10-02).
 */
const PRINT_FACES: PrintFace[] = [
    { family: 'Andika', weight: 400, file: 'andika-regular.ttf', format: 'truetype' },
    { family: 'Andika', weight: 700, file: 'andika-bold.ttf', format: 'truetype' },
    { family: 'Sarabun', weight: 400, file: 'sarabun-thai-400-normal.woff2', format: 'woff2', unicodeRange: THAI },
];

/** The folder with the print font files (the Fontsource builds and the Andika TTFs). */
const PRINT_FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'print-fonts');

let cachedFontCss: string | undefined;

/**
 * The `@font-face` rules of the workbook, with each static face as a `file:` URL, so that a
 * `file://` render in Chrome and the tests load the same faces. The faces are not data URLs:
 * a base64 blob can contain a forbidden label by chance (the R28 label check reads the whole
 * HTML), and a static file needs no embedding.
 * @returns The CSS.
 */
function fontFaceCss(): string {
    if (cachedFontCss) return cachedFontCss;
    cachedFontCss = PRINT_FACES.map((f) => {
        const range = f.unicodeRange ? ` unicode-range: ${f.unicodeRange};` : '';
        return `@font-face { font-family: '${f.family}'; font-weight: ${f.weight}; font-style: normal; src: url('file://${PRINT_FONT_DIR}/${f.file}') format('${f.format}');${range} }`;
    }).join('\n');
    return cachedFontCss;
}

/**
 * The document CSS: the page size from the profile trim (one `@page` rule), the black-on-white
 * palette, and the Thai nowrap rule. The page sides sit 0.5 mm short of the trim, so that
 * Paged.js never spills a side onto an extra page (the shortfall is invisible on white paper).
 * @param profile The print profile.
 * @returns The CSS text.
 */
function pageCss(profile: StorytimePrintProfile): string {
    const { widthMm, heightMm } = profile.trim;
    return `${fontFaceCss()}
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #000; background: #fff; }
.student-page { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; break-after: page; page-break-after: always; padding: 14mm; }
.student-page:last-of-type { break-after: auto; page-break-after: auto; }
[lang="th"], .th-run { font-family: 'Sarabun', 'Andika', sans-serif; font-weight: 400; }
.th-run { white-space: nowrap; }
.page-title { font-weight: 700; }
.belongs { margin-top: 60mm; font-size: 20pt; }
.name-write-line { display: block; width: 120mm; border-bottom: 0.6mm solid #000; margin: 8mm 0 0 20mm; height: 12mm; }
.map-grid { display: flex; flex-wrap: wrap; gap: 6mm; margin-top: 10mm; }
.map-place { width: 40mm; height: 34mm; border: 0.6mm dashed #000; display: flex; align-items: flex-end; justify-content: center; }
.map-place-label { font-size: 10pt; padding: 2mm; }
.letter-box { border: 0.6mm solid #000; padding: 6mm; margin-top: 8mm; }
.letter-model { width: 46mm; height: 55mm; display: block; }
.model-letter { font-family: 'Andika', sans-serif; font-size: 92px; }
.formation-words { font-size: 12pt; margin-top: 4mm; }
.trace-row { display: flex; gap: 8mm; margin-top: 6mm; }
.trace-cell { width: 26mm; height: 26mm; border: 0.6mm solid #000; display: flex; align-items: center; justify-content: center; font-size: 44pt; }
.practice-sheet { margin-top: 8mm; }
.practice-line { display: flex; align-items: center; gap: 6mm; margin-top: 6mm; }
.practice-picture { width: 30mm; height: 30mm; }
.practice-text { font-size: 20pt; border-bottom: 0.4mm solid #000; flex: 1; padding: 2mm 0; }
.picture-box { border: 0.6mm dashed #000; display: flex; align-items: center; justify-content: center; font-size: 9pt; }
.picture-box img { width: 100%; height: 100%; object-fit: contain; }
.dictation-line { font-size: 18pt; margin-top: 4mm; }
.dictation-line span { display: inline-block; min-width: 18mm; border-bottom: 0.4mm solid #000; margin-right: 6mm; text-align: center; }
.writing-trace { font-size: 22pt; border-bottom: 0.6mm solid #000; display: block; padding: 3mm 0; margin-top: 10mm; }
.write-line { display: block; border-bottom: 0.6mm solid #000; height: 14mm; margin-top: 8mm; }
.picture-draw-box { width: 70mm; height: 55mm; border: 0.6mm solid #000; margin-top: 10mm; }
.check-row { display: flex; gap: 8mm; margin-top: 10mm; }
.check-row .picture-box { width: 40mm; height: 40mm; }
.check-write-letter { display: block; width: 26mm; height: 26mm; border: 0.6mm solid #000; margin-top: 10mm; }
.check-cue { font-size: 11pt; margin-top: 10mm; }
.home-card-title { font-size: 14pt; font-weight: 700; }
.home-line { font-size: 13pt; margin-top: 8mm; }
.home-sound { font-size: 26pt; font-weight: 700; margin-top: 8mm; }
.home-words { display: flex; gap: 10mm; margin-top: 8mm; font-size: 20pt; border-bottom: 0.6mm solid #000; padding-bottom: 2mm; }
.home-frame { font-size: 18pt; margin-top: 8mm; }
.home-activity { font-size: 12pt; margin-top: 8mm; }
.qr-row { display: flex; gap: 14mm; margin-top: 10mm; }
.qr { width: 42mm; }
.qr svg { width: 40mm; height: 40mm; display: block; }
.qr-label { font-size: 9pt; }
.qr-note { font-size: 9pt; margin-top: 6mm; }
.song-lines { margin-top: 8mm; font-size: 11pt; }
.song-lines p { padding: 1mm 0; }
.strip-mark { position: absolute; top: 1mm; left: 2mm; font-size: 7pt; }
.cut-line { position: absolute; left: ${profile.perforationMm}mm; width: ${2 * profile.readerPage.widthMm}mm; border-top: 0.4mm dashed #000; }
.perforation { position: absolute; top: 0; height: 100%; width: 0.5mm; border-left: 0.5mm dashed #000; }
.blank-page { }`;
}

/** One blank side that aligns a spread or a tear-out leaf (allowed by the page-order contract). */
const blankPage = (): PageSpec => ({ kind: 'blank', body: '' });

/** The perforation mark of a tear-out side: 12 mm from the parity-dependent spine (P2). */
const perforationMark = (pageNumber: number, profile: StorytimePrintProfile): string => {
    const edge = pageNumber % 2 ? 'left' : 'right';
    return `<div class="perforation" data-part="perforation" data-spine-edge="${edge}" style="position:absolute;top:0;${edge}:${profile.perforationMm}mm;"></div>`;
};

/**
 * The picture element of a picture-list row: a proof placeholder box, or (final mode) the
 * line-art picture file (FR-9: the workbook prints line art only). A final build stops and
 * names the picture id when the file is missing (FR-5.6).
 * @param row The picture-list row.
 * @param week The week that needs the picture.
 * @param o The compile options.
 * @param className The extra class of the box.
 * @returns The HTML.
 */
function pictureElement(row: StorytimePictureRow, week: StorytimeWeek, o: StorytimeStudentBookOptions, className: string): string {
    const dir = pictureDirOf(week);
    const file = path.join(dir, row.fileName);
    if (o.mode === 'final') {
        if (!fs.existsSync(file)) throw new Error(`picture missing: ${row.id} (${row.fileName})`);
        return `<div class="picture-box ${className}" data-picture-id="${row.id}" data-picture-file="${row.lineArtFileName}"><img src="file://${file}" alt=""></div>`;
    }
    return `<div class="picture-box ${className}" data-picture-id="${row.id}" data-picture-file="${row.lineArtFileName}">PICTURE MISSING</div>`;
}

/** The name page ("This book belongs to") and the P11 title. */
function namePage(week: StorytimeWeek): PageSpec {
    const body = `<h1 class="page-title" data-part="title">${esc(studentBookTitle(week))}</h1>
<p class="belongs">This book belongs to</p>
<span class="name-write-line" data-student-work></span>`;
    return { kind: 'name', body };
}

/** The book map: one sticker place for each decodable reader and one for the unit (FR-3). */
function bookMapPage(): PageSpec {
    const places = [
        ...Array.from({ length: DECODABLE_WEEKS_PER_UNIT }, (_v, i) => `decodable-${i + 1}`),
        'unit-1',
    ];
    const body = `<h2 class="page-title">My book map</h2>
<div class="map-grid">${places.map((place) => `<div class="map-place" data-sticker="${place}"><span class="map-place-label">${esc(place.startsWith('unit') ? 'Unit 1' : `Week ${place.split('-')[1]}`)}</span></div>`).join('')}</div>`;
    return { kind: 'book-map', body };
}

/**
 * The left page of the weekly spread: the letter formation box and the practice sheet (FR-3).
 * The formation box shows the letter with the start dot, the formation arrows, three trace
 * copies, and one write space.
 */
function practicePage(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions): PageSpec {
    const box = week.print!.letterBox;
    const practiceRows = week.print!.practice.map((line) => rows.find((r) => r.use === 'practice-line' && r.text === line.pictureWord));
    const arrowId = `st-arrow-w${week.meta.week}`;
    const body = `<h2 class="page-title">Week ${week.meta.week}: the sound ${esc(week.focus.element?.sound ?? '')}</h2>
<div class="letter-box" data-part="letter-box">
  <svg class="letter-model" viewBox="0 0 100 120" aria-hidden="true">
    <defs><marker id="${arrowId}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="#000"/></marker></defs>
    <text class="model-letter" data-part="letter" x="56" y="108" text-anchor="middle">${esc(box.letter)}</text>
    <circle data-part="start-dot" data-start-point="${esc(box.startPoint)}" cx="26" cy="22" r="3"/>
    <path d="M26 28 L26 104" fill="none" stroke="#000" marker-end="url(#${arrowId})" data-part="formation-arrow"/>
    <path d="M26 72 C26 44 72 44 72 72 L72 104" fill="none" stroke="#000" marker-end="url(#${arrowId})" data-part="formation-arrow"/>
  </svg>
  <p class="formation-words" data-part="formation-words">${esc(box.formationWords)}</p>
  <div class="trace-row">
    <span class="trace-cell"><span data-part="trace-letter">${esc(box.letter)}</span></span>
    <span class="trace-cell"><span data-part="trace-letter">${esc(box.letter)}</span></span>
    <span class="trace-cell"><span data-part="trace-letter">${esc(box.letter)}</span></span>
    <span class="trace-cell"><span class="write-letter" data-part="write-letter" data-student-work></span></span>
  </div>
</div>
<div class="practice-sheet" data-part="practice-sheet">
${week.print!.practice.map((line, i) => {
    const row = practiceRows[i];
    if (!row) throw new Error(`picture row missing for the practice word "${line.pictureWord}" of week ${week.meta.week}`);
    return `<div class="practice-line">${pictureElement(row, week, o, 'practice-picture')}<span class="practice-text" data-part="practice-text">${esc(line.text)}</span></div>`;
}).join('\n')}
</div>`;
    return { kind: 'practice', body };
}

/** The right page of the weekly spread: the dictation lines and the writing page (FR-3, C3, D4). */
function writingPage(week: StorytimeWeek): PageSpec {
    const print = week.print!;
    const body = `<h2 class="page-title">Write</h2>
<div data-part="dictation" class="dictation-line">${print.dictation.letters.map((l) => `<span data-part="dictation-letter">${esc(l)}</span>`).join('')}${print.dictation.words.map((w) => `<span data-part="dictation-word">${esc(w)}</span>`).join('')}</div>
<span class="writing-trace" data-part="writing-trace">${esc(print.writing.traceText)}</span>
<span class="write-line" data-part="${print.writing.line}-line" data-line="${print.writing.line}" data-student-work></span>
${print.writing.pictureBox ? '<div class="picture-draw-box" data-part="writing-picture-box" data-student-work></div>' : ''}`;
    return { kind: 'writing', body };
}

/** The picture-sound page of the Friday check: the rows of `check.items`, with no answer mark. */
function checkPage(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions): PageSpec {
    const rowByName = new Map(rows.filter((r) => r.use === 'check-row').map((r) => [r.text, r]));
    const itemHtml = (item: StorytimeCheckItem): string => {
        if (item.kind === 'circle-picture') {
            const pictures = item.pictures.map((word) => {
                const row = rowByName.get(word);
                if (!row) throw new Error(`picture row missing for the check word "${word}" of week ${week.meta.week}`);
                return pictureElement(row, week, o, '');
            });
            return `<div class="check-row" data-part="check-row">${pictures.join('')}</div>`;
        }
        if (item.kind === 'write-letter') return `<span class="check-write-letter" data-part="check-write-letter" data-student-work></span>`;
        if (item.kind === 'write-word') return `<p class="check-cue" data-student-work>${esc(item.word)}: </p>`;
        if (item.kind === 'picture-sort') {
            return item.groups.map((g) => `<div class="check-row" data-part="check-row">${g.pictures.map((word) => {
                const row = rowByName.get(word);
                if (!row) throw new Error(`picture row missing for the check word "${word}" of week ${week.meta.week}`);
                return pictureElement(row, week, o, '');
            }).join('')}</div>`).join('');
        }
        return `<p class="check-cue" data-student-work>${item.words.map(esc).join('   ')}</p>`;
    };
    const body = `<h2 class="page-title">Week ${week.meta.week} check</h2>
<p class="check-cue">Circle the picture. Write the letter.</p>
${week.check.items.map(itemHtml).join('\n')}`;
    return { kind: 'check', body };
}

/** The two sides of the home-card leaf (FR-3): the Thai card with the QR codes, then the English card. */
function homePages(week: StorytimeWeek, mode: 'proof' | 'final'): PageSpec[] {
    const home = week.home;
    if (!home) throw new Error(`week ${week.meta.week} has no home card`);
    const qr = (url: string | undefined, label: string): string => {
        if (!url) return '';
        const address = `https://storytime.reading-advantage.com${url}`;
        const svg = generateQRCode(address);
        if (!svg) throw new Error(`QR code failed for ${address}`);
        return `<span class="qr" data-qr-input="${esc(address)}">${svg}<span class="qr-label">${esc(label)}</span></span>`;
    };
    const words = home.words.map((w) => `<span data-part="home-word">${esc(w)}</span>`).join('');
    const front = `<h2 class="home-card-title">Storytime Advantage</h2>
<p class="home-line" data-part="home-line" lang="th">${thaiText(home.line.th)}</p>
<p class="home-sound" data-part="home-sound">${esc(week.focus.element?.sound ?? '')}</p>
<div class="home-words">${words}</div>
<p class="home-frame" data-part="home-frame">${esc(week.focus.frame)}</p>
<p class="home-activity" data-part="home-activity" lang="th">${thaiText(home.activity.th)}</p>
<div class="qr-row">${qr(home.songUrl, 'The song of the week')}${qr(home.readAlongUrl, 'The book of the week')}</div>
${mode === 'proof' ? '<p class="qr-note">QR target answers after the deploy (monorepo task 7.4)</p>' : ''}`;
    const songLines = week.song
        ? week.song.lines.map((line) => `<p data-part="song-line">${esc(line.text)}</p>`).join('')
        : '<p data-part="song-line">The songs of unit 1</p>';
    const back = `<h2 class="home-card-title">Storytime Advantage</h2>
<p class="home-line" data-part="home-line">${esc(home.line.en)}</p>
<div class="home-words">${words}</div>
<p class="home-frame" data-part="home-frame">${esc(week.focus.frame)}</p>
<p class="home-activity" data-part="home-activity">${esc(home.activity.en)}</p>
<div class="song-lines">${songLines}</div>`;
    return [
        { kind: 'home-front', body: front },
        { kind: 'home-back', body: back },
    ];
}

/**
 * The three reader leaves of a week (FR-5.1): 3 strips for each book, 2 strips on each A4 leaf,
 * with the dashed cut line across the middle. The strip boxes stay empty until Phase 4 adds the
 * reader content; each strip carries the small mark with the reader and the strip number.
 */
function readerPages(week: StorytimeWeek, profile: StorytimePrintProfile): PageSpec[] {
    const strips = week.books.flatMap((book) => [1, 2, 3].map((n) => ({ kind: book.kind, title: book.title, n })));
    if (strips.length !== 6) throw new Error(`week ${week.meta.week} needs 2 books of 3 strips, got ${strips.length}`);
    const leafWidth = 2 * profile.readerPage.widthMm;
    const sides: PageSpec[] = [];
    for (let leaf = 0; leaf < 3; leaf++) {
        for (const isBack of [false, true]) {
            const slotStrips = [strips[leaf * 2], strips[leaf * 2 + 1]];
            const stripHtml = (strip: (typeof strips)[number], slot: number): string => {
                const top = slot * profile.trim.heightMm / 2;
                const left = isBack ? 0 : profile.perforationMm;
                return `<div class="reader-strip" data-part="reader-strip" data-reader="${strip.kind}" data-strip="${strip.n}" data-slot="${slot === 0 ? 'top' : 'bottom'}" style="position:absolute;left:${left}mm;top:${top}mm;width:${leafWidth}mm;height:${profile.readerPage.heightMm}mm;"><span class="strip-mark">${esc(strip.title)} &middot; strip ${strip.n} of 3${isBack ? ' (back)' : ''}</span></div>`;
            };
            const body = `${stripHtml(slotStrips[0], 0)}${stripHtml(slotStrips[1], 1)}
<div class="cut-line" style="position:absolute;top:${profile.readerPage.heightMm + (profile.trim.heightMm - profile.readerPage.heightMm * 2) / 4}mm;"></div>`;
            sides.push({ kind: 'reader', body });
        }
    }
    return sides;
}

/**
 * Compiles the student workbook of one unit from its week packages (spec FR-3).
 * @param weeks The parsed weeks of the unit, in week order. Review weeks are not part of this
 *   phase yet; they throw with a clear message.
 * @param o The print profile (one constant holds the trim) and the build mode. In `final` mode
 *   a missing picture file stops the build and names the picture id (FR-5.6); in `proof` mode
 *   the picture boxes print the placeholder.
 * @returns The print HTML of the whole book.
 */
export function compileStorytimeStudentBook(weeks: StorytimeWeek[], o: StorytimeStudentBookOptions): { html: string } {
    if (!weeks.length) throw new Error('no weeks');
    const specs: PageSpec[] = [namePage(weeks[0]), bookMapPage()];
    for (const week of weeks) {
        if (week.meta.kind === 'review') throw new Error(`student book: the review pages of week ${week.meta.week} come with the weeks 2 to 8 phase`);
        if (!week.print) throw new Error(`student book: week ${week.meta.week} has no print block`);
        const rows = storytimePrintPictures([week]);
        const weekPages: PageSpec[] = [
            practicePage(week, rows, o),
            writingPage(week),
            checkPage(week, rows, o),
            ...homePages(week, o.mode),
            ...readerPages(week, o.profile),
        ];
        // The weekly spread starts on a left page (a 0-based odd index), so that its two pages
        // face each other; the home leaf and the reader leaves then start on a leaf front.
        if (specs.length % 2 === 0) specs.push(blankPage());
        specs.push(...weekPages);
    }
    const sides = specs
        .map((spec, i) => `<section class="student-page" data-page-kind="${spec.kind}" data-page-number="${i + 1}">${spec.body}${['reader', 'home-front', 'home-back'].includes(spec.kind) ? perforationMark(i + 1, o.profile) : ''}</section>`)
        .join('\n');
    return { html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(studentBookTitle(weeks[0]))}</title>
<style>
${pageCss(o.profile)}
</style>
</head>
<body>
${sides}
</body>
</html>` };
}

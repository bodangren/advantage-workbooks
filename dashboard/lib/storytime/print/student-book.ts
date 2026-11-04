import path from 'path';
import { pathToFileURL } from 'node:url';
import { generateQRCode } from '../../qr-generator';
import { STORYTIME_ROOT, storytimeQrUrl } from '../files';
import type { StorytimeCheckItem, StorytimeWeek } from '../schema';
import { storytimePrintPictures, storytimePrintPracticePicture, type StorytimePictureRow } from './pictures';
import { resolveStorytimePictureFiles, type StorytimePictureFile } from './picture-check';
import { dictationRowKind } from './taught-letters';
import { iconSvg } from './icons';
import { LETTER_BOX, LETTER_CELL_MM, LETTER_GUIDE, letterStrokeData } from './letter-strokes';
import { fontFaceCss } from './print-fonts';
import { readerFoldLabelsHtml, readerLeafMarkCss, readerPageCss, readerTearOutHtml, storytimeReaderLeafSides } from './readers';
import type { StorytimePrintProfile } from './profile';
import { STORYTIME_CHECK_ROW_TYPES, STORYTIME_DAY_KEY, STORYTIME_ICON_KEY, storytimeStep, type StorytimeIcon } from './step-map';
import { TRACE_LINE, traceLineLayout } from './trace-words';

/**
 * The student workbook template (spec FR-3, design §8): one black-and-white A4 book per unit,
 * built from the week packages. Every physical side is a `.student-page` with its
 * `data-page-kind` and 1-based `data-page-number`; printed elements carry stable `data-part`
 * hooks. The weekly spread starts on a left page (a blank aligns it when needed), the home-card
 * leaf carries no student work, and every tear-out leaf is perforated 12 mm from the
 * parity-dependent spine (P2). The reader leaves hold empty strip boxes until Phase 4 adds the
 * reader content (plan, Phase 2 Red contract). The text ink is the trace gray #b0b0b0 (a K tone
 * of about 31 %) and the guide and line ink is black; the --k-only PDF/X conversion keeps the
 * C, M, and Y plates empty (D2, spec FR-3).
 */

/** One side of a physical sheet before the page numbers are assigned. */
interface PageSpec {
    kind: string;
    body: string;
    /** True for a sound, write, or check page: it gets the page number at the bottom right (A-48). */
    numbered?: boolean;
}

/** The options for compiling one complete Storytime student book. */
export interface StorytimeStudentBookOptions {
    profile: StorytimePrintProfile;
    mode: 'proof' | 'final';
    /** Final-build picture row ids that Forge has not delivered yet. */
    pendingPictures?: string[];
}

/** The P11 default title of the unit book (spec P11: release 1 is unit 1 only). */
const studentBookTitle = (week: StorytimeWeek): string =>
    `Storytime Advantage, Level ${week.meta.level}, Unit ${week.meta.unit} Student Book`;

/** The teaching weeks of a unit: 7 decodable readers plus the unit sticker (spec P1, D2 item 1). */
const DECODABLE_WEEKS_PER_UNIT = 7;

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

/**
 * The document CSS: the page size from the profile trim (one `@page` rule), the black-on-white
 * palette, the Thai nowrap rule, and the reader page rules of `readers.ts` (one face set and one
 * reader page look for the workbook and the readers build). The page sides sit 0.5 mm short of the trim, so that
 * Paged.js never spills a side onto an extra page (the shortfall is invisible on white paper).
 * @param profile The print profile.
 * @returns The CSS text.
 */
function pageCss(profile: StorytimePrintProfile): string {
    const { widthMm, heightMm } = profile.trim;
    return `${fontFaceCss()}
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
/* The default ink of the book is the trace gray: raster 176, a K tone of 31 % (D2). The
 * page scope resets to black, and each trace item opts back into the gray. */
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #b0b0b0; background: #fff; }
.student-page { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; break-after: page; page-break-after: always; padding: 14mm; color: #000; }
.student-page:last-of-type { break-after: auto; page-break-after: auto; }
[lang="th"], .th-run { font-family: 'Sarabun', 'Andika', sans-serif; font-weight: 400; }
.th-run { white-space: nowrap; }
.page-title { font-weight: 700; }
.belongs { margin-top: 30mm; font-size: 20pt; }
.name-write-line { display: block; width: 120mm; border-bottom: 0.6mm solid #000; margin: 8mm 0 0 20mm; height: 12mm; }
.map-grid { display: flex; flex-wrap: wrap; gap: 6mm; margin-top: 10mm; }
.map-place { width: 40mm; height: 34mm; border: 0.6mm dashed #000; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 2mm; }
.map-number { font-size: 22pt; font-weight: 700; line-height: 1; }
.map-place-unit .map-number { font-size: 14pt; }
.map-star { display: block; width: 9mm; height: 9mm; }
.map-page { font-size: 9pt; margin-top: 1mm; }
.map-line { font-size: 12pt; margin-top: 6mm; }
.letter-box { }
.page-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm; }
.week-label { font-size: 9pt; }
.page-number { position: absolute; right: 14mm; bottom: 8mm; font-size: 9pt; color: #000; }
.step-block { border: 0.6mm solid #000; padding: 3mm 4mm 4mm; margin-top: 5mm; break-inside: avoid; }
.step-head { display: flex; align-items: center; gap: 3mm; margin-bottom: 3mm; }
.step-badge { display: inline-block; font-size: 8pt; line-height: 1.2; background: #d9d9d9; color: #000; padding: 0.6mm 1.8mm; }
.step-icons { display: flex; gap: 1mm; }
.step-icon { width: 11mm; height: 11mm; display: block; flex: none; }
.step-title { font-size: 13pt; font-weight: 700; }
.row-icons { display: flex; gap: 1mm; }
.row-icon { width: 8mm; height: 8mm; display: block; flex: none; }
.row-number { display: flex; flex: none; align-items: center; justify-content: center; width: 7mm; height: 7mm; border: 0.4mm solid #000; border-radius: 50%; font-size: 10pt; font-weight: 700; }
.row-label { font-size: 10pt; flex: none; }
.work-row { display: flex; align-items: center; gap: 3mm; margin-top: 4mm; }
.trace-row { display: flex; gap: 4mm; margin-top: 2mm; }
.cell-col { display: flex; flex-direction: column; align-items: center; gap: 1mm; }
.cell-label { font-size: 8pt; }
.letter-cell { display: block; width: 25.2mm; height: 30mm; border: 0.6mm solid #000; }
.letter-model { width: ${LETTER_CELL_MM.width}mm; height: ${LETTER_CELL_MM.height}mm; display: block; }
.model-letter { font-family: 'Andika', sans-serif; font-size: ${LETTER_BOX.fontSize}px; }
.write-letter { display: block; width: 100%; height: 100%; }
.formation-words { font-size: 12pt; margin-top: 3mm; }
/* The trace items the children follow print in the trace gray, never solid black (D2). The letter
 * of a trace cell and the words of a trace line are SVG text, so the gray is a fill. The black
 * start dots are circles with the default black fill. */
.student-page [data-part="trace-letter"],
.student-page [data-part="writing-trace"] text,
.student-page [data-part="dictation-trace"] text,
.student-page [data-part="dictation-word-trace"] text,
.student-page [data-part="choice-word-trace"] text { fill: #b0b0b0; color: #b0b0b0; }
.practice-sheet { margin-top: 0; }
.practice-line { display: flex; align-items: center; gap: 4mm; margin-top: 4mm; }
.practice-pictures { display: flex; gap: 3mm; flex: none; }
.practice-picture { width: 30mm; height: 30mm; }
.practice-text { font-size: 20pt; line-height: 12mm; flex: 1; }
.practice-text-rule { display: block; position: relative; overflow: hidden; }
.practice-rule-line { position: absolute; left: 0; right: 0; height: 0; border-top: 0.4mm solid #000; }
.picture-box { border: 0.6mm dashed #000; display: flex; align-items: center; justify-content: center; font-size: 9pt; }
.picture-box img { width: 100%; height: 100%; object-fit: contain; }
.dictation-rows { }
.box-group { display: flex; gap: 4mm; }
.letter-slot, .sound-box { display: block; flex: none; border: 0.6mm solid #000; }
.letter-slot { width: 18mm; height: 18mm; }
.sound-box { width: 15mm; height: 15mm; }
.trace-line { display: block; overflow: visible; }
.writing-trace { display: block; flex: 1; border-bottom: 0.6mm solid #000; }
.write-line { display: block; flex: 1; border-bottom: 0.6mm solid #000; height: 12mm; }
.picture-draw-box { width: 70mm; height: 50mm; border: 0.6mm solid #000; }
.draw-boxes { display: flex; gap: 4mm; }
.picture-draw-box.draw-box-half { width: 64mm; height: 44mm; }
.prompt-picture { width: 38mm; height: 38mm; }
.choice-words { display: flex; flex-wrap: wrap; gap: 3mm 8mm; flex: 1; }
.choice-word { display: block; }
.choice-word .writing-trace { display: block; flex: none; }
.tricky-row { display: flex; flex-wrap: wrap; gap: 6mm; }
.tricky-card { border: 0.6mm solid #000; padding: 2mm 7mm; font-size: 24pt; }
.row-group-head { display: flex; align-items: center; gap: 2mm; margin-top: 5mm; }
.row-group-head .check-cue { margin-top: 0; font-size: 13pt; }
.check-item { display: flex; align-items: center; gap: 4mm; margin-top: 3mm; }
.check-item .check-row { margin-top: 0; gap: 5mm; }
.check-item .circle-word-row { margin-top: 0; }
.check-item .check-row .picture-box { width: 32mm; height: 32mm; }
.check-item .check-write-letter { margin-top: 0; width: 22mm; height: 22mm; }
.check-write-word { display: flex; gap: 3mm; }
.score-strip { position: absolute; right: 14mm; bottom: 17mm; font-size: 12pt; border: 0.4mm solid #000; padding: 1.5mm 4mm; }
.score-blank { display: inline-block; width: 12mm; border-bottom: 0.4mm solid #000; margin-right: 1mm; }
.icon-key { margin-top: 24mm; border-top: 0.4mm solid #000; padding-top: 5mm; }
.key-title { font-size: 11pt; margin-bottom: 4mm; }
.key-grid { display: flex; flex-wrap: wrap; gap: 5mm 8mm; }
.key-item { display: flex; align-items: center; gap: 3mm; width: 54mm; font-size: 11pt; }
.key-days { display: flex; gap: 8mm; margin-top: 8mm; font-size: 11pt; }
.check-row { display: flex; gap: 8mm; margin-top: 10mm; }
.check-row .picture-box { width: 40mm; height: 40mm; }
.picture-sort { display: block; margin-top: 3mm; }
.picture-sort-group { flex: 1; min-width: 0; text-align: center; }
.picture-sort-group .check-row { justify-content: center; flex-wrap: wrap; }
.picture-sort-group .picture-box { width: 28mm; height: 28mm; }
.sort-label { font-size: 16pt; }
.circle-word-row { display: flex; gap: 8mm; margin-top: 8mm; }
.circle-word { padding: 3mm 5mm; font-size: 18pt; }
.check-write-letter { display: block; width: 26mm; height: 26mm; border: 0.6mm solid #000; margin-top: 10mm; }
.benchmark-row, .sound-row, .match-row { display: flex; align-items: center; gap: 4mm; margin-top: 3mm; }
.benchmark-pictures, .sound-pictures { display: flex; gap: 4mm; }
.benchmark-row .picture-box { width: 25mm; height: 25mm; }
.sound-row .picture-box { width: 26mm; height: 26mm; }
.review-dense .sound-row { margin-top: 2mm; }
.review-dense .sound-row .picture-box { width: 17mm; height: 17mm; }
.match-row.review-dense { margin-top: 1mm; }
.match-row.review-dense .match-target { padding: 1mm 4mm; font-size: 16pt; }
.match-row.review-dense .circle-word { padding: 1mm 4mm; font-size: 16pt; }
.position-mark { display: block; flex: none; }
.row-group-head .position-mark { margin-left: 2mm; }
.sound-label { display: block; flex: none; width: 16mm; font-size: 16pt; font-weight: 700; text-align: center; }
.match-target { display: block; flex: none; min-width: 28mm; border: 0.6mm solid #000; padding: 2mm 5mm; font-size: 18pt; text-align: center; }
.match-choices { display: flex; gap: 8mm; margin-left: 4mm; padding-left: 8mm; border-left: 0.6mm dotted #000; }
.benchmark-boxes { display: flex; flex-wrap: wrap; gap: 8mm 12mm; margin-top: 8mm; }
.benchmark-box { display: flex; align-items: center; gap: 3mm; }
.benchmark-box .check-write-letter { margin-top: 0; width: 24mm; height: 24mm; }
.check-cue { font-size: 11pt; margin-top: 10mm; }
.home-card-title { font-size: 14pt; font-weight: 700; }
.home-week { font-size: 10pt; margin-top: 1mm; }
.qr-label-th { display: block; }
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
.perforation { position: absolute; top: 0; height: 100%; width: 0.5mm; border-left: 0.5mm dashed #000; }
.student-page[data-page-kind="reader"] { overflow: hidden; padding: 0; }
.student-page[data-page-kind="reader"] > .reader-page { position: absolute; }
.student-page[data-page-kind="reader"][data-leaf-side="front"] > .reader-page { left: ${profile.perforationMm}mm; }
.student-page[data-page-kind="reader"][data-leaf-side="back"] > .reader-page { left: 0; }
.student-page[data-page-kind="reader"] > .reader-page:nth-of-type(1) { top: 0; }
.student-page[data-page-kind="reader"] > .reader-page:nth-of-type(2) { top: ${profile.readerPage.heightMm}mm; }
.fold-line { position: absolute; z-index: 4; left: 0; width: 100%; top: 148.5mm; border-top: 0.3mm dashed #000; }
.leaf-mark { position: absolute; z-index: 5; top: 2mm; left: ${(profile.trim.widthMm - profile.perforationMm) / 2}mm; transform: translateX(-50%); white-space: nowrap; font-size: 5pt; }
.student-page[data-page-kind="reader"][data-leaf-side="front"] .leaf-mark { left: ${profile.perforationMm + (profile.trim.widthMm - profile.perforationMm) / 2}mm; }
.blank-page { }
${readerPageCss(profile)}
${readerLeafMarkCss(profile)}
`;
}

/** One blank side that aligns a spread or a tear-out leaf (allowed by the page-order contract). */
const blankPage = (): PageSpec => ({ kind: 'blank', body: '' });

/** The perforation mark of a tear-out side: 12 mm from the parity-dependent spine (P2). */
const perforationMark = (pageNumber: number, profile: StorytimePrintProfile, kind: string): string => {
    const edge = pageNumber % 2 ? 'left' : 'right';
    // A reader side prints only 2 short ticks and the scissors label (fix 6); a home card keeps its dashed cut line.
    if (kind === 'reader') return readerTearOutHtml(edge, profile);
    return `<div class="perforation" data-part="perforation" data-spine-edge="${edge}" style="position:absolute;top:0;${edge}:${profile.perforationMm}mm;"></div>`;
};

/**
 * The picture element of a picture-list row: a proof placeholder box, or (final mode) the picture
 * file that the folder manifest resolves into (FR-9: the workbook prints line art only). Final
 * mode loads the line art of the row, never the color file (B-P2-02). The source is a
 * percent-encoded `file:` URL of the resolved path, and the attribute values are HTML-escaped,
 * so a folder name with `"`, `<`, `>`, `#`, `?`, `%`, or a space cannot add markup or give a
 * wrong URL (B-P4-1).
 * @param row The picture-list row.
 * @param o The compile options.
 * @param files The resolved picture files of the weeks, by row id; the map is empty in proof mode.
 * @param className The extra class of the box.
 * @returns The HTML.
 * @throws Error When final mode holds no file for the row (FR-5.6).
 */
function pictureElement(row: StorytimePictureRow, o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>, className: string): string {
    if (o.mode === 'final') {
        if (o.pendingPictures?.includes(row.id)) {
            return `<div class="picture-box ${className}" data-picture-id="${esc(row.id)}" data-picture-file="${esc(row.lineArtFileName)}">PICTURE MISSING</div>`;
        }
        const entry = files.get(row.id);
        if (!entry) throw new Error(`picture missing: ${row.id} (${row.lineArtFileName})`);
        return `<div class="picture-box ${className}" data-picture-id="${esc(row.id)}" data-picture-file="${esc(entry.fileName)}"><img src="${esc(pathToFileURL(entry.file).href)}" alt=""></div>`;
    }
    return `<div class="picture-box ${className}" data-picture-id="${row.id}" data-picture-file="${row.lineArtFileName}">PICTURE MISSING</div>`;
}

/** The icon key of page 1 (A-48): the 6 icons with their short line and Thai word, and the day letters A to E. */
function iconKeyHtml(): string {
    const items = STORYTIME_ICON_KEY.map((entry) => `<div class="key-item"><span data-part="key-icon" data-icon="${entry.icon}">${iconSvg(entry.icon, 'step-icon', 'icon-art')}</span><span class="key-english" data-part="key-english">${esc(entry.english)}</span><span class="key-thai" data-part="key-thai" lang="th">${thaiText(entry.thai)}</span></div>`);
    const days = STORYTIME_DAY_KEY.map((day) => `<span class="key-day" data-part="key-day" data-day="${day.letter}"><b>${day.letter}</b> <span lang="th">${thaiText(day.thai)}</span></span>`);
    return `<div class="icon-key" data-part="icon-key">
<p class="key-title">Key</p>
<div class="key-grid">${items.join('')}</div>
<div class="key-days">${days.join('')}</div>
</div>`;
}

/** The name page ("This book belongs to"), the P11 title, and the icon key. */
function namePage(week: StorytimeWeek): PageSpec {
    const body = `<h1 class="page-title" data-part="title">${esc(studentBookTitle(week))}</h1>
<p class="belongs">This book belongs to</p>
<span class="name-write-line" data-student-work></span>
${iconKeyHtml()}`;
    return { kind: 'name', body };
}

/**
 * The book map: one sticker place for each decodable reader and one for the unit (FR-3). Each place
 * shows its number (the unit place shows the star) and the printed page of its week (B19, B24).
 * @param pageOf The printed page number of the first page of each week, by week number.
 * @param unitPage The printed page where the unit sticker belongs, if the book holds that page.
 */
function bookMapPage(pageOf: ReadonlyMap<number, number>, unitPage?: number): PageSpec {
    const pageLine = (page?: number): string => `<span class="map-page" data-part="map-page">${page === undefined ? '' : `page ${page}`}</span>`;
    const places = Array.from({ length: DECODABLE_WEEKS_PER_UNIT }, (_v, i) =>
        `<div class="map-place" data-sticker="decodable-${i + 1}"><span class="map-number" data-part="map-number">${i + 1}</span>${pageLine(pageOf.get(i + 1))}</div>`);
    places.push(`<div class="map-place map-place-unit" data-sticker="unit-1"><span class="map-star">${iconSvg('star', 'row-icon', 'row-icon')}</span><span class="map-number" data-part="map-number">Unit 1</span>${pageLine(unitPage)}</div>`);
    const body = `<h2 class="page-title">My book map</h2>
<p class="map-line" data-part="map-line">Put the sticker on the number.</p>
<div class="map-grid">${places.join('')}</div>`;
    return { kind: 'book-map', body };
}

/** The week header of a sound, write, or check page: "Week N · สัปดาห์ที่ N" (A-48). */
const weekLabel = (week: number): string =>
    `<span class="week-label" data-part="week-label">Week ${week} · ${thaiText(`สัปดาห์ที่ ${week}`)}</span>`;

/** The head of a step block: the grey badge with the step code, the icons, and the short title (A-48). */
function stepHead(code: string): string {
    const entry = storytimeStep(code);
    return `<div class="step-head"><span class="step-badge" data-part="step-badge" data-step="${esc(entry.code)}">${esc(entry.code)}</span><span class="step-icons">${entry.icons.map((icon) => iconSvg(icon)).join('')}</span><span class="step-title" data-part="step-title">${esc(entry.label)}</span></div>`;
}

/** A framed step block of the step map: the head, then the content. */
function stepBlock(code: string, content: string): string {
    const entry = storytimeStep(code);
    return `<div class="step-block" data-part="step-block" data-step="${esc(entry.code)}" data-block="${esc(entry.block)}">${stepHead(code)}${content}</div>`;
}

/** The numbered start of a row: the row number, the row icons, and the one short line (A-48). */
function rowStart(number: number, icons: StorytimeIcon[], label: string): string {
    return `<span class="row-number" data-part="row-number">${number}</span><span class="row-icons">${icons.map((icon) => iconSvg(icon, 'row-icon', 'row-icon')).join('')}</span><span class="row-label">${esc(label)}</span>`;
}

/** The arrowhead id of a week's letter model. */
const arrowIdOf = (week: StorytimeWeek): string => `st-arrow-w${week.meta.week}`;

/** The six cells of the formation row (page template 8.1): the model, three trace cells, the dot-only cell, and the empty cell. */
function formationCells(week: StorytimeWeek): string {
    const box = week.print!.letterBox;
    const data = letterStrokeData(box.letter);
    const { width, height, centerX, baseline } = LETTER_BOX;
    const view = `0 0 ${width} ${height}`;
    const arrowId = arrowIdOf(week);
    const letterText = (part: string, extra: string): string =>
        `<text class="model-letter" data-part="${part}" x="${centerX}" y="${baseline}" text-anchor="middle"${extra}>${esc(box.letter)}</text>`;
    // The model letter prints in the trace gray and the guide prints in black on top of it (D5). The
    // strokes were measured on the Andika glyph, so that every stroke stays inside the letter.
    const model = `<svg class="letter-model" viewBox="${view}" aria-hidden="true">
    <defs><marker id="${arrowId}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="#000"/></marker></defs>
    ${letterText('letter', ' fill="#b0b0b0"')}
    ${data.strokes.map((stroke) => `<path data-part="formation-arrow" d="${stroke.d}" fill="none" stroke="#000" stroke-width="${LETTER_GUIDE.strokeWidth}" stroke-linecap="round" marker-end="url(#${arrowId})"/>`).join('\n    ')}
    <circle data-part="start-dot" data-start-point="${esc(box.startPoint)}" cx="${data.modelDot.x}" cy="${data.modelDot.y}" r="${LETTER_GUIDE.modelDotRadius}"/>
    ${data.strokes.map((stroke, index) => `<text data-part="stroke-number" x="${stroke.number.x}" y="${stroke.number.y}" font-size="${LETTER_GUIDE.numberSize}" font-weight="700" text-anchor="middle">${index + 1}</text>`).join('\n    ')}
  </svg>`;
    const trace = `<svg class="letter-model" viewBox="${view}" aria-hidden="true">${letterText('trace-letter', '')}<circle data-part="trace-dot" cx="${data.traceDot.x}" cy="${data.traceDot.y}" r="${LETTER_GUIDE.traceDotRadius}"/></svg>`;
    const dotOnly = `<svg class="letter-model" viewBox="${view}" aria-hidden="true"><circle data-part="dot-only-dot" cx="${data.dotOnlyDot.x}" cy="${data.dotOnlyDot.y}" r="${LETTER_GUIDE.traceDotRadius}"/></svg>`;
    const cell = (kind: string, className: string, inner: string, label: string): string =>
        `<div class="cell-col"><span class="letter-cell ${className}" data-part="letter-cell" data-cell-kind="${kind}">${inner}</span><span class="cell-label" data-part="cell-label">${label}</span></div>`;
    return [
        cell('model', 'model-cell', model, 'Model'),
        cell('trace', 'trace-cell', trace, 'Trace'),
        cell('trace', 'trace-cell', trace, 'Trace'),
        cell('trace', 'trace-cell', trace, 'Trace'),
        cell('dot-only', 'trace-cell', dotOnly, 'Dot'),
        cell('empty', 'trace-cell', '<span class="write-letter" data-part="write-letter" data-student-work></span>', 'My own'),
    ].join('\n  ');
}

/** The line height of a practice text in mm; the rule of each line sits at the bottom of its line box (fix 4). */
const PRACTICE_LINE_MM = 12;
/** The most lines of a practice text that get a rule; the clip of `.practice-text-rule` cuts the rules under the last line. */
const PRACTICE_RULE_MAX_LINES = 6;

/**
 * The rules of a practice text: one vector line at the bottom of each possible line box, across the full width of the text box.
 * The clipped text block hides the rules under its last line, so each wrapped line keeps one rule.
 */
function practiceRuleLines(): string {
    return Array.from({ length: PRACTICE_RULE_MAX_LINES }, (_value, i) => {
        const top = ((i + 1) * PRACTICE_LINE_MM - 0.4).toFixed(1);
        return `<span class="practice-rule-line" style="top:${top}mm" aria-hidden="true"></span>`;
    }).join('');
}

/**
 * The left page of the weekly spread, the sound page (page template 8.1, A-48): block A3 "Form it"
 * with the six formation cells, block A7 "Read it" with the numbered practice lines, and block
 * A6 and D2 "Tricky words" with one card for each tricky word of the week.
 */
function practicePage(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>): PageSpec {
    const box = week.print!.letterBox;
    const practiceRows = week.print!.practice.map((line) => storytimePrintPracticePicture(week, line.pictureWord, rows));
    const lines = week.print!.practice.map((line, i) => {
        const row = practiceRows[i];
        if (!row) throw new Error(`picture row missing for the practice word "${line.pictureWord}" of week ${week.meta.week}`);
        const extras = (line.extraPictureWords ?? []).map((word) => {
            const extra = storytimePrintPracticePicture(week, word, rows);
            if (!extra) throw new Error(`picture row missing for the extra practice word "${word}" of week ${week.meta.week}`);
            return extra;
        });
        const pictures = [row, ...extras].map((picture) => pictureElement(picture, o, files, 'practice-picture')).join('');
        return `<div class="practice-line"><span class="row-number" data-part="row-number">${i + 1}</span><span class="practice-pictures">${pictures}</span><span class="practice-text" data-part="practice-text"><span class="practice-text-rule">${esc(line.text)}${practiceRuleLines()}</span></span></div>`;
    });
    const formation = `<div class="letter-box" data-part="letter-box">
<div class="trace-row">
  ${formationCells(week)}
</div>
<p class="formation-words" data-part="formation-words">${esc(box.formationWords)}</p>
</div>`;
    const body = `<div class="page-head">${weekLabel(week.meta.week)}<h2 class="page-title">The sound ${esc(week.focus.element?.sound ?? '')}</h2></div>
${stepBlock('A3', formation)}
${stepBlock('A7', `<div class="practice-sheet" data-part="practice-sheet">
${lines.join('\n')}
</div>`)}
${stepBlock('A6·D2', `<div class="tricky-row" data-part="tricky-row">${week.focus.trickyWords.map((word) => `<span class="tricky-card" data-part="tricky-card">${esc(word)}</span>`).join('')}</div>`)}`;
    return { kind: 'practice', body, numbered: true };
}

/** The label and the icons of the picture row of D4, by the action of the child (A-48 F5). */
const PROMPT_ACTIONS = {
    look: { label: 'Look.', icons: ['read'] as StorytimeIcon[] },
    color: { label: 'Color.', icons: ['pencil'] as StorytimeIcon[] },
    draw: { label: 'Draw.', icons: ['pencil'] as StorytimeIcon[] },
} as const;

/**
 * One trace line as SVG (A-48): the words in trace gray at explicit x positions, and one black
 * start dot on the first stroke of each word that starts with a letter. The unit of the SVG is 1 mm.
 * @param text The trace text.
 * @param part The `data-part` of the wrapper.
 * @returns The wrapper with the SVG.
 */
function traceLineHtml(text: string, part: string): string {
    const { fontSizeMm, baselineMm, heightMm, padMm, dotRadiusMm } = TRACE_LINE;
    const layout = traceLineLayout(text, fontSizeMm);
    const width = Number((layout.width + 2 * padMm).toFixed(3));
    const round = (value: number): number => Number(value.toFixed(3));
    const words = layout.words.map((word) => `<text x="${round(padMm + word.x)}" y="${baselineMm}" font-size="${fontSizeMm}">${esc(word.text)}</text>`).join(' ');
    const dots = layout.words.filter((word) => word.dot)
        .map((word) => `<circle data-part="trace-word-dot" cx="${round(padMm + word.x + word.dot!.x)}" cy="${round(baselineMm - word.dot!.y)}" r="${dotRadiusMm}"/>`).join('');
    return `<span class="writing-trace" data-part="${part}"><svg class="trace-line" width="${width}mm" height="${heightMm}mm" viewBox="0 0 ${width} ${heightMm}" aria-hidden="true">${words}${dots}</svg></span>`;
}

/**
 * The right page of the weekly spread, the write page (page template 8.2, A-48): the framed block
 * C3 "Dictation" (a box for each dictated letter, sound boxes for a dictated word of taught letters or a
 * trace row for a word with an untaught letter, with no printed word, and the trace sentence) and the
 * framed block D4 "Write it" (the frame trace, the name line, the prompt picture, the draw boxes, the
 * choice words, and the word line, in the order of the D4 script). The row numbers run through the page.
 * The draw boxes are one box when the page has no choice words, else two boxes in all, and the prompt
 * picture counts as one of the two.
 */
function writingPage(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>): PageSpec {
    const print = week.print!;
    let row = 0;
    const letterRow = `<div class="work-row" data-part="work-row">${rowStart(++row, ['ear', 'pencil'], 'Listen. Write.')}<span class="box-group">${print.dictation.letters.map(() => '<span class="letter-slot" data-part="dictation-letter"></span>').join('')}</span></div>`;
    const soundRows = print.dictation.words.map((word) => dictationRowKind(word, week.meta.week) === 'sound-boxes'
        ? `<div class="work-row" data-part="sound-row" data-dictation-kind="sound">${rowStart(++row, ['mouth', 'pencil'], 'Say. Write.')}<span class="box-group">${[...word].map(() => '<span class="sound-box" data-part="sound-box"></span>').join('')}</span></div>`
        : `<div class="work-row" data-part="work-row" data-dictation-kind="trace">${rowStart(++row, ['pencil'], 'Trace.')}${traceLineHtml(word, 'dictation-word-trace')}</div>`).join('');
    const sentenceRow = print.dictation.traceSentence
        ? `<div class="work-row" data-part="work-row">${rowStart(++row, ['pencil'], 'Trace.')}${traceLineHtml(print.dictation.traceSentence, 'dictation-trace')}</div>`
        : '';
    const writing = print.writing;
    const frameRow = () => `<div class="work-row" data-part="work-row">${rowStart(++row, ['pencil'], 'Trace.')}${traceLineHtml(writing.traceText, 'writing-trace')}</div>`;
    const lineRow = () => `<div class="work-row" data-part="work-row">${rowStart(++row, ['pencil'], 'Write.')}<span class="write-line" data-part="${writing.line}-line" data-line="${writing.line}" data-student-work></span></div>`;
    const promptRowData = writing.promptPicture ? storytimePrintPracticePicture(week, writing.promptPicture, rows) : undefined;
    if (writing.promptPicture && !promptRowData) throw new Error(`picture row missing for the prompt picture "${writing.promptPicture}" of week ${week.meta.week}`);
    const promptRow = () => promptRowData
        ? `<div class="work-row prompt-row" data-part="prompt-row">${rowStart(++row, PROMPT_ACTIONS[writing.promptAction ?? 'look'].icons, PROMPT_ACTIONS[writing.promptAction ?? 'look'].label)}${pictureElement(promptRowData, o, files, 'prompt-picture')}</div>`
        : '';
    const boxCount = writing.pictureBox ? (writing.choiceWords ? 2 - (promptRowData ? 1 : 0) : 1) : 0;
    const drawRow = () => boxCount
        ? `<div class="work-row" data-part="work-row">${rowStart(++row, ['pencil'], 'Draw.')}<span class="draw-boxes">${Array.from({ length: boxCount }, () => `<span class="picture-draw-box${boxCount > 1 ? ' draw-box-half' : ''}" data-part="writing-picture-box" data-student-work></span>`).join('')}</span></div>`
        : '';
    const chooseRow = () => writing.choiceWords
        ? `<div class="work-row" data-part="work-row">${rowStart(++row, ['pencil'], 'Trace one.')}<span class="choice-words" data-part="choice-words">${writing.choiceWords.map((word) => `<span class="choice-word" data-part="choice-word">${traceLineHtml(word, 'choice-word-trace')}</span>`).join('')}</span></div>`
        : '';
    // The picture row stands above the trace row, as the scripts say "above it" (A-48 F4). The row numbers follow the page order.
    const d4 = writing.line === 'name'
        ? `${promptRow()}${frameRow()}${lineRow()}${drawRow()}${chooseRow()}`
        : `${promptRow()}${frameRow()}${drawRow()}${chooseRow()}${lineRow()}`;
    const body = `<div class="page-head">${weekLabel(week.meta.week)}<h2 class="page-title">Write</h2></div>
${stepBlock('C3', `<div data-part="dictation" class="dictation-rows">${letterRow}${soundRows}${sentenceRow}</div>`)}
${stepBlock('D4', d4)}`;
    return { kind: 'writing', body, numbered: true };
}

/**
 * The week check page (page template 8.3, A-48): the step badge E5, one head (icons and one short
 * line) before each run of rows of the same kind, the numbered rows, sound boxes for the write-word
 * item with no printed answer, and a score strip "__ / N" for the teacher.
 */
function checkPage(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>): PageSpec {
    const items = week.check.items;
    const rowByName = new Map(rows.filter((r) => r.use === 'check-row').map((r) => [r.text, r]));
    const pictureHtml = (word: string): string => {
        const row = rowByName.get(word);
        if (!row) throw new Error(`picture row missing for the check word "${word}" of week ${week.meta.week}`);
        return pictureElement(row, o, files, '');
    };
    const content = (item: StorytimeCheckItem): string => {
        if (item.kind === 'circle-picture') return `<div class="check-row" data-part="check-row">${item.pictures.map(pictureHtml).join('')}</div>`;
        if (item.kind === 'circle-word') return `<div class="circle-word-row" data-part="circle-word-row">${item.words.map((word) => `<span class="circle-word" data-part="circle-word">${esc(word)}</span>`).join('')}</div>`;
        if (item.kind === 'write-letter') return '<span class="check-write-letter" data-part="check-write-letter" data-student-work></span>';
        if (item.kind === 'write-word') return `<div class="check-write-word" data-part="check-write-word" data-student-work>${[...item.word].map(() => '<span class="sound-box" data-part="sound-box"></span>').join('')}</div>`;
        throw new Error(`the week check page of week ${week.meta.week} cannot print a "${item.kind}" item`);
    };
    let lastLabel = '';
    const body = items.map((item, index) => {
        const type = STORYTIME_CHECK_ROW_TYPES[item.kind];
        const head = type.label === lastLabel ? ''
            : `<div class="row-group-head" data-part="row-group-head">${type.icons.map((icon) => iconSvg(icon)).join('')}<p class="check-cue">${esc(type.label)}</p></div>`;
        lastLabel = type.label;
        return `${head}<div class="check-item" data-part="check-item"><span class="row-number" data-part="row-number">${index + 1}</span>${content(item)}</div>`;
    }).join('\n');
    const entry = storytimeStep('E5');
    return {
        kind: 'check',
        numbered: true,
        body: `<div class="page-head">${weekLabel(week.meta.week)}<h2 class="page-title">Week ${week.meta.week} check</h2><span class="step-badge" data-part="step-badge" data-step="${entry.code}">${entry.code}</span></div>
${body}
<div class="score-strip" data-part="score-strip"><span class="score-blank"></span> / ${items.length}</div>`,
    };
}

/** The check items of one kind, with the type narrowed. */
function itemsOfKind<K extends StorytimeCheckItem['kind']>(items: StorytimeCheckItem[], kind: K): Extract<StorytimeCheckItem, { kind: K }>[] {
    return items.filter((item): item is Extract<StorytimeCheckItem, { kind: K }> => item.kind === kind);
}

/** The score strip for the teacher: a blank and the total, at the bottom right of a check, benchmark, or review page. */
const scoreStrip = (total: number): string => `<div class="score-strip" data-part="score-strip"><span class="score-blank"></span> / ${total}</div>`;

/** The head of a week 8 page: the week label, the title, and the badge of the step (A-48 U4). */
function weekEightHead(week: StorytimeWeek, title: string, code: string): string {
    return `<div class="page-head">${weekLabel(week.meta.week)}<h2 class="page-title">${esc(title)}</h2><span class="step-badge" data-part="step-badge" data-step="${esc(code)}">${esc(code)}</span></div>`;
}

/** The head of a run of rows: the icons and one short line. */
function groupHead(icons: StorytimeIcon[], label: string, extra = ''): string {
    return `<div class="row-group-head" data-part="row-group-head">${icons.map((icon) => iconSvg(icon)).join('')}<p class="check-cue">${esc(label)}</p>${extra}</div>`;
}

/**
 * The first-sound or last-sound mark of a benchmark row: three squares, the first or the last one filled,
 * so that a child who cannot read sees which end of the word the row asks for (B22).
 * @param position The part of the word.
 * @returns The SVG.
 */
function positionMark(position: 'first' | 'last'): string {
    const filled = position === 'first' ? 0 : 2;
    const squares = [0, 1, 2].map((i) => `<rect x="${i * 5 + 0.3}" y="0.3" width="3.6" height="3.6" fill="${i === filled ? '#000' : 'none'}" stroke="#000" stroke-width="0.5"/>`).join('');
    return `<svg class="position-mark" data-part="position-mark" data-position="${position}" viewBox="0 0 14.4 4.2" width="9mm" height="2.6mm" aria-hidden="true">${squares}</svg>`;
}

/** The first picture-list row of each check-row word: a review or benchmark word keeps the row of the earliest week (the picture list reuses it). */
function firstRowByWord(rows: StorytimePictureRow[]): Map<string, StorytimePictureRow> {
    const byWord = new Map<string, StorytimePictureRow>();
    for (const row of rows) if (row.use === 'check-row' && !byWord.has(row.text)) byWord.set(row.text, row);
    return byWord;
}

/**
 * The two Benchmark 1 pages (step A1, B22, E43): page 1 holds rows 1 to 8 (3 pictures each, the first-sound mark
 * on rows 1 to 4 and the last-sound mark on rows 5 to 8), and page 2 holds boxes 9 to 15 (the letters from the
 * sound). The numbers run 1 to 15 through the two pages, and no answer is marked.
 */
function benchmarkPages(week: StorytimeWeek, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>): PageSpec[] {
    const items = week.benchmark!.paper.items;
    const byWord = firstRowByWord(rows);
    const pictureHtml = (word: string): string => {
        const row = byWord.get(word);
        if (!row) throw new Error(`picture row missing for the check word "${word}" of week ${week.meta.week}`);
        return pictureElement(row, o, files, 'benchmark-picture');
    };
    let number = 0;
    let lastPosition = '';
    const rowHtml = itemsOfKind(items, 'circle-picture').map((item) => {
        const position = item.position === 'last' ? 'last' : 'first';
        const head = position === lastPosition ? ''
            : groupHead(['ear', 'circle'], `Listen. Circle the picture that ${position === 'first' ? 'starts' : 'ends'} with the sound.`, positionMark(position));
        lastPosition = position;
        return `${head}<div class="benchmark-row" data-part="benchmark-row" data-position="${position}"><span class="row-number" data-part="row-number">${++number}</span>${positionMark(position)}<span class="benchmark-pictures">${item.pictures.map(pictureHtml).join('')}</span></div>`;
    }).join('\n');
    const letters = itemsOfKind(items, 'write-letter');
    const boxes = letters.map(() => `<span class="benchmark-box" data-part="benchmark-box"><span class="row-number" data-part="row-number">${++number}</span><span class="check-write-letter" data-part="check-write-letter" data-student-work></span></span>`).join('');
    const pictureCount = itemsOfKind(items, 'circle-picture').length;
    return [
        { kind: 'benchmark', numbered: true, body: `${weekEightHead(week, 'Benchmark 1', 'A1')}\n${rowHtml}\n${scoreStrip(pictureCount)}` },
        { kind: 'benchmark', numbered: true, body: `${weekEightHead(week, 'Benchmark 1', 'A1')}\n${groupHead(STORYTIME_CHECK_ROW_TYPES['write-letter'].icons, STORYTIME_CHECK_ROW_TYPES['write-letter'].label)}\n<div class="benchmark-boxes" data-part="benchmark-boxes">${boxes}</div>\n${scoreStrip(letters.length)}` },
    ];
}

/**
 * One review page (a paper center of week 8, B20, B21, E41): the match rows, where the word to find stands at the
 * row start and the child circles the same word, then one picture row for each sound, where the sound label starts
 * the row and the child circles the pictures that start with it. A row holds 4 pictures: the first 2 of the sound
 * (or the one picture of a single-picture group) and pictures of the other sounds. A child can do each row alone,
 * with no teacher voice.
 */
function reviewPage(week: StorytimeWeek, dayIndex: number, rows: StorytimePictureRow[], o: StorytimeStudentBookOptions, files: Map<string, StorytimePictureFile>): PageSpec {
    const day = week.block!.days[dayIndex];
    const byWord = firstRowByWord(rows);
    const pictureHtml = (word: string): string => {
        const row = byWord.get(word);
        if (!row) throw new Error(`picture row missing for the check word "${word}" of week ${week.meta.week}`);
        return pictureElement(row, o, files, 'review-picture');
    };
    let number = 0;
    const groups = itemsOfKind(day.paper, 'picture-sort').flatMap((item) => item.groups);
    const matchDense = groups.length > 2 ? ' review-dense' : '';
    const matchRows = itemsOfKind(day.paper, 'circle-word').map((item) =>
        `<div class="match-row${matchDense}" data-part="match-row"><span class="row-number" data-part="row-number">${++number}</span><span class="match-target" data-part="match-target">${esc(item.answer)}</span><span class="match-choices">${item.words.map((word) => `<span class="circle-word" data-part="circle-word">${esc(word)}</span>`).join('')}</span></div>`).join('\n');
    const targetCount = Math.min(2, ...groups.map((group) => group.pictures.length));
    const soundRows = groups.map((group, index) => {
        const targets = group.pictures.slice(0, targetCount);
        const pool = Array.from({ length: groups.length - 1 }, (_value, step) => groups[(index + step + 1) % groups.length].pictures).flat();
        const others = pool.slice(0, 4 - targets.length);
        const places = targets.length === 2 ? (index % 2 === 0 ? [0, 3] : [1, 2]) : [index % 4];
        const printed: string[] = [];
        let next = 0;
        for (let place = 0; place < 4; place++) printed.push(places.includes(place) ? targets[places.indexOf(place)] : others[next++]);
        return `<div class="sound-row" data-part="sound-row"><span class="row-number" data-part="row-number">${++number}</span><span class="sound-label" data-part="sound-label">${esc(group.sound)}</span><span class="sound-pictures">${printed.map(pictureHtml).join('')}</span></div>`;
    }).join('\n');
    const code = storytimeStep(['A2', 'B1', 'C1', 'D1', 'E1'][dayIndex]).code;
    const dense = groups.length > 2 ? ' review-dense' : '';
    const sortHead = groupHead(['read', 'circle'], targetCount === 1 ? 'Circle the picture that starts with the sound.' : 'Circle the pictures that start with the sound.');
    return {
        kind: 'review',
        numbered: true,
        body: `${weekEightHead(week, `Review ${dayIndex + 1}`, code)}
${groupHead(['read', 'circle'], 'Find the same word. Circle it.')}
${matchRows}
${sortHead}
<div class="picture-sort${dense}" data-part="picture-sort">${soundRows}</div>
${scoreStrip(number)}`,
    };
}

/** The week 8 pages: the Benchmark 1 pages first (step A1 opens week 8), then the five review pages (spec FR-3, A-48 U4). */
function reviewPages(
    week: StorytimeWeek,
    rows: StorytimePictureRow[],
    o: StorytimeStudentBookOptions,
    files: Map<string, StorytimePictureFile>,
): PageSpec[] {
    const days = week.block?.days ?? [];
    if (days.length !== 5 || !week.benchmark) throw new Error(`student book: review week ${week.meta.week} needs five review pages and a benchmark`);
    return [...benchmarkPages(week, rows, o, files), ...days.map((_day, index) => reviewPage(week, index, rows, o, files))];
}

/** The Thai line of each QR label of the Thai card side (E45; Daniel checks the Thai). */
const QR_LABELS_TH: Readonly<Record<string, string>> = {
    'The song of the week': 'เพลงประจำสัปดาห์',
    'The book of the week': 'หนังสือประจำสัปดาห์',
};

/** The two sides of the home-card leaf (FR-3): the Thai card with the QR codes, then the English card. */
function homePages(week: StorytimeWeek, mode: 'proof' | 'final'): PageSpec[] {
    const home = week.home;
    if (!home) throw new Error(`week ${week.meta.week} has no home card`);
    const qr = (url: string | undefined, label: string): string => {
        if (!url) return '';
        // B-P2-01: each printed code encodes storytimeQrUrl of the package page path, so a
        // path outside /th/st/ stops the build instead of printing a wrong address.
        const address = storytimeQrUrl(url);
        const svg = generateQRCode(address);
        if (!svg) throw new Error(`QR code failed for ${address}`);
        const thai = QR_LABELS_TH[label];
        const thaiLine = thai ? `<span class="qr-label qr-label-th" data-part="qr-label-th" lang="th">${thaiText(thai)}</span>` : '';
        return `<span class="qr" data-qr-input="${esc(address)}">${svg}${thaiLine}<span class="qr-label">${esc(label)}</span></span>`;
    };
    const words = home.words.map((w) => `<span data-part="home-word">${esc(w)}</span>`).join('');
    const weekLine = `<p class="home-week" data-part="home-week">${weekLabel(week.meta.week).replace(/^<span[^>]*>|<\/span>$/g, '')}</p>`;
    const front = `<h2 class="home-card-title">Storytime Advantage</h2>
${weekLine}
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
${weekLine}
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
 * The six reader leaves of a week, with each leaf side rendered by the shared reader-page renderer.
 */
function readerPages(week: StorytimeWeek, profile: StorytimePrintProfile, mode: 'proof' | 'final'): PageSpec[] {
    const sides = storytimeReaderLeafSides(week, { profile, mode, output: 'workbook' });
    if (sides.length !== 12) throw new Error(`week ${week.meta.week} needs 6 reader leaves, got ${sides.length / 2}`);
    return sides.map((side) => {
        const foldLeft = side.side === 'back' ? 0 : profile.perforationMm;
        const foldWidth = profile.trim.widthMm - profile.perforationMm;
        return { kind: 'reader', body: `${side.html}
<div class="fold-line" data-part="fold-line" data-position-mm="148.5" style="left:${foldLeft}mm;width:${foldWidth}mm;"></div>
${readerFoldLabelsHtml(side.side === 'back' ? 'right' : 'left', profile)}
<span class="leaf-mark" data-part="leaf-mark">${esc(side.title)} &middot; leaf ${side.leaf} of 3</span>` };
    });
}

/**
 * Compiles the student workbook of one unit from its week packages (spec FR-3), including week 8 review pages and binding padding.
 * @param weeks The parsed weeks of the unit, in week order.
 * @param o The print profile and build mode. Final mode requires every picture except named pending rows.
 * @returns The print HTML of the whole book, padded at the end to the binding page multiple.
 * @throws Error When a picture of a final build does not resolve, or a pending row id is unknown.
 */
export function compileStorytimeStudentBook(weeks: StorytimeWeek[], o: StorytimeStudentBookOptions): { html: string } {
    if (!weeks.length) throw new Error('no weeks');
    // FR-9 + B-P2-02 + plan Phase 4 Red 4g: a final build resolves the line art of every picture
    // row of the compiled weeks through the folder manifest, in list order, so the first problem
    // names its row before any page renders (R44). Proof mode prints placeholders instead.
    const pictureFiles = new Map<string, StorytimePictureFile>();
    const allPictureRows = storytimePrintPictures(weeks);
    const pending = new Set(o.pendingPictures ?? []);
    const unknownPending = [...pending].filter((id) => !allPictureRows.some((row) => row.id === id));
    if (unknownPending.length) throw new Error(`pending picture row not found: ${unknownPending.join(', ')}`);
    if (pending.size && o.mode !== 'final') throw new Error('pending pictures are supported only in final mode');
    if (o.mode === 'final') {
        const dir = path.join(STORYTIME_ROOT, `l${weeks[0].meta.level}`, 'print', 'pictures');
        for (const entry of resolveStorytimePictureFiles(dir, allPictureRows.filter((row) => !pending.has(row.id)), 'line')) pictureFiles.set(entry.rowId, entry);
    }
    const specs: PageSpec[] = [namePage(weeks[0]), bookMapPage(new Map())];
    const pageOf = new Map<number, number>();
    for (const week of weeks) {
        if (week.meta.kind === 'review') {
            const rows = allPictureRows.filter((row) => row.week === week.meta.week || row.use === 'check-row');
            const review = reviewPages(week, rows, o, pictureFiles);
            if (specs.length % 2 === 0) specs.push(blankPage());
            pageOf.set(week.meta.week, specs.length + 1);
            specs.push(...review);
            continue;
        }
        if (!week.print) throw new Error(`student book: week ${week.meta.week} has no print block`);
        const rows = storytimePrintPictures([week]);
        const weekPages: PageSpec[] = [
            practicePage(week, allPictureRows, o, pictureFiles),
            writingPage(week, allPictureRows, o, pictureFiles),
            checkPage(week, rows, o, pictureFiles),
            ...homePages(week, o.mode),
            ...readerPages(week, o.profile, o.mode),
        ];
        // The weekly spread starts on a left page (a 0-based odd index), so that its two pages
        // face each other; the home leaf and the reader leaves then start on a leaf front.
        if (specs.length % 2 === 0) specs.push(blankPage());
        pageOf.set(week.meta.week, specs.length + 1);
        specs.push(...weekPages);
    }
    const reviewWeek = weeks.find((week) => week.meta.kind === 'review');
    specs[1] = bookMapPage(pageOf, reviewWeek ? pageOf.get(reviewWeek.meta.week) : undefined);
    while (specs.length % o.profile.bindingPageMultiple !== 0) specs.push(blankPage());
    const readerMeta = weeks.flatMap((week) => storytimeReaderLeafSides(week, { profile: o.profile, mode: 'proof', output: 'workbook' }))
        .map(({ kind, title, leaf, side }) => ({ kind, title, leaf, side }));
    let readerIndex = 0;
    const sides = specs
        .map((spec, i) => {
            const reader = spec.kind === 'reader' ? readerMeta[readerIndex++] : undefined;
            const attrs = reader ? ` data-reader="${reader.kind}" data-reader-title="${esc(reader.title)}" data-leaf-number="${reader.leaf}" data-leaf-side="${reader.side}"` : '';
            const number = spec.numbered ? `<span class="page-number" data-part="page-number">${i + 1}</span>` : '';
            // A home card keeps 6 mm between its text and the cut line (E47): 4 mm more padding on the spine side.
            const cardEdge = ['home-front', 'home-back'].includes(spec.kind) ? ((i + 1) % 2 ? 'left' : 'right') : '';
            const cardStyle = cardEdge ? ` style="padding-${cardEdge}:${o.profile.perforationMm + 6}mm"` : '';
            return `<section class="student-page" data-page-kind="${spec.kind}" data-page-number="${i + 1}"${attrs}${cardStyle}>${spec.body}${number}${['reader', 'home-front', 'home-back'].includes(spec.kind) ? perforationMark(i + 1, o.profile, spec.kind) : ''}</section>`;
        })
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

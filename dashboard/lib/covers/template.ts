import { THAI, type PrintFontFace } from '../document-wrapper/print-fonts';
import { richHtml, type BackText } from './back-text';
import type { CoverBook } from './catalogue';

/**
 * The cover HTML (track book_covers_20261007). Each side is one 210 x 285 mm page: the composed
 * picture (`compose.ts`) and an SVG text layer in the coordinates of the Canva page (points), so
 * the positions measured on the Canva export apply as they are. Print-safe: static fonts, solid
 * colors, no transparency.
 */

/** The Canva page in points. */
export const PAGE_PT = { width: 595.5, height: 807.749976 };

/**
 * The Thai size for one font size: Canva draws Thai in Noto Sans Thai (its fallback for League
 * Spartan) at 13.6 pt and the Latin text in League Spartan at 16.35 pt in the same text box (both
 * measured on the Canva back, 2026-10-07; pixel overlap 0.95 and 0.89).
 */
export const THAI_SIZE_ADJUST = 13.6 / 16.35;

/**
 * The cover fonts (static files in `assets/print-fonts/`). League Spartan has only the bold face in
 * Canva, so every Latin letter is 700; Thai is Noto Sans Thai, scaled by `size-adjust`.
 */
export const COVER_FONT_FACES: PrintFontFace[] = [
    { family: 'League Spartan', weight: 700, style: 'normal', file: 'league-spartan-latin-700-normal.woff2' },
    ...([400, 700] as const).map((weight) => ({
        family: 'Noto Sans Thai',
        weight,
        style: 'normal' as const,
        file: `noto-sans-thai-thai-${weight}-normal.woff2`,
        unicodeRange: THAI,
        sizeAdjust: `${(THAI_SIZE_ADJUST * 100).toFixed(2)}%`,
    })),
];

/**
 * The front text, measured on the Canva export (2026-10-07): League Spartan 700, white. The Canva
 * sizes 24.1 and 50 are 39.8 and 82.7 CSS px (29.9 and 62 pt). The title shrinks to `maxWidth`.
 */
export const FRONT_TEXT = {
    level: { x: 133.1, y: 50.99, size: 29.9 },
    title: { x: 296.5, y: 738.77, size: 62, maxWidth: 430 },
};

/**
 * The back text boxes, measured on the Canva back (points): the first baseline, the left edge,
 * the width, and the lowest point that the text may reach (the top of the wooden sign for the body,
 * the bottom of the sign for the contact lines). Canva sizes 13.6 and 13.4.
 */
export const BACK_TEXT = {
    body: { x: 98.33, baseline: 179.55, width: 334.67, bottom: 621, size: 16.35, line: 18.94 },
    contact: { x: 114.53, baseline: 685.26, width: 274.47, bottom: 763, size: 16.11, line: 18.16 },
    /** The bullet text starts here (from the bullet). */
    bulletIndent: 13.47,
};

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The front page.
 * @param book The book.
 * @param background The composed front picture as a URL (data URL or file URL).
 * @returns The page element.
 */
export function frontPage(book: CoverBook, background: string): string {
    const { level, title } = FRONT_TEXT;
    return `<div class="page front"><img src="${escapeXml(background)}" alt="">
<svg viewBox="0 0 ${PAGE_PT.width} ${PAGE_PT.height}" preserveAspectRatio="none">
<g font-family="League Spartan" font-weight="700" fill="#ffffff" text-anchor="middle">
<text class="level" x="${level.x}" y="${level.y}" font-size="${level.size}">${book.level}</text>
<text class="title" x="${title.x}" y="${title.y}" font-size="${title.size}" data-max-width="${title.maxWidth}">${escapeXml(book.name)}</text>
</g></svg></div>`;
}

/**
 * The back page.
 * @param background The composed back picture as a URL.
 * @param text The back text (`backText`).
 * @returns The page element.
 */
export function backPage(background: string, text: BackText): string {
    const { body, contact } = BACK_TEXT;
    const box = (b: typeof body) => `data-baseline="${b.baseline}" data-bottom="${b.bottom}" style="left: ${b.x}pt; top: ${b.baseline - b.line}pt; width: ${b.width}pt; font-size: ${b.size}pt; line-height: ${b.line}pt"`;
    const mark = '<i class="baseline-mark"></i>';
    return `<div class="page back"><img src="${escapeXml(background)}" alt="">
<div class="text body" ${box(body)}>
<p>${mark}${richHtml(text.seriesHeading, true)}</p>
${text.seriesParagraphs.map((t) => `<p class="gap">${richHtml(t, true)}</p>`).join('\n')}
<p class="gap2">${richHtml(text.bookHeading, true)}</p>
<p class="gap">${richHtml(text.bookParagraph, true)}</p>
<p class="gap">${richHtml(text.canDoIntro, true)}</p>
<ul>${text.canDo.map((t) => `<li>${richHtml(t, true)}</li>`).join('')}</ul>
</div>
<div class="text contact" ${box(contact)}>
${text.contact.map((t, i) => `<p>${i === 0 ? mark : ''}${richHtml(t)}</p>`).join('\n')}
</div></div>`;
}

/**
 * The page script: shrinks each title that is wider than its `data-max-width`, moves each text box
 * so that its first baseline is at `data-baseline` (pt), records the boxes that go below
 * `data-bottom` (pt) and the runs wider than their box in `body.dataset.overflow`, then marks the
 * body as ready.
 */
const FIT_SCRIPT = `document.fonts.ready.then(() => {
    for (const t of document.querySelectorAll('text[data-max-width]')) {
        const max = Number(t.dataset.maxWidth), w = t.getComputedTextLength();
        if (w > max) t.setAttribute('font-size', String(Number(t.getAttribute('font-size')) * max / w));
    }
    const PT = 96 / 72, over = [];
    for (const box of document.querySelectorAll('[data-baseline]')) {
        const page = box.closest('.page').getBoundingClientRect();
        const base = box.querySelector('.baseline-mark').getBoundingClientRect().top - page.top;
        box.style.top = (parseFloat(box.style.top) * PT + Number(box.dataset.baseline) * PT - base) + 'px';
        const rect = box.getBoundingClientRect(), bottom = rect.bottom - page.top;
        if (bottom > Number(box.dataset.bottom) * PT + 0.5) over.push(box.classList[1] + ' ' + Math.round((bottom / PT - Number(box.dataset.bottom)) * 10) / 10 + ' pt');
        for (const ph of box.querySelectorAll('.ph')) if (ph.getBoundingClientRect().right > rect.right + 0.5) over.push(box.classList[1] + ' "' + ph.textContent + '" is wider than the box (mark a break with |)');
    }
    if (over.length) document.body.dataset.overflow = over.join(', ');
    document.body.dataset.ready = '1';
});`;

/**
 * The cover document: one page per side, 210 x 285 mm, no margins.
 * @param pages The page elements (`frontPage`, then the back).
 * @param fontCss The `@font-face` rules of `COVER_FONT_FACES`.
 * @returns The HTML. Wait for `body[data-ready]` before a screenshot or a PDF; `body[data-overflow]`
 *   lists the text boxes that are too long.
 */
export function coverDocument(pages: string[], fontCss: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
@page { size: 210mm 285mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
.page { position: relative; width: 210mm; height: 285mm; overflow: hidden; }
.page + .page { break-before: page; }
.page > img, .page > svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.text { position: absolute; color: #000000; font-family: 'League Spartan', 'Noto Sans Thai'; font-weight: 400; font-synthesis: none; }
.text p { margin: 0; }
.text .gap { margin-top: ${BACK_TEXT.body.line}pt; }
.text .gap2 { margin-top: ${2 * BACK_TEXT.body.line}pt; }
.text ul { margin: 0; padding: 0; list-style: none; }
.text li { position: relative; padding-left: ${BACK_TEXT.bulletIndent}pt; }
.text li::before { content: '\\2022'; position: absolute; left: 0; }
.text .ph { white-space: nowrap; }
.baseline-mark { display: inline-block; width: 0; height: 0; vertical-align: baseline; }
</style></head><body>
${pages.join('\n')}
<script>${FIT_SCRIPT}</script>
</body></html>`;
}

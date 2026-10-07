import type { PrintFontFace } from '../document-wrapper/print-fonts';
import type { CoverBook } from './catalogue';

/**
 * The cover HTML (track book_covers_20261007). Each side is one 210 x 285 mm page: the composed
 * picture (`compose.ts`) and an SVG text layer in the coordinates of the Canva page (points), so
 * the positions measured on the Canva export apply as they are. Print-safe: static fonts, solid
 * colors, no transparency.
 */

/** The Canva page in points. */
export const PAGE_PT = { width: 595.5, height: 807.749976 };

/** The cover fonts (static files in `assets/print-fonts/`). */
export const COVER_FONT_FACES: PrintFontFace[] = [{ family: 'League Spartan', weight: 700, style: 'normal', file: 'league-spartan-latin-700-normal.woff2' }];

/**
 * The front text, measured on the Canva export (2026-10-07): League Spartan 700, white. The Canva
 * sizes 24.1 and 50 are 39.8 and 82.7 CSS px (29.9 and 62 pt). The title shrinks to `maxWidth`.
 */
export const FRONT_TEXT = {
    level: { x: 133.1, y: 50.99, size: 29.9 },
    title: { x: 296.5, y: 738.77, size: 62, maxWidth: 430 },
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

/** Shrinks each title that is wider than its `data-max-width`, then marks the body as ready. */
const FIT_SCRIPT = `document.fonts.ready.then(() => {
    for (const t of document.querySelectorAll('text[data-max-width]')) {
        const max = Number(t.dataset.maxWidth), w = t.getComputedTextLength();
        if (w > max) t.setAttribute('font-size', String(Number(t.getAttribute('font-size')) * max / w));
    }
    document.body.dataset.ready = '1';
});`;

/**
 * The cover document: one page per side, 210 x 285 mm, no margins.
 * @param pages The page elements (`frontPage`, then the back).
 * @param fontCss The `@font-face` rules of `COVER_FONT_FACES`.
 * @returns The HTML. Wait for `body[data-ready]` before a screenshot or a PDF.
 */
export function coverDocument(pages: string[], fontCss: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
@page { size: 210mm 285mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
.page { position: relative; width: 210mm; height: 285mm; overflow: hidden; break-after: page; }
.page > img, .page > svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
</style></head><body>
${pages.join('\n')}
<script>${FIT_SCRIPT}</script>
</body></html>`;
}

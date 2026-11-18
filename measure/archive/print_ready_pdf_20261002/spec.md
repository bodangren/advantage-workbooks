# Spec: Print-ready PDF/X-1a workbooks

Version 1.1 | Date 2026-10-02 | Status: Active | Owner: Daniel Bo | Internal

## Goal

The printer (China, Adobe Acrobat 9 Pro) says our PDFs are not print-ready ("embedded fonts or
rasterized"). Last time he converted the pages to images, and the result was not good. Daniel
(2026-10-02): target **PDF/X-1a**, **full color**, profile **Japan Color 2001 Coated**. "I am not
married to the font choices. We can use compatible fonts." Daniel prints with Chrome's "Save as
PDF"; that step stays.

## Diagnosis (Chrome 153, Skia PDF, 2026-10-02)

1. **Type 3 fonts.** Chrome writes variable fonts as Type 3. The template loads Merriweather and
   Open Sans from Google Fonts, which serves variable fonts. Emoji (Noto Color Emoji) and fallback
   fonts (FreeSerif, a synthetic bold of the system Noto Sans Thai) are Type 3 too. The May 2026
   publisher font package holds the same variable files.
2. **Transparency.** PDF/X-1a does not allow it. Ghostscript removes it only by rendering the
   **whole page** as a 300 ppi image (tested: a page with one opaque group or one emoji becomes a
   2479 × 3367 px image; a page without them stays vector). Sources, tested one by one in Chrome:
   - emoji: color bitmap with a soft mask
   - a dashed or dotted border + rounded corners + a background color: a transparency group
     (any two of the three make no group)
   - `opacity` < 1, `box-shadow`: a group with alpha
   - `rgba()` color or background: an alpha graphics state
   - not a source: solid borders with radius, `overflow: hidden` with radius, JPG pictures with
     radius
   - gradients are not transparency, but Ghostscript turns each one into an image that fits its
     256 KB default: 90 ppi for a tip box, 22 ppi for the full-page title gradient
3. RGB color, PDF 1.4, no output intent. No bleed (the printer has accepted that so far).

## Requirements

- R1. One command converts a Chrome PDF to PDF/X-1a:2001 (CMYK, Japan Color 2001 Coated output
  intent, TrimBox) with Ghostscript, and checks the result: no page rendered as an image, no
  Type 3 font, every font embedded, PDF 1.3, PDF/X marker. It fails with the page numbers when a
  check fails. Text outlines (`-dNoOutputFonts`) are an option, and the default when the input
  has Type 3 fonts.
- R2. The Primary print document uses static, embedded fonts only: Merriweather, Open Sans,
  Caveat (same look), and Sarabun for Thai (looped Thai, the Thai school standard). Every weight
  and style that the CSS uses has its own file, so Chrome does not synthesize bold or italic. No
  request to Google Fonts; the fonts are in the HTML as data URLs, so the dashboard iframe,
  `render-lesson-html.ts`, and file:// all work.
- R3. No emoji or symbol characters in the Primary print document. Inline SVG icons (stroke or
  solid fill, no opacity) replace them.
- R4. No transparency sources in the Primary print CSS: no `rgba()`, `opacity` < 1, or shadows in
  print; dashed or dotted boxes with rounded corners draw their background on a `::before` layer.
  No gradients: solid colors (the middle color of each old gradient; the title page uses the
  series color).
- R5. A full Primary Advantage Origins 3.2 render passes R1 with fonts kept (not outlined).

## Out of scope

Bleed and crop marks (the printer accepted files without them; ask him after his holiday,
2026-10-07). K-only black text. The secondary (Reading Advantage) template. The cover (Canva).

## Revision history

- 1.1 (2026-10-02): gradients found in the full-book test; solid colors (R4).
- 1.0 (2026-10-02): first version.

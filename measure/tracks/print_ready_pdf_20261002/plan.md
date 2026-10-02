# Plan: print_ready_pdf_20261002

## Phase 1: Convert and check command (R1)
- [x] Tests: Ghostscript arguments, the PDF/X definition file, and the checks on
      `pdfinfo` / `pdffonts` / `pdfimages` output (page-size images, Type 3, not embedded)
      (`__tests__/print-pdfx.test.ts`, 7 tests)
- [x] `scripts/print/make-pdfx.ts`: profile from a local cache (download from Adobe on first use;
      the Adobe license allows use and embedding), Ghostscript PDF/X-1a, then the checks.
      Verified on test pages: emoji, opacity, rgba text and background, box-shadow, and a dashed
      rounded box with a background each make their page one image; the check names those pages.

## Phase 2: Fonts (R2)
- [x] Tech stack note: Ghostscript and poppler for print; static fonts only
- [x] Tests: the print document has `@font-face` data URLs for each family, weight, and style in use,
      and no Google Fonts request (`__tests__/print-fonts.test.ts`, 5 tests)
- [x] `lib/document-wrapper/print-fonts.ts`; remove the `@import` from the template; Sarabun in each
      font stack. 17 faces (Fontsource 5.3.0 woff2, OFL) in `dashboard/assets/print-fonts/`, about
      630 KB as data URLs. Measured use on an Origins 3.2 render with all sections: Merriweather
      300/400/400i/600/700, Open Sans 400/400i/600/700/700i/800, Thai 400/400i/600; added
      Merriweather 700i and Sarabun 700/700i so that Chrome never synthesizes a bold (a synthesized
      bold is Type 3: tested). Caveat was loaded but unused (dropped). The tracing text asked for
      Comic Sans MS, which is not installed; it now uses Open Sans.

## Phase 3: Icons and transparency (R3, R4)
- [x] Tests: no emoji or symbol characters, no `rgba(`, `opacity`, shadows, filters, or gradients
      in print CSS, no dashed rounded box with a background (`__tests__/print-transparency.test.ts`)
- [x] Inline SVG icons (Lucide, ISC; `lib/document-wrapper/icons.ts`, Handlebars helper `icon`)
      for the 13 emoji kinds; solid colors; `::before` backgrounds for `.collection-box` and
      `.qr-box`; the certificate inset shadow is an outline. Gradients became solid (the middle
      color; the title page uses the series color): Ghostscript turned each gradient into an image
      that fits 256 KB (90 ppi for a tip box, 22 ppi for the full-page title gradient).

## Phase 4: Verify (R5)
- [x] Render Origins 3.2 (Playwright, Paged.js), convert, check: 0 pages as images, 0 Type 3 fonts.
      Full book with the default sections: 277 pages (same count as before), 35.5 MB, 13 embedded
      TrueType fonts, all checks pass, Ghostscript 162 s. Two lessons with all sections on: 55
      pages, all checks pass. Before: 9 of 12 pages of an old book became 300 ppi page images.
- [x] Compare page pictures before and after: same layout; icons in place of emoji, solid boxes.

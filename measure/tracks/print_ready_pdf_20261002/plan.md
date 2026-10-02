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
- [ ] Tests: no emoji or symbol characters and no `rgba(`, `opacity`, or `box-shadow` in the
      rendered Primary print document
- [ ] Inline SVG icons (Lucide, ISC) for the emoji; solid colors; `::before` backgrounds for
      dashed rounded boxes

## Phase 4: Verify (R5)
- [ ] Render Origins 3.2 (Playwright, Paged.js), convert, check: 0 pages as images, 0 Type 3 fonts
- [ ] Compare page pictures before and after

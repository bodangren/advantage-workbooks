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
- [ ] Tech stack note: `@fontsource/*` packages (OFL), Ghostscript and poppler for print
- [ ] Tests: the print document has `@font-face` data URLs for each family, weight, and style in use,
      and no Google Fonts request
- [ ] `lib/document-wrapper/print-fonts.ts`; remove the `@import` from the template; Thai in each
      font stack

## Phase 3: Icons and transparency (R3, R4)
- [ ] Tests: no emoji or symbol characters and no `rgba(`, `opacity`, or `box-shadow` in the
      rendered Primary print document
- [ ] Inline SVG icons (Lucide, ISC) for the emoji; solid colors; `::before` backgrounds for
      dashed rounded boxes

## Phase 4: Verify (R5)
- [ ] Render Origins 3.2 (Playwright, Paged.js), convert, check: 0 pages as images, 0 Type 3 fonts
- [ ] Compare page pictures before and after

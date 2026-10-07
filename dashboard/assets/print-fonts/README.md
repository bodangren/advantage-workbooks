# Print fonts

Static faces for the print document (track `print_ready_pdf_20261002`). Loaded by
`lib/document-wrapper/print-fonts.ts` as data URLs.

- **Why static:** Chrome writes variable fonts (what Google Fonts serves) as Type 3 fonts in a
  PDF. The printer's Acrobat 9 Pro cannot use Type 3 fonts. A synthesized bold or italic is also
  Type 3, so every weight and style that the CSS uses has its own file here.
- **Source:** Fontsource 5.3.0 (`@fontsource/merriweather`, `@fontsource/open-sans`,
  `@fontsource/sarabun`, `@fontsource/league-spartan`), built from Google Fonts. Latin subset for Merriweather and Open Sans,
  Thai subset for Sarabun (it gives only the Thai glyphs).
- **License:** SIL Open Font License 1.1 (`OFL-*.txt`). The fonts may be embedded in PDFs and
  shared with the printer.
- **To add a face:** copy the woff2 from the Fontsource package, add it to `PRINT_FONT_FACES`, and
  check a render with `scripts/print/make-pdfx.ts` (no Type 3 font).
- **Covers:** League Spartan is the cover font (track `book_covers_20261007`; `lib/covers/`), not a
  workbook font, so it is not in `PRINT_FONT_FACES`. Weight 700 = the Canva title and level number.

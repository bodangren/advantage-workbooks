# Plan: print_export_20261012

## Phase 1: Export
- [x] Test first: `__tests__/print-export.test.ts` (bucket pictures, export record, document with and without the key)
- [x] `lib/print/book-lessons.ts` (from `make-lesson-pdfs.ts`) and `lib/print/print-export.ts`
- [x] Check: the 70 lesson documents of `make-lesson-pdfs.ts` are byte-identical to `eeeddfd` (sha256)
- [x] `scripts/print/export-print-data.ts`; run with `--golden origins-3.2:5`
- [x] Check: 70 files; each lesson equals the print source except the picture URLs; 210 bucket
      URLs, no local URL; 44 of 70 pass `WorkbookLessonSchema` (the 26 printed Origins 2 and 3.1
      files have a legacy `article_image_url` array)
- [x] Check: every bucket URL answers HTTP 200 (210 of 210; 9 needed a second try after a network timeout)
- [x] Check: the golden differs from the PDF document of the lesson only in the 3 picture URLs; the
      no-key file differs only by the answer key block
- [x] Commit (`08bb160`), and send the commit id to the monorepo session

# Spec: print_export_20261012

Version 1.0 | Date 2026-10-12 | Status: Active | Owner: Daniel Bo

## Why

The monorepo track `primary_parity_print_lesson_20261011` lets a teacher print one lesson from the
class book in the new app. The monorepo copies the primary template into a "print kit" with the
Workbooks commit id. It also needs the print data of each lesson, and a golden HTML file for its
test. The monorepo session asked for these on 2026-10-12 (cutover 2026-10-17/18).

## Requirements

### R1 One print file for each lesson
1. `content/primary/<book>/print/<package file name>` for origins-1, origins-2, origins-3.1,
   origins-3.2, and quest-4 (70 files; the insert is `origins-3.1/print/e12.json`).
2. Content: `{ seriesName, seriesLevel, lessonNumber, packageKey, lesson }`. The lesson is the
   `WorkbookLesson` that `scripts/print/make-lesson-pdfs.ts` renders: the project files for
   Origins 2, 3.1, 3.2, and Quest 4, and the packages for Origins 1.
3. Pictures are public bucket URLs, not local files. A local picture goes to the object that the
   injector uploaded: `images/<articleId>_<n>.png`, n = its place in `pkg.images`
   (`bucketObjects`, `lib/inject/legacy.ts`). The bucket PNG is a lossless copy of the local file.
4. The export stops when a lesson has no package, the titles differ, or a picture has no bucket object.

### R2 Golden fixture
`origins-3.2/print/golden/lesson-05.html` (with the answer key page) and `lesson-05-no-key.html`
(without it), rendered from `origins-3.2/print/p05.json` at the same commit.

### R3 One renderer
`make-lesson-pdfs.ts` and the export share `lib/print/book-lessons.ts` and `lessonDocument`
(`lib/print/print-export.ts`). The 70 PDF documents stay byte-identical to `eeeddfd`.

### R4 No effect on the imports
The class-books import (`import-lesson-packages.ts`) and the Workbooks package tools read only the
top-level `*.json` files of a book folder, so they do not read `print/`.

## Out of scope
- The legacy `article_image_url` arrays of the printed Origins 2 and 3.1 files stay as they are
  (the same URLs as `article_images`; the renderer uses `article_images`).
- Removal of the proprietary fonts in `dashboard/public/fonts/publisher-font-package/` (Daniel's decision).

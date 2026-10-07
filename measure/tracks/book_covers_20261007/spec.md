# Spec: Book covers from data (front and back)

Version 1.1 | Date 2026-10-07 | Status: Approved | Owner: Daniel Bo | Internal

## Goal

A script makes each Primary Advantage cover from a data file, the book art, and a shared cover
kit. Daniel made the covers for levels 1–4 in Canva. Their back covers have errors from copied
text: the wrong "next book" ("Origins 2" on the Origins 2, 3.1, and 3.2 backs), "the first step"
on books after Origins 1, the wrong book name ("Origins3.2" on the level 4 back), and two names
for level 4 ("QUEST 4.1", "Origins 4"; the correct name is **Quest 4**). Levels 5–9 need covers
for 11 more books.

First deliverables: Origins 3.2 (corrected back) and Quest 4 (front and back). Both go to the
printer in the week of 2026-10-12. Then new, improved backs for Origins 1, 2, and 3.1 (reprint).

## Facts (Canva SVG export, `Primary ADVANTAGE (210 x 285 mm).zip`, 2026-10-07)

- Page: 794 × 1077 Canva px = 210 × 285 mm. One Canva px = one CSS px.
- Front (3 pictures + outlines): the book art (pixel-equal to
  `assets/PA-<book>-background.png`), one frame layer for all books (level bar with "LV", PA
  logo, empty title banner; 1055 × 1491 RGB + a grayscale mask, pixel-equal on the Origins 3.2
  and level 4 fronts), and the level number and the title as outlined letters.
- Back (9 pictures + about 890 outlines): the back art (pixel-equal to
  `assets/PA-<book>-back-cover-background.png`), a paper panel, the RA logo, the CEFR steps
  picture, the QR code, a wooden sign (vector, solid wood colors), the CEFR badge, and the Thai
  and English text as outlined letters.
- Fonts (Daniel): League Spartan; level number 24.1, title 50, back text 13.6, contact lines
  13.4. Thai: a Canva fallback face (name unknown).
- Resolution: the art and the frame are about 128 ppi at print size. The Canva covers have the
  same resolution.
- Printer: Daniel sends flattened PDFs of the covers. No spine, no bleed.

## Decisions (Daniel, 2026-10-07)

- Thai face: use the Canva fallback face if it can be identified and is an OFL font; else
  Sarabun (the Thai print font of the workbooks).
- Claude writes the new Thai text; Daniel checks every Thai line before a cover goes to print.
- CEFR badge: A1 for levels 1–6 (Pre-A1 is not an official CEFR level).
- New, improved back covers for Origins 1, 2, and 3.1 too.

## Requirements

- R1. Cover kit: the shared layers, extracted once from the SVGs into `assets/cover-kit/`, with
  a README that names the source file of each layer. The extraction is a script, so a new Canva
  export can replace the kit.
- R2. Cover data for each book, checked by a Zod schema: title, level, series, front and back
  art, CEFR badge, and the back text (series paragraph, book paragraph, can-do points). The
  script takes the book name, the level, and the next book from the book order, not from free
  text.
- R3. Front template: League Spartan, static OFL files (no variable font, no synthesized bold),
  with the weight measured against the Canva render. Test: the rebuilt Origins 1, 2, 3.1, and 3.2
  fronts match the Canva renders within a set pixel difference.
- R4. Back template: the Canva layout, with the text set from the data. Test: a rebuild of the
  Canva Origins 3.2 back with the Canva text matches the Canva render by eye and within a set
  pixel difference outside the text.
- R5. Copy check: a cover fails when a text field names a book other than the cover's book or
  its next book, or when the next book is wrong.
- R6. One command per book makes two outputs. The first output is a 1474 × 2000 RGB PNG of each
  side in `assets/` (the existing names `PA-<Book>-Front Cover.png` and
  `PA-<Book>-Back Cover.png`). The second output is a 2-page print PDF (front, back) at
  210 × 285 mm, converted by `scripts/print/make-pdfx.ts` to PDF/X-1a. All picture layers of a
  side are combined into one opaque image, so the PDF has no transparency and the text stays
  vector.
- R7. Daniel approves each cover PNG before the print PDF is made.

## Out of scope

Spine and full spread; bleed and crop marks (the same as the Canva covers; ask the printer);
new art for levels 5–9 (phase 4, separate approval); higher-resolution art; Secondary (Reading
Advantage) covers.

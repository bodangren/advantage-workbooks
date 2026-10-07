# Plan: Book covers from data

Spec: [spec.md](./spec.md). Source SVGs: `~/Downloads/Primary ADVANTAGE (210 x 285 mm) (210 x 285 mm).zip`
(1 = level 4 front "QUEST 4.1", 2–9 = Origins 1, 2, 3.1, 3.2 front and back, 10–11 = level 4
"Origins 4" front and back).

## Phase 1: Cover kit, cover data, and the front cover

- [ ] Task: Kit. `scripts/covers/extract-kit.ts <svg-dir>` writes the shared layers to
      `assets/cover-kit/` (frame as RGBA = frame × mask, paper panel, RA logo, CEFR steps, A1 badge,
      QR code, wooden sign) and a README with the source file and SHA-256 of each layer
- [ ] Task: Fonts. League Spartan static woff2 files (Fontsource) for the weights in use, with the
      OFL file, in `dashboard/assets/print-fonts/`; the weight measured against the Canva title
- [ ] Task: Contract. `lib/covers/schema.ts` (Zod cover data) and `lib/covers/catalogue.ts` (cover
      order Origins 1 → Adventure 9.3, display name, level, next book, CEFR badge A1 for levels
      1–6); tests first
- [ ] Task: Copy check. `lib/covers/check.ts` (R5); tests first, with the Canva Origins 3.2 back
      text as a failing fixture
- [ ] Task: Front template and render. `lib/covers/template.ts` (front) and
      `scripts/covers/make-cover.ts <book> --front`: a 1474 × 2000 PNG. Test: rebuilt Origins 1, 2,
      3.1, and 3.2 fronts against the Canva renders (R3)
- [ ] Task: The Quest 4 front PNG; Daniel's check
- [ ] Task: Measure - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Back cover and the new back text

- [ ] Task: Thai face. Identify the Canva fallback face; use it if it is OFL, else Sarabun
- [ ] Task: Back template. Layout from the Canva back (logo, steps, badge, panel, sign, QR, text
      blocks). Test: a rebuild of the Canva Origins 3.2 back with the Canva text (R4)
- [ ] Task: Back text data for Origins 1, 2, 3.1, 3.2, and Quest 4 (improved; Thai drafted by
      Claude); the copy check passes; Daniel checks the Thai
- [ ] Task: The back PNGs of the five books; Daniel's check
- [ ] Task: Measure - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Print files

- [ ] Task: Compose. sharp combines all picture layers of a side into one opaque image
      (2480 × 3366 px, 300 ppi); the template draws only text and solid shapes on it. Test: the
      print PDF passes `make-pdfx.ts --check` with the fonts kept
- [ ] Task: `make-cover.ts <book> --print`: a 2-page Chrome PDF, then `make-pdfx.ts`, to
      `~/Desktop/print-ready/Primary-Advantage-<Book>-Cover_PDFX-1a.pdf`
- [ ] Task: The Origins 3.2 and Quest 4 print PDFs after Daniel approves the PNGs (printer: week of
      2026-10-12)
- [ ] Task: Docs. tech-stack.md (League Spartan, the cover pipeline), lessons-learned.md,
      tech-debt.md
- [ ] Task: Measure - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4 (later; separate approval): levels 5–9

- [ ] Task: Hero reference sheets (the boy, the girl, the fox) from the Quest 4 front, for
      `--subject-ref`; a test of one wide picture
- [ ] Task: One wide picture (R8) for each of Quest 5, Quest 6.1, 6.2, and Adventure 7.1–9.3, from
      `docs/content-plans/primary-cover-art-plan.md`; Daniel approves each picture
- [ ] Task: Adventure series text; the CEFR badge for levels 7–9 (Daniel's decision)
- [ ] Task: Covers for each book

# Plan: Book covers from data

Spec: [spec.md](./spec.md). Source SVGs: `~/Downloads/Primary ADVANTAGE (210 x 285 mm) (210 x 285 mm).zip`
(1 = level 4 front "QUEST 4.1", 2–9 = Origins 1, 2, 3.1, 3.2 front and back, 10–11 = level 4
"Origins 4" front and back).

## Phase 1: Cover kit, cover data, and the front cover

- [x] Task: Kit. `scripts/covers/extract-kit.ts --front <svg> --back <svg>` writes the shared layers
      to `assets/cover-kit/` (front frame, back overlay with the panel, logos, QR code, and sign, A1
      badge; each the Canva page with every other element removed, rendered by Chrome with a
      transparent background) and a README with the source files and SHA-256 2d39a44
- [x] Task: Fonts. League Spartan 700 (Fontsource 5.3.0, OFL) in `dashboard/assets/print-fonts/`;
      measured against the Canva title: 82.7 CSS px, pixel overlap 0.89 70e204e
- [x] Task: Contract. `lib/covers/schema.ts` (Zod cover data) and `lib/covers/catalogue.ts` (16
      books, Origins 1 → Adventure 9.3, display name, level, next book, CEFR badge A1 for levels
      1–6) 70e204e
- [x] Task: Copy check. `lib/covers/check.ts` (R5); the Canva Origins 3.2 back text fails; three
      mutations caught 70e204e
- [x] Task: Front template and render. `lib/covers/compose.ts`, `lib/covers/template.ts`, and
      `scripts/covers/make-cover.ts <book> --front`: a 1474 × 2000 PNG. R3 (mean difference per
      channel against the Canva render, 1474 × 2000): Origins 1 page 8.4, title band 13.7; Origins
      3.2 (art at the top) 11.7 and 14.8. Origins 2 and 3.1 differ only in the title band (27.0,
      26.9): Daniel moved those Canva titles by hand (baselines 731.1 and 733.6 pt). Canva centered
      the art on every page except the Origins 3.2 front, so the placement is cover data
      (`art.align`, default center), not kit data
- [~] Task: The Quest 4 front PNG (`assets/PA-Quest-4-Front Cover.png`); Daniel's check
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

- [~] Task: Hero references and a test of one wide picture (Quest 5, 2026-10-07). mmx image-01
      (`--subject-ref` with the heroes cut from the Quest 4 front, 2048 × 1392): generic cartoon
      style, other faces, heroes over the center line; failed. Muse (`meta/muse-image`, OpenRouter,
      `aspect_ratio 3:2` = 1920 × 1280, references: heroes from Quest 4, fox from Origins 3.2, the
      Origins 3.2 front art for the style): same style, same heroes and fox; chosen. Prompt rules: never
      say "left half = back cover" (Muse then draws a divider); say "one continuous painting, no
      divider"; give the hero size by place (heads at the middle of the height, feet one sixth above
      the bottom). Cut: 1886 × 1280 → two pages of 943 × 1280 (about 114 ppi)
- [ ] Task: One wide picture (R8) for each of Quest 5, Quest 6.1, 6.2, and Adventure 7.1–9.3, from
      `docs/content-plans/primary-cover-art-plan.md`; Daniel approves each picture
- [ ] Task: Adventure series text; the CEFR badge for levels 7–9 (Daniel's decision)
- [ ] Task: Covers for each book

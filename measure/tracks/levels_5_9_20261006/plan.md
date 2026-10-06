# Plan: Levels 5–9 workbook lessons and online banks

Track: `levels_5_9_20261006`. Progression plan: `docs/content-plans/primary-levels-5-9-plan.md`.

## Phase 1: Decisions, inventory, tools, calibration

- [x] A2 objective key (`data/a2-objective-key.json`, GSE 30–42); lead objectives per book (`level-plans/levels-5-9-objectives.*`)
- [x] Daniel's decisions D1–D7 (plan §11): all proposals approved, 2026-10-06
- [ ] Read-only inventory of levels 5–9 (`scripts/inventory-legacy.ts`; needs read access to the legacy database); similar old articles grouped (`scripts/plan-dedup.ts`)
- [x] Vocabulary index: A2 Key and B1 Preliminary as separate levels (`Key`, `PET`, `Above`); tests
- [x] Profiles `quest-5`, `quest-6`, `adventure-7`, `adventure-8`, `adventure-9`, and `bank-5` … `bank-9`; glossed-word rules for a Flyers and an A2 Key list level (`glossedFrom`); paragraph ranges; book folders in `BOOK_ORDER`, `BOOK_KEYS`, and `BOOK_PROFILES`; tests (levels 1–4 check results unchanged; mutation test passed)
- [x] Coverage report for levels 5–9 (`scripts/level-coverage.ts --levels 5-9` → `level-plans/coverage-5-9.md`): the book rule, the level rule, and the list coverage; tests
- [x] Recycling (Daniel, 2026-10-06): the coverage report shows the first teaching and the practice after it for each A1 and A2 objective; `--next <book>` prints the lists for a lesson map; tests
- [~] Supporting objectives: every objective that a package gives practice in. Done for Quest 4, bank-4, Origins 1, Origins 3.2, Origins 2, and Origins 3.1 (8241be9) (`data/availability-*.json`; generic objectives are in every package of their band). bank-1 to bank-3: data checked (`availability-bank-1-2.json`, `availability-bank-3.json`); the merge into the packages waits for the end of the production load, because the injector writes those packages
- [x] Fault fixed: the MCQ option shuffle put 99% of the answers last (222 lessons, app and print); print files, lesson PDFs, and the Origins 3.2 and Quest 4 book PDFs made again (4625ff3, 323da27)
- [x] Bank text types for levels 5–9 (`scripts/plan-level-bank.ts 5`…`9` → `level-plans/bank-5…9`); word lists by topic for Flyers and A2 Key; tests. Follow-up: required words come mostly in alphabetical order, not by topic
- [x] Grammar draft (plan §7) checked against the Movers, Flyers, and A2 Key handbooks (`data/grammar-levels-5-9.md`; spot check of 6 items in the PDFs)
- [x] Calibration: two sample texts for each level pass the text check (`calibration/levels-5-9/`); a 480-word level 9 article prints on 2.5 pages (the lesson grows from 15 to 16 pages). Follow-up: 5 small profile changes and the text-check faults in `report.md` (past forms, -ied/-ier, lines with no end stop)
- [~] Injector: a new-database target (`--target new`; UUID ids, `primary_legacy_id_map`, picture key in `articles.image`); tests; dry run only. Open: agreement with the monorepo side (7 questions in the field map, open item 3)
- [ ] Dialogue audio with one voice for each speaker (D5)
- [~] Series bible: Quest ages and an Adventure section (`primary-quest-adventure-series-bible.md`, draft); cast-sheet candidates for 8 of the 13 new people (4324f47), for Daniel to choose on `/review/cast` (D3)

## Phase 2: Level 5

- [~] Quest 5: lesson map (v0.2, approved), 14 packages (0a2ef3c, drafts, 0 FAIL; my review fixed 8 text faults), editorial pre-review (done: `reviews/2026-10-06-prereview-level-5.md`, 76 changes), pictures, audio, Tutor clips
- [~] bank-5: plan and 36 packages (9a276cc, drafts, 0 FAIL; my review fixed names, May's family, the November dates, and the Thai for Aunt Sue); cross-batch QA; editorial pre-review (done, 92 changes, same report); pictures and audio
- [~] Coverage report for level 5 (every goal met: 31 of 31 objectives at 3+, 0 book gaps; Movers 354 of 355, "get undressed" left for level 6); tags export; Daniel's review

## Phase 3: Level 6

- [~] Quest 6.1: lesson map, 14 packages, pre-review, media — map v0.3; 14 lessons PASS; pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-quest-6.md`); pictures started; audio and Daniel's approval next
- [~] Quest 6.2: lesson map, 14 packages, pre-review, media — map v0.3; 14 lessons PASS; pre-review done (same report); media and Daniel's approval next
- [~] bank-6: 72 packages; QA; media — 72 drafts, 0 FAIL; pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-bank-6.md`, 205 changes); media next
- [ ] A1 band report: every A1 objective and every Movers word; tags export; Daniel's review

## Phase 4: Level 7

- [~] Adventure 7.1 and 7.2: lesson maps, 28 packages, pre-review, media — maps v0.3; 28 lessons PASS (4–6 new A2 Key words each, Daniel 2026-10-06); pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-adventure-7.md`); pictures started; audio and Daniel's approval next
- [~] bank-7: 72 packages; QA; media — writers started 2026-10-06
- [ ] Coverage report; tags export; Daniel's review

## Phase 5: Level 8

- [ ] Adventure 8.1, 8.2, and 8.3: lesson maps, 42 packages, pre-review, media
- [ ] Word pacing before bank-8 and bank-9 (levels plan §6, v0.5): the Adventure 8 maps (then 9) take the new A2 Key words first; then generate the bank-8 (then bank-9) required words again in `lib/lesson-package/bank-plan.ts` from words that earlier packages and the level's maps gloss, so that the bank does not use up the A2 Key list (the current bank-8 plan needs 432 Key places with each word once before any word twice). Test first.
- [ ] bank-8: 108 packages; QA; media
- [ ] Coverage report (95% of Flyers); tags export; Daniel's review

## Phase 6: Level 9

- [ ] Adventure 9.1, 9.2, and 9.3: lesson maps, 42 packages, pre-review, media
- [ ] bank-9: 108 packages; QA; media
- [ ] A2 band report: every A2 objective, 90% of A2 Key; tags export; Daniel's review

## Phase 7: Into the app

- [ ] For each approved level: backup, injection into the new database, verify, similar old articles deleted (after Daniel approves the level), tags export

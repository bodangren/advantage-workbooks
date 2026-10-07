# Plan: Levels 5–9 workbook lessons and online banks

Track: `levels_5_9_20261006`. Progression plan: `docs/content-plans/primary-levels-5-9-plan.md`.

## Phase 1: Decisions, inventory, tools, calibration

- [x] A2 objective key (`data/a2-objective-key.json`, GSE 30–42); lead objectives per book (`level-plans/levels-5-9-objectives.*`)
- [x] Daniel's decisions D1–D7 (plan §11): all proposals approved, 2026-10-06
- [~] Read-only inventory of levels 5–9 (`scripts/inventory-legacy.ts`; needs read access to the legacy database); similar old articles grouped (`scripts/plan-dedup.ts`) — inventory done 2026-10-08 on the local copy of the 2026-10-07 export (`data/legacy-levels-5-9-2026-10-08.json`): 271 old articles (92, 88, 4, 38, 49), 14 approved, 26 with any student use (15 progress rows, 0 assignments); no level 5–9 package replaces an old article. Open: the grouping (`plan-dedup.ts` writes the fixed levels 1–4 paths; it needs an output option first)
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
- [~] Series bible: Quest ages and an Adventure section (`primary-quest-adventure-series-bible.md`, draft); cast-sheet candidates for 8 of the 13 new people (4324f47), for Daniel to choose on `/review/cast` (D3) Sheets chosen by Claude on Daniel's instruction (2026-10-07, f4a962a); the 69 pictures made before the choice were made again with the sheets.

## Phase 2: Level 5

- [~] Quest 5: lesson map (v0.2, approved), 14 packages (0a2ef3c, drafts, 0 FAIL; my review fixed 8 text faults), editorial pre-review (done: `reviews/2026-10-06-prereview-level-5.md`, 76 changes), pictures, audio, Tutor clips Media complete and committed (ff14bf3, 2026-10-07).
- [~] bank-5: plan and 36 packages (9a276cc, drafts, 0 FAIL; my review fixed names, May's family, the November dates, and the Thai for Aunt Sue); cross-batch QA; editorial pre-review (done, 92 changes, same report); pictures and audio Media complete and committed (703d844, 2026-10-07).
- [~] Coverage report for level 5 (every goal met: 31 of 31 objectives at 3+, 0 book gaps; Movers 354 of 355, "get undressed" left for level 6); tags export; Daniel's review

## Phase 3: Level 6

- [~] Quest 6.1: lesson map, 14 packages, pre-review, media — map v0.3; 14 lessons PASS; pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-quest-6.md`); pictures started; audio and Daniel's approval next
- [~] Quest 6.2: lesson map, 14 packages, pre-review, media — map v0.3; 14 lessons PASS; pre-review done (same report); media and Daniel's approval next Media complete and committed (caa8dec, 2026-10-07).
- [~] bank-6: 72 packages; QA; media — 72 drafts, 0 FAIL; pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-bank-6.md`, 205 changes); media next
- [~] A1 band report: every A1 objective and every Movers word; tags export; Daniel's review — coverage report 2026-10-08: 81 of 81 A1 objectives taught with 3+ practice after; Movers 355 of 355 by level 6; levels 5 and 6 meet every objective goal. Tags export and Daniel's review next

## Phase 4: Level 7

- [~] Adventure 7.1 and 7.2: lesson maps, 28 packages, pre-review, media — maps v0.3; 28 lessons PASS (4–6 new A2 Key words each, Daniel 2026-10-06); pre-review done (`docs/content-plans/reviews/2026-10-06-prereview-adventure-7.md`); pictures started; audio and Daniel's approval next
- [~] bank-7: 72 packages; QA; media — 72 written (72 PASS); pre-review b001–b036 done (75 changes), b037–b072 in progress; report `reviews/2026-10-06-prereview-bank-7.md` (draft). Three November dates moved into the first term (Adventure 8.1 holds November 14 and 21).
- [~] Coverage report; tags export; Daniel's review — 2026-10-08: level 7 meets every objective goal (46 of 46 at 3+, 0 book gaps). The tags export waits for the injection (export-tags.ts runs after each injection); Daniel's review next

## Phase 5: Level 8

- [~] Adventure 8.1, 8.2, and 8.3: lesson maps, 42 packages, pre-review, media — 42 written and edited (42 PASS; 146 change rows); committed 8ceba82, 79ffad8, 5a7ca16; report `reviews/2026-10-07-prereview-adventure-8.md`; 8.1 and 8.2 media complete (c03bfb3, 3d015c6); 8.3 pictures done, audio in progress (2026-10-08). Waits for Daniel.
- [x] Word pacing before bank-8 and bank-9 (levels plan §6, v0.5): `plan-level-bank.ts --a2key-from` (fd97e9f, test-first); bank-8 plan generated again from the Adventure 7 and 8 words (4b13fd8: 0 new A2 Key words, was 143). bank-9 plan generated again from the Adventure 7, 8, and 9 words (cceb53a).
- [~] bank-8: 108 packages; QA; media — 108 written and edited (108 PASS; 216 change rows); report `reviews/2026-10-07-prereview-bank-8.md`; pictures done; audio in progress (2026-10-08). Provisional approval after the media.
- [~] Coverage report (95% of Flyers); tags export; Daniel's review — 2026-10-08: Flyers 467 of 476 (98%) by level 8; levels 7 and 8 meet every objective goal. Tags export and Daniel's review next

## Phase 6: Level 9

- [~] Adventure 9.1, 9.2, and 9.3: lesson maps, 42 packages, pre-review, media — maps committed (cceb53a); 42 written (42 PASS, no word twice in a book); pre-review of all three books done (f981a80, `reviews/2026-10-07-prereview-adventure-9.md`); pictures done; audio in progress (2026-10-08).
- [~] bank-9: 108 packages; QA; media — plan generated again with --a2key-from (cceb53a); 108 written and edited (108 PASS; 272 change rows); report `reviews/2026-10-07-prereview-bank-9.md`; pictures done; audio in progress (2026-10-08). Provisional approval after the media.
- [~] A2 band report: every A2 objective, 90% of A2 Key; tags export; Daniel's review — 2026-10-08: 156 of 156 A2 objectives taught with 3+ practice after (bank-7 b064 now supports R32.8); level 9 meets every objective goal. A2 Key 496 of 578 (85.8%): 72 of the 82 missing words are in no text (British forms, UK money and titles, adult topics), and 5 are glossed but not counted (headwords with "/" or "!"). Decision for Daniel (`level-plans/a2-key-gap.md`): leave British-only forms and UK money and titles out of the goal (like CD/DVD) → 496 of 547 (90.7%)

## Phase 7: Into the app

- [ ] For each approved level: backup, injection into the new database, verify, similar old articles deleted (after Daniel approves the level), tags export

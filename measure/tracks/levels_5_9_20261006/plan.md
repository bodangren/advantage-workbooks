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
- [~] Supporting objectives: every objective that a package gives practice in. Done for Quest 4 and bank-4 (`data/availability-quest-4.json`, `data/availability-bank-4.json`; R23.3, R24.6, and R25.2 are in every package). Not done for levels 1–3 (A0 band)
- [x] Fault fixed: the MCQ option shuffle put 99% of the answers last (222 lessons, app and print); print files and lesson PDFs rebuilt (4625ff3). Book PDFs of Origins 3.2 and Quest 4 still to make again
- [x] Bank text types for levels 5–9 (`scripts/plan-level-bank.ts 5`…`9` → `level-plans/bank-5…9`); word lists by topic for Flyers and A2 Key; tests. Follow-up: required words come mostly in alphabetical order, not by topic
- [x] Grammar draft (plan §7) checked against the Movers, Flyers, and A2 Key handbooks (`data/grammar-levels-5-9.md`; spot check of 6 items in the PDFs)
- [x] Calibration: two sample texts for each level pass the text check (`calibration/levels-5-9/`); a 480-word level 9 article prints on 2.5 pages (the lesson grows from 15 to 16 pages). Follow-up: 5 small profile changes and the text-check faults in `report.md` (past forms, -ied/-ier, lines with no end stop)
- [~] Injector: a new-database target (`--target new`; UUID ids, `primary_legacy_id_map`, picture key in `articles.image`); tests; dry run only. Open: agreement with the monorepo side (7 questions in the field map, open item 3)
- [ ] Dialogue audio with one voice for each speaker (D5)
- [~] Series bible: Quest ages and an Adventure section (`primary-quest-adventure-series-bible.md`, draft); new cast sheets (13 people, 3 priorities) not made yet (D3)

## Phase 2: Level 5

- [ ] Quest 5: lesson map, 14 packages, editorial pre-review, pictures, audio, Tutor clips
- [ ] bank-5: plan and 36 packages; cross-batch QA; pictures and audio
- [ ] Coverage report for level 5; tags export; Daniel's review

## Phase 3: Level 6

- [ ] Quest 6.1: lesson map, 14 packages, pre-review, media
- [ ] Quest 6.2: lesson map, 14 packages, pre-review, media
- [ ] bank-6: 72 packages; QA; media
- [ ] A1 band report: every A1 objective and every Movers word; tags export; Daniel's review

## Phase 4: Level 7

- [ ] Adventure 7.1 and 7.2: lesson maps, 28 packages, pre-review, media
- [ ] bank-7: 72 packages; QA; media
- [ ] Coverage report; tags export; Daniel's review

## Phase 5: Level 8

- [ ] Adventure 8.1, 8.2, and 8.3: lesson maps, 42 packages, pre-review, media
- [ ] bank-8: 108 packages; QA; media
- [ ] Coverage report (95% of Flyers); tags export; Daniel's review

## Phase 6: Level 9

- [ ] Adventure 9.1, 9.2, and 9.3: lesson maps, 42 packages, pre-review, media
- [ ] bank-9: 108 packages; QA; media
- [ ] A2 band report: every A2 objective, 90% of A2 Key; tags export; Daniel's review

## Phase 7: Into the app

- [ ] For each approved level: backup, injection into the new database, verify, similar old articles deleted (after Daniel approves the level), tags export

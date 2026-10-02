# Plan: Levels 1–4 workbook lessons and online banks

Track: `level_banks_20261002`

## Phase 0: Inventory

- [x] Read-only production inventory of levels 1–4 (`scripts/inventory-legacy.ts`)

## Phase 1: Tools (TDD)

- [x] Profiles origins-1, quest-4, bank-1 … bank-4; Movers list for level 4 (`listLevel`); first lesson has nothing to recycle; tests
- [x] `meta.role` (workbook or bank) and `meta.replaces` (old article id); bank packages skip the print set, activities, and Tutor clips; tests
- [x] A1 objective key (`a1-objective-key.json`, GSE 22–29) from the graph; YLE word lists by topic
- [x] Book order: Origins 1 first; Origins 1 has no printed books before it
- [x] Authoring format → package converter (`scripts/author-package.ts`, `lib/lesson-package/author.ts`): one "English | Thai" line per sentence, answer shuffle, evidence by reference, glossary example and graph nodes found automatically; tests; guide `content/primary/AUTHORING.md`
- [x] Similar old articles grouped; the best of each group kept (`scripts/plan-dedup.ts`, `level-plans/duplicates.md`)
- [x] Bank article plans (`scripts/plan-level-bank.ts`, `level-plans/bank-1.md` … `bank-4.md`); Origins 1 map (stories, no alphabet) and Quest 4 map
- [x] Coverage report per level: objectives and glossed words against the graph (`scripts/level-coverage.ts`)
- [x] Injector and audio: bank packages without Tutor clips; `meta.replaces` as the app article
- [x] Checks across packages: same titles, same old article, MCQ options, recycle words, similar texts (`scripts/qa-packages.ts`)
- [x] Media for whole book folders (`scripts/media/make-media.ts`)
- [x] Check fixes from the writer reports: accents ("café"), "-s" stem before "-es" ("planes")

## Phase 2: Workbook lessons

- [x] Origins 3.2: 14 packages from the briefs
- [x] Quest 4: lesson map and 14 packages
- [x] Origins 1: lesson map and 14 packages
- [ ] Pictures (Muse) and audio with Tutor clips for the 42 lessons

## Phase 3: Banks

- [ ] Level 4: 36 packages
- [x] Level 1: 36 packages
- [ ] Level 2: 24 packages
- [ ] Level 3: 84 packages
- [ ] Pictures and audio for the bank packages
- [ ] Coverage report: every level objective in 2 or more articles

## Phase 4: Approval and injection

- [x] Review page: approve a whole folder of lessons that pass every check; picture sheet per book
- [x] Delete script for the similar old articles (backup first; after Daniel approves the level)
- [ ] Daniel approves; inject (backup first); verify; level counts 50, 50, 100, 50
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`

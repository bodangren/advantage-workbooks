# Plan: Levels 5–9 workbook lessons and online banks

Track: `levels_5_9_20261006`. Progression plan: `docs/content-plans/primary-levels-5-9-plan.md`.

## Phase 1: Decisions, inventory, tools, calibration

- [x] A2 objective key (`data/a2-objective-key.json`, GSE 30–42); lead objectives per book (`level-plans/levels-5-9-objectives.*`)
- [ ] Daniel's decisions D1–D7 (plan §11)
- [ ] Read-only inventory of levels 5–9 (`scripts/inventory-legacy.ts`; needs read access to the legacy database); similar old articles grouped (`scripts/plan-dedup.ts`)
- [ ] Vocabulary index: A2 Key and B1 Preliminary as separate levels (now one "Key/PET" group); tests
- [ ] Profiles `quest-5`, `quest-6`, `adventure-7`, `adventure-8`, `adventure-9`, and `bank-5` … `bank-9`; glossed-word rules for a Flyers and an A2 Key list level; book folders in `BOOK_ORDER` and `BOOK_PROFILES`; tests
- [ ] Coverage report for levels 5–9 (`scripts/level-coverage.ts`): the book rule, the level rule, and the list coverage
- [ ] Bank text types for levels 5–9 (`scripts/plan-level-bank.ts`) from the lead objectives
- [ ] Grammar draft (plan §7) checked against the Movers, Flyers, and A2 Key handbooks
- [ ] Calibration: two sample texts for each level through the text check; one print test of a 480-word article in the 13-step template (the article may need two pages)
- [ ] Injector: a new-database target (`--target new`), agreed with the monorepo session (UUID ids, picture key, `legacy_id_map`); tests
- [ ] Dialogue audio with one voice for each speaker, if Daniel agrees (D5)
- [ ] Series bible: Quest ages; an Adventure section and new cast sheets (D3)

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

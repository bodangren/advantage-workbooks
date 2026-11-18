# Spec: Levels 5–9 workbook lessons and online banks

Version 0.3 | Date 2026-11-19 | Status: Active | Owner: Daniel Bo | Internal

## Goal

Daniel (2026-10-06): "Next, we need to develop the material for levels 5-9. Please come up with a plan. Use the mastery-advnatage graph to make a strong progression. You can find the book plan in the advantage-pr repo. Remember that each book gets 14 articles in them (which should be as complete as possible), while the total number of articles in the system is 50/book."

1. Complete lesson packages for the 11 books of levels 5–9: Quest 5, Quest 6.1, Quest 6.2, Adventure 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3 (154 lessons).
2. An online bank of 36 articles for each book (396 articles).
3. 50 articles for each book in the Primary database: 50, 100, 100, 150, and 150 at levels 5–9.
4. A progression from the Mastery Advantage graph: every in-scope A1 and A2 reading and listening objective, every Movers word, 95% of the Flyers words, and 90% of the A2 Key words taught by the end of level 9.

The progression plan, with the tables, is `docs/content-plans/primary-levels-5-9-plan.md`.

## Start state

- Books: none of the 11 exists. The book catalogue is in `advantage-pr/08-strategy/product-strategy-2026-2027.md` §2.
- Production articles at levels 5–9: not known. The inventory needs read access to the legacy database (Phase 1).
- Graph: the A1 key exists (`data/a1-objective-key.json`, GSE 22–29, 86 objectives). The A2 key is new (`data/a2-objective-key.json`, GSE 30–42, 162 objectives; the A1 rule makes the same ids).
- Words not yet glossed in the 250 packages: 131 Movers, 461 Flyers, 570 A2 Key.
- Tools: the text check knows Starters, Movers, Flyers, and one "Key/PET" group above Flyers. The injector writes only to the legacy database.

## Requirements

### Objectives

- Source: young-learner reading and listening objectives in `mastery-advantage/english/gse-knowledge-space.json`. Level ranges from `mastery-advantage/english/gse-to-primary-advantage.csv`: level 5 GSE 24–26, 6 GSE 27–29, 7 GSE 30–33, 8 GSE 34–38, 9 GSE 39–42.
- Band rule (Daniel, 2026-09-30): the books of a CEFR band share its objectives; no book is pinned to a GSE range. The objectives that each book teaches first: `docs/content-plans/level-plans/levels-5-9-objectives.json` (`books`).
- Each article has 2–4 targets. Each question carries its objectives.
- Book rule: each objective that a book teaches first is a target in 1 or more of its 14 lessons.
- Level rule: each in-scope objective of a level's own GSE range (`levels`) is a target in 3 or more packages of the level.
- Recycling (Daniel, 2026-10-06): each package lists every objective that it gives practice in (targets and supporting objectives). The coverage report counts the practice after the first teaching, and the lesson maps choose their other targets from the lowest counts.
- Out of scope (D1): R25.6, R26.4, R29.1, R32.3 (sounds); R24.1, R29.7, R37.8 (dictionary); L30.2, L31.8, L41.2, R38.13 (media and online tasks).

### Vocabulary

- The Cambridge lists in the vocabulary graph. 12 glossed words in each article. The list share and the glossed-word rules for each level are in the plan §5.
- Coverage goals: every Movers word by the end of level 6; 95% of the Flyers words by the end of level 8; 90% of the A2 Key words by the end of level 9.
- Each glossed word maps to its graph node (`tags.glossedNodes`), and `content/primary/tags.json` is exported again after each book.

### Packages

- A workbook lesson is complete: all package parts, 3 pictures, audio, Tutor clips, tags, and teacher-manual pages. The 13 printed steps do not change.
- A bank article has the app parts only (`meta.role = "bank"`).
- `ra_level` and `cefr_level`: 5 A1, 6 A1+, 7 A2-, 8 A2, 9 A2+.

### Process

- Each book: lesson map, 14 packages, editorial pre-review, media, Daniel's approval, injection, tags export.
- Packages go into the new database after the cutover. A new-database target for the injector comes before the first injection.

## Decisions

Daniel (2026-10-06): "Approve all proposals, start Phase 1. Use four sonnet subagents at a time to work as quickly as possible." So D1–D7 in plan §11 are decisions: the 11 out-of-scope objectives; the text profiles of §5 (calibrated in Phase 1); the cast of §8; the levels 1–4 rule for old articles; one voice for each speaker in dialogue from Adventure 7 on; Quest 5 and 6 first, then Adventure in level order; Thai for each sentence (print shows Thai only in the glossary from Adventure 8 on).

Grouping targets (2026-11-19, default of the orchestrator, waits for Daniel's word in the level review): the grouping run of `plan-dedup.ts` uses 50 articles per book, by the book list of `docs/content-plans/primary-levels-5-9-plan.md` §2. The book counts of that file: level 5 has 1 book (Quest 5), level 6 has 2 (Quest 6.1, Quest 6.2), level 7 has 2 (Adventure 7.1, 7.2), level 8 has 3 (Adventure 8.1, 8.2, 8.3), level 9 has 3 (Adventure 9.1, 9.2, 9.3). So the run targets are 50, 100, 100, 150, 150. Each level total includes the 550 new packages: the new ids fill the book targets, and the run applies the levels 1–4 rule to the old articles alone (keep = target − printed: level 5 keeps 50 of 92; levels 6 to 9 keep all: 88, 4, 38, 49, each below its target). That keep count is provisional and is not a decision of this track: at level 5 the total is 50 new packages plus the kept old articles of the run (up to 50), provisional. Daniel decides the final total, and for each kept old article whether it is rebuilt (same id) or deleted, in the level review. The run output is provisional: its heading and its intro say so, and it shows no delete column. The run takes a passages inventory only (articles with `summary` and `passage`), never the metadata-only inventory. No deletion happens in this track before Phase 7.

## Out of scope

Levels 10–15 (Hero and Legend are deferred: the A2 ceiling). Changes to the 13 printed steps. Speaking and writing objectives as article targets (the workbook's writing steps keep their current form).

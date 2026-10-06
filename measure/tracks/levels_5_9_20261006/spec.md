# Spec: Levels 5–9 workbook lessons and online banks

Version 0.1 | Date 2026-10-06 | Status: Draft (waits for Daniel's decisions D1–D7) | Owner: Daniel Bo | Internal

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
- The lead objectives of each book: `docs/content-plans/level-plans/levels-5-9-objectives.json`.
- Each article has 2–4 targets. Each question carries its objectives.
- Book rule: each lead objective of a book is a target in 1 or more of its 14 lessons.
- Level rule: each in-scope objective of a level is a target in 3 or more packages of the level.
- Out of scope (proposal D1): R25.6, R26.4, R29.1, R32.3 (sounds); R24.1, R29.7, R37.8 (dictionary); L30.2, L31.8, L41.2, R38.13 (media and online tasks).

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

Open (plan §11): D1 out-of-scope objectives; D2 text lengths; D3 cast; D4 old articles; D5 dialogue audio; D6 order and print dates; D7 Thai in print.

## Out of scope

Levels 10–15 (Hero and Legend are deferred: the A2 ceiling). Changes to the 13 printed steps. Speaking and writing objectives as article targets (the workbook's writing steps keep their current form).

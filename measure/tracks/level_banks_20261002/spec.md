# Spec: Levels 1–4 workbook lessons and online banks

Version 1.1 | Date 2026-10-02 | Status: Active | Owner: Daniel Bo | Internal

## Goal

Daniel (2026-10-02): "Create the 1, 3.2 and 4 article definitions and assets that will be used in
the workbooks, then for levels 1-4, rework all articles not in the workbooks -- these can be
completely rebuilt based on the mastery advantage graph requirements because they are not printed
anywhere yet. We need to increase the minimum number of articles in each level to 50."

1. Lesson packages with all assets for Primary Advantage Origins 1 (level 1), Origins 3.2 (level 3),
   and Quest 4 (level 4): 42 lessons.
2. A rebuilt online bank for levels 1–4. Every live article at these levels that no printed book
   uses gets new text, questions, Thai, pictures, and audio from the Mastery Advantage graph.
3. 50 or more articles at each of the levels 1–4 in the Primary database.

## Start state (read-only production inventory, 2026-10-02, `scripts/inventory-legacy.ts`)

| Level | CEFR | Articles | Printed (Origins 2, 3.1, E12) | Not printed |
|---|---|---|---|---|
| 1 | A0- | 64 | 0 | 64 |
| 2 | A0 | 56 | 26 | 30 |
| 3 | A0+ | 173 | 2 | 171 |
| 4 | A1- | 7 | 0 | 7 |

## Decisions

Daniel (2026-10-02):
- "Keep information about all duplicates, but delete all but the best and rebuild that. We do not need 150+ article, escpecially if they are similar. The levels with two books need about 100 and the levels with one book need about 50."
- Origins 1 is not an alphabet book: "alphabet will be handled by the schools in grades K-2 ... that entire alpabet / phonics / 100 first words thing will be handled in our later storytime-advnatage package."
- Sonnet subagents can write the articles in parallel once the article plans hold every requirement.

Claude (2026-10-02; Daniel can change them on review):
1. **Similar old articles.** `scripts/plan-dedup.ts` groups the old online articles of each level by their title, summary, and text, and keeps the best one of each group (most student use, then approved, then newest). The kept ones get new text; the others are deleted after Daniel approves the level (Cloud SQL backup first). `docs/content-plans/data/duplicates-levels-1-4.json` keeps every deleted article's title, summary, passage, and use counts; `level-plans/duplicates.md` lists the groups.
2. **Result per level.** Level 1: 14 Origins 1 + 36 bank = 50 (14 old deleted). Level 2: 26 printed + 24 bank = 50 (6 deleted). Level 3: 2 printed + 14 Origins 3.2 + 84 bank = 100 (73 deleted). Level 4: 14 Quest 4 + 36 bank = 50 (7 old ids reused, 43 new).
3. **Article ids.** A workbook lesson takes the id of a kept old article at its level (update mode): Origins 1 the 14 oldest kept level-1 ids, Origins 3.2 the 14 newest kept level-3 ids. Quest 4 gets new ids; the 7 old level-4 ids go to the level-4 bank. The print uses the book-and-lesson URL (plan D1), not the id.
4. **Bank packages** (`content/primary/bank-<level>/`) are online only: no print set, no workbook activities, and no Tutor Advantage clips (Tutor sells the printed books). `meta.role = "bank"`. They keep the app shape: 10 MCQ, 5 SAQ, 5 LAQ, 12 glossed words, 3 pictures, Thai per sentence.
5. **Other app languages.** New text has no old cn, tw, or vi. English fills them (the E12 rule).
6. **Quest 4 cast.** The Pip family continues, one school year older (Tom 10, Lily 8). The cast sheets stay the same.
7. **Origins 1** has 14 Pip-world stories at level 1 (`docs/content-plans/primary-origins-1-plan.md`).

## Graph requirements (Mastery Advantage)

- **Objectives.** Young-learner reading and listening objectives from
  `mastery-advantage/english/gse-knowledge-space.json`. Level 1: GSE 10–13. Level 2: GSE 14–17.
  Level 3: GSE 18–21. Level 4: GSE 22–23, with 24–25 as supporting (A1 key: `a1-objective-key.json`).
  Each article has 1–4 target objectives at or below its level; each question carries its
  objectives. Each objective of a level's own range is a target in 2 or more articles of the level.
  The letter and sound objectives (R10.1, R10.3, R14.2, R18.1, R21.3, L10.1, L10.3, L10.5, L16.3)
  are out of scope: schools and Storytime Advantage teach them (Daniel, 2026-10-02).
- **Vocabulary.** The Cambridge YLE lists in the vocabulary graph. Levels 1–3: running words on the
  Starters list; glossed words from Starters. Level 4: running words on Starters or Movers; 7 or more
  glossed words from Movers. Each glossed word maps to its graph node (`tags.glossedNodes`).
- **Text profiles** (`lib/text-profile/check.ts`):

| Profile | Words | Mean sentence | Longest | List share | Glossed |
|---|---|---|---|---|---|
| level-1 (Origins 1, bank-1) | 80–120 | 3.0–4.2 | 7 | Starters 95% | 11+ Starters, 1 Movers max |
| level-2 (bank-2) | 120–175 | 3.6–4.8 | 8 | Starters 95% | 10+ Starters, 2 Movers max |
| level-3 (Origins 3.2; bank-3) | 150–200 | 5.0–5.5 (bank 4.8–5.8) | 10 | Starters 95% | 10+ Starters, 2 Movers max |
| level-4 (Quest 4, bank-4) | 190–250 | 5.6–7.0 | 12 | Starters+Movers 95% | 7+ Movers, 1 Flyers max |

## Out of scope

The injection of a package before Daniel approves it (the injector refuses it). Levels 5–9.

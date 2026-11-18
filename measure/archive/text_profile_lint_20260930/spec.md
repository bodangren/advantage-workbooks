# Spec: Text-profile lint for new Primary Origins lessons

Track: `text_profile_lint_20260930` | Type: feature | Date: 2026-09-30 | Source: task C3 in `docs/content-plans/primary-origins-3.2-plan.md` §9

## Why

Origins 3.2 (14 lessons) and the Origins 3.1 lesson-12 insert go to the printer by 2026-10-24. Each text must meet the level-3 profile in the 3.2 plan §4. A person cannot count sentence lengths and Cambridge Starters shares by hand for 15 texts on each edit. The script does it in one command and lists the words to change.

## Inputs

1. **Draft files** (before the lesson JSON exists): Markdown with front matter, in `docs/content-plans/origins-3.2-drafts/`.
   ```
   ---
   lesson: P01
   title: Hello! I Am May
   profile: origins-3.2
   glossed: hi, spell, year, ...
   recycle: name, old, house, favorite
   names: Nong
   allow: sign
   ---
   Paragraph one.

   Paragraph two.

   Paragraph three.
   ```
2. **Lesson JSON** (`*_workbook.json`): `article_paragraphs[].text`, `vocabulary[].word`, `lesson_title`.
3. **Earlier lessons**: by default the lesson JSON in `primary/origins-2-a0/` and `primary/origins-3.1-a0/`, plus every file that comes before the lesson in its own folder (sorted by file name).
4. **Vocabulary graph**: `mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json` (a sibling repo). Override with `--graph` or `MASTERY_VOCAB_GRAPH`.

## Checks per lesson (profile `origins-3.2`, from the plan §4)

| ID | Check | Target |
|---|---|---|
| words | Running words | 150–200 |
| paragraphs | Paragraphs | 3 |
| msl | Mean sentence length | 5.0–5.5 words |
| longest | Longest sentence | 10 words or less |
| starters | Running words on the Starters list; names are not counted | 95% or more (see note) |
| gloss-count | Glossed words | 12 |
| gloss-starters | Glossed words on Starters | 10 or more (with at most 2 Movers words, 10 is the lowest possible) |
| gloss-movers | Glossed words on Movers | 2 or less |
| gloss-above | Glossed words above Movers or not in the graph | 0 |
| gloss-in-text | Each glossed word occurs in the text | all |
| new | Glossed Starters words that no earlier text uses | 6 or more; below that the status is WARN, not FAIL (Daniel, 2026-10-01: a good story comes before exact word order) |
| recycled | Glossed words of earlier lessons that occur in the text (own glossed words excluded) | 4 or more |
| recycle-list | Each word in the front-matter `recycle` list occurs in the text | all (only when the list exists) |
| questions | Question marks | 2 or more |
| digits | Numbers written as digits | 0 |
| spelling | British spellings (profile spelling = American) | 0 |

Note on `starters`: the plan's first version said "85% or more (or proper names)" against "Origins 3.1 today: 80%". The 80% came from the 2026-09-30 analysis, which counted names as non-Starters words. Names are about 13% of the words in Origins 3.1. With names not counted, Origins 3.1 scores 90.5% and Origins 2 scores 79%. So the target is 95% with names not counted, a real step up. The report also gives the share with names (`startersShare`).

Book checks: question marks (2 or more) in 10 or more of 14 lessons; dialogue in 6 or more lessons. They show as "pending" until the folder has 14 lessons.

Profile `origins-3.1-insert` (the errata lesson): 150–190 words, mean sentence length 4.5–5.2, 3 or more question marks; the other rules are the same.

## Rules of measurement

- Words: tokens that match `[A-Za-z']+` (same rule as the 2026-09-30 analysis). "T-shirt" is two tokens.
- Sentences: end at `.`, `!` or `?` (and a closing quotation mark) when the next word starts with a capital letter or an opening quotation mark. `"Where is Pip?" says Tom.` is one sentence.
- Lemmas: suffix rules and an irregular list, as in the 2026-09-30 analysis. Contractions reduce to their base (`don't` → `do`).
- Levels: the lowest Cambridge YLE level of any graph node that matches the form. Number words one to twenty count as Starters (the graph holds only "one"; task M1).
- Proper names: the series cast (series bible §2), the front-matter `names`, and capitalized words in mid-sentence that the graph does not hold. The report lists the names it used.
- Allowed words: the front-matter `allow` list names words above Starters that the lesson brief permits (for example "sign" in a sign lesson, or the days of the week). The Starters share does not count them, the same as names. The report lists them. Keep the list short; the brief sets it, not the writer.
- The glossed words and the series word "woof" count as allowed words too. The page teaches the glossed words, and the `gloss-movers` and `gloss-above` checks control their level. Without this rule, a lesson that repeats a glossed Movers word ("o'clock" in the routine lesson) fails the Starters share.
- American mode maps `mom` to the graph form `mum`.

## Output

A text report per lesson: each check with PASS or FAIL, the non-Starters words with their level, the new words, and the recycled words. Then the book checks. `--json` gives the same data as JSON. Exit code 1 when a check fails.

## Out of scope

GSE objective tagging (task C5), question and activity checks, and Thai text.

## Acceptance

- Unit tests with a small fixed vocabulary cover tokens, sentences, lemmas, each check, and the draft parser.
- One test runs the real graph on the insert v0 text (when the graph file exists): 167 words, 4 question marks, and "puppy" in the non-Starters list.
- `npx tsx scripts/lint-text-profile.ts ../docs/content-plans/origins-3.2-drafts` runs from `dashboard/`.

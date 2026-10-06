# Primary Advantage Levels 5–9 — Progression Plan

Version 0.4 | Date 2026-10-06 | Status: Approved (Daniel approved all proposals D1–D7, 2026-10-06) | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Track: `measure/tracks/levels_5_9_20261006/`. Data: [`level-plans/levels-5-9-objectives.md`](level-plans/levels-5-9-objectives.md) (the objectives of each book), [`data/a2-objective-key.json`](data/a2-objective-key.json) (new), [`data/a1-objective-key.json`](data/a1-objective-key.json). Book catalogue: `advantage-pr/08-strategy/product-strategy-2026-2027.md` §2.

## 1. Summary

Levels 5–9 have 11 books: Quest 5, Quest 6.1, Quest 6.2 (A1), and Adventure 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3 (A2). Each book has 14 complete workbook lessons. The system holds 50 articles for each book, so each book also gets 36 online bank articles. That makes 550 new lesson packages: 154 workbook lessons and 396 bank articles.

The Mastery Advantage graph sets the progression. The books of each CEFR band share the band's objectives and move up the GSE scale. Each article lists every objective that it gives practice in, so the coverage report can track recycling. Each book also takes its share of the next Cambridge word list. At the end of level 6, every A1 objective and every Movers word is taught. At the end of level 9, every A2 objective, every Flyers word, and 90% of the A2 Key words are taught.

## 2. Books and counts

| Level | CEFR (`cefr_level`) | GSE | Books | Workbook lessons | Bank articles | Articles in the level |
|---|---|---|---|---|---|---|
| 5 | A1 | 24–26 | Quest 5 | 14 | 36 | 50 |
| 6 | A1+ | 27–29 | Quest 6.1, Quest 6.2 | 28 | 72 | 100 |
| 7 | A2- | 30–33 | Adventure 7.1, 7.2 | 28 | 72 | 100 |
| 8 | A2 | 34–38 | Adventure 8.1, 8.2, 8.3 | 42 | 108 | 150 |
| 9 | A2+ | 39–42 | Adventure 9.1, 9.2, 9.3 | 42 | 108 | 150 |
| **Total** | | | **11 books** | **154** | **396** | **550** |

A **complete** workbook lesson has every part of the lesson package: the article, the glossary (English and Thai), Thai for each sentence, the app question bank (10 MCQ, 5 SAQ, 5 LAQ), the print set, the workbook activities, 3 pictures, the audio, the Tutor Advantage clips, the objective and vocabulary tags, and the teacher-manual pages. A bank article has the app parts only (no print set, no activities, no Tutor clips), as at levels 1–4.

## 3. The progression

| Level | Books | Objectives of the level's own GSE range | What the reader learns to do | Main text types | Words to gloss |
|---|---|---|---|---|---|
| 4 (now) | Quest 4 | 20 (GSE 22–23) | Read short illustrated stories and simple functional texts | 8 stories, 6 functional | Movers starts |
| 5 | Quest 5 | 31 (GSE 24–26) | Find names and key words; follow dialogue while listening; tell positive from negative; describe people, clothes, likes, family | 8 stories, 6 functional: a phone call, a family page, a weather diary, a chant with repeated lines, directions, a day plan | Movers (the 131 not yet glossed) |
| 6 | Quest 6.1, 6.2 | 30 (GSE 27–29) | Follow written directions; read a timetable, a menu, labels, notes, and messages; predict from pictures; infer a character's preferences; follow a traditional story | 7 stories, 7 functional per book | Movers finished; Flyers starts |
| 7 | Adventure 7.1, 7.2 | 46 (GSE 30–33) | Read signs and notices, event posters, postcards, maps with a key, board-game rules, factual texts with headings; follow a conversation; find the theme of a story | 7 stories, 7 informational or functional per book | Flyers |
| 8 | Adventure 8.1, 8.2, 8.3 | 67 (GSE 34–38) | Use linking words; read leaflets, safety rules, diagrams, biographies, diary entries, emails, recipes, animal fact files; compare two texts; find what a pronoun refers to; give evidence from the text | 6 stories, 8 informational or functional per book | Flyers finished; A2 Key starts |
| 9 | Adventure 9.1, 9.2, 9.3 | 43 (GSE 39–42) | Infer feelings and facts that the text does not state; find opinions and reasons, the writer's audience, a point of view, and paragraph topics; scan; read school-subject texts and news | 6 stories, 8 informational or functional per book | A2 Key |

The books of a CEFR band share the band's objectives (Daniel, 2026-09-30): no book is pinned to a GSE range. The objectives of each book are in [`level-plans/levels-5-9-objectives.md`](level-plans/levels-5-9-objectives.md).

**First teaching.** Each band objective is a target in one book lesson first. Quest 4 is written and teaches 34 of the 81 in-scope A1 objectives (GSE 22–25). The other objectives of each band are sorted by GSE and split evenly over the band's books:

| Book | Level | GSE of the objectives taught first | Objectives taught first |
|---|---|---|---|
| Quest 4 (written) | 4 | 22–25 | 34 |
| Quest 5 | 5 | 23–26 | 16 |
| Quest 6.1 | 6 | 26–27 | 15 |
| Quest 6.2 | 6 | 28–29 | 16 |
| Adventure 7.1 | 7 | 30–31 | 20 |
| Adventure 7.2 | 7 | 31–33 | 19 |
| Adventure 8.1 | 8 | 33–34 | 19 |
| Adventure 8.2 | 8 | 34–36 | 20 |
| Adventure 8.3 | 8 | 36–38 | 20 |
| Adventure 9.1 | 9 | 38–39 | 19 |
| Adventure 9.2 | 9 | 39–41 | 19 |
| Adventure 9.3 | 9 | 41–42 | 20 |

**Recycling (Daniel, 2026-10-06).** Each package lists every objective that it gives practice in: its targets (`tags.targetObjectives`) and the other objectives that the text and the questions practice (`tags.supportingObjectives`). The coverage report counts, for each objective, the packages after its first teaching that give practice in it. Each lesson map takes its other targets from the objectives with the lowest counts. So an objective comes back because the report shows that it needs practice, not because a fixed plan says so.

Rules for the objectives:
- Each article has 2–4 targets. Each question carries its objectives. This is the same as at levels 1–4.
- **Book rule:** each objective that a book teaches first is a target in 1 or more of its 14 lessons.
- **Level rule (app):** each in-scope objective of a level's own GSE range is a target in 3 or more packages of that level (workbook and bank together). The bank articles of each level fill the gaps.
- **Recycling:** the supporting objectives of a package are complete: every in-scope objective at or below the package's band that the text or a question practices.

## 4. Out of scope for article targets

These 11 objectives are not article targets (proposal; Daniel decides, §11 D1). The levels 1–4 rule already put letters and sounds out of scope.

| Reason | Objectives |
|---|---|
| Letters, sounds, and syllables (schools and Storytime Advantage) | R25.6, R26.4, R29.1, R32.3 |
| Dictionary use: the workbook's Language Questions step can practice it, but the app cannot test it | R24.1, R29.7, R37.8 |
| Media that we do not make (a cartoon, a video, authentic recordings) or a shared online task | L30.2, L31.8, L41.2, R38.13 |

The phone objectives (L26.4, L38.4, L38.5) stay in scope: a dialogue text can be a phone call or a phone message.

## 5. Text profiles (proposal)

The profiles continue the levels 1–4 steps. Phase 1 calibrates them with two sample texts for each level and one print test (§9).

| Level | Profile | Words | Paragraphs | Mean sentence | Longest | Running words (95% or more) | 12 glossed words |
|---|---|---|---|---|---|---|---|
| 4 (now) | `quest-4` | 190–250 | 3 | 5.6–7.0 | 12 | Starters, Movers | 7+ Movers, 1 Flyers at most |
| 5 | `quest-5` | 230–300 | 3–4 | 6.5–8.0 | 14 | Starters, Movers | 8+ Movers, 2 Flyers at most |
| 6 | `quest-6` | 270–340 | 4 | 7.0–8.5 | 15 | Starters to Flyers | 6+ Movers or Flyers (the lesson map sets the share: 6.1 more Movers, 6.2 more Flyers), 1 A2 Key at most |
| 7 | `adventure-7` | 300–380 | 4–5 | 7.5–9.0 | 16 | Starters to Flyers | 8+ Flyers, 2 A2 Key at most |
| 8 | `adventure-8` | 340–430 | 5 | 8.0–9.5 | 18 | Starters to A2 Key | 5+ A2 Key, the rest Flyers or A2 Key, 1 B1 at most |
| 9 | `adventure-9` | 380–480 | 5–6 | 8.5–10.5 | 20 | Starters to A2 Key | 8+ A2 Key, 2 B1 at most |

Book rules stay as in Quest 4: question marks in 10 or more of the 14 lessons, dialogue in 6 or more, 6 or more new words of the book's list for each lesson, and 4 or more recycled words. American spelling. Each bank profile uses the book's text targets without the book rules (the `bank()` rule in `lib/text-profile/check.ts`).

## 6. Vocabulary

Words not yet glossed in any of the 250 packages (vocabulary graph, lowest list of each word, 2026-10-06):

| List | Words | Glossed so far | Not yet glossed | Goal |
|---|---|---|---|---|
| Movers | 372 | 241 | 131 | 100% by the end of level 6 |
| Flyers | 491 | 30 | 461 | 95% by the end of level 8 |
| A2 Key for Schools (words above Flyers) | 577 | 7 | 570 | 90% by the end of level 9 |

Shares for the workbooks (the banks glossed the rest and repeat the book words):

| Book(s) | List words to gloss (target) |
|---|---|
| Quest 5 | about 110 of the 131 Movers words |
| Quest 6.1, 6.2 | the rest of the Movers words; about 120 Flyers words |
| Adventure 7.1, 7.2 | about 220 Flyers words |
| Adventure 8.1–8.3 | the rest of the Flyers words; about 250 A2 Key words |
| Adventure 9.1–9.3 | about 300 A2 Key words |

A book's lesson map gives each lesson its list words by topic, as the Quest 4 map does. The coverage report counts the glossed words of each list after each book.

## 7. Grammar

Checked against the Cambridge Young Learners handbook (2024; Movers and Flyers grammar lists) and the A2 Key handbook (inventory of grammatical areas) on 2026-10-06. The full lists, examples, sources, and the items to avoid are in [`data/grammar-levels-5-9.md`](data/grammar-levels-5-9.md). That file is the rule for writers.

| Level | New grammar (summary) |
|---|---|
| 5 | Movers: past simple with questions and negatives; comparatives and superlatives (also of adverbs); adverbs of frequency; *have to / had to*; *could* for past ability; *Why? Because …*; *when* clauses; relative clauses with *who, which, where*; infinitive of purpose; verb + infinitive and verb + *-ing*; *shall I …?*; *What is … like?* |
| 6 | The rest of Movers (6.1); Flyers starts: past continuous (with *when*); *be going to*; *will*; *should*; *might, may*; *so*; zero conditional; tag questions; *first, then, next, finally* (6.2); *Have you ever been …?* as a fixed question only |
| 7 | Flyers: present perfect with *ever, never, just, already, yet*; *before / after* clauses; *be made of*; *look / sound / feel like*; *shall* and *could* for suggestions |
| 8 | A2 Key: first conditional; present perfect with *for / since*; *don't have to*, *needn't*; *too*, *a few* (also *enough*, *a little*); present continuous for arrangements; *would* for requests; *whose*; *while*; *(not) as … as* (GSE only) |
| 9 | A2 Key: present and past simple passive of common verbs (no agent; not in every lesson); *says that / tells him that* (and *said that* with a simple clause, no tense changes); gerunds as subjects; participles as adjectives |

Avoid at levels 5–9: *used to*, the second conditional, the present perfect continuous, and reported speech with tense changes (B1).

## 8. Cast and world (proposal; Daniel decides, §11 D3)

- **Quest 5, 6.1, 6.2:** the Pip family continues. Quest 5 is one school year after Quest 4 (Tom 11, Lily 9). Quest 6.1 and 6.2 are one more year (Tom 12, Lily 10). Pip stays a small brown puppy (series bible). The cast sheets stay the same.
- **Adventure 7.1–9.3:** the same children, older, in a wider world. Lily's class starts a school club that goes on trips, makes a class blog, and writes to a pen-pal class. This gives a reason for each A2 text type: posters, leaflets, maps, emails, diary entries, fact files, news, interviews, recipes, and biographies. Pip appears in some stories. New characters need new cast sheets, and the series bible gets an Adventure section.

## 9. Production rules from levels 1–4

- Each book gets a lesson map first (as [`primary-quest-4-plan.md`](primary-quest-4-plan.md)), then 14 packages, then an editorial pre-review (as `reviews/2026-10-03-prereview.md`), then pictures and audio, then Daniel's review. The pre-review found 76 text and 47 question faults in 42 lessons that the script checks did not find.
- Parallel writers read the folder's titles and summaries before each article. `scripts/qa-packages.ts` runs after each batch.
- Sign text goes in the picture prompt in quotation marks (Muse draws it). Each overlay gets a place on its sign.
- Old articles at levels 5–9: the levels 1–4 rule (§11 D4). A read-only inventory comes first.
- **After the cutover deploy (Sunday Oct 11; test Oct 7; calendar of 2026-10-06), every injection writes to the new database.** The injector writes only to the legacy database today. So a new-database target is a Phase 1 task, together with the monorepo (the picture key is the UUID when an article has no legacy id; the tags go through `content/primary/tags.json`).

## 10. Order

1. Phase 1: decisions, inventory, tools, and calibration.
2. Quest 5 and bank-5, then Quest 6.1, Quest 6.2, and bank-6. The A1 band is then complete (strategy: Quest 5, 6.1, 6.2 in semester 2).
3. Adventure 7.1, 7.2, and bank-7; then 8.1–8.3 and bank-8; then 9.1–9.3 and bank-9.

Each book is a unit of work and review: map, packages, pre-review, media, Daniel's approval, injection. Levels 1–4 made 222 packages, with their pictures and audio, from 2026-10-02 to 2026-10-03. Levels 5–9 have 2.5 times as many packages, and the texts are longer. Daniel's review time sets the real speed.

## 11. Decisions

Daniel (2026-10-06): "Approve all proposals, start Phase 1." Every proposal below is a decision.

| # | Decision | Proposal |
|---|---|---|
| D1 | Out-of-scope objectives | The 11 in §4 |
| D2 | Text lengths | §5; calibrate in Phase 1 |
| D3 | Cast | §8: the Pip family continues in Quest; the same children, older, with a school club and a pen-pal class in Adventure. A pen-pal class abroad brings people who are not Thai (the series bible now says "All people are Thai") |
| D4 | Old articles at levels 5–9 | The levels 1–4 rule: group similar old articles, keep and rebuild the best of each group (same id), delete the others after you approve the level (backup first) |
| D5 | Dialogue audio | A2 listening objectives use conversations, calls, and announcements. Proposal: one voice for each speaker in dialogue texts from Adventure 7 on (a change to the audio script) |
| D6 | Order and print | §10. Print dates for Quest 5 and 6 (strategy: authored in semester 2; on sale for the 2027 school year) and for Adventure |
| D7 | Thai | Thai for each sentence at every level (the app needs it). Optional: the print shows Thai only in the glossary from Adventure 8 on |

## Revision history

- 0.1 — 2026-10-06 — First draft (track `levels_5_9_20261006`).
- 0.2 — 2026-10-06 — Daniel approved D1–D7. One level-6 glossed-word rule for Quest 6.1 and 6.2.
- 0.3 — 2026-10-06 — §7 grammar checked against the Cambridge handbooks (`data/grammar-levels-5-9.md`).
- 0.4 — 2026-10-06 — §3: the band rule of 2026-09-30 again (no book pinned to a GSE range); first teaching split evenly over each band's books; recycling tracked through the objectives that each package practices (Daniel).

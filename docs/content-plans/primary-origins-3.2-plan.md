# Primary Advantage Origins 3.2 — Coverage and Production Plan

Version 1.2 | Date 2026-10-01 | Status: Decisions D1–D3 made; production path changed (§6, §8) | Owner: Daniel Bo | Internal (names GSE and Cambridge YLE; do not quote in external copy)

Companion files: [`primary-origins-series-bible.md`](primary-origins-series-bible.md) (story world), [`primary-origins-3.1-errata-lesson-12.md`](primary-origins-3.1-errata-lesson-12.md) (replacement lesson), [`primary-origins-3.2-lesson-briefs.md`](primary-origins-3.2-lesson-briefs.md) (task C1), and [`origins-3.2-drafts/`](origins-3.2-drafts/README.md) (drafts and the text check, task C3). Strategy source: `advantage-pr/08-strategy/product-strategy-2026-2027.md` §3.1 and §6.

## 1. Summary

Origins 3.2 is the last book of the A0 (Pre-A1) band. It goes to the printer with Quest 4 and the Origins 3.1 lesson-12 insert by **2026-10-24**. The two printed A0 books cover 7 of the 52 young-learner reading and listening objectives in the band. Origins 3.2 is designed to raise that to **35 covered** and to teach **115 Cambridge Starters words** that no earlier text uses (124 with the insert). It does this with a new genre mix: 8 stories in the Pip world and 6 functional texts (a self-introduction, a chant, two sets of signs, a daily routine, and a set of instructions). The lesson shape does not change.

## 2. Fixed constraints

| Constraint | Rule |
|---|---|
| Lesson shape | The 13 printed steps do not change. Each lesson fills the same JSON fields as Origins 3.1: 12 glossed words, 3 article paragraphs, 4 multiple-choice questions, 1 short-answer question, 3 sentence starters, 12-item vocabulary match, 4-item vocabulary fill, 2 sentence-order items, 3 sentence-completion prompts, 1 writing prompt, Thai translation, 3 images. |
| Level | Primary level 3. In the Primary database: `cefr_level = 'A0+'`, `ra_level = 3`. (Origins 3.1 articles are stored at level 2. That is a known defect and is fixed separately.) |
| Coverage unit | The A0 band. The four A0 books (Origins 1, 2, 3.1, 3.2) share the A0 objectives. Origins 3.2 closes gaps that Origins 2 and 3.1 left. Letter and sound skills go to Origins 1. |
| External wording | CEFR only ("Pre-A1"). GSE objective IDs and YLE lists stay in internal files. |
| Frozen books | Do not change Origins 2 or Origins 3.1 text or questions. |
| Article IDs | Each article must exist in the Primary database before the book is rendered, because the lesson prints a QR code (see decision D1). |

## 3. What Origins 3.2 must fix

From the 2026-09-30 analysis of the 28 printed lessons:

1. **Objective coverage.** Of 52 A0 reading and listening objectives: 7 covered, 16 weak, 29 not covered. The gaps are functional: signs and notices, numbers above eight, time, instructions, introductions, songs, and classroom language.
2. **Genre.** 28 of 28 printed texts are fiction.
3. **Vocabulary.** Only 51% of the glossed words are Starters words. 303 of the 495 Starters words appear in no text. The glossed lists lean to abstract words (texture, feelings, "teamwork", "sportsmanship").
4. **Level step.** Level 3 is not harder than level 2 today (mean sentence length 4.3 words against 4.0).

## 4. Level-3 text profile

Every Origins 3.2 article meets these numbers. The text check (`dashboard/scripts/lint-text-profile.ts`, task C3) tests them.

| Measure | Target | Origins 3.1 today |
|---|---|---|
| Words | 150–200, in 3 paragraphs | 140–194 |
| Mean sentence length | 5.0–5.5 words | 4.2 |
| Longest sentence | 10 words or less | — |
| Running words on the Starters list (names, glossed words, and the brief's allowed words not counted) | 95% or more | 90.5% (80% if names count as non-Starters) |
| Glossed words from Starters | 10 or more of 12; never more than 2 Movers words; no word above Movers | 51% overall |
| New Starters words per lesson | 6 or more (glossed); a target, not a gate | — |
| Recycled words | 4 or more words from earlier lessons appear again in the text | not measured |
| Question marks in the text | 2 or more in 10 of 14 lessons | 1 in 28 lessons |
| Dialogue | In 6 or more lessons | 8 of 28 |

**Priority rule (Daniel, 2026-10-01):** a good story comes before exact word order. The text check gives WARN, not FAIL, for fewer than 6 new words. The earlier books were extensive reading texts with no vocabulary control. We adapt them as we go.

Grammar to bring in at level 3 (all on the Starters grammar list): questions with *what, where, who, how many, how old*; *can / can't*; *There is / There are*; *has got*; prepositions *in, on, under, behind, between, next to, in front of*; *like + -ing*; imperatives and *Don't …*; *Let's …*.

## 5. Lesson map

`P` = Origins 3.2 lesson. Objective IDs are GSE young-learner descriptors (internal). A `~` marks a weak target. Words are the planned glossed list; the lesson brief can swap up to two words. Print spelling is American ("color", "favorite").

| # | Working title | Text type | Cast and place | Target objectives | Glossed words (12) | Grammar focus |
|---|---|---|---|---|---|---|
| P01 | Hello! I Am May | **Functional:** self-introduction to the class, with questions and answers | May, Teacher Kim, Lily; school | L19.1, L20.1, R17.1, R10.2, L13.2, R18.3, L11.1, L12.1~ | hi, spell, English, brother, sister, baby, live, classmate, goodbye, nine, ten, school | *What is your name? How old are you? I live …* |
| P02 | Where Is Pip? | Story | Tom, Lily, Pip; home (every room) | L19.2, L21.2, R10.2, L12.1, R17.2, R15.1~ | kitchen, bedroom, bathroom, living room, sofa, lamp, clock, under, behind, between, next to, in front of | *Is Pip in the kitchen? No, he isn't.* Prepositions |
| P03 | May's Birthday Party | Story with a song | May, Pat, Lily, Mia, Pip; May's house | L18.2, L21.3~, L11.1, L13.2, R18.3, L20.1, R15.1, R10.2 | birthday, cake, balloon, candy, chocolate, ice cream, juice, pink, purple, please, thank you, sing | *How old are you? Can I have …, please?* |
| P04 | The Counting Chant | **Functional:** chant (numbers 1–20 with actions) | Class and Teacher Kim | L18.2, L21.3, R12.1, R13.2, L10.2, R18.2, R20.2, L15.1 | clap, count, number, song, jump, hand, foot, eleven, twelve, fifteen, twenty, again | Repeated chant lines; plurals |
| P05 | At the Market | Story | Grandma, Tom, Pip; the market | R18.2, L10.2, R13.2, R20.2, L11.1, R10.2, R17.2, R15.1 | shop, fruit, mango, banana, coconut, egg, bread, lime, how many, apple, lemon, thirteen | *How many …? … , please. Thank you.* |
| P06 | Signs at the Zoo | **Functional:** a set of signs, with a short frame story | Mia and her dad; the zoo (Pip stays home) | R19.2, R20.3, R20.4, L16.2, R20.2 | zoo, tiger, snake, crocodile, bear, hippo, giraffe, spider, food, drink, lizard, look | *Don't …* on signs; *This way to …* |
| P07 | Tom's New Bike | Story | Tom, Ben, Pip; the park playground | L15.1, R21.2, L18.3, L20.2~ | bike, ride, playground, football, catch, bounce, kick, throw, can, fantastic, great, skateboard | *can / can't*; short commands in play |
| P08 | Mia's Day | **Functional:** daily routine by the clock | Mia; home and school | L18.4, R19.1 | morning, afternoon, evening, breakfast, lunch, dinner, o'clock, get up, go to bed, go to sleep, today, clock | *At seven o'clock, Mia …* |
| P09 | Signs at School | **Functional:** school signs and classroom language | Lily, May, Teacher Kim; school | R19.2, R20.3, R20.4, L17.1, L16.2, L13.1, L20.2 | classroom, board, desk, cupboard, computer, listen, answer, ask, open, close, line, quiet | *Open your books. Let's start. Don't run.* |
| P10 | The Monster Picture | Story | Lily, Leo, Pip; home | L19.3, L19.2, L21.2, R12.1~ | monster, head, arm, short, hair, mouth, nose, eye, ear, draw, color, face | *Draw three eyes. Color the hair green.* |
| P11 | Let's Make a Kite! | **Functional:** instructions (steps with pictures) | Tom and Dad; home and park | L19.3, L20.2, L13.1, R20.2~ | kite, crayon, ruler, pencil, line, tail, long, color, cross, put, fly, wind | Numbered imperatives |
| P12 | Family Hobby Week | Story across one week | Whole family, Pip; home and park | L20.1, R19.1, L18.4, L12.1, R17.1~ | hobby, fishing, guitar, piano, basketball, badminton, camera, photo, drawing, favorite, enjoy, like | *On Monday …* (days are Movers words in the text, not glossed); *Do you like …? Yes, I do.* |
| P13 | Teacher Says | Story with a game | Teacher Kim, class, Leo; school | L18.3, L16.2, L15.1, L17.1, L20.2 | clap, point, wave, sit, stand, show, hit, right, hooray, again, teacher, hand | Game commands; *Don't …* |
| P14 | The Lost Teddy | Story, review lesson (a notice solves the problem) | Pat, May, Tom, Pip; the street and the shop | R19.2, L19.2, L21.2, R10.2 | teddy, find, street, shop, behind, in front of, where, who, poster, doll, train, hooray | Recycles prepositions, colors, numbers, questions, a notice |

The order puts introductions and greetings first, numbers before the market, and the two sign lessons apart. Functional and story lessons alternate as far as possible.

### Vocabulary result

- 168 glossed slots. 164 are Starters words (98%). 4 are Movers words (*o'clock, get up, quiet, wind*).
- 115 glossed Starters words are new: no earlier text uses them (the text check, 2026-09-30). The insert adds 9. More appear in the running text. The briefs' own model lines use some of these words in earlier lessons. With the model lines, the count is 102, and P11, P13, and P14 have 4 or 5 new words (text check on mock drafts, 2026-10-01). This is acceptable under the §4 priority rule.
- Version 1.1 swaps three words to reach 6 new words in every lesson: P01 *name → spell*, *old → English* (the insert glosses both); P10 *foot → short* (P04 glosses it). Details: the lesson briefs §5.
- Themes that were empty before: food, the home, school objects, family, time of day, the body, sports and hobbies, toys, numbers 9–20.
- **Mastery graph gap:** the vocabulary graph has no nodes for the numbers 1–20 or the alphabet (it holds only "one"). Add them in `mastery-advantage` before tagging (task M1). Until then, number words cannot be tagged.

### Objective coverage result (projected)

Rule, same as the analysis: *covered* = two or more lessons (unique texts) require the skill; *weak* = one lesson or a loose fit. The projection counts the Origins 3.1 lesson-12 insert (`E12`).

| | Before (O2 + O3.1) | After (O2 + O3.1 + insert + O3.2) |
|---|---|---|
| Covered | 7 | **35** |
| Weakly covered | 16 | 4 |
| Not covered | 29 | 13 |

Still not covered after Origins 3.2, and why:

| Objectives | Where they belong |
|---|---|
| R10.1, R10.3, R13.1, R14.2, R18.1, R21.3, L10.1, L10.3, L10.5, L16.3 (letters, sounds, book covers) | Origins 1 (phonics start) |
| L10.4 (answer with a gesture) | Origins 1 and the teacher guide |
| R20.1 (match a word to a picture) | A task change; the digital twin can carry it (picture-match item in the app) |
| L16.1 (isolated words with audio and pictures) | The app flashcards; tag them when flashcards are tagged |

Still weak: R14.1 (reading direction) and R21.4 (words with pictures) are implicit in every lesson; L10.6 belongs to Origins 1; L21.3 (the gist of a song, with gestures) depends on real song audio and the teacher's gestures.

This is a design projection. After the texts are written, run the tagger on the final texts (task C6) and report the real numbers.

## 6. Question and activity rules

The workbook questions test the target objectives, not only the story facts.

**One question bank per lesson (Daniel, 2026-10-01).** The app keeps 10 multiple-choice, 5 short-answer, and 5 long-answer questions per article and gives them at random. Claude writes this bank first, tagged with objective IDs. The workbook prints the most salient items from the bank: 4 multiple-choice and 1 short-answer. The workbook JSON is built from the lesson package, not from an AI call (the older `dashboard/lib/lesson-generator.ts` writes its own questions; new books do not use it).

- **Multiple choice (4 printed, from the bank of 10):** at least 2 of the 4 test a target objective. Sign lessons: "What does the sign say?", "Where can you eat?". Routine lesson: "What time does Mia eat lunch?". Market: "How many mangoes does Grandma buy?".
- **Short answer (1):** a personal question in the target frame ("How old are you?").
- **Sentence starters and completion:** use the lesson's grammar focus ("At seven o'clock, I …").
- **Writing prompt:** a personal version of the text type. P01: "Write about you." P08: "Write about your day." P09: "Make a sign for your classroom."
- **Vocabulary match and fill:** the 12 glossed words. Definitions are short and concrete. Claude writes the Thai; Daniel checks it on the review page.
- **The rest of the bank** stays online only. It is tagged the same way.

## 7. Decisions for Daniel

**D1 — What the QR codes print.** Each printed lesson carries two QR codes: `https://primary.reading-advantage.com/student/read/<articleId>` and the same URL plus `/writing` (`Workbooks/dashboard/lib/template-renderer.ts`). Three facts make this fragile:

1. The monorepo Primary build stores article IDs as UUIDs. Printed books carry the old IDs (for example `cmgqwsfcs02bqt79bkaa1pjaw`). After the cutover, a resolver must map old IDs to new ones (see the monorepo cutover spec).
2. The page needs a Primary Advantage login. A Tutor Advantage family who scans the code sees the Primary sign-in page.
3. Neither Primary build has a `/writing` route under `student/read/[articleId]`. Scan the writing QR code in a printed Origins 3.1 book to confirm what students see.

Options:

- **A.** Keep article-ID URLs, as in Origins 2 and 3.1. The cutover resolver covers them.
- **B.** Print a stable book-and-lesson URL, for example `https://primary.reading-advantage.com/b/o3-2/5`. The server looks up the current article and sends the reader to Primary Advantage or to Tutor Advantage. A printed book then never depends on a database ID again. The route must be live in production before the books reach students (about mid-November).

**Decided 2026-10-01 (Daniel): B** for Origins 3.2, Quest 4, and the insert. The route must be live by 2026-11-10. If it is not, the books print option A.

**D2 — Spelling. Decided 2026-10-01: American**, as in the printed books.

**D3 — Names. Decided 2026-10-01: keep May, Pat, and Teacher Kim.** All three are on the Cambridge Starters name list. New names come from that list (series bible §2).

## 8. How an article gets into the Primary database

**Path from 2026-10-01 (Daniel's decisions).** The Primary app does not use Mastery Advantage for generation yet, so its generator is not used. Blended Learning means the workbook and the app carry the same content, so every workbook asset goes into both databases.

1. Claude writes one **lesson package** per lesson in Workbooks: article, glossary (English and Thai), question bank, print set, workbook activities, Thai translation, image prompts, and tags. Script checks gate each part.
2. `mmx image` makes the three images from the series bible character sheets. `mmx speech` makes the article and word audio, with timing.
3. Daniel tweaks and approves each lesson on a review page in the dashboard.
4. An injector script writes the approved package into the Primary database and bucket, in the same shape as the app's own rows (`article`, the three question tables, `sentencs_and_words_for_flashcard`, and the bucket paths). It uses the book-and-lesson key (the D1 URL key) and records the article ID in the package, so a second run updates and never duplicates. Claude takes a Cloud SQL backup before each production write (Daniel authorized production writes, 2026-10-01).
5. Before the cutover, the injector writes to the live (legacy) database, and the cutover ETL copies the rows. After the cutover, it writes to the new database. No content writes on the cutover evening.
6. A verify script compares each database with the packages, after each rehearsal and after the cutover.

Tracks: `lesson_packages_20261001`, `review_page_20261001`, `lesson_media_20261001`, and `primary_injector_20261001` in `measure/tracks/`.

### Fallback (the v1.1 path, only if the injector is not ready)

The admin tool in both Primary builds (`components/admin/article-creation.tsx`) offers CEFR levels A1 to C2 only, and it sets `ra_level` from that choice (`lib/utils.ts`, `convertCefrLevel`: "A1" gives level 5). It cannot create a level-3 (A0+) or level-4 (A1−) article directly. It does let an admin edit the title, passage, and summary before saving, and "Save and Publish" then generates the app questions, word list, and audio from the edited passage (`server/models/articleModel.ts`, `createdArticleCustom`).

Path before the cutover (no code change):

1. Draft and edit the text outside the app (lesson brief + series bible + §4 profile). Lint it.
2. In production Primary, **Admin → Article creation**: generate with any topic at A1. Replace the title, passage, and summary with the approved text. Save and Publish. Record the new article ID.
3. Set the level with one SQL statement per book: `UPDATE article SET cefr_level = 'A0+', ra_level = 3 WHERE id IN (…);` (Quest 4: `'A1-'`, `4`).
4. Review the app questions the tool generated. They were written at A1 difficulty. The printed questions come from the workbook JSON, not from these.
5. Record the article ID in the lesson JSON (`article_url`). Export the workbook JSON from the article, then edit it in the Workbooks dashboard against this plan.

The cutover migration carries these rows to the new database like all others. After the cutover, add A0 and A1− level choices to the monorepo admin tool so step 3 is no longer needed (owner: Daniel, monorepo).

## 9. Production plan and calendar

Print lead time is 3–4 weeks. Files at the printer on 2026-10-24 means books in hand about 2026-11-14 to 2026-11-21, three to four weeks into semester 2.

| Dates | Step | Owner |
|---|---|---|
| Oct 1 | Decisions D1, D2, D3 and the cutover calendar made; E12 text approved as is — **done 2026-10-01** | Daniel |
| Oct 1–2 | C1: write 14 lesson briefs and the insert brief from §5 — **drafted 2026-09-30** ([briefs](primary-origins-3.2-lesson-briefs.md)) | Claude (draft), Daniel (approve) |
| Oct 1–2 | M1: add numbers 1–20 and the alphabet to the vocabulary graph | Daniel |
| Oct 2 | C3: lint script for the §4 profile — **done 2026-09-30** ([drafts README](origins-3.2-drafts/README.md)) | Claude |
| Oct 2–5 | Pilot: E12 goes through the whole new path (package, review page, character sheets, images, audio, injector into the live database) | Claude; Daniel approves on the review page |
| Oct 3–7 | 14 articles drafted and checked; Daniel approves the texts on the review page | Claude (draft), Daniel (approve) |
| Oct 8 | Texts frozen; packages injected into the live database (IDs exist). Quest 4 progress check | Claude; Daniel |
| Oct 7 | Cutover test (calendar of 2026-10-06; it replaces the rehearsals of Oct 8–9 and 12–13); verify script on the test database | Daniel (monorepo), Claude (verify) |
| Oct 8–13 | Question banks, print sets, activities, Thai, 45 images, audio for all 15 lessons; Daniel checks the Thai on the review page | Claude; Daniel |
| Oct 14 | Workbook JSON built from the packages; tag file written (C5); first render | Claude |
| Oct 11 (Sunday) | Primary cutover deploy (if the Oct 7 test passed; it replaces Oct 14–16); verify script on the new database. Last cutover date Oct 20 | Daniel, Claude (verify) |
| Oct 15–17 | Full proof: Origins 3.2, the insert, and Quest 4 (29 lessons) | Daniel |
| Oct 18–21 | Corrections; final PDFs; printer pre-flight | Daniel |
| Oct 22–24 | Files to printer | Daniel |
| After print | Add the books to Tutor Advantage (Tutor spec) | Wannachok |

Tasks:

- **C1** Lesson briefs: one page per lesson with target objectives, text type, cast, place, 12 words, 4 recycled words, grammar focus, and the 4 MCQ targets.
- **C3** Lint script: runs on the lesson JSON and the article text; uses the graph in `mastery-advantage/english/cefr-vocabulary/`. Done: `dashboard/scripts/lint-text-profile.ts`, spec in `measure/tracks/text_profile_lint_20260930/`.
- **C5** Tag file: until the tagging tables exist in the Primary database, keep `primary/origins-3.2-a0/mastery-tags.json` beside the lesson files. It lists, per lesson: article ID, GSE objective IDs (target and supporting), and vocabulary node IDs (glossed and recycled). Create the `origins-3.2-a0/` folder only together with its `project.json`: Tutor Advantage's importer reads every folder under `primary/` and fails on a folder with no `project.json`.
- **C6** Coverage check: re-run the A0 tagging analysis on the final texts and record the real coverage numbers in this file.
- **M1** Graph: add the Starters numbers 1–20 and the alphabet as vocabulary nodes.
- **C7** Lesson packages: one file per lesson with every asset; the question bank (10/5/5) and the print set; builder to workbook JSON. Track `lesson_packages_20261001`.
- **C8** Review page in the dashboard: Daniel tweaks and approves each lesson. Track `review_page_20261001`.
- **C9** Media: character-sheet images for the cast; three images per lesson with `mmx image`; article and word audio with `mmx speech`. Track `lesson_media_20261001`.
- **C10** Injector and verify script for the live database, the rehearsal database, and the new database. Track `primary_injector_20261001`.

## 10. Quest 4 (next plan, same dates)

Quest 4 is the first A1 book. The four Quest books (4, 5, 6.1, 6.2) share the 86 A1 young-learner reading and listening objectives and the Movers list. Quest 4 has no printed predecessor, so it has no continuity debt. Its plan follows this file's shape: a profile for level 4 (`cefr_level = 'A1-'`, `ra_level = 4`), a lesson map that takes about a quarter of the A1 objectives with the Starters-to-Movers step, and the same genre mix. Start date: 2026-10-01. The Quest cast can continue the Pip family one school year older, or start a new cast; decide before the briefs.

## Revision history

- 1.2 — 2026-10-01 — Decisions D1 (B), D2 (American), D3 (names kept) made. New-word count is a target, not a gate; glossed Starters minimum 10. One question bank per lesson, print set chosen from it. New production path (§8): Claude-made lesson packages, mmx media, review page, injector into both databases; the admin tool is only a fallback. Calendar and tasks C7–C10 updated; Thai checked by Daniel.
- 1.1 — 2026-09-30 — Starters-share target corrected to 95% with names not counted (the 80% baseline counted names against the text). New-word count measured with the text check: 115 (not about 125). Glossed-word swaps in P01 and P10. C1 drafted and C3 done.
- 1.0 — 2026-09-30 — First draft. Lesson map, vocabulary, and coverage projection computed from `tagging-data.json` and the vocabulary graph on 2026-09-30.

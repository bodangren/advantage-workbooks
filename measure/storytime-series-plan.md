# Storytime Advantage: series plan, Anuban 2 to P2

Version 1, 2026-11-06. Author: the Workbooks Build session (model `claude-code/claude-opus-5-5[1m]`), for the Workbooks Measure orchestrator and the PM session. Status: a planning default. Daniel decides each owner gate. No date in this file is a public date.

Owner order (Daniel, Tasks, 2026-11-06 about 20:57 ICT, via the PM), word for word: 'For the books, make sure we are moving forward and creating the entire series as quickly as possible.'

## 1. Summary

- The series has 4 levels and 16 units. Each unit is one student book of 8 weeks: 7 teaching weeks and 1 review week.
- Level 2 Unit 1 is in production. Its print order is 2026-11-25, and release 1 is 2026-12-01. Unit 1 stays first.
- The fastest safe order: Level 2 Units 2 to 4, then Level 3, then Level 4 on lane A. Level 1 runs on lane B.
- At the present speed, Level 2 is print-ready on 2026-12-22, Level 1 on 2027-01-19, Level 3 on 2027-02-05, and Level 4 on 2027-03-09.
- Daniel's checks limit the speed most. Each unit needs 5 owner items. The two-lane plan needs about 0.7 items a day on average, and about 0.8 in January.
- The track of the next unit is `storytime_l2_unit2_20261106` (Level 2 Unit 2, weeks 9 to 16).

Terms in this file:

- **Print-ready**: Daniel approves the print proof of the unit. The print order date is Daniel's decision and is not in this plan.
- **Lane**: one session slot that writes content or code for the series. A lane does one unit at a time.
- **Shape track**: a code track that adds a level shape to the makers (a template, a rule, or a check) before the content of that level.
- **Present speed**: the durations that section 6 measures on unit 1, with the makers of unit 1 in place.

## 2. Sources

- Program design: `../reading-advantage-monorepo/measure/archive/storytime_advantage_program_20261021/design.md`, section 2 (scope and sequence), 3.3 to 3.5 (the 30-minute scripts and the review week), 5.7 (level map), 6 (content production), 6.7 (artefact counts), 7 (assessment), 11 (MVP and capacity). Also `decisions.md` (S1 to S30), `forge-brief.md`, and `sources.md`.
- The committed sequence of the phonics graph: `../mastery-advantage/english/phonics/sequence.json` (commit ceb728d, 2026-10-22) and `storytime-levels.csv`. The graph labels the elements "E 1" to "E 68" (decision S21). This file uses the same element numbers.
- Product file: `../advantage-pr/03-products/storytime-advantage.md` version 1.22 (2026-11-05).
- This repository: `content/storytime/README.md`, `content/storytime/l2/w01.json` to `w08.json`, `content/storytime/l2/print/pictures.md` and `pictures.json` (picture list version 7), `content/storytime/covers/books.json` (the 16 student books), `dashboard/lib/storytime/`, `dashboard/scripts/storytime/`, and the tracks `storytime_week_package_20261022`, `storytime_print_r1_20261025`, and `storytime_teaching_loops_20261103`.
- Git history of this repository and of `../advantage-forge` (read only), for the measured durations in section 6.

## 3. The series: levels, units, and scope

### 3.1 Level map

| Level | Grade | Period | Scripts | Program weeks | Sounds | Reader bands | Decodable books |
|---|---|---|---|---|---|---|---|
| 1 | Anuban 2 | 30 min, opening 6 | L, M, S, V, P | 1 to 32 | The 26 letter names and sounds by song, after 2 listening weeks | Seed | None |
| 2 | Anuban 3 | 30 min, opening 6 | A to E | 33 to 64 | Elements 1 to 28 (CVC, the 5 short vowels, 9 word-family weeks) | Seed, Sprout | 28, 2 to 5 words a page, VC and CVC only |
| 3 | P1 | 49 min, opening 8 | A to E | 65 to 96 | Elements 29 to 51 and the Thai weeks T1 to T5 | Sprout, Leaf, Bud | 28, 6 to 12 words a page; the Thai weeks use review texts |
| 4 | P2 | 49 min, opening 8 | A to E | 97 to 128 | Elements 52 to 68 and the exit weeks E1 to E11 | Bud, Flower | 28, 12 to 20 words a page; the exit weeks use cumulative texts |

Every unit has the same word families, one Cambridge Pre A1 Starters topic for each teaching week:

| Unit | Weeks | The 7 topics |
|---|---|---|
| 1 | 1 to 8 | names and greetings, numbers 1 to 10, colors, family, body and face, pets, toys |
| 2 | 9 to 16 | food and drink, clothes, home, school, actions, weather, transport |
| 3 | 17 to 24 | places (park, shop), feelings, sports and play, time and days, farm and zoo animals, fruit, nature |
| 4 | 25 to 32 | jobs, health, music and sounds, shapes and size, opposites, birthday and parties, holidays |

Each topic comes back in each level, with more words and longer frames. A family has 6 to 8 picture words; the numbers family has 10 (design 6.3). The review week of each unit (week 8, 16, 24, or 32) re-reads the books of the unit, plays the songs as a medley, and holds a benchmark (1, 2, 3, or 4).

### 3.2 Scope of each unit

The sounds and the new sight words come from `sequence.json`. The frames are the design section 2 wording. The week files use American spelling, as unit 1 does (w03 "Colors").

**Level 1 (Anuban 2).** No decodable book and no written word. Name writing starts in week 20.

| Unit | Sounds (letter name and sound, by song) | Frames |
|---|---|---|
| L1 U1 | weeks 1 and 2 listening only; n, a, p, m, s | Hello! Goodbye! / My name is ___. / It's a ___. / I am ___ (age). / This is my ___. / Point to your ___. / I have a ___. |
| L1 U2 | t, o, d, e, h, f, g | I like ___. / Stand up. Sit down. / It's ___ (color). / A ___, please. / I can ___. / It's ___ (weather). / Go, go, go! |
| L1 U3 | i, b, c, r, u, l, w | Where is ___? Here! / I am happy/sad. / Let's play! / Today is ___. / Big ___. Small ___. / I like ___ (fruit). / Look! A ___. |
| L1 U4 | j, k, v, y, q, x, z | He/She is a ___. / I'm OK. / Clap! Stamp! / It's a circle. / Up and down. / Happy birthday! / Bye-bye, ___! |

**Level 2 (Anuban 3).**

| Unit | Sounds (elements) | New sight words | Frames |
|---|---|---|---|
| L2 U1 (in production) | 1 n, 2 short a, 3 p, 4 m, 5 s, 6 t, 7 short o | a, and, can; I, on, in; the, get; is, this; off, saw, with; he, put, see; from, run, up (19) | Hello, I am ___. / How many? One, two... / It is ___. / This is my ___. / I have two ___. / I can see a ___. / Is it a ___? Yes/No. |
| L2 U2 | 8 d, 9 -an -ad, 10 short e, 11 h, 12 -ot -op, 13 f, 14 g | are, has, cannot; they, too, were; me, of; goes, it, said, that; do, for, like; you (this is a review word); his, no, my (19) | I like ___. Yum! / Put on your ___. / Where is ___? In/On/Under. / Open your book. / I can run/hop/jump. / It is hot/cold. / Look, a ___! |
| L2 U3 | 15 -et -en, 16 short i, 17 b, 18 -it -in, 19 c, 20 r, 21 short u | she, will; her, look; eat; stop, them; jump, just; we; go, play, take (13) | Let's go to the ___. / I am ___. Are you ___? / Can you ___? Yes, I can. / What day is it? / The ___ is big/small. / I like ___. Do you? / What is it? It is a ___. |
| L2 U4 | 22 -ug -un, 23 l, 24 w, 25 -at -ap, 26 j, 27 k, 28 -ut -ub | over, want; would; out; does; good; have; more, some (9) | He/She is a ___. / I have a ___ ache. / I can hear a ___. / It is a ___ (shape). / ___ is big. ___ is small. / How old are you? I am ___. / Here is a ___ for you. |

**Level 3 (P1).**

| Unit | Sounds (elements and Thai weeks) | New sight words | Frames |
|---|---|---|---|
| L3 U1 | 29 v, 30 y, 31 -ill -ip, 32 qu, 33 x, 34 z, 35 -ob -ell | into, went; make, one; never, seen; as, where; help, made; be, who, then; how, new, there (16) | What's your name? I'm ___. / How many ___ are there? There are ___. / What color is ___? It is ___. / Who is this? This is my ___. / I have ___ eyes/hands. / Do you like ___? Yes, I do./No, I don't. / Is this your ___? Yes, it is. |
| L3 U2 | T1 final consonants /p t k d/, 36 s-blends, 37 r-blends, 38 l-blends, 39 final n-blends, 40 final blends, 41 three-letter blends | give, live; come, think, why; could, don't, so; by, your; every; day, our (13) | What do you want? I want ___. / He/She has a ___. / There is a ___ in the ___. / What's this? It's a ___. / He/She can ___. He/She can't ___. / What's the weather like? It's ___. / How do you go to school? By ___. |
| L3 U3 | T2 initial clusters, T3 final clusters and -s, 42 a_e, 43 o_e, 44 i_e, 45 u_e, 46 sh | always, find; about, people; what (5) | Where is the ___? Next to ___. / How are you? I'm ___. / Let's play ___. Good idea! / What time is it? It's ___ o'clock. / The ___ lives on a farm. / I like ___ but I don't like ___. / Look at the ___! It's ___. |
| L3 U4 | 47 ch, 48 ck, 49 ng, 50 th, T4 th s f contrast, 51 wh, T5 v w and r l contrast | none (review) | What does he/she do? He/She is a ___. / I have a ___. Oh no! / I can play the ___. / It's a big red ___. / ___ is tall. ___ is short. / Happy birthday! Here's a ___. / We go to the ___. |

**Level 4 (P2).**

| Unit | Sounds (elements and exit weeks) | Sight words | Frames |
|---|---|---|---|
| L4 U1 | 52 open vowels, 53 ee ea ie, 54 short ea, 55 ai ay, 56 ea eigh ey, 57 oa oe ow, 58 i igh | the Level 3 words again: what, give; live, come; think, why; could, don't; so, by; your, every; day, our | This is ___. ___ is a ___. / How many? (to 20) / What color is his/her ___? / ___ is ___'s brother/sister. / ___ has got ___. / ___ likes ___. ___ loves ___. / Where is ___? ___ is in the garden. |
| L4 U2 | 59 oo ue ew, 60 oo oul u, 61 a aw, 62 augh ough, 63 oi oy, 64 ou ow, 65 or oar our | always, find; about, people (review) | ___ says, "___!" / What is ___ wearing? / Is there a ___? Yes, there is. / What does Teacher ___ say? / ___ comes too. ___ looks at ___. / It is sunny. Let's go to the ___. / ___ goes by ___. |
| L4 U3 | 66 air are ear, 67 ar, 68 er ir ur, E1 -s -es, E2 -ing -ed, E3 two-syllable and compound words, E4 vowel length (Thai) | says, comes, asks; looks, loves, am, are; yes, to, do, does; or, old, say, how | Who is in the park? ___ and ___. / How is ___? ___ is happy/sad/angry. / Do you like ___? ___ asks. / What day is it today? / What does the ___ say? Woof! / ___ is eating a ___. / Don't ___! Be careful! |
| L4 U4 | E5 long and short vowel review, E6 timed re-read, E7 dialogue and expression, E8 and E9 sentence writing, E10 an Origins 1 text, E11 Origins 1 frames and names | color, white, red, blue, children; school, teacher, draw, write, sit; the names Lily, Tom, Mia, Pip | What does your mom/dad do? / ___ is sick. Poor ___! / Listen! I can hear ___. / It is big and brown. / ___ is old. ___ is new. / Happy birthday, ___! ___ is eight. / Goodbye, ___! See you! |

Two source points with a default:

- Level 2 week 9 teaches "cannot". The design table put it in week 6, but `sequence.json` and the shipped `w06.json` (he, put, see) put it in week 9. Default: week 9.
- Level 2 week 14 lists "this, you", and week 4 already taught "this". Default: week 14 teaches "you", and "this" is a review word.

### 3.3 What one unit makes

| Artefact | Level 1 unit | Level 2 unit | Level 3 unit | Level 4 unit |
|---|---|---|---|---|
| Week packages | 8 | 8 | 8 | 8 |
| Read-along books | 7 (1 word or phrase a page) | 7 (1 sentence a page) | 7 (2 sentences a page) | 7 (60 to 100 words, dialogue) |
| Decodable books | 0 | 7 | 7 | 7 |
| Songs | 7 | 7 | 7 | 7 |
| Scripts | 40 | 40 | 40 | 40 |
| Picture rows for Forge | about 63 book rows plus the picture words (estimate) | 227 (unit 1, measured) | about 227 (estimate) | about 250 (estimate; 8 to 12 read-along pages) |
| Student book, A4 pages | measured by the Level 1 shape track | 136 (unit 1, measured) | about 136 (estimate) | about 150 (estimate) |
| Thai teacher book, A4 pages | measured by the Level 1 shape track | 223 (unit 1 proof v15, measured) | more than 223 (49-minute period) | more than 223 (49-minute period) |
| Color A3 readers | 7 | 14 | 14 | 14 |

## 4. Reuse of the unit 1 makers and templates

The makers live in `dashboard/scripts/storytime/` and `dashboard/lib/storytime/`. The planning session read each usage text and searched the code for fixed unit 1 values.

| Maker or template | Reuse | Change before the next unit | Where |
|---|---|---|---|
| `check-weeks.ts --level <n>` and `lib/storytime/checks.ts` | As is for Levels 1 to 4 | Tech debt (2026-11-05, findings 3 and 9): the review strip trusts the card week, and `check-answers` accepts two right answers. Fix before a new week enters `l2/`. | Unit 2 track, Phase 4 |
| `schema.ts` | As is: Level 1 scripts L to P, Levels 2 to 4 A to E, period 20 to 60 minutes | None for Level 2. The shape tracks check Levels 1, 3, and 4. | Shape tracks |
| `make-manual-pdf.ts --file <week.json>... --lang th\|en` | As is; it takes any week file, also a staged file | None | Every unit |
| `make-teacher-book-print.ts --weeks` | As is for the pages | It reads every week file of the level as the unit weeks (line 186). Filter by unit. | Unit 2 track, Phase 4 |
| `make-student-book-pdf.ts --weeks` | The page templates | Fixed unit 1 values: the title and file name (`student-book.ts` line 48, `student-book-cli.ts` line 60), the map sticker `unit-1` (line 304), "The songs of unit 1" (line 712), the "Benchmark 1" label (line 622, `step-map.ts` line 41). Take them from `meta.unit`. | Unit 2 track, Phase 4 |
| `letter-strokes.ts` (the tracing guides) | n, a, p, m, s, t, o | Add d, e, h, f, g for unit 2. Later units add their letters; Level 1 needs all 26; Level 3 adds the capitals. | Each unit track |
| `make-readers-pdf.ts --weeks` (tear-out leaves and A3 color readers) | As is for Level 2 | Level 1 (1 word a page) and Levels 3 and 4 (more text a page) need new page plans. | Shape tracks |
| `print-pictures.ts --level` (the picture list) | The row rules and the file names | It writes one list for every week file of the level into `l2/print/pictures.json`. Make one list for each unit. A staged run already works (section 6, measured). | Unit 2 track, Phases 2 and 4 |
| `check-storytime-pictures.ts --level --weeks` | As is | None | Every unit |
| `make-card-kit-pdf.ts --weeks` | As is for the cards | The title is fixed to "Unit 1 Card Kit" (lines 200 and 209). | Unit 2 track, Phase 4 |
| `make-step-map.ts` | The step rows | It writes `step-map-u1.json` from every week of the level (`step-pages.ts` line 131). Write one file for each unit. | Unit 2 track, Phase 4 |
| `make-storytime-book-cover.ts --level --unit` and `make-storytime-teacher-cover.ts` | As is | In `books.json`, 13 books have no picture recipe and 15 have no panel text. The covers of the other 13 books wait for Daniel until after release 1 (covers track, Phase 3). | Each unit track, with Daniel's go |
| `make-fold-test-lead-pdf.ts`, `make-reader-howto-pdf.ts --level --week`, `check-qr.ts --level`, `book-audio.ts`, `set-phoneme-audio.ts --file`, `set-book-pictures.ts` | As is | None | Every unit |
| Templates | The unit 1 week files (w02 is the exemplar of a teaching week; w08 of a review week), the picture style of picture list version 7 (spec FR-9 version 1 of `storytime_print_r1_20261025`), the Forge 3D cast and the one look for books and videos (P3, 2026-10-25), Daniel's phoneme bank of 45 sounds (S22), and the teaching routines of A-42 | None | Every unit |

Three unit 1 tests pin unit 1 counts and read every week file of the level: `storytime-print-h1-classes.test.ts` line 44 (8 weeks), `storytime-print-card-pictures.test.ts` line 230 (227 rows), and the picture list contract tests (the committed list equals the maker output). A new `w09.json` in `content/storytime/l2/` fails them. So the unit 2 weeks stay in `content/storytime/drafts/l2/` until the unit scope change (unit 2 track, Phase 4), after the unit 1 print order.

## 5. Order and dates

### 5.1 The fastest safe order, and why

1. **Level 2 Units 2 to 4 first (lane A).** They reuse every Level 2 maker, the cast, the 30-minute shape, and the checks. They need one small code change (the unit scope). They complete the Anuban 3 year that release 1 starts, and decision S17 asks for Level 2 first (2027-02-15).
2. **Level 1 on a second lane (lane B), from 2026-11-26.** Level 1 has no decodable book, so it does not depend on the other levels. It needs one shape track first (the Level 1 student book and readers, and the 26 letter guides). Decision S4 (MVP option B) asks for Levels 1 and 2, and S17 sets Level 1 for 2027-04-15.
3. **Level 3, then Level 4 (lane A, after Level 2).** A decodable book may use only the sounds taught before it (design 6.1). The check reads the earlier week files. So the Level 3 texts need the Level 2 texts, and the Level 4 texts need the Level 3 texts. Levels 3 and 4 also need one shape track (the 49-minute scripts, the 8-minute opening, and longer books).

This order puts the longest chain (Level 2, then Level 3, then Level 4) on one lane without a wait. Level 1 fills the second lane. Unit 1 keeps every slot that it needs until its print order (2026-11-25).

### 5.2 Assumptions of the present speed

- Week texts: 1 day for each week file in one lane, so 8 days a unit. Basis: section 6, row 1.
- Daniel's English check: 2 days after the English text file. Daniel's picture look: 1 day. Daniel's Thai check: 2 days. Daniel's proof check: inside the 7 build days.
- Forge pictures: 3 days for a unit after Daniel's go. Basis: section 6, row 3.
- Print build, the PM audit, and the proof: 7 days a unit. Builds wait for the heavy lock; build weeks of two units can overlap.
- Lanes: 1 lane until 2026-11-25 (the slot that unit 1 does not use), then 2 lanes. The other 2 slots serve unit 1, the app, the song videos, and the Measure roles.
- A lane writes the week texts, with the Thai draft of each week. After Daniel's English check, the Thai step only aligns the changed lines. The code phases run as Measure roles in the other slots. The print build and the hand-offs of a unit run in its lane between text tasks; most of their time is machine time under the heavy lock.
- The sessions work on all 7 days of a week, as on unit 1. A stop of Daniel's checks (for example at New Year) moves every later date by the length of the stop.

### 5.3 Dates of each unit

| Unit | Lane | Week texts | Daniel's English check | Forge pictures and Daniel's look | Print-ready | Track |
|---|---|---|---|---|---|---|
| L2 U1 | unit 1 tracks | done 2026-10-22 | 2026-11-01 (approved) | 2026-11-03 (approved) | proof approval 2026-11-24; print order 2026-11-25 | `storytime_print_r1_20261025` |
| L2 U2 | A | 2026-11-07 to 2026-11-14 | 2026-11-18 | 2026-11-19 to 2026-11-23 | 2026-12-08 | `storytime_l2_unit2_20261106` |
| L2 U3 | A | 2026-11-17 to 2026-11-24 | 2026-11-27 | 2026-11-28 to 2026-12-02 | 2026-12-15 | new track, from the unit 2 track |
| L2 U4 | A | 2026-11-26 to 2026-12-03 | 2026-12-05 | 2026-12-06 to 2026-12-10 | 2026-12-22 | new track |
| Level 1 shape track | B | code 2026-11-26 to 2026-12-13 | — | — | — | new track |
| L1 U1 | B | 2026-12-07 to 2026-12-14 | 2026-12-16 | 2026-12-17 to 2026-12-21 | 2026-12-29 | new track |
| L1 U2 | B | 2026-12-15 to 2026-12-22 | 2026-12-24 | 2026-12-25 to 2026-12-29 | 2027-01-05 | new track |
| L1 U3 | B | 2026-12-23 to 2026-12-30 | 2027-01-01 | 2027-01-02 to 2027-01-06 | 2027-01-12 | new track |
| L1 U4 | B | 2026-12-31 to 2027-01-07 | 2027-01-09 | 2027-01-10 to 2027-01-13 | 2027-01-19 | new track |
| Level 3 and 4 shape track | A | code 2026-12-04 to 2026-12-24 | — | — | — | new track |
| L3 U1 | A | 2026-12-25 to 2027-01-01 | 2027-01-03 | 2027-01-04 to 2027-01-08 | 2027-01-15 | new track |
| L3 U2 | A | 2027-01-02 to 2027-01-09 | 2027-01-11 | 2027-01-12 to 2027-01-15 | 2027-01-22 | new track |
| L3 U3 | A | 2027-01-10 to 2027-01-17 | 2027-01-19 | 2027-01-20 to 2027-01-22 | 2027-01-29 | new track |
| L3 U4 | A | 2027-01-18 to 2027-01-25 | 2027-01-27 | 2027-01-28 to 2027-01-30 | 2027-02-05 | new track |
| L4 U1 | B | 2027-01-26 to 2027-02-02 | 2027-02-04 | 2027-02-05 to 2027-02-09 | 2027-02-16 | new track |
| L4 U2 | B | 2027-02-03 to 2027-02-10 | 2027-02-12 | 2027-02-13 to 2027-02-16 | 2027-02-23 | new track |
| L4 U3 | B | 2027-02-11 to 2027-02-18 | 2027-02-20 | 2027-02-21 to 2027-02-23 | 2027-03-02 | new track |
| L4 U4 | B | 2027-02-19 to 2027-02-26 | 2027-02-28 | 2027-03-01 to 2027-03-03 | 2027-03-09 | new track |

Against the earlier targets: decision S17 sets Level 2 complete by 2027-02-15 and Level 1 by 2027-04-15. This plan gives 2026-12-22 and 2027-01-19. Design 11.2 gives Levels 3 and 4 no calendar date. The S17 targets do not change; this plan only shows that the present speed can beat them.

Lane B is free from 2027-01-08 to 2027-01-25, because Level 4 waits for the Level 3 texts. Default use of that time: the covers of the finished units, the fixes from the proofs, and the content tech debt.

## 6. What limits the speed

Each row gives a number that the planning session measured on 2026-11-06, with its source.

| # | Limit | Measured on unit 1 | Effect on this plan |
|---|---|---|---|
| 1 | Week text writing | The first drafts of w01 to w08 with Thai took about 4 hours (git: w01 at 2026-10-22 06:42, the week 8 Thai proofread at 10:43). Each week file has 25 to 34 commits by 2026-11-06 (w01 34, w02 32, w03 31, w04 25, w05 26, w06 25, w07 25; w08 9). The check of a teaching week now has 40 rules (the `check-weeks.ts --level 2` report of st2/2 at commit 504fb6a2). | About 1 day for each week file with the review and the fixes, so 8 days a unit in one lane. Not the main limit with 2 lanes. |
| 2 | Daniel's checks (owner gates) | Daniel's dated answers fall on 10 of the 15 days from 2026-10-22 to 2026-11-05, often 2 to 4 items in one day (product file and `decisions.md`). The English text of weeks 2 to 8: file built 2026-10-30, approved 2026-11-01 07:3x ICT. Pictures: the Forge approval lists of weeks 3 to 6 are dated 2026-11-02 23:27 to 2026-11-03 07:40 ICT, and Daniel approved weeks 2 to 6 at 08:43 and week 7 with the cover at 10:29. Proofs: v3 (sent 2026-11-03 about 21:40 ICT) and v13 (2026-11-04) went back; v15 waits for his check on 2026-11-06. Unit 1 still has 5 owner dates to 2026-11-24. | The main limit. Each unit needs 5 owner items: the English text, the song picks, the picture look, the Thai, and the print proof. Units 2 to 16 need 75 items. From 2026-11-18 to 2027-03-09 that is about 0.7 items a day; January, with 5 units print-ready, needs about 0.8 a day. The PM can group the items of a unit into one sitting a gate. |
| 3 | Forge pictures | Weeks 2 to 7 (162 rows): from the week 2 staging at 2026-11-02 00:51 ICT to the week 7 approval list at 2026-11-03 08:22 ICT, about 31.5 hours, 12.93 USD with the cover (Forge plan). Week 1 took 2026-10-25 to 2026-11-01, because Forge built its picture pipeline. The restart of 24 pictures cost 0.57 USD. Forge runs one textured build at a time. | About 3 days a unit after Daniel's go. Every Forge render is paid generation, so each unit needs Daniel's go (about 13 to 17 USD a unit at the unit 1 rate). |
| 4 | Thai checks | Only Daniel checks Thai. No other person and no model checks it. The unit 1 Thai teacher book has 223 A4 pages (proof v15). Design 6.5 estimates 20 minutes of lesson Thai a week, about 10 hours a level. | One Thai sitting a unit. It is part of limit 2. A Level 3 or 4 book has more Thai (49-minute scripts). |
| 5 | Session slots | The machine has 4 session slots (PM). Unit 1 holds them until about 2026-11-25. The print track alone has 1,390 run files under `measure/runs/storytime_print_r1_20261025/`, and its Phase 8 ran review rounds 4 to 7 on 2026-11-06 (30 commits that name Phase 8 on that day). | 1 lane until 2026-11-25, then 2. Each code phase uses the full Measure chain (Red, Green, Reviews A to C, adversarial tests, acceptance), so the plan keeps the code work in 3 short parts: the unit 2 scope change and the two shape tracks. |
| 6 | The heavy lock | One heavy job at a time on the machine (`heavy-run.sh`). The machine has 7.3 GB of memory; 2.9 GB were free at about 21:50 ICT on 2026-11-06, and a job needs 1,500 MB free. Unit 1 built proofs v1 to v15 from 2026-11-03 to 2026-11-05. | The plan starts the builds of two units 7 days apart. |
| 7 | The cumulative sound rule | A decodable book uses only the sounds taught before it (design 6.1), and `check-weeks.ts` reads the earlier week files of Levels 2 to 4. | Level 3 waits for the Level 2 texts, and Level 4 for the Level 3 texts. This chain sets the last date (2027-03-09). |
| 8 | Paid music | Lyria 3 Pro costs 0.08 USD for each candidate, 3 candidates a song (S16). Unit 1: 7 songs with Daniel's picks on 2026-10-22, 13:51 to 18:33 ICT. | About 1.68 USD and one owner item a unit. Not a limit of the print path. |

Measured stage tools (2026-11-06, commit 504fb6a2): `check-weeks.ts --level 2` on a temporary root that links the content folder gives the same report as the normal run (8 packages, 0 failed checks, 1 warning) in 1.5 seconds. `print-pictures.ts --level 2` on that root writes the same 227-row list (`cmp` equal) and changes no file in the repository. So the unit 2 drafts can use the real makers before they enter `content/storytime/l2/`.

## 7. New tracks that this plan needs

| Track | Start | Content |
|---|---|---|
| `storytime_l2_unit2_20261106` | 2026-11-07 | Level 2 Unit 2: the week texts, the picture list for Forge, the Thai parts, the unit scope change of the makers, the print build, and the hand-offs. It is the template of every later unit track. |
| One unit track for each later unit | Section 5.3 | A copy of the unit 2 track with the scope row of section 3.2. A unit track does not change a maker, except the letter guides of its new letters. |
| Level 1 shape track | 2026-11-26 | The Level 1 student book (tracing, picture pages, name writing from week 20), the Level 1 readers, the 26 letter guides, the listening weeks 1 and 2, and the Level 1 review week and benchmarks. |
| Level 3 and 4 shape track | 2026-12-04 | The 49-minute scripts (design 3.2) with the 8-minute opening, the Level 3 and 4 books and readers, the blend words in the decodable rule, the capital letters, the Thai contrast weeks, and the Level 4 exit weeks. |

Outside this plan (no date here): the Storytime app (Monorepo), the song videos (track `storytime_song_video_20261022` and Forge), the karaoke cut (S28, open), the classroom extras (Daniel, 2026-10-26), the Primary catch-up module (design 7.8), and the full benchmark forms of design 7.

## 8. Open points, each with a default

1. The unit 2 weeks stay in `content/storytime/drafts/l2/` until the unit scope change after the unit 1 print order. Default: yes (section 4, the measured test failures).
2. Benchmark 2 in week 16: design 7 asks for about 10.6 minutes a child (PA form 5, nonsense words 2, sight words about 0.6, speaking 3), so about 320 minutes for 30 children. The week 8 shape gives 81 minutes at the check table (27 sittings of 3 minutes). Default: week 16 keeps the week 8 shape (the paper part, one 3-minute sitting, the reading record). The full forms wait for a later assessment track.
3. Daniel's sittings for unit 2: the English check on 2026-11-17 or 2026-11-18 (after his unit 1 sitting of 2026-11-16), the Thai check from 2026-11-26 to 2026-11-28, and the proof check by 2026-12-08. Default: these dates; the PM sets the real slots.
4. Paid generation for each unit (Forge renders, about 13 to 17 USD; Lyria songs, about 1.68 USD). Default: the PM asks Daniel's go after his English approval of the unit.
5. Two content lanes from 2026-11-26. Default: lane A and lane B as in section 5.3. A third lane, if the PM frees a slot, does not move the last date, because limit 7 sets it.

## 9. Facts changed

None. This file adds planning defaults only. The internal dates of release 1 (2026-11-20, 2026-11-24, 2026-11-25, 2026-12-01) and the S17 targets do not change.

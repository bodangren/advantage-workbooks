# Storytime Advantage — Write-in Student Workbook Content Design

Version 0.5 | Date 2026-10-27 | Status: Daniel answered the questions on 2026-10-27 (section 8) (A-18 b) | Owner: Daniel Bo | Internal (names GSE, CEFR, and Cambridge lists; keep them out of parent and teacher text)

## 1. Summary

Storytime Advantage has 16 write-in student books: 4 levels x 4 units x 8 weeks. Every book holds the writing parts, the readers, and the home cards of its unit.

This plan decides four things.

1. The page types of Level 1, where the child traces letters but writes nothing before week 20.
2. The read-aloud interface of the teacher app, with the full word lists of Level 2 Unit 1.
3. The changes to the standard native-speaker phonics workbooks, with one reason for each change.
4. The audio source of the word lists of every book.

**Scope.** This plan covers the rules for all 16 books, the app interface, and the full word lists of Level 2 Unit 1. Level 2 Unit 1 is the only unit with week text. The word lists of the other 15 books come when their weeks are written.

**The requirement, verbatim.** Workbooks project note, 2026-10-26 20:10 ICT. Daniel:

> "Storytime Level 1 needs activities like matching, etc. instead of writing. Normal phonics initial sound workbooks are written for native speakers, with pictures of vocabulary they know, but ELLs won't know that vocabulary, so we will need to maybe have a section in the teacher app that reads these out for the students to listen and identify whether the initial sound is right. Other similar modifications to the normal phonics workbooks you see sold."

## 2. Sources

| Source | Path and lines | What it gives this plan |
|---|---|---|
| Daniel's requirement | Workbooks project note, 2026-10-26 20:10 ICT | The four requirements in section 1 |
| Program design | `reading-advantage-monorepo/measure/archive/storytime_advantage_program_20261021/design.md` | §1.2 line 89 (Level 1 exit profile); §2 lines 113 to 144 (Level 1 weeks), lines 145 to 176 (Level 2 weeks), line 185 (T1), lines 193 to 207 (T2 to T5), line 231 (E4); §3.4 lines 354 to 364 (Level 1 at 30 minutes); §3.5 lines 340 to 352 (review week); §5.2 lines 399 to 416 (PA modules); §6.3 line 505 (6 to 8 picture words); §6.4 line 522 (audio); §6.5 lines 524 to 526 (pictures and the Thai layer); §6.7 line 544 (page budget); §7 line 559 (Friday check); §8 lines 570 to 576 (teacher kit, student book, sound picture cards); §10.2 line 606 (interface rules) |
| Level 2 Unit 1 week packages | `content/storytime/l2/w01.json` to `w08.json` | The print block of week 1; the check items of weeks 1 to 7; the review pages and the Benchmark 1 paper of week 8; the family words; the home card words |
| Picture list | `content/storytime/l2/print/pictures.json` (192 rows) and `pictures.md` (version 3) | The picture id of every check row, practice line, story page, and cover |
| Print track | `measure/tracks/storytime_print_r1_20261025/spec.md` and `plan.md` | FR-3 lines 117 to 134 (the workbook pages); FR-9 lines 177 to 195 (the picture spec); P3 line 244 (the Forge decision); plan Phase 2 line 111 and Phase 7 lines 248 to 256 |
| Phoneme bank | `content/storytime/phonemes/daniel/manifest.json` (45 sounds, approved 2026-10-22) and `dashboard/lib/storytime/phonemes.ts` | The sound recordings and the label mapping `/a/` to `/a-short/` |
| Audio state | `content/storytime/README.md`; `approval.audio` of `w01.json` | No approved word recording exists; the book audio stays draft after Daniel's stop of 2026-10-24 |
| Monorepo app track | `reading-advantage-monorepo/measure/tracks/storytime_app_rebuild_20261025/spec.md` | FR-3 line 104 (the week contract); FR-5 lines 130 to 143 (the home card with recorded audio); FR-9 line 188 (the teacher app) |
| Generation rules draft 2 | `storytime-approval/re/generation-rules-draft2.md` | Rule 6.6 (the three stages), rule 6.7 (the model pre-check), rule 7.3 (the cost ledger), rule 10.5 (no phone voice) |

**A note on the cast.** Section 6.5 of the design names the Chibi Sprouts cast. That text is out of date. The current rule is in the print track: Storytime pictures use only the Forge 3D cast and renders, and the workbook prints line art from them (spec FR-9). Daniel's words of 2026-10-25: "We can use the same style for the entire system, I think. We have the 3D assets from Forge. If they need more poses, we can request them. If we need additional assets, we can create them. One character look for both books and videos seems like a good idea!"

## 3. Requirement 1: the pages of Level 1

Level 1 is Anuban 2, for children of 4 to 5 years. The child does not read English. The child traces letters, but the child does not write before week 20. Tracing is not writing (Daniel, 2026-10-27, section 3.3).

### 3.1 The page types

| Page type | What the child does | Teacher-app part | Level 1 PA focus of §2 that it serves | Icon id |
|---|---|---|---|---|
| Match the pictures | The child draws a line from a picture to the picture with the same first sound. | The app reads both words. | Rhyme 1 to 3 (weeks 6, 7, 9); alliteration (weeks 10, 27, 29) | `icon-match` |
| Circle the picture | The child circles the picture whose first sound is the sound of the week. | The app reads the sound, then each word. | Initial sound and alliteration (week 10); final sound (weeks 19, 30) | `icon-circle-picture` |
| Colour the picture | The child colours the picture whose first sound is the sound of the week. | The app reads the sound, then each word. | Name the sound (week 1); sound effects (week 3) | `icon-colour-picture` |
| Listen and point | The app says a word. The child points to the picture and says the word. | The app says the word. | First, next, last sound (week 2); initial sound and syllable blending (week 11) | `icon-listen-and-point` |
| Sort the pictures | The child puts each picture in the box of its first sound. | The app reads each word and each box sound. | Initial sound and sort (weeks 10, 19, 21, 30) | `icon-picture-sort` |
| Cut and stick | The child cuts out a picture and sticks it in the box of its sound. | The app reads each word. | Syllable deletion (week 12); segment onset-rime (weeks 13, 18); phoneme addition (week 14); phoneme deletion (week 15) | `icon-cut-and-stick` |
| Circle the letter (added) | The child circles the letter of the week among letters that look alike. | The app reads the letter name and the sound. | The 26 letter names by song (§1.2); find the letter in the frieze (§3.4) | `icon-circle-letter` |
| Trace the path (added) | The child traces a crayon path with a finger and a crayon. The path has no letter form. | None. | Pre-writing strokes (§1.2); weeks 1 and 2 | `icon-trace-path` |
| Trace the letter (added) | The child traces the letter of the week. The letter prints in gray with a black start dot and black arrows. | The app says the sound of the letter and the formation words. | Traces 10 letters (§1.2); Daniel's answer to Q1 (2026-10-27) | `icon-trace-letter` |
| Name page (week 20 to 32) | The child traces the child's own name and copies it. | The app reads the child's name. | Writes own name by copy (§1.2); name writing from week 20 (§2) | `icon-name-copy` |

Four page types are added to the list in the requirement. Each one has a reason.

- **Circle the letter.** The exit profile holds the 26 letter names by song (§1.2). The Level 1 script finds the letter in the frieze (§3.4, line 359). The page gives that same search to the child.
- **Trace the path.** The exit profile holds pre-writing strokes (§1.2). A crayon path gives the child that work in weeks 1 and 2, before the first letter.
- **Trace the letter.** The exit profile holds "traces 10 letters" (§1.2). Daniel answered Q1 on 2026-10-27: tracing is not writing, and tracing is fine in Level 1. The child traces the letter of each letter week from week 3. Level 1 has 26 letter weeks, so the child traces 26 letters.
- **Name page.** The §2 table holds the note "(none; name writing wk 20+)" in the tricky-word column of every teaching week of Level 1. This page carries that work and it is the only page where the child writes.

Two rules hold on every Level 1 page.

- The page shows one icon and one short English line. The child cannot read the line, so the icon carries the task.
- The page shows no Thai. One Thai gloss under each picture of the family page is the only exception (design §6.5). The other Thai sits in the teacher book, the home card, and the app.

### 3.2 The week map, Level 1 weeks 1 to 32

The map comes from §2 of the design. The page types serve the PA focus of the week.

| Week | Element (§2) | PA focus (§2) | Vocabulary family (§2) | Page types |
|---|---|---|---|---|
| 1 | Listening only | Listening: start-stop, name the sound (DSS A1-A3) | Names and greetings (ViU 52) | Colour the picture; listen and point; trace the path |
| 2 | Listening only | Listening: first, next, last sound (DSS A4-A6) | Numbers 1-10 (Starters) | Listen and point; sort the pictures; trace the path |
| 3 | Letter n name+sound (song) | Listening: sound effects, silly songs, directions (DSS A7-A9) | Colours (Starters) | Colour the picture; circle the picture; trace the letter |
| 4 | Letter a name+sound (song) | Word awareness | Family (Starters) | Match the pictures; circle the letter; trace the letter |
| 5 | Letter p name+sound (song) | Syllable counting | Body and face (Starters) | Circle the picture; listen and point; trace the letter |
| 6 | Letter m name+sound (song) | Rhyme 1 | Animals (pets) (ViU 31) | Match the pictures; sort the pictures; trace the letter |
| 7 | Letter s name+sound (song) | Rhyme 2 | Toys (Starters) | Match the pictures; circle the picture; trace the letter |
| 8 | REVIEW WEEK | Review | Review | Circle the picture; listen and point; trace the letter (the letters of the block) |
| 9 | Letter t name+sound (song) | Rhyme 3 | Food and drink (ViU 22) | Match the pictures; circle the picture; trace the letter |
| 10 | Letter o name+sound (song) | Initial sound; alliteration | Clothes (Starters) | Circle the picture; sort the pictures; trace the letter |
| 11 | Letter d name+sound (song) | Initial sound; syllable blending | Home (ViU 11/13) | Listen and point; circle the picture; trace the letter |
| 12 | Letter e name+sound (song) | Syllable deletion; blend onset-rime | School (ViU 15) | Cut and stick; circle the picture; trace the letter |
| 13 | Letter h name+sound (song) | Segment onset-rime | Actions (verbs) (ViU 47/49) | Cut and stick; circle the picture; trace the letter |
| 14 | Letter f name+sound (song) | Phoneme addition | Weather (ViU 28) | Circle the picture; cut and stick; trace the letter |
| 15 | Letter g name+sound (song) | Phoneme deletion | Transport (ViU 32/49) | Circle the picture; cut and stick; trace the letter |
| 16 | REVIEW WEEK | Review | Review | Circle the picture; listen and point; trace the letter (the letters of the block) |
| 17 | Letter i name+sound (song) | Rhyme; phoneme substitution | Places (park, shop) (ViU 29) | Match the pictures; circle the picture; trace the letter |
| 18 | Letter b name+sound (song) | Segment onset-rime; addition | Feelings (ViU 7) | Cut and stick; circle the picture; trace the letter |
| 19 | Letter c name+sound (song) | Final sound | Sports and play (ViU 23) | Circle the picture; sort the pictures; trace the letter |
| 20 | Letter r name+sound (song) | Phoneme substitution | Time and days (ViU 51) | Name page; circle the picture; trace the letter |
| 21 | Letter u name+sound (song) | Final + initial; phoneme blending | Animals (farm and zoo) (ViU 31) | Cut and stick; sort the pictures; name page |
| 22 | Letter l name+sound (song) | Initial, medial, final; segment and blend | Fruit (Starters) | Circle the picture; cut and stick; name page |
| 23 | Letter w name+sound (song) | Medial vowel; segmentation | The world around us (nature) (ViU 30) | Circle the picture; cut and stick; name page |
| 24 | REVIEW WEEK | Review | Review | Circle the picture; listen and point; name page |
| 25 | Letter j name+sound (song) | Word awareness; syllables (pass 2) | Jobs (ViU 14) | Match the pictures; circle the letter; name page |
| 26 | Letter k name+sound (song) | Rhyme; syllables (pass 2) | Health (Starters) | Match the pictures; circle the picture; name page |
| 27 | Letter v name+sound (song) | Rhyme; alliteration (pass 2) | Music and sounds (ViU 26) | Match the pictures; circle the picture; name page |
| 28 | Letter y name+sound (song) | Blend and segment onset-rime (pass 2) | Shapes and size (Starters) | Cut and stick; circle the picture; name page |
| 29 | Letter q name+sound (song) | Alliteration; initial; delete, segment, blend | Opposites (ViU 56) | Cut and stick; circle the letter; name page |
| 30 | Letter x name+sound (song) | Final sound (pass 2) | Birthday and parties (Starters) | Circle the picture; sort the pictures; name page |
| 31 | Letter z name+sound (song) | Initial, medial, final; segment, blend (capstone) | Holidays (Starters) | Circle the picture; cut and stick; name page |
| 32 | REVIEW WEEK | Review | Review | Circle the picture; listen and point; name page |

Every week also has a family page. The app reads the 6 to 8 family words, and the child points and says each word. The numbers week has 10 words. The page holds one Thai gloss under each picture (design §6.5).

In weeks 21 to 31, the name page also holds the trace of the letter of the week. The top half holds the letter trace, and the bottom half holds the name trace and the name copy.

### 3.3 The conflict between the exit profile and requirement 1

The exit profile of Level 1 holds "Pre-writing strokes; traces 10 letters; writes own name by copy" (§1.2, line 89). Requirement 1 holds no writing before the week 20 name writing. The two texts disagree about the traced letters.

A third text agrees with requirement 1. Section 3.4 of the design holds "Nothing is written except name copying from week 20" (line 364).

**Daniel's answer to Q1.** Daniel answered on 2026-10-27 (Google Tasks, 12:02 ICT, PM relay). His point 1, verbatim: "1. Tracing is different to working. Tracing is fine in k2." The PM reads "working" as "writing", and this plan uses that reading. K2 is Anuban 2, so Level 1.

**Decision.** Letter tracing is not writing. The child traces letters in Level 1, also before week 20. The exit profile keeps "traces 10 letters". The rule of no writing before week 20 holds for writing, so the name copy starts in week 20.

The crayon paths stay for the pre-writing strokes in weeks 1 and 2, before the first letter. From week 3, the child traces the letter of each letter week (sections 3.1 and 3.2).

Section 3.4 of the design ("Nothing is written except name copying from week 20") still holds, because tracing is not writing.

**Question 1.** See section 8.

## 4. Requirement 2: the read-aloud interface of the teacher app

### 4.1 The rule

Every picture-based phonics item names its picture word in the package data. The teacher taps the page in the app. The app says the word. The children decide.

Six rules hold.

1. Every picture-based item names its word in the package data.
2. The teacher taps the page in the app, then taps a picture.
3. The app says the word of that picture.
4. The app plays the target sound from Daniel's bank where the task needs it.
5. The child points, circles, colours, sorts, or sticks. The child does not read the instruction.
6. The app shows no answer. The answers stay in the teacher book (print track spec FR-3, line 130).

The teacher says the word aloud as well when the class cannot hear the device. The teacher speaks the pure sound, not the letter name (design §3.2, step A2, line 280).

### 4.2 The data interface

The read-aloud data is a separate file. The Monorepo week contract holds the check items of each week. It holds no print block, no review pages, and no benchmark paper (app track spec FR-3, line 108). The check items hold the words, but they hold no picture id, no row, no column, and no audio id. The read-aloud file holds all of them.

The file holds one record for each group on a page. A group is one question, or one column of a picture sort. The key of a record is its page id and its group number.

**The page record fields.**

| Field | Type | What it holds | The app needs it |
|---|---|---|---|
| `bookId` | string | The unit book, for example `st-l2-u1` | Yes |
| `week` | number | The week of the unit, 1 to 8 | Yes |
| `pageId` | string | The page, for example `st-l2-u1-w01-check` | Yes |
| `pageKind` | string | `practice-sheet`, `check-page`, `review-page`, or `benchmark-paper` | Yes |
| `activityType` | string | The task of the group | Yes |
| `iconId` | string | The fixed icon of the task | Yes |
| `prompt` | string | The target sound or the letter of the group | Yes |
| `promptPosition` | string | `first`, `middle`, or `last`; only when the sound is not at the start | Yes, for the last-sound rows |
| `promptSoundId` | string | The bank id of the prompt sound, for example `P04` | No; the app can map the label |
| `group` | number | The group number on the page | Yes |
| `items` | array | The picture items in print order | Yes |

**The item fields.**

| Field | Type | What it holds | The app needs it |
|---|---|---|---|
| `word` | string | The English word of the picture | Yes |
| `pictureId` | string | The row id in `pictures.json` | Yes |
| `role` | string | `target` when the picture shows the sound of the prompt; `other` when it does not | Yes |
| `row` | number | The vertical position of the picture on the page | Yes |
| `col` | number | The horizontal position of the picture on the page | Yes |
| `audioId` | string | The id of the word recording, for example `wa-nest` | Yes |

**The definition of role.** The role is `target` when the first sound of the word matches the prompt sound in the prompt position. Every other picture is `other`. On the Benchmark 1 paper the row with the prompt `/t/ (last)` gives the role `target` to "cat" and the role `other` to "sun" and "bed".

**The app needs these fields to build the screen.** `bookId`, `week`, `pageId`, `pageKind`, `activityType`, `iconId`, `prompt`, `promptPosition`, `group`, and the six item fields. The app can build every screen of the read-aloud view from them.

**The field names are a proposal for the Monorepo team.** The Monorepo team may change a name. The Monorepo team must not change the meaning of a field.

**The activity types and the icons.** One icon serves one activity type in the book and in the app. The list covers Level 1 and Level 2 Unit 1.

| Activity type | Icon id | Used on |
|---|---|---|
| `match` | `icon-match` | Level 1 matching page |
| `circle-picture` | `icon-circle-picture` | Level 1 circle page; Level 2 check page; Benchmark 1 paper |
| `colour-picture` | `icon-colour-picture` | Level 1 colour page |
| `listen-and-point` | `icon-listen-and-point` | Level 1 listen page |
| `picture-sort` | `icon-picture-sort` | Level 1 sort page; Level 2 review page |
| `cut-and-stick` | `icon-cut-and-stick` | Level 1 cut page |
| `circle-letter` | `icon-circle-letter` | Level 1 circle letter page |
| `trace-path` | `icon-trace-path` | Level 1 trace page |
| `name-copy` | `icon-name-copy` | Level 1 name page |
| `practice-picture` | `icon-practice-picture` | Level 2 practice sheet |
| `circle-word` | `icon-circle-word` | Level 2 check page, circle word row |
| `write-letter` | `icon-write-letter` | Level 2 check page and Benchmark 1 paper, letter row |
| `write-word` | `icon-write-word` | Level 2 check page, word row |

**One JSON example.** This is the first group of the week 1 check page.

```json
{
  "bookId": "st-l2-u1",
  "week": 1,
  "pageId": "st-l2-u1-w01-check",
  "pageKind": "check-page",
  "activityType": "circle-picture",
  "iconId": "icon-circle-picture",
  "prompt": "/n/",
  "promptSoundId": "P04",
  "group": 1,
  "items": [
    { "word": "nest", "pictureId": "l2-w01-check-row-nest", "role": "target", "row": 1, "col": 1, "audioId": "wa-nest" },
    { "word": "cat", "pictureId": "l2-w01-check-row-cat", "role": "other", "row": 1, "col": 2, "audioId": "wa-cat" },
    { "word": "fish", "pictureId": "l2-w01-check-row-fish", "role": "other", "row": 1, "col": 3, "audioId": "wa-fish" }
  ]
}
```

### 4.3 The word lists of Level 2 Unit 1

**The pages and their state.**

| Page | State today | Source |
|---|---|---|
| `st-l2-u1-w01-practice` | Exists | `w01.json`, `print.practice` |
| `st-l2-u1-w01-check` to `st-l2-u1-w07-check` | Exist | `w01.json` to `w07.json`, `check.items` |
| `st-l2-u1-w08-review-d1` to `st-l2-u1-w08-review-d5` | Exist | `w08.json`, `block.days[].paper` |
| `st-l2-u1-w08-benchmark` | Exists | `w08.json`, `benchmark.paper` |
| `st-l2-u1-w02-practice` to `st-l2-u1-w07-practice` | Come with Phase 7 | Print track plan, Phase 7, lines 248 to 256 |

**The counts.** The pages of unit 1 hold 121 picture items. These items hold 35 distinct words. The home cards of weeks 1 to 7 hold 21 words. The family pages hold 69 rows, 68 distinct words; mom is in weeks 4 and 8. The three lists together hold 98 distinct words.

**The picture list has no row for week 8.** `pictures.json` holds rows for weeks 1 to 7 only. The list script reads the books, the check items, and the practice lines. It does not read the review pages or the benchmark paper. The words "moon", "mango", "ostrich", and "drum" have no row in the file at all. The other week 8 words reuse a row of weeks 1 to 7. The week 8 rows come with the next version of the picture list.

#### Week 1 — the sound of the week is /n/

**Page `st-l2-u1-w01-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /n/ | 1 | 1 | nose | target | `l2-w01-practice-line-nose` | `wa-nose` |
| 1 | /n/ | 2 | 1 | nest | target | `l2-w01-practice-line-nest` | `wa-nest` |
| 1 | /n/ | 3 | 1 | nut | target | `l2-w01-practice-line-nut` | `wa-nut` |

**Page `st-l2-u1-w01-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /n/ | 1 | 1 | nest | target | `l2-w01-check-row-nest` | `wa-nest` |
| 1 | /n/ | 1 | 2 | cat | other | `l2-w01-check-row-cat` | `wa-cat` |
| 1 | /n/ | 1 | 3 | fish | other | `l2-w01-check-row-fish` | `wa-fish` |
| 2 | /n/ | 2 | 1 | dog | other | `l2-w01-check-row-dog` | `wa-dog` |
| 2 | /n/ | 2 | 2 | nose | target | `l2-w01-check-row-nose` | `wa-nose` |
| 2 | /n/ | 2 | 3 | bus | other | `l2-w01-check-row-bus` | `wa-bus` |
| 3 | /n/ | 3 | 1 | hat | other | `l2-w01-check-row-hat` | `wa-hat` |
| 3 | /n/ | 3 | 2 | cup | other | `l2-w01-check-row-cup` | `wa-cup` |
| 3 | /n/ | 3 | 3 | net | target | `l2-w01-check-row-net` | `wa-net` |

The page also has a write-letter row. It carries no picture, so it stays out of the read-aloud list.

#### Week 2 — the sound of the week is /a/

**Page `st-l2-u1-w02-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /a/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w02-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /a/ | 1 | 1 | apple | target | `l2-w02-check-row-apple` | `wa-apple` |
| 1 | /a/ | 1 | 2 | dog | other | `l2-w02-check-row-dog` | `wa-dog` |
| 1 | /a/ | 1 | 3 | sun | other | `l2-w02-check-row-sun` | `wa-sun` |
| 2 | /a/ | 2 | 1 | bus | other | `l2-w02-check-row-bus` | `wa-bus` |
| 2 | /a/ | 2 | 2 | ant | target | `l2-w02-check-row-ant` | `wa-ant` |
| 2 | /a/ | 2 | 3 | fish | other | `l2-w02-check-row-fish` | `wa-fish` |
| 3 | /a/ | 3 | 1 | pig | other | `l2-w02-check-row-pig` | `wa-pig` |
| 3 | /a/ | 3 | 2 | bed | other | `l2-w02-check-row-bed` | `wa-bed` |
| 3 | /a/ | 3 | 3 | alligator | target | `l2-w02-check-row-alligator` | `wa-alligator` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 3 — the sound of the week is /p/

**Page `st-l2-u1-w03-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /p/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w03-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /p/ | 1 | 1 | pen | target | `l2-w03-check-row-pen` | `wa-pen` |
| 1 | /p/ | 1 | 2 | cat | other | `l2-w03-check-row-cat` | `wa-cat` |
| 1 | /p/ | 1 | 3 | sun | other | `l2-w03-check-row-sun` | `wa-sun` |
| 2 | /p/ | 2 | 1 | dog | other | `l2-w03-check-row-dog` | `wa-dog` |
| 2 | /p/ | 2 | 2 | pear | target | `l2-w03-check-row-pear` | `wa-pear` |
| 2 | /p/ | 2 | 3 | bus | other | `l2-w03-check-row-bus` | `wa-bus` |
| 3 | /p/ | 3 | 1 | fish | other | `l2-w03-check-row-fish` | `wa-fish` |
| 3 | /p/ | 3 | 2 | hat | other | `l2-w03-check-row-hat` | `wa-hat` |
| 3 | /p/ | 3 | 3 | pencil | target | `l2-w03-check-row-pencil` | `wa-pencil` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 4 — the sound of the week is /m/

**Page `st-l2-u1-w04-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /m/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w04-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /m/ | 1 | 1 | monkey | target | `l2-w04-check-row-monkey` | `wa-monkey` |
| 1 | /m/ | 1 | 2 | cat | other | `l2-w04-check-row-cat` | `wa-cat` |
| 1 | /m/ | 1 | 3 | sun | other | `l2-w04-check-row-sun` | `wa-sun` |
| 2 | /m/ | 2 | 1 | dog | other | `l2-w04-check-row-dog` | `wa-dog` |
| 2 | /m/ | 2 | 2 | mouse | target | `l2-w04-check-row-mouse` | `wa-mouse` |
| 2 | /m/ | 2 | 3 | bus | other | `l2-w04-check-row-bus` | `wa-bus` |
| 3 | /m/ | 3 | 1 | fish | other | `l2-w04-check-row-fish` | `wa-fish` |
| 3 | /m/ | 3 | 2 | hat | other | `l2-w04-check-row-hat` | `wa-hat` |
| 3 | /m/ | 3 | 3 | milk | target | `l2-w04-check-row-milk` | `wa-milk` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 5 — the sound of the week is /s/

**Page `st-l2-u1-w05-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /s/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w05-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /s/ | 1 | 1 | sun | target | `l2-w05-check-row-sun` | `wa-sun` |
| 1 | /s/ | 1 | 2 | cat | other | `l2-w05-check-row-cat` | `wa-cat` |
| 1 | /s/ | 1 | 3 | dog | other | `l2-w05-check-row-dog` | `wa-dog` |
| 2 | /s/ | 2 | 1 | pen | other | `l2-w05-check-row-pen` | `wa-pen` |
| 2 | /s/ | 2 | 2 | sock | target | `l2-w05-check-row-sock` | `wa-sock` |
| 2 | /s/ | 2 | 3 | bed | other | `l2-w05-check-row-bed` | `wa-bed` |
| 3 | /s/ | 3 | 1 | cup | other | `l2-w05-check-row-cup` | `wa-cup` |
| 3 | /s/ | 3 | 2 | hat | other | `l2-w05-check-row-hat` | `wa-hat` |
| 3 | /s/ | 3 | 3 | sofa | target | `l2-w05-check-row-sofa` | `wa-sofa` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 6 — the sound of the week is /t/

**Page `st-l2-u1-w06-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /t/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w06-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /t/ | 1 | 1 | tiger | target | `l2-w06-check-row-tiger` | `wa-tiger` |
| 1 | /t/ | 1 | 2 | sun | other | `l2-w06-check-row-sun` | `wa-sun` |
| 1 | /t/ | 1 | 3 | bag | other | `l2-w06-check-row-bag` | `wa-bag` |
| 2 | /t/ | 2 | 1 | cup | other | `l2-w06-check-row-cup` | `wa-cup` |
| 2 | /t/ | 2 | 2 | ten | target | `l2-w06-check-row-ten` | `wa-ten` |
| 2 | /t/ | 2 | 3 | fish | other | `l2-w06-check-row-fish` | `wa-fish` |
| 3 | /t/ | 3 | 1 | dog | other | `l2-w06-check-row-dog` | `wa-dog` |
| 3 | /t/ | 3 | 2 | pen | other | `l2-w06-check-row-pen` | `wa-pen` |
| 3 | /t/ | 3 | 3 | table | target | `l2-w06-check-row-table` | `wa-table` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 7 — the sound of the week is /o/

**Page `st-l2-u1-w07-practice` — the practice sheet** (pageKind `practice-sheet`, activityType `practice-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /o/ | 1 | 1 | not written yet | — | — | — |

**Page `st-l2-u1-w07-check` — the Friday check page** (pageKind `check-page`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /o/ | 1 | 1 | octopus | target | `l2-w07-check-row-octopus` | `wa-octopus` |
| 1 | /o/ | 1 | 2 | sun | other | `l2-w07-check-row-sun` | `wa-sun` |
| 1 | /o/ | 1 | 3 | bed | other | `l2-w07-check-row-bed` | `wa-bed` |
| 2 | /o/ | 2 | 1 | cat | other | `l2-w07-check-row-cat` | `wa-cat` |
| 2 | /o/ | 2 | 2 | ox | target | `l2-w07-check-row-ox` | `wa-ox` |
| 2 | /o/ | 2 | 3 | fish | other | `l2-w07-check-row-fish` | `wa-fish` |
| 3 | /o/ | 3 | 1 | pen | other | `l2-w07-check-row-pen` | `wa-pen` |
| 3 | /o/ | 3 | 2 | bus | other | `l2-w07-check-row-bus` | `wa-bus` |
| 3 | /o/ | 3 | 3 | olive | target | `l2-w07-check-row-olive` | `wa-olive` |

The page also has circle-word, circle-word, write-letter, and write-word rows. They carry no picture, so they stay out of the read-aloud list.

#### Week 8 — the review week and the Benchmark 1 paper

**Page `st-l2-u1-w08-review-d1` — the review page of day 1** (pageKind `review-page`, activityType `picture-sort`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /n/ | 1 | 1 | nest | target | `l2-w01-check-row-nest` | `wa-nest` |
| 1 | /n/ | 2 | 1 | nose | target | `l2-w01-check-row-nose` | `wa-nose` |
| 1 | /n/ | 3 | 1 | net | target | `l2-w01-check-row-net` | `wa-net` |
| 2 | /a/ | 1 | 2 | apple | target | `l2-w02-check-row-apple` | `wa-apple` |
| 2 | /a/ | 2 | 2 | ant | target | `l2-w02-check-row-ant` | `wa-ant` |
| 2 | /a/ | 3 | 2 | alligator | target | `l2-w02-check-row-alligator` | `wa-alligator` |

**Page `st-l2-u1-w08-review-d2` — the review page of day 2** (pageKind `review-page`, activityType `picture-sort`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /p/ | 1 | 1 | pen | target | `l2-w03-check-row-pen` | `wa-pen` |
| 1 | /p/ | 2 | 1 | pig | target | `l2-w02-check-row-pig` | `wa-pig` |
| 1 | /p/ | 3 | 1 | pear | target | `l2-w03-check-row-pear` | `wa-pear` |
| 2 | /m/ | 1 | 2 | moon | target | **no picture row** | `wa-moon` |
| 2 | /m/ | 2 | 2 | milk | target | `l2-w04-check-row-milk` | `wa-milk` |
| 2 | /m/ | 3 | 2 | mango | target | **no picture row** | `wa-mango` |

**Page `st-l2-u1-w08-review-d3` — the review page of day 3** (pageKind `review-page`, activityType `picture-sort`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /s/ | 1 | 1 | sun | target | `l2-w02-check-row-sun` | `wa-sun` |
| 1 | /s/ | 2 | 1 | sock | target | `l2-w05-check-row-sock` | `wa-sock` |
| 1 | /s/ | 3 | 1 | sofa | target | `l2-w05-check-row-sofa` | `wa-sofa` |
| 2 | /t/ | 1 | 2 | tiger | target | `l2-w06-check-row-tiger` | `wa-tiger` |
| 2 | /t/ | 2 | 2 | ten | target | `l2-w06-check-row-ten` | `wa-ten` |
| 2 | /t/ | 3 | 2 | table | target | `l2-w06-check-row-table` | `wa-table` |

**Page `st-l2-u1-w08-review-d4` — the review page of day 4** (pageKind `review-page`, activityType `picture-sort`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /o/ | 1 | 1 | octopus | target | `l2-w07-check-row-octopus` | `wa-octopus` |
| 1 | /o/ | 2 | 1 | ox | target | `l2-w07-check-row-ox` | `wa-ox` |
| 1 | /o/ | 3 | 1 | ostrich | target | **no picture row** | `wa-ostrich` |
| 2 | /m/ | 1 | 2 | moon | target | **no picture row** | `wa-moon` |
| 2 | /m/ | 2 | 2 | milk | target | `l2-w04-check-row-milk` | `wa-milk` |
| 2 | /m/ | 3 | 2 | mouse | target | `l2-w04-check-row-mouse` | `wa-mouse` |

**Page `st-l2-u1-w08-review-d5` — the review page of day 5** (pageKind `review-page`, activityType `picture-sort`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | nnn | 1 | 1 | nest | target | `l2-w01-check-row-nest` | `wa-nest` |
| 2 | /a/ | 1 | 2 | apple | target | `l2-w02-check-row-apple` | `wa-apple` |
| 3 | /p/ | 1 | 3 | pen | target | `l2-w03-check-row-pen` | `wa-pen` |
| 4 | mmm | 1 | 4 | moon | target | **no picture row** | `wa-moon` |
| 5 | sss | 1 | 5 | sun | target | `l2-w02-check-row-sun` | `wa-sun` |
| 6 | /t/ | 1 | 6 | tiger | target | `l2-w06-check-row-tiger` | `wa-tiger` |
| 7 | /o/ | 1 | 7 | octopus | target | `l2-w07-check-row-octopus` | `wa-octopus` |

**Page `st-l2-u1-w08-benchmark` — the Benchmark 1 paper part** (pageKind `benchmark-paper`, activityType `circle-picture`).

| Group | Prompt | Row | Column | Word | Role | Picture id in pictures.json | Audio id |
|---|---|---|---|---|---|---|---|
| 1 | /n/ | 1 | 1 | nest | target | `l2-w01-check-row-nest` | `wa-nest` |
| 1 | /n/ | 1 | 2 | cup | other | `l2-w01-check-row-cup` | `wa-cup` |
| 1 | /n/ | 1 | 3 | bed | other | `l2-w02-check-row-bed` | `wa-bed` |
| 2 | /p/ | 2 | 1 | sun | other | `l2-w02-check-row-sun` | `wa-sun` |
| 2 | /p/ | 2 | 2 | pen | target | `l2-w03-check-row-pen` | `wa-pen` |
| 2 | /p/ | 2 | 3 | fish | other | `l2-w01-check-row-fish` | `wa-fish` |
| 3 | /s/ | 3 | 1 | dog | other | `l2-w01-check-row-dog` | `wa-dog` |
| 3 | /s/ | 3 | 2 | hat | other | `l2-w01-check-row-hat` | `wa-hat` |
| 3 | /s/ | 3 | 3 | sock | target | `l2-w05-check-row-sock` | `wa-sock` |
| 4 | /o/ | 4 | 1 | octopus | target | `l2-w07-check-row-octopus` | `wa-octopus` |
| 4 | /o/ | 4 | 2 | bus | other | `l2-w01-check-row-bus` | `wa-bus` |
| 4 | /o/ | 4 | 3 | ten | other | `l2-w06-check-row-ten` | `wa-ten` |
| 5 | /t/ (last) | 5 | 1 | cat | target | `l2-w01-check-row-cat` | `wa-cat` |
| 5 | /t/ (last) | 5 | 2 | sun | other | `l2-w02-check-row-sun` | `wa-sun` |
| 5 | /t/ (last) | 5 | 3 | bed | other | `l2-w02-check-row-bed` | `wa-bed` |
| 6 | /m/ (last) | 6 | 1 | drum | target | **no picture row** | `wa-drum` |
| 6 | /m/ (last) | 6 | 2 | dog | other | `l2-w01-check-row-dog` | `wa-dog` |
| 6 | /m/ (last) | 6 | 3 | bus | other | `l2-w01-check-row-bus` | `wa-bus` |
| 7 | /n/ (last) | 7 | 1 | sun | target | `l2-w02-check-row-sun` | `wa-sun` |
| 7 | /n/ (last) | 7 | 2 | cup | other | `l2-w01-check-row-cup` | `wa-cup` |
| 7 | /n/ (last) | 7 | 3 | hat | other | `l2-w01-check-row-hat` | `wa-hat` |
| 8 | /p/ (last) | 8 | 1 | cup | target | `l2-w01-check-row-cup` | `wa-cup` |
| 8 | /p/ (last) | 8 | 2 | bed | other | `l2-w02-check-row-bed` | `wa-bed` |
| 8 | /p/ (last) | 8 | 3 | fish | other | `l2-w01-check-row-fish` | `wa-fish` |

The paper also has 7 write-letter rows. They carry no picture, so they stay out of the read-aloud list.

**A note on the /t/ (last) row.** That row holds a Thai risk for the child. See Q7 in section 8.

**A note on the short vowels.** The packages write the short vowels as `/a/`, `/e/`, `/i/`, `/o/`, and `/u/`. The bank calls them `/a-short/` to `/u-short/` (design §6.4; `dashboard/lib/storytime/phonemes.ts`). The app maps the label with that table.

**A note on week 7.** The design writes the element of week 7 as "RAZ 7: short o". The package writes the prompt `/o/`. The words of the week take /ɑ/ in American English and /ɒ/ in British English. Every recording of "octopus", "ox", and "olive" uses the American vowel (row 8 of section 5). The teacher page says "short o".

## 5. Requirement 3: the changes to standard native-speaker phonics workbooks

A standard phonics workbook assumes that the child knows the word in the picture. A Thai child of 5 years does not know the word in the picture. The table lists every change this plan makes to that standard.

| # | Change | Reason | Where it applies |
|---|---|---|---|
| 1 | Every picture-based item names its word, and the teacher app reads the word aloud. | The child does not know the word in the picture. Without the word the child cannot test the sound. Daniel's words: "ELLs won't know that vocabulary, so we will need to maybe have a section in the teacher app that reads these out for the students to listen and identify whether the initial sound is right." | All levels; every picture page |
| 2 | The teacher says the word before the child answers. | The word fixes the name of the picture. The child then tests the sound, not the meaning. | All levels; every picture page |
| 3 | One fixed icon for each activity type. | The children cannot read the instruction. The icon carries the task. | All levels; every page |
| 4 | The teacher and parent instructions are in Thai. Daniel checks the Thai. | The teacher and the parent read Thai. The English in the book stays for the child. | All levels; teacher book, home card |
| 5 | A picture-word glossary with audio. | The family words of the week are the words the child must know by ear (§1.2). The glossary gives a name to every picture. | All levels; family page, app |
| 6 | A picture word comes from the picture word bank of the unit. | A word outside the bank is new on the page and breaks the "known by ear" base of the program (design §8, line 572). | All levels; every picture page |
| 7 | No picture word whose first letter differs from its first sound appears on an initial-sound item. | The child matches a sound to a letter. A word like "knife" or "phone" makes the item wrong. | All levels; initial-sound items |
| 8 | Every word and every sound uses American pronunciation. | The short o of week 7 is /ɑ/ in American English and /ɒ/ in British English. The words "octopus" and "ox" need the American vowel in every recording. | All levels; every picture page |
| 9 | No picture that a Thai child may name with a Thai word or another English word. One clear name for each picture. The same picture appears in the book, the app, and the cards. | Two names for one picture make the answer wrong. The child hears one name in class and sees another name at home. | All levels; every picture page |
| 10 | A final-sound item may put a picture with a final that Thai does not have next to a picture whose final is the Thai sound of that final (for example "bed" next to "cat"). The teacher app reads both words, and the teacher book names the pair. | Daniel, 2026-10-27, verbatim: "The goal is to teach them to hear the difference. A lot of phonics lessons double as pronunciation and listening discernment". The pair trains the child to hear the English final. | All levels; final-sound items |
| 11 | The Thai weeks of the design hold their own picture items. | A contrast week needs Thai minimal pairs and a Thai gloss. | Level 3 weeks 9, 17, 18, 29, 31; Level 4 week 23 (E4) |
| 12 | The student page shows no answer mark. The answers stay in the teacher book. | The Friday check is an assessment (design §7). A printed answer turns the check into a copying task. | All levels; check pages |
| 13 | No picture holds a letter, a word, or a number. | The child cannot read at Level 1, and a printed letter gives the answer away at every level. | All levels; every picture |
| 14 | Each picture holds one object, or one person who does the action. | A scene of many things does not name one answer. | All levels; picture words |
| 15 | A row holds at most 3 pictures. A check page holds at most 9. | The Level 2 check page holds 9 pictures today. A child of 5 years scans a short row. | All levels; check pages |
| 16 | Letter tracing is not writing. The child traces the letter of the week from week 3, in gray with a black start dot. The child writes nothing before week 20. | Daniel, 2026-10-27, verbatim: "Tracing is different to working. Tracing is fine in k2." The exit profile holds "traces 10 letters" (§1.2). | Level 1 |
| 17 | The family page holds one Thai gloss under each picture. | The child needs the Thai name of the picture to hold the English word. | Level 1 and 2; family page |

**The Thai finals.** Thai words end in /p/, /t/, /k/, /m/, /n/, /ŋ/, /w/, and /j/. A Thai child hears an English final of /b/, /d/, /g/, /s/, /z/, /f/, /v/, /ʃ/, /tʃ/, or /l/ as a Thai final. So "bed" sounds like "bet" and "bus" sounds like "but". The Thai weeks that teach a final are these. T1 (Level 3, week 9) teaches /d/. T3 (Level 3, week 18) teaches /s/. T4 (Level 3, week 29) teaches /s/ and /f/. T5 (Level 3, week 31) teaches /l/ and /v/. The design has no Thai week for /b/, /g/, /z/, /ʃ/, or /tʃ/, so a picture with one of these finals makes a listening item at every level (row 10).

**The picture word bank.** The bank of a unit holds every picture word of that unit: the family words, the home card words, and the words of the check pages. Every picture word of the pages of Level 2 Unit 1 is in the bank of unit 1. The sound picture set of the design sits in the bank through the check words. Its words carry the target sound, and they are not Starters picture words (design §8, line 572).

**The PM ideas.** Four of the five ideas are accepted as they stand: the fixed icon for each activity type (row 3), the Thai teacher and parent instructions (row 4), the Thai weeks of the design (row 11), and the picture-word glossary with audio (row 5).

The fifth idea is accepted in part. The strict form of "picture words only from the vocabulary that the unit teaches" cannot hold for the target-sound items. The sound picture card set of the design holds words that are not Starters picture words (design §8, line 572). Row 6 replaces the strict form with the picture word bank of the unit.

## 6. The audio source of the word lists

**The target sounds.** The app plays the target sound from Daniel's 45 approved recordings (P01 to P45, `content/storytime/phonemes/daniel/manifest.json`, approved 2026-10-22). These recordings hold sounds, not words. They cost nothing.

**The picture words.** No approved word recording exists today. The book audio stays draft after Daniel's stop of 2026-10-24.

**Option A, the default.** A text-to-speech run with one voice makes the word recordings. The run needs four things.

1. Daniel's go for the run.
2. The price named before the run, in the cost ledger (rule 7.3).
3. The measurement stage and the model pre-check of rules 6.6 and 6.7.
4. Daniel's listen check of a sample.

Status 2026-10-27: option A is done. The run made 98 recordings (576 characters, MiniMax Token Plan quota, no extra charge). Daniel passed the 12-word sample on 2026-10-27: "Approved, American, ox and axe correct". The files are in `content/storytime/words/` with `manifest.json`.

The voice is the same text-to-speech voice that Primary uses (design §6.4). The app never uses the phone voice as a fallback (rule 10.5).

**Option B.** Daniel records the words himself. This option costs no money. It costs his time.

**The word count of Level 2 Unit 1, for each option.**

| List | Distinct words | Option A | Option B |
|---|---|---|---|
| The read-aloud pages of unit 1 | 35 | 35 recordings | 35 recordings |
| The home card words of weeks 1 to 7 | 21 | 21 recordings | 21 recordings |
| The family picture words of weeks 1 to 8 | 68 | 68 recordings | 68 recordings |
| The three lists together | 98 | 98 recordings | 98 recordings |

The read-aloud pages hold 121 picture items, but they hold 35 distinct words. The family picture words hold 69 rows, 68 distinct words; mom is in weeks 4 and 8.

## 7. The date 2026-11-06

The date holds with the default scope: the rules, the app interface, and the word lists that exist today come from the shipped week packages, and the practice sheets of weeks 2 to 7 come with Phase 7 (2026-11-10 to 2026-11-18).

## 8. Open questions for Daniel

Each question has a default. The default holds until Daniel answers.

Daniel answered on 2026-10-27 (Google Tasks, 12:02 ICT, PM relay; evidence class peer-report). His words, verbatim: "1. Tracing is different to working. Tracing is fine in k2. 2. The goal is to teach them to hear the difference. A lot of phonics lessons double as pronunciation and listening discernment". Point 1 answers Q1, and point 2 answers Q7. He made no change to Q2 to Q6 and Q8 to Q12, so those defaults hold.

**Q1. The pre-writing strokes and the traced letters of Level 1.** The exit profile holds "Pre-writing strokes; traces 10 letters" (§1.2, line 89). Requirement 1 holds no writing before week 20.
*Default:* the pre-writing strokes become crayon paths with no letter form, and the letter traces and the name copy start in week 20. The level then traces 11 letters.
*Decision (Daniel, 2026-10-27):* letter tracing stays in Level 1, also before week 20. The exit profile keeps "traces 10 letters". The no-writing rule before week 20 holds for writing. The default above does not hold (section 3.3).

**Q2. The three added Level 1 page types.** The list in the requirement holds six types. This plan adds circle the letter, trace the path, and the name page.
*Default:* accept all three.

**Q3. The strict form of the picture-word rule.** The sound picture card set of the design holds words outside the unit vocabulary (design §8, line 572).
*Default:* use the picture word bank of row 6 in section 5. The sound picture set of the design stays inside the bank through the check words.

**Q4. The read-aloud file.** The Monorepo week contract holds the check items of each week. It holds no print block, no review pages, and no benchmark paper (app track spec FR-3).
*Default:* the PM hands the read-aloud file to the Monorepo team as a separate file, one record per group, and the field names of section 4.2 are a proposal.

**Q5. The field names of the read-aloud file.**
*Default:* the Monorepo team may rename a field. The Monorepo team does not change the meaning of a field.

**Q6. The picture-sort page and the sound of its second column.** The page holds two columns and two sounds.
*Default:* each column is one group with its own prompt, and the app reads the column sound when the teacher taps the column heading.

**Q7. The /t/ (last) row of the Benchmark 1 paper.** The row is in `w08.json`, `benchmark.paper`. It holds the answer "cat" and the other pictures "sun" and "bed". A Thai child can hear "bed" as "bet", so the child can circle two pictures with a heard /t/. The three other final-sound rows have no such pair.
*Default:* no change until Daniel decides, because the paper is approved week text. The recommendation is to replace "bed" in that row. The new picture needs a final that Thai has, and that final must not be /t/. One example is "pen" (`l2-w03-check-row-pen`). "Pen" is in the picture word bank of unit 1, and it has a picture row.
*Decision (Daniel, 2026-10-27):* "bed" stays in the /t/ (last) row. The row teaches the child to hear the difference between a final /d/ and a final /t/. The recommendation to replace "bed" does not hold. Row 10 of section 5 changes to match.

The three other final-sound rows hold no pair.

- The /m/ (last) row holds "drum", "dog", and "bus". The final /g/ of "dog" and the final /s/ of "bus" fall to a Thai final, so neither picture sounds like the target /m/.
- The /n/ (last) row holds "sun", "cup", and "hat". The final /p/ of "cup" and the final /t/ of "hat" are Thai finals, so the child hears both, and neither is the target /n/.
- The /p/ (last) row holds "cup", "bed", and "fish". The final /d/ of "bed" and the final /ʃ/ of "fish" fall to a Thai final, so neither picture sounds like the target /p/.

**Q8. The sound label of week 7.** The design writes "RAZ 7: short o". The package writes the prompt `/o/`.
*Default:* keep the package label. The teacher page says "short o".

**Q9. The voice of the word recordings.**
*Default:* Option A, a text-to-speech run with one voice, after Daniel's go, with the price named first, the pre-checks of rules 6.6 and 6.7, and Daniel's listen check of a sample.

**Q10. The number of recordings in the first run.** The read-aloud pages of unit 1 hold 35 distinct words. The home card needs 21 words with recorded audio (app track spec FR-5, line 135).
*Default:* the first run makes 98 recordings, the union of the three lists of section 6, and it covers the home card and the glossary with the same files.

**Q11. The Thai gloss on the student page.** The design holds the glossed family words in the student book (§6.5). The requirement holds the Thai in the teacher and parent text.
*Default:* one Thai gloss under each family picture on the family page. No other Thai on a student page.

**Q12. The word lists of the other 15 books.** Unit 1 of Level 2 is the only unit with week text.
*Default:* the rules of this plan hold for all 16 books. The word lists come when their weeks are written, in the same file format.

## 9. Revision history

- 0.5 — 2026-10-27 — Recorded Daniel's answers to Q1 and Q7 verbatim. Q1: letter tracing stays in Level 1 (sections 1, 3.1 to 3.3, row 16 of section 5, Q1). Q7: "bed" stays in the /t/ (last) row; row 10 of section 5 becomes a listening rule. The other defaults hold.
- 0.4 — 2026-10-27 — Recorded Daniel's pass of the 98 word recordings and their place in the repo (section 6).
- 0.3 — 2026-10-27 — Corrected the family word count (68 distinct words; "mom" is in weeks 4 and 8) and the audio count (98 words), as measured by the audio run.
- 0.2 — 2026-10-27 — Corrected the vowel example of row 8 and the Thai final-sound rule of row 10 and Q7 (orchestrator review).
- 0.1 — 2026-10-27 — First draft (A-18 b).

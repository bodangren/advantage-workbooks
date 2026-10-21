# Spec: the storytime-week package and the Storytime manual template

Track: `storytime_week_package_20261022`. Type: feature (classic FR list).

## Overview

Storytime Advantage is the kindergarten to P2 phonics program (Anuban 2 to P2, Levels 1 to 4). Its design is in the monorepo: `measure/tracks/storytime_advantage_program_20261021/design.md` (branch primary-parity-integration, commit 80df85c9a). Daniel approved decisions S1 to S14 on 2026-10-22 and set a release goal of 2026-12-01. Workbooks makes the content (design §6): one package is one week, and the teacher book comes from the manual generator with a Storytime template (design §8).

Decision (this session, 2026-10-22): the week is its own schema, not the Primary `LessonPackageSchema`. The Primary schema needs an article (paragraphs, glossary, question bank, Thai paragraphs, article audio); a week has none of them. A new field on the Primary meta also changes the 70 pinned packages when they are saved again. The design §6.6 values stay: `meta.program = "storytime"`, `meta.shape = "storytime-week"`, injector key (program, level, week).

## Functional Requirements

1. **Schema** `dashboard/lib/storytime/schema.ts` (Zod, `version: 1`): meta (with `status` draft or published and the S15 `band`), focus (element, PA skill, new tricky words, frame, family, word wall), `books[]` with `kind` readalong or decodable (decodable from Level 2) with pages, pictures, sounds page and audio at 0.75 and 1.0 timed in the app player's `SentenceTimepointSchema` shape, song (lines as sung with gesture and picture, audio, video, karaoke, times in the same shape), five scripts with steps (four headings in English, optional Thai, Easier, Harder, Group, minutes, an optional move to the next day's opening), review strips for days 1 to 5, the Friday check, the home card, tags, approvals, db. Pictures reuse the Primary picture fields without the Primary positions.
2. **Files:** `content/storytime/l<level>/w<nn>.json`, media in `content/storytime/l<level>/media/w<nn>/`, URL key `st<level>/<week>`.
3. **Checks** `dashboard/lib/storytime/checks.ts`: the design rules (§3, §4, §6) as errors and warnings. Five scripts on days 1 to 5 with the script ids of the level (A to E; Level 1 L, M, S, V, P); opening plus the main steps equal the period; no Level 1 step over 8 minutes; 6 to 8 family words; 3 or fewer new tricky words; 8 read-along pages in Levels 1 to 3; a decodable from Level 2 and none in Level 1; the frame 8 or more times in the song; a gesture on every song line; Thai line counts equal the English; 18 or fewer strip cards a day, one strip for each day.
4. **Manual template** `dashboard/lib/storytime/manual.ts`: one HTML document for a level, through the Primary print wrapper (A4 or book, Sarabun). A title page with the product name; per week a header (element, frame, family, tricky words, books, song); per day a new page: the opening routine with the day's review strip and the recall of the moved steps, then each step with its minutes, the four headings, and the Easier, Harder and Group lines. In the Thai manual the teacher's English stays English with the Thai gloss under it.
5. **Labels** `dashboard/lib/storytime/i18n.ts` (English and Thai). The four headings come from the pinned manual i18n, read only.

## Non-Functional Requirements

- No change to a pinned path (`dashboard/lib/teacher-manual/i18n/*`, `Teacher guide/step-*.md`, the 70 printed packages) or to the Primary package code.
- Daniel checks all Thai. The Thai labels in `i18n.ts` are drafts until his check.
- Heavy jobs (tsc, Chrome renders): a message to the Monorepo session first, then `flock ~/Desktop/primary-parity-progress/heavy.lock`.
- PR rules: the product name "Storytime Advantage" is on the title page; no CEFR in the teacher book.

## Acceptance Criteria

- A fixture week (Level 2, 30 minutes) parses and passes the checks; each broken rule gives its error.
- The English and Thai manuals of the fixture have five day sections, the step minutes, the four headings, the three lines, and no CJK character in the Thai output.
- The Storytime session has the commit id and the shape summary.

## Out of Scope

- The injector and the database rows (later, with Monorepo; key (program, level, week)).
- The content of Level 2 week 1 (after Daniel confirms S17), the media scripts for books and songs, and the music source (S16).
- The student book, the cards, and the benchmark packs.

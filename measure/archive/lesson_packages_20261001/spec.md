# Spec: Lesson packages for Primary Advantage books

Track: `lesson_packages_20261001` | Type: feature | Date: 2026-10-01 | Source: Origins 3.2 plan v1.2 §6, §8, task C7

## Why

On 2026-10-01 Daniel decided that Claude writes and curates every Primary lesson asset, and that the Primary app's generator is not used (it has no Mastery Advantage input). Blended Learning needs the same content in the workbook and in the app. One file per lesson makes this true: the workbook JSON, the database rows, and the tag file all come from it. Daniel has very little review time, so script checks gate every part.

## Package

- Location: `content/primary/<book>/<lesson>.json`, for example `content/primary/origins-3.2/p05.json` and `content/primary/origins-3.1/e12.json`. Media go in `content/primary/<book>/media/`. Never under `primary/` (the Tutor importer reads that folder).
- Schema: Zod, `dashboard/lib/lesson-package/schema.ts`.

| Part | Content |
|---|---|
| `meta` | Book, lesson number, key (the D1 URL key, for example `o3-2/5`), title, `raLevel`, `cefrLevel`, text type, genre, text-check profile, brief reference |
| `text` | 3 paragraphs, summary; `glossed`, `recycle`, `allow`, `names` (as in the draft format) |
| `glossary` | 12 entries: word, part of speech, English definition, Thai definition, example sentence from the text |
| `bank` | `mcq` (10: question, 4 options, answer, evidence sentence, objective IDs), `saq` (5: question, model answer, objective IDs), `laq` (5: question, objective IDs). Each item has a stable `id`. |
| `print` | 4 MCQ IDs and 1 SAQ ID from the bank; the short-answer hint |
| `activities` | Sentence starters (3), vocabulary fill (4), sentence order (2), sentence completion (3), writing prompt, writing frames |
| `thai` | Paragraph translations, sentence by sentence; summary translation |
| `images` | 3: prompt, main character, position, caption, file, overlay text (exact text for signs, posters, and labels) |
| `audio` | Voice, article file and sentence timing, word file and word timing |
| `tags` | Target and supporting objective IDs; glossed and recycled vocabulary node IDs |
| `approval` | Per part (`text`, `thai`, `bank`, `images`, `audio`, `lesson`): `draft` or `approved`, with the date |
| `db` | Legacy article ID, new article ID, question row IDs, content hash, last injection date (the injector writes these) |

## Checks (`dashboard/scripts/check-lesson-package.ts <folder or file>`)

| ID | Check | Status on failure |
|---|---|---|
| schema | The package parses | FAIL |
| text | The text check (profile from `meta`) has no FAIL | FAIL |
| bank-size | 10 MCQ, 5 SAQ, 5 LAQ | FAIL |
| mcq-answer | 4 different options; the answer is exactly one of them | FAIL |
| mcq-evidence | The evidence sentence occurs in the text | FAIL |
| bank-level | Question and option words are Starters words, glossed words, allowed words, or names; the report lists the others | WARN |
| bank-unique | No two question stems are the same after normalization | FAIL |
| print-set | 4 MCQ and 1 SAQ from the bank; 2 or more of the 4 MCQ have a target objective | FAIL |
| glossary | 12 entries, the same words as `glossed`, each with English and Thai definitions | FAIL |
| thai | Thai text for each paragraph and the summary, in Thai script | FAIL |
| activities | The counts match the lesson shape (plan §2) | FAIL |
| images | 3 image plans (prompt, characters, caption) | FAIL |
| tags | Each objective ID exists in the objective key (`docs/content-plans/data/a0-objective-key.json` maps the short IDs to GSE graph nodes) | FAIL |
| tags-coverage | Each bank item has one or more objective IDs (plain story-fact questions may have none) | WARN |

The report has the same form as the text check. `--json` gives the data. Exit code 1 on a FAIL.

## Builder (`dashboard/scripts/build-workbook-json.ts <package> [--out <file>]`)

Maps a package to `WorkbookLessonSchema` (`dashboard/lib/workbook-schema.ts`): vocabulary, article paragraphs, the print MCQs (`comprehension_questions` and `mc_answers`), the short answer, the activities and their answer strings, translation paragraphs, article images, and `article_url` (the D1 stable URL). No AI call. The output must pass the schema.

## Pilot

The E12 package, from the approved text in `docs/content-plans/origins-3.2-drafts/e12-hello-i-am-tom.md` and the draft questions in the errata brief §4, extended to the full bank.

## Out of scope

Image and audio generation (`lesson_media_20261001`), the review page (`review_page_20261001`), database writes (`primary_injector_20261001`), and print layout changes.

## Acceptance

- Unit tests for the schema, each check, and the builder, on a fixture package.
- The E12 package passes every check. Its workbook JSON passes the schema and renders in the dashboard.

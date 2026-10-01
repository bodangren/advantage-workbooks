# Primary Advantage lesson packages

Version 1.0 | Date 2026-10-01 | Status: Active | Owner: Daniel Bo | Internal

One JSON file per lesson holds every asset: the article, glossary (English and Thai), the app question bank (10 MCQ, 5 SAQ, 5 LAQ), the print set, the workbook activities, the Thai translation, the image plans, the audio, the objective tags, the approvals, and the database IDs. The workbook JSON, the database rows, and the tag file are built from it. Claude writes the packages; Daniel tweaks and approves them on the review page. The Primary app's generator is not used.

Spec: `measure/tracks/lesson_packages_20261001/spec.md`. Plan context: `docs/content-plans/primary-origins-3.2-plan.md` §6 and §8.

## Folders

| Folder | Content |
|---|---|
| `origins-3.1/` | `e12.json`: the lesson-12 insert (replaces the duplicate "My Happy Holiday") |
| `origins-3.2/` | `p01.json` … `p14.json` |
| `<book>/media/` | Images and audio for the book's lessons |

Keep this folder out of `primary/`: Tutor Advantage imports every folder there.

## Commands (run from `dashboard/`)

```
npx tsx scripts/check-lesson-package.ts ../content/primary/origins-3.2        # a whole book
npx tsx scripts/check-lesson-package.ts ../content/primary/origins-3.1/e12.json
npx tsx scripts/build-workbook-json.ts ../content/primary/origins-3.1/e12.json --out <file>
```

A FAIL blocks approval. A WARN does not (for example, fewer than 6 new words: a good story comes first).

## Rules that are easy to miss

- `meta.key` is the stable URL key (`o3-2/5` → `https://primary.reading-advantage.com/b/o3-2/5`). The QR codes print it.
- Thai: `thai.paragraphs` holds one English–Thai pair per sentence. The English sentences must join to the exact paragraph text.
- MCQs keep 4 options for the app. Print shows the answer and the first two other options (`print.mcqOptions`).
- Objective IDs are short IDs from `docs/content-plans/data/a0-objective-key.json`, which maps each one to its GSE graph node.
- mmx cannot draw text. Signs, posters, and labels go in `images[].overlay`; a script writes them on the image.
- Never edit `db`, except through the injector.

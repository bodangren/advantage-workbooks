# Spec: Origins 2 and 3.1 app refresh

**Track:** `origins_app_refresh_20261001`
**Version:** 1.2
**Date:** 2026-10-01
**Status:** new

## Goal

Make the app content for every printed lesson of Primary Advantage Origins 2 and Primary
Advantage Origins 3.1 again, to the same standard as the new Origins 3.2 lessons. The printed
books do not change.

Daniel (2026-10-01): "we will need to redo the supporting information, images, and audio for
workbooks 2 and 3.1 in their entirety. We can't change the articles or the vocabulary choice at
this point, but we can improve the app experience."

## Scope

- 27 app articles: Origins 2 lessons 1–14 (`primary/origins-2-a0/`) and Origins 3.1 lessons 1–11,
  13, and 14 (`primary/origins-3.1-a0/`). Origins 3.1 lessons 9 and 12 use the same app article
  (`cmgqwsfcs02bqt79bkaa1pjaw`); E12 replaces lesson 12 and is a new article (track
  `lesson_packages_20261001`).
- Each lesson becomes a lesson package (`content/primary/<book>/<lesson>.json`) with the app
  article id in `db.legacy.articleId` (from `article_url`).

## Locked (copied from the printed file; a check fails on any change)

- The article paragraphs.
- The vocabulary words and their order.
- The printed questions and activities (the `print` part): they are on paper already.

## Made again (app only)

- **Sentence Thai:** one Thai line for each English sentence (the printed file has Thai for each
  paragraph only). Daniel checks all Thai.
- **Summary** and Thai summary.
- **Glossary:** simple English definitions and Thai for the locked words.
- **App question bank:** MCQ, SAQ, and LAQ for the app (more than the 4 printed MCQs).
- **Pictures:** 3 for each lesson (hero, paragraph 2, paragraph 3), in the flat 2D cast style
  (below). Origins 2 lesson 14 has no pictures today.
- **Audio:** article, words, flashcard sentences, and the Tutor Advantage clips with the American
  voices (narrator: `English_magnetic_voiced_man` when a boy or a man tells the story, else
  `English_captivating_female1`; teacher: `English_captivating_female1`).

## Picture style (tests on 2026-10-01, `lesson_media_20261001`)

- A `--subject-ref` pulls MiniMax `image-01` toward a 3D look, also with 2D references.
- The flat 2D style text and a full `look` (hair and clothes) for each character give the same
  character in each picture, with no reference.
- So: the cast sheets are flat 2D and made from the text only. Scene pictures use the style and
  the looks. A sheet is the standard that Claude and Daniel compare a picture against.

## Injection

- The packages update the existing articles (same ids), so links, progress, and assignments
  stay.
- Before an upload, the old bucket objects of the article go to a backup prefix.
- Old question rows: the package replaces them (Q-ORF-01 below).
- Other languages (Daniel, 2026-10-01, second decision): keep the old `cn`, `tw`, and `vi`
  translations, matched by sentence. `scripts/fetch-legacy-locales.ts` copies them into each printed
  package (`locales`) before the first injection; the injector refuses a printed lesson without the
  copy. English fills each gap, because the app shows an empty string as empty (the summary uses
  `?? summary`, the reading view `|| ""`). E12 has no old article, so it gets English only. The first
  decision ("Thai only") came from a wrong statement that the app shows English for an empty value.

## Pictures and the app page (Daniel, 2026-10-01)

The 1024×1024 pictures fill the full width of the legacy reading page (about 926 px high each), and
the lesson view crops them to 894×320. The pictures stay square for now. Daniel: "We are migrating to
the monorepo version of primary advantage, so I want fix the page format there, not in the current
deployment." The page notes from the E12 check go to the monorepo visual refresh: picture size and
crop, the empty learning objectives, the reading time, the purple gradients, the English disclaimer in
the Thai interface, and the red "Delete" button on the account page.

## Open items

- **Q-ORF-01 (closed 2026-10-01):** Replace. Each article had 10 MCQ, 5 SAQ, and 5 LAQ rows; no
  row points at them, and the app picks 5 random MCQs from all rows of an article (Daniel chose
  replace).
- **Q-ORF-02 (closed 2026-10-01):** No change. The app has the printed values: 26 articles at
  `ra_level` 2 / A0, and Origins 3.1 lesson 13 at 3 / A0+.

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-01 | First version |
| 1.1 | 2026-10-01 | Q-ORF-01 and Q-ORF-02 closed from the production sample; Thai only |
| 1.2 | 2026-10-01 | Keep the old cn, tw, and vi (matched by sentence, English for gaps); pictures stay square, page fixes go to the monorepo |

# Spec: editorial_prereview_20261003

Version 1.0 | Date 2026-10-03 | Status: Active | Owner: Daniel Bo

## Why

The 42 lesson packages of Origins 1, Origins 3.2, and Quest 4 pass every script check, but they are
still draft. The checks do not find language errors ("We lose Snow!", Quest 4 L13), story logic
errors, wrong answers in the question bank, or pictures that do not match the text. Daniel has very
little review time (see `content/primary/README.md`). Claude reads every lesson first, fixes what it
finds, and gives Daniel a log of each change. Daniel then approves on `/review`.

The first read found a fault in the pictures. Each sign, board, map, and notice in a picture is
blank, and its text is drawn in one white box at the bottom of the picture. When a picture has more
than one text, the boxes sit on top of each other (Quest 4 L05: four timetable lines; Origins 3.2
P04: nine chant lines). The authoring format cannot give a text its place, and three image lines put
their text list in the caption field (Quest 4 L09, bank-3 b064, b068).

## Requirements

### R1 Sign text on the sign
Daniel (2026-10-03): "Text in images works well in Muse image gen." A test the same day confirmed
it (four zoo signs, a four-line timetable, a five-line poster: every word right).
1. A prompt that quotes text (`A sign says "NO DOGS."`) ends with an exact-spelling rule
   (`SIGN_TEXT`), not the no-text rule. Pictures with text are made with `--model muse`.
2. Fallback for a misspelled word: the overlay. The authoring format accepts a place for each
   overlay text (`text @ x, y, w, h`, fractions of the picture); the converter rejects a place
   outside the picture. The renderer wraps a long text and picks the largest font that fits.
   Overlays with no place stack in rows at the bottom and never overlap. A placed text has a
   plain panel; an unplaced one keeps the bordered sign.
3. The converter rejects an image caption that contains ` ; ` (a text list in the wrong field).
4. The `image-text` check warns when an image has two or more overlays and one has no place.

### R2 Editorial fixes
1. Read every lesson of Quest 4, Origins 3.2, and Origins 1: text, glossary, MCQ, SAQ, LAQ, print
   set, activities, image plan, and the pictures.
2. Fix language errors, story-logic errors, continuity errors across lessons and the series bible,
   wrong or ambiguous questions, and pictures that do not match the text.
3. Keep each story; do not rewrite what works. A good story comes first (Daniel, 2026-10-01).
4. Fix the source (`<book>/src/<lesson>.md`), convert it, and keep every check at PASS (WARN is OK).
5. Make the audio again for every lesson whose text or glossary changed, and new pictures for every
   image whose prompt changed. Draw the sign texts in their places.
6. Write a review log for Daniel: one line for each change, with the reason, and the open questions.

## Out of scope

- Approval: only Daniel approves. Import and new PDFs come after his approval.
- Thai: Daniel checks all Thai. Claude writes the Thai of a changed sentence and fixes a clear
  meaning error, and lists each Thai change in the log.
- Bank articles (levels 1–4): the R1 fix applies to them, but their sign places are a later task.

## Acceptance

- `npm run test:run` passes, including new tests for R1.
- `check-lesson-package.ts` and `qa-packages.ts` show no FAIL and no ERROR for the three books.
- Every picture with text in the three books shows the text on its sign, spelled right (checked by eye).
- The review log exists in `docs/content-plans/reviews/` and lists every change.

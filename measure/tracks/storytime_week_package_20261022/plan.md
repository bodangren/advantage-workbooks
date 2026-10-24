# Plan: storytime_week_package_20261022

## Phase 1: Package

- [x] Task: the schema and a Level 2 fixture week (tests first: the fixture parses; a wrong program, shape, level, or step id is refused). Changed the same day after Monorepo's QR-page review (Storytime agreed): `books[]` with `kind` readalong or decodable, the app's `SentenceTimepointSchema` for book and song times (`page` on book sentences), `meta.status` draft or published, `meta.band` (S15 names).
- [x] Task: the checks (tests first: the fixture is clean; one test for each rule). 9 mutants, all caught (one after a new test).
- [x] Task: the file paths and the URL key (`st<level>/<week>`): `lib/storytime/files.ts`, `content/storytime/README.md`.

## Phase 2: Manual template

- [x] Task: the labels (English and Thai drafts).
- [x] Task: the week and day renderer (tests first: five day sections, minutes, four headings, three lines, the Thai gloss under the English, no CJK).
- [x] Task: the document (title page, wrapper, A4) and one A4 PDF of the fixture (Chrome render under the heavy lock): `scripts/storytime/make-manual-pdf.ts`; the fixture week is 14 A4 pages in Thai, fonts embedded. Contact sheets showed two defects (no day page breaks, a split title word); both fixed.

## Phase 3: Hand-off

- [~] Task: the commit, the commit id and the shape summary to the Storytime session; tech-debt and lessons-learned.

## Phase 4: Level 2 week 1 (S17, approved 2026-10-22)

- [~] Task: write week 1 from the Storytime sequence row (element n, frame "Hello, I am ___.", names and greetings): the read-along, the decodable, the song lyrics, the five scripts, the strips, the check, and the home card; checks clean; the Storytime review, then Daniel's Thai check.
  - 2026-10-22: written (`content/storytime/l2/w01.json`): read-along "Hello!" (8 pages, 33 words, Pip twist), sound book "Nan Can Nod" (`soundBook`, Storytime option A), the song lyric that Daniel rated "really good" (unchanged, `lyricSheet`), five 30-minute scripts. An independent review gave 33 findings; 32 applied (graph ids wait for graph v0, as Storytime asked). Changes against design §3.3, sent to Storytime: the Friday check E5 stays on day 5; the song steps B7 and D6 are item 3 of the next opening; E6 joins D6; A8 is a home-time task. The n action is a nod (n for nod).
  - 2026-10-22: the Storytime review fixes (539298a; Nan joins the series bible) and the song audio (020f9b5; Lyria 3 Pro, Daniel's choice, `media/w01/song.mp3`, 78.4 s).
  - 2026-10-22: `song.lines` and `song.times` follow the audio: 15 sung lines. Two transcriptions agree that the sheet line "Hello, I am, hello, I am" is not sung and that chorus 1 sings "Hello, who are you?" three times. The lyric sheet stays as the text sent to Lyria, and the `song-sheet` check is now a warning. The independent Thai proofread (a subagent, 26 findings) is applied, and Daniel still checks all Thai; `focus.element.action`, `focus.paSkill`, and `focus.family.name` are now English with Thai, and the `thai` check counts them, the prep lines, and the song notes.

## Phase 5: Book audio (S30, Storytime 2026-10-23; Daniel's go 2026-10-24)

- [~] Task: the book audio of each week with mmx and the read-along times (`dashboard/scripts/storytime/book-audio.ts`, tests first: the sentences and pages, the gaps, the screen words, the word fit, the heard check). One mmx clip for each sentence at 1.0 and at 0.75 (design §6.1), joined with 0.5 s in a page and 1.2 s at a page turn; `books[].audio` = {voice, file, sentences, slowFile, slowSentences} with the word times from faster-whisper (the letter counts when the word count differs). A take that the recognizer hears as other words is made again ("Nan can nod!" was heard as "Nan cannot."). The mmx clip code moved from `lesson-audio.ts` to `lib/media/make-clip.ts`; `check-weeks.ts` checks that the book audio files exist. Voice: `English_captivating_female1` (Daniel's lesson voice, 2026-10-01).

## Phase 6: Song-line pictures for weeks 2 to 7 (QR3; Daniel's go 2026-10-24, item 4)

- [~] Task: the gesture pictures of the week 2 to 7 song lines (`video/storytime-song/scripts/line-pictures.mjs`, test first: the week's own Forge set, else the gesture library). The library `content/storytime/forge-gestures/` is a Forge set with gestures only: the week 1 frames and the chibi-sprouts stills for weeks 2 to 7 (advantage-forge `out/chibi-sprouts/r1/week2-7/gestures`, 2026-10-24; 21 gestures, 32 frames). Only its `manifest.json` is in git; the video does not read it, so weeks 2 to 7 keep the placeholder art until Daniel passes the week 1 video. 45 pictures, 540 KB; `image.file` on 50 lines. Follow-up: march, stamp, and sway look close to idle in a still (the legs are short and the crop ends below the belt); turn has no independent review yet.

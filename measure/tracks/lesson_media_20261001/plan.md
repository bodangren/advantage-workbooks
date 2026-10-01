# Plan: Lesson media

Track: `lesson_media_20261001`

## Phase 1: Probe

- [x] Test `--subject-ref`: one, two, and four references work; results in the spec
- [x] Test `--subtitles` output: one segment for the whole text, so one clip per sentence (spec, Audio)
- [~] 3 voice samples of the E12 text for Daniel (made in `origins-3.1/media/e12/samples/`; Daniel picks)

## Phase 2: Contract and tests

- [x] Clip join and timing tests (`__tests__/media-audio.test.ts`, 9 tests)
- [x] Overlay tests (text box position, font size, escaping, drawn pixels) and image-prompt tests (`__tests__/media-images.test.ts`)

## Phase 3: Implement

- [x] `dashboard/scripts/media/cast-sheets.ts` (candidates and `cast.json`)
- [x] `dashboard/scripts/media/lesson-images.ts` (with the overlay step; refuses prompts with skin, race, or nationality words: series bible v1.2)
- [x] `dashboard/scripts/media/lesson-audio.ts` (article and words, with timing; bad-take retries; `--redo`)
- [x] Download the 81 printed story images; sort them by character; choose one source image per character (Pip brown with a red collar)
- [~] Make the cast sheets from the source images (30 candidates, 2 per character); Daniel picks on `/review/cast`
- [x] E12 images and audio (Claude chose 3 of 10 candidates; Daniel approves on `/review`)

## Phase 4: Docs

- [x] Media section in `content/primary/README.md`
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`

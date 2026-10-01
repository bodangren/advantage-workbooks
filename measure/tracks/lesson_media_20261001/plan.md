# Plan: Lesson media

Track: `lesson_media_20261001`

## Phase 1: Probe

- [~] Test `--subject-ref` (one reference works; two references not yet tested); results in the spec
- [x] Test `--subtitles` output: one segment for the whole text, so one clip per sentence (spec, Audio)
- [~] 3 voice samples of the E12 text for Daniel (made in `origins-3.1/media/e12/samples/`; Daniel picks)

## Phase 2: Contract and tests

- [x] Clip join and timing tests (`__tests__/media-audio.test.ts`, 9 tests)
- [ ] Overlay tests (text box position, font, exact text)

## Phase 3: Implement

- [x] `dashboard/scripts/media/cast-sheets.ts` (candidates and `cast.json`)
- [ ] `dashboard/scripts/media/lesson-images.ts` (with the overlay step; refuse prompts with skin, race, or nationality words: series bible v1.2)
- [x] `dashboard/scripts/media/lesson-audio.ts` (article and words, with timing; bad-take retries; `--redo`)
- [x] Download the 81 printed story images; sort them by character; choose one source image per character (Pip brown with a red collar)
- [~] Make the cast sheets from the source images (30 candidates, 2 per character); Daniel picks on `/review/cast`
- [~] E12 images and audio (audio done with the default voice; images next)

## Phase 4: Docs

- [ ] Media section in `content/primary/README.md`
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`

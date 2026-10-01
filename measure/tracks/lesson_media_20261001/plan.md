# Plan: Lesson media

Track: `lesson_media_20261001`

## Phase 1: Probe

- [~] Test `--subject-ref` (one reference works; two references not yet tested); results in the spec
- [ ] Test `--subtitles` output: sentence or word timing; record the result in the spec
- [ ] 3 voice samples of the E12 text for Daniel

## Phase 2: Contract and tests

- [ ] Timing-conversion types and tests (mmx subtitles → app sentence and word timing)
- [ ] Overlay tests (text box position, font, exact text)

## Phase 3: Implement

- [x] `dashboard/scripts/media/cast-sheets.ts` (candidates and `cast.json`)
- [ ] `dashboard/scripts/media/lesson-images.ts` (with the overlay step; refuse prompts with skin, race, or nationality words: series bible v1.2)
- [ ] `dashboard/scripts/media/lesson-audio.ts` (article and words, with timing)
- [x] Download the 81 printed story images; sort them by character; choose one source image per character (Pip brown with a red collar)
- [~] Make the cast sheets from the source images (30 candidates, 2 per character); Daniel picks on `/review/cast`
- [ ] E12 images and audio

## Phase 4: Docs

- [ ] Media section in `content/primary/README.md`
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`

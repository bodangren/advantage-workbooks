# Spec: Lesson media with mmx

Track: `lesson_media_20261001` | Type: feature | Date: 2026-10-01 | Source: Origins 3.2 plan v1.2 task C9

## Why

On 2026-10-01 Daniel chose local `mmx image` and `mmx speech` over the app's OpenAI and Lemonfox path. The printed books drew Pip in three colors, so character sheets must fix one look for every character.

## Character sheets

- **Method (Daniel, 2026-10-01): the existing story images make the character sheets, and the character sheets make the new article images.**
- Source: the 81 images of the printed Origins 2 and Origins 3.1 lessons (27 unique articles × 3), in the bucket `primary-app-storage` at `images/<articleId>_<n>.png`. Claude sorts them by character and picks the best reference for each character. The chosen image must agree with the series bible (for example, Pip is brown with a red collar; the books also show him yellow and white).
- For each character with a printed reference: `mmx image generate --n 4 --subject-ref type=character,image=<printed image>` with the bible description makes the candidates (a clean full-body sheet on a plain background). Daniel picks one on `/review/cast`.
- New characters with no printed image (May, Pat, Teacher Kim, and any others the inventory does not find): the prompt uses the bible row and the house style of the printed images. Daniel picks one.
- `cast.json` records the source image, the style prompt, the seed, the chosen file, and the approval date, so every job reuses them.
- Files: `docs/content-plans/character-sheets/<name>.png`, the source images in `docs/content-plans/character-sheets/source/`, and `cast.json`.
- mmx cannot draw text. No sheet or image may rely on generated text (see the overlay rule below).

## Probe results (2026-10-01)

- `--subject-ref` with one printed image keeps the character (Pip: brown, cream chest, red collar).
- Without style words, mmx draws a 3D render. With "2D hand-drawn cartoon illustration in a children's picture-book style, clean brown outlines, flat colors with soft cel shading … Not 3D, not a render, not a photo", it matches the printed style. Put this style text in `cast.json` and use it in every job.
- Two mmx calls at the same time give no output. Run the jobs one at a time.
- People keep their printed look (Daniel, 2026-10-01). The printed books use a picture-book style where race is not marked, and readers take the characters as Thai, as in Asian manga and anime. Prompts describe hair and clothes only, never skin or ethnicity: an ethnicity prompt gave Lily tightly curled hair, which is not typical for a Thai child. Large eyes are part of the style.
- The printed children change between lessons (Mia is brown-haired in O3.1-05 and blonde in O3.1-06), so each sheet uses one chosen reference and fixes one look.

## Lesson images

- 3 per lesson from `images[].prompt`, with `--subject-ref type=character,image=<sheet of the main character>`.
- Phase 1 tests if `--subject-ref` accepts 2 or more references. If not, the job uses the main character's sheet and describes the others in the prompt.
- Signs, posters, clocks, and step labels: the generated image leaves the sign blank. A script then writes the exact `images[].overlay` text on it, so the picture always matches the article letter for letter (series bible §5).
- Claude looks at every image before review: the characters match the sheets, the counts and clock hours match the text, and the image has no text errors.
- Files: `content/primary/<book>/media/<lesson>_<n>.png`.

## Audio

- Article: `mmx speech synthesize --subtitles`. One English voice for all Primary lessons; Daniel picks it once from 3 samples. The speed suits young learners.
- The script changes the subtitle timing into the app's sentence-timing format (the shape comes from the injector's field map).
- Words: one file with the 12 glossed words and their timing, in the same form as the app's `audios/words/<id>.mp3`.
- Chant and song audio (P03, P04) is a later task.
- Files: `content/primary/<book>/media/<lesson>.mp3` and `<lesson>_words.mp3`.

## Out of scope

Video and music.

## Acceptance

- Unit tests for the timing conversion and the overlay step, on fixture inputs.
- E12 has 3 approved images and 2 audio files, and the app's timing format accepts the timing.

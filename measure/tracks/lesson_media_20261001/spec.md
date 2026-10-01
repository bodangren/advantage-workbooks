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

- 3 per lesson from `images[].prompt`, 1:1 (the printed pictures are 1024 × 1024). The prompt is the house style, the scene, each character's `look` (hair and clothes; the sheet `description` holds a sheet pose that fights the scene), and "No words, letters, or numbers anywhere in the picture."
- One `--subject-ref type=character,image=<sheet>` for each character in the image: the chosen sheet, or else the printed source crop. Two and four references work (probe, 2026-10-01).
- Prompts with skin, race, or nationality words fail the `images` check, and the script refuses them (series bible v1.2).
- Each run makes 2 candidates per image in `<book>/media/<lesson>/candidates/` (not in git). A later run gets its own prefix, because mmx numbers from 001 every run. An image with no picture gets its first candidate; Daniel picks another on the review page, or asks for new pictures (`redo`), and `--redo-marked` makes them.
- Signs, posters, clocks, and step labels: the picture leaves the sign blank, and `images[].overlay` text is drawn on it (white sign, dark bold text, `sharp` + SVG). A picture with signs keeps a `.raw.jpg` copy so the signs can be drawn again after an edit; a picture without a raw copy has no signs. The review page's save draws the signs again.
- Claude looks at every candidate before review: the characters match the sheets, the counts and objects match the text (E12: "football" is a soccer ball; Pip asleep means eyes closed), and the picture has no text.
- Files: `content/primary/<book>/media/<lesson>/<position>.jpg`; `images[].file` is relative to `content/primary/`.

## Audio

- Article: one WAV clip per sentence (`mmx speech synthesize --format wav --language English`), because `--subtitles` gives one segment for the whole text, even with one sentence per line (probe, 2026-10-01). The sentences come from the Thai part, whose check proves they join to each paragraph.
- The clips are trimmed (60 ms pad) and joined with gaps (450 ms between sentences, 900 ms between paragraphs). The sentence times come from the sample counts, so they are exact. One MP3 encode at the end (`libmp3lame -q:a 4`).
- Takes vary: the same sentence differs by up to 40% in length between runs, more than the speed setting changes it. A take with an inner pause over 0.6 s is made again (3 tries; the take with the shortest pause stays). `--redo 4,w2` makes named sentences or words again.
- One English voice for all Primary lessons; Daniel picks it once from 3 samples (paragraph 1 of E12 at speed 0.75: `English_expressive_narrator`, `English_Graceful_Lady`, `English_Gentle-voiced_man`). Default until then: the narrator. Speed 0.75 gives about 124 words a minute with the gaps (the legacy app used 0.7 on Lemonfox).
- Words: one file with the 12 glossed words and their timing (700 ms gaps), for the app's `audios/words/<id>.mp3`. The injector maps both timing lists to the app's fields.
- Chant and song audio (P03, P04) is a later task.
- Files: `content/primary/<book>/media/<lesson>/article.mp3` and `words.mp3`; clips are cached in `.clips/` (not in git). The review page serves them with byte ranges, so the player can seek.

## Out of scope

Video and music.

## Acceptance

- Unit tests for the WAV parts, the trim, the join timing, the clip key, and the overlay step, on fixture inputs.
- E12 has 3 approved images and 2 audio files, and the app's timing format accepts the timing.

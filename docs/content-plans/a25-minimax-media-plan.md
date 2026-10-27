# A-25 MiniMax media plan

Version 0.3 | Date 2026-10-27 | Status: draft for the PM

History: v0.2 (2026-10-27) measured the counts of the Workbooks repository. v0.3 (2026-10-27) takes the item 7 Daniel check minutes from design v0.3 section 7.5. The PM decision of 2026-10-27 22:41 ICT set the Thai of the tests to the glossary Thai that Daniel already checked.

## 1. Summary

Program A-25 (Daniel, 2026-10-27) asks for more MiniMax speech and pictures. This version gives a measured count for each of Daniel's items. The counts come from the Workbooks repository. The live app counts stay open inputs until the Monorepo answers.

**Scope.** The strategy says: "The active program is levels 1–9: 16 books, 224 articles" (`advantage-pr/08-strategy/product-strategy-2026-2027.md` §3.1, line 64). The 16 books are these:

| Band | Books |
|---|---|
| Origins (levels 1–3) | Origins 1, Origins 2, Origins 3.1, Origins 3.2 |
| Quest (levels 4–6) | Quest 4, Quest 5, Quest 6.1, Quest 6.2 |
| Adventure (levels 7–9) | Adventure 7.1, Adventure 7.2, Adventure 8.1, Adventure 8.2, Adventure 8.3, Adventure 9.1, Adventure 9.2, Adventure 9.3 |

The `bank-1` to `bank-9` folders hold online-only articles. They are reported apart from the books.

**Measurement.** One read-only Python script measured everything below.

| Fact | Value |
|---|---|
| The script | `/tmp/opencode/a25-count/count_primary.py` |
| The command | `python3 -I /tmp/opencode/a25-count/count_primary.py` |
| The run date | 2026-10-27 |
| The script stays out of the repository | Yes. It lives in `/tmp/opencode/a25-count/`. |
| The repository files it reads | `content/primary/<book>/*.json`, `content/primary/<book>/media/`, `content/storytime/words/manifest.json`, and the 2026-10-27 word test list |
| The Git check | `git ls-files content/primary/<book>/media` per book |
| The result file | `/tmp/opencode/a25-count/results-v02.txt` |

**The count table.** The "Order" column is the program order. Item 7 comes first after the covers and the test design. Item 2 runs before that order, because the PM gave the go for the word batch on 2026-10-27 at 21:05 ICT.

| Item | Count | Voice or style | Order | MiniMax estimate | Daniel check minutes |
|---|---|---|---:|---|---:|
| 1. Read-aloud article audio | 0 book packages and 0 bank packages lack article audio. Live-app gap is an open input (Monorepo, due 10-30). | American narrator; `English_magnetic_voiced_man` for a boy or a man, else `English_captivating_female1`; speed 0.75 | 2 | 0 characters in Workbooks. The live-app count arrives on 10-30. | 0 |
| 2. Word audio for the Primary word lists | 1,540 distinct glossary words in the 16 books; 9,491 characters. 1,463 words need a new clip (10,612 characters sent with the full stop). 77 words already have a clip: 68 from the Storytime set and 10 from the test batch, with 1 word in both. | `English_captivating_female1`, speed 0.9, model `speech-2.8-hd`; one clip per word | 3 | 10,612 characters, 3 nights, cap 500 words a night. The banks add 3 more nights and 10,129 characters. List price: USD 1.06 for the books. | 30 |
| 3. Listening practice on the lesson QR codes | 224 lessons in the 16 books. One practice a lesson. | Same teacher voice; a short instruction per practice | 4 | 224 practices. The instruction text is an open input (PM). 6,048 characters a default estimate. | 60 |
| 4. Two-voice dialogues for the Tutor pair phase | 224 lessons in the 16 books. One dialogue a lesson. | Two voices: `English_captivating_female1` and `English_magnetic_voiced_man` | 5 | 224 dialogues, 35,168 characters at 4 turns a dialogue (measured average sentence: 39.3 characters). 9 nights, cap 25 dialogues a night. | 90 |
| 5. Minimal-pair listening drills for Storytime | 38 candidate pairs in the 98 approved Storytime words (one letter differs). The pair words use 30 distinct words, and all 30 already have a clip. The PM confirms the final pair list. | `English_captivating_female1`, speed 0.9; the pair reads as one clip and one prompt | 6 | 38 drills, 760 characters for the prompts. One night. | 20 |
| 6. How-to-play audio for the games | 28 games in the Monorepo registry. The game texts arrive from the Monorepo through the PM. | English, plus one Thai template that Daniel approves one time | 7 | 28 clips plus 1 Thai template. The character count is an open input. | 25 |
| 7. Book tests and level-test listening parts | 32 book tests (16 books × 2) and 3 level-test listening forms. 84,030 characters, 226 pictures, 155 audio files. | `English_captivating_female1` at speed 0.9; the passage at 0.85; Thai `Thai_male_1_sample8` at 1.0 | 1 | 84,030 characters, 226 pictures, 155 audio files. 11 nights, cap 8,000 characters a night. | 90 |
| 10. One picture for each article that has none | 0 book packages and 0 bank packages lack a picture. Live-app gap is an open input (Monorepo, due 10-30). | Printed-book style; characters show hair and clothes only | 8 | 0 pictures in Workbooks. The live-app count arrives on 10-30. | 0 |
| 11. Simple object pictures for flashcards | 836 distinct noun words in the 16 books (5,286 characters). Method: glossary part of speech, nouns only. The upper bound is the 1,540 distinct words. | Printed-book style; one object; no text | 9 | 836 pictures, 5 nights, cap 200 pictures a night. | 60 |
| 12. Speaking-prompt pictures for Tutor pair work and the tests | 224 lessons in the 16 books (one set a lesson) plus the 226 test pictures from the design document. | Printed-book style; characters show hair and clothes only | 10 | 224 pictures for the lessons, 226 for the tests. 3 nights, cap 150 pictures a night. | 45 |

**Totals.** The measured speech counts are:

| Item | Characters |
|---|---:|
| 2 | 10,612 |
| 4 | 35,168 |
| 5 | 760 |
| 7 | 84,030 |
| 3 | about 6,048 (default estimate) |
| **Total** | **about 136,600** |

At the list price of USD 100 per million characters the speech costs about USD 13.70. The picture count is 1,286 pictures. The picture list price is not supplied, so only the quota applies for pictures.

## 2. Item 1: Read-aloud audio for each Primary article

**The count.** 0 of the 224 book packages lack article audio. 0 of the 576 bank packages lack article audio. The Workbooks gap is 0 packages and 0 characters.

**The measurement.** The script reads `audio.article` from each package and checks the file on disk. All 224 book packages and all 576 bank packages have the file.

**The live-app gap.** The Monorepo holds the list of articles that have no audio in the live app. That answer is due 2026-10-30. Until it arrives the live-app count is unknown, and this plan states no number for it.

**The character base for the estimate.** The 224 book articles hold 339,218 characters of paragraph text (measured). The 576 bank articles hold 803,354 characters. A live-app gap of any size can be priced with these two numbers: characters × USD 100 per million.

**The voice.** The narrator voice comes from `audio.voice` in the package. It is `English_magnetic_voiced_man` when a boy or a man tells the story. Otherwise it is `English_captivating_female1`. The speed is 0.75. The source is `dashboard/lib/media/audio.ts` and `content/primary/README.md` (voices of 2026-10-01).

**The checks.** The English clip passes the speech recognizer with a word error rate of at most 0.10. The clip is not silent. The inner silence is at most 1.2 s. The shift rate is at most 0.35 s a character.

**The files.** `content/primary/<book>/media/<lesson>/article.mp3` and the same `tutor/` folder. The clip cache is `content/primary/<book>/media/<lesson>/.clips/`.

## 3. Item 2: Word audio for each word of the Primary word lists

**The count.** The 16 books hold 1,540 distinct glossary words. Their total length is 9,491 characters.

77 of these words already have a clip at the batch speed. 68 come from the 98 approved Storytime words. 10 come from the 2026-10-27 test batch. One word is in both sets. **1,463 words need a new clip.** With the full stop that the batch adds, the batch sends 10,612 characters.

**The per-book table.** "New" counts the words that no clip exists for at the batch speed.

| Book | Packages | Distinct words | Word characters | Already cached | New words | New characters |
|---|---:|---:|---:|---:|---:|---:|
| origins-2 | 14 | 121 | 642 | 20 | 101 | 538 |
| origins-3.1 | 14 | 128 | 684 | 23 | 105 | 567 |
| origins-3.2 | 14 | 158 | 884 | 18 | 140 | 793 |
| quest-4 | 14 | 156 | 843 | 8 | 148 | 811 |
| adventure-7.1 | 14 | 168 | 1,048 | 1 | 167 | 1,044 |
| adventure-7.2 | 14 | 168 | 1,061 | 1 | 167 | 1,058 |
| adventure-8.1 | 14 | 168 | 1,042 | 3 | 165 | 1,027 |
| adventure-8.2 | 14 | 168 | 1,165 | 0 | 168 | 1,165 |
| adventure-8.3 | 14 | 168 | 1,002 | 1 | 167 | 998 |
| adventure-9.1 | 14 | 168 | 1,087 | 0 | 168 | 1,087 |
| adventure-9.2 | 14 | 168 | 1,123 | 0 | 168 | 1,123 |
| adventure-9.3 | 14 | 168 | 1,103 | 1 | 167 | 1,099 |
| origins-1 | 14 | 148 | 670 | 51 | 97 | 442 |
| quest-5 | 14 | 168 | 1,067 | 1 | 167 | 1,065 |
| quest-6.1 | 14 | 168 | 1,039 | 2 | 166 | 1,031 |
| quest-6.2 | 14 | 168 | 1,015 | 1 | 167 | 1,011 |
| **Total** | **224** | **1,540** | **9,491** | **77** | **1,463** | **9,149** |

The total row holds the union of the 16 books. The per-book rows sum to 2,559 distinct words and 15,475 characters. The per-book rows also sum to 131 cached words and 2,428 new words. A word that two books share is made once, so the batch makes 1,463 clips and sends 10,612 characters.

**The bank folders, apart.** The 9 bank folders hold 1,550 distinct words (8,968 characters). 72 words already have a clip at the batch speed. 1,478 words need a new clip (10,129 characters sent).

The banks are not in the night plan of item 2 because the PM order names the books. The PM decides whether the banks follow the books.

| Bank | Packages | Distinct words | Word characters | Already cached | New words |
|---|---:|---:|---:|---:|---:|
| bank-1 | 36 | 247 | 1,250 | 49 | 198 |
| bank-2 | 24 | 207 | 1,057 | 33 | 174 |
| bank-3 | 84 | 361 | 1,853 | 57 | 304 |
| bank-4 | 36 | 277 | 1,525 | 17 | 260 |
| bank-5 | 36 | 225 | 1,210 | 11 | 214 |
| bank-6 | 72 | 587 | 3,216 | 28 | 559 |
| bank-7 | 72 | 531 | 2,982 | 18 | 513 |
| bank-8 | 108 | 692 | 4,223 | 15 | 677 |
| bank-9 | 108 | 660 | 3,983 | 16 | 644 |
| **Total** | **576** | **1,550** | **8,968** | **72** | **1,478** |

The total row holds the union of the 9 banks. The per-book rows sum to 3,787 distinct words, 244 cached words and 3,543 new words. A word that two banks share is made once, so the banks need 1,478 clips and send 10,129 characters.

**The clip cache.** The lesson clip cache holds a clip for 1,530 of the 1,540 book words. The cache holds them at speed 0.75 with the bare word as the text. It holds a clip for all 1,550 bank words. The batch uses speed 0.9 with the word and a full stop, so it needs a different clip. The batch checks the cache before every call and never makes a cached clip again.

The "New characters" column holds the length of the words. The batch sends the word and a full stop, so it sends 10,612 characters for the 9,149 characters of the books.

**The voice.** `English_captivating_female1`, speed 0.9, model `speech-2.8-hd`. The same voice and speed as the 98 approved Storytime words and the 2026-10-27 test batch.

**The test batch.** The PM passed the 10-word test batch on 2026-10-27 at 21:05 ICT. It used the 10 words of `origins-2/l01.json`, sent 63 characters, and the recognizer read 10 of 10 words on take 1. The files are in `~/Desktop/asset-requests/2026-10-27/primary-word-audio-test/`. The 63 characters did not move the `general` pool, because the resolution is 1 % and another session used 4 % in the minute before. The cost per character is still unknown.

**The checks.** Every English clip passes the recognizer with a word error rate of at most 0.10. The clip is not silent. The peak level is at most -1.5 dBFS. The batch report goes to the PM before any clip enters use or Git.

**The files.** The clips go to `content/primary/<book>/media/<lesson>/tutor/` as `word-<index>-<hash>.mp3`, with the index and hash from `dashboard/lib/media/tutor-audio.ts`. The clip cache is `content/primary/<book>/media/<lesson>/.clips/`.

## 4. Item 3: Listening practice on the lesson QR codes

**The count.** 224 lessons in the 16 books. One practice a lesson.

**The measurement.** The script counts the lesson packages of the 16 books: 16 folders × 14 packages = 224. Each package has `meta.key`, the stable URL key that the QR code prints (for example `o2/1`).

**Default:** one practice a lesson. The practice alternates between "listen and point" and "listen and colour". The lessons alternate in order: lesson 1 is "listen and point", lesson 2 is "listen and colour", and so on.

**The estimate.** The instruction text for the two practices is an open input for the PM. A default estimate is 27 characters an instruction, so 224 × 27 = 6,048 characters.

**The pictures.** The practice needs its own pictures. The count of new pictures depends on the practice text, so this plan gives no picture number for item 3. The PM sends the practice text with the Monorepo answer on 10-30.

**The voice.** The teacher voice `English_captivating_female1`, speed 0.9. The instruction is short and repeated, so one clip can serve many lessons. Default: 2 instruction clips, one for each practice type, plus the word clips that the practice plays.

**The checks.** The English clip passes the recognizer. The clip is not silent. The QR code resolves to the lesson key.

**The files.** The practice data goes into the lesson package `activities` part. The QR code already prints `meta.key`.

## 5. Item 4: Two-voice dialogues for the Tutor pair-conversation phase

**The count.** 224 lessons in the 16 books. One dialogue a lesson.

**The measurement.** The same 224 packages. The Tutor phase is `PAIR_CONVERSATION` (phase 17) in `/home/daniebo/Desktop/tutor-advantage/apps/tutor-pwa/src/lib/lessonPhases.ts`.

**The estimate.** The script measured the article sentences of the 16 books: 8,424 sentences, 331,018 characters, an average of 39.3 characters a sentence. Default: 4 turns a dialogue, so 157 characters a dialogue and 224 × 157 = 35,168 characters.

**The voice.** Two voices: `English_captivating_female1` and `English_magnetic_voiced_man`. The dialogue text is an open input for the PM, because the Monorepo holds the pair-conversation prompts.

**The checks.** Every English clip passes the recognizer with a word error rate of at most 0.10. Each turn is a separate clip, so a bad turn can be made again without the other turns.

**The files.** `content/primary/<book>/media/<lesson>/tutor/` with the Tutor ids from `dashboard/lib/media/tutor-audio.ts`.

## 6. Item 5: Minimal-pair listening drills for Storytime phonics

**The count.** 38 candidate pairs. The method: among the 98 approved Storytime words, two words form a pair when they have the same length and exactly one letter differs. The script found 38 such pairs. Daniel's example "ox and axe" is a rhyme pair, not a letter pair, so the PM must confirm the final list.

**The measurement.** The 98 words come from `content/storytime/words/manifest.json`. The pair count comes from the same comparison over those 98 words.

**The estimate.** The 38 pairs use 30 distinct words. All 30 words already have a clip at the batch speed, because the Storytime run used the same voice, speed and text form. So a drill needs no new word clip. Default: 1 prompt clip a drill, 20 characters a prompt, so 38 drills send 760 characters. The 30 word clips hold 124 characters and are reused.

**The voice.** `English_captivating_female1`, speed 0.9. The same as the Storytime words.

**The checks.** Every English clip passes the recognizer. The Thai gloss for the Thai contrast weeks is Daniel's ear only. The Thai contrast weeks are Level 3 weeks 9, 17, 18, 29 and 31, and Level 4 week 23 (`docs/content-plans/storytime-workbook-content-design.md` §5, row 11).

**The files.** `content/storytime/words/` with the `wa-<word>` id form, and the drill list in the Storytime week data.

## 7. Item 6: How-to-play audio for the games

**The count.** 28 games. The count comes from the game registry of the Monorepo, `/home/daniebo/Desktop/reading-advantage-monorepo/packages/game-cartridges-3d/src/registry.ts`, which holds 28 game entries. All 28 have a manifest and a loader, so all 28 are playable.

**The open input.** The Monorepo sends the game texts through the PM. The number of characters is unknown until then. The 5 Tutor direction clips that exist now (`sd-flashcards`, `sd-pair-conversation`, `sd-sentence-game`, `sd-vocabulary-game`, `sd-wrap-up`) are the model for the form.

**The voice.** English for the game text, plus one Thai template that Daniel approves one time. The Thai voice is `Thai_male_1_sample8` at speed 1.0. The English voice is `English_captivating_female1` at speed 0.9.

**The checks.** The English clip passes the recognizer. The Thai clip is Daniel's ear only. The joined file plays English first, 1.2 seconds of silence, then Thai.

**The files.** The clip folder of the game, in the Monorepo. The PM sends the path with the game texts.

## 8. Item 7: The book tests and the level-test listening parts

**The count.** 32 book tests and 3 level-test listening forms. 84,030 speech characters. 226 pictures. 155 audio files.

**The source.** The design document `docs/content-plans/a25-book-tests-design.md` (version 0.1, 2026-10-27) holds these counts. This plan takes its counts and does not change that document.

**The catalogue.** The design document maps each of the 16 books to its folder. All 16 books hold 14 lessons in Workbooks now. The book tests are 16 × 2 = 32. The level tests cover Pre-A1, A1 and A2.

**The voice.** `English_captivating_female1` at speed 0.9 for the items. The passage uses speed 0.85. The Thai direction uses `Thai_male_1_sample8` at speed 1.0. Default: one voice keeps the programme consistent, and the step directions already carry Daniel's approval for `English_captivating_female1`.

**The order.** Item 7 comes first after the Storytime covers. It waits for the test design (due 10-31) and Daniel's test-template check.

**The checks.** The English clip passes the recognizer with a word error rate of at most 0.10. The clip is not silent. The peak level of the joined file is at most -1.5 dBFS. The loudness of each part is -18 LUFS. The inner silence is at most 1.2 s. The print check needs A4, margins Default or None, and Background graphics enabled in the print dialog.

**The secure part.** The Workbooks repository is public. The level-test items live only in the private place. The design document names the private place as a new private repository `advantage-assessment`, and Daniel approves the name and the repository.

**The files.** The private place holds `tests/book/<book>/<test>/` and `tests/level/<band>/`. This repository keeps the form document and the build tools.

**Daniel's check time.** 90 minutes, from design v0.3 section 7.5. The Thai direction template takes 15 minutes, once. One full book test for each band takes 25 minutes, so 75 minutes. The Thai of the 12 books that are not made yet is checked once with each book. That check adds no test check time. The full review of every test (1,520 minutes) stays an option only.

## 9. Item 10: One picture for each article that has none

**The count.** 0 of the 224 book packages lack a picture. 0 of the 576 bank packages lack a picture.

**The measurement.** The script checks the `images[]` entries of each package and the picture files in `content/primary/<book>/media/<lesson>/`. All 672 book image entries and all 1,728 bank image entries have their file on disk. The packages hold 3 pictures each: `hero`, `inline-para-2` and `inline-para-3`.

**The live-app gap.** The Monorepo holds the list of articles that have no picture in the live app. That answer is due 2026-10-30. This plan states no number for it.

**The style.** Printed-book style. The characters show hair and clothes only. No picture holds a letter, a word or a number. A style test of 10 pictures goes to Daniel's Drive through the PM before any volume.

**The checks.** The 10-picture style test passes. Each picture has one object or one person who does the action. The picture is at least 30 mm wide on an A4 page.

**The files.** `content/primary/<book>/media/<lesson>/` with the `file` field of the `images[]` entry.

## 10. Item 11: Simple object pictures for flashcards

**The count.** 836 distinct noun words in the 16 books. Their total length is 5,286 characters.

**The method.** Default: the glossary part of speech. The package holds `glossary[].pos`. A word counts as a picturable object when `pos` is `noun`. The measurement takes the lower case and trims the word. The upper bound is the 1,540 distinct words, because a verb or an adjective can also name a picture. The PM confirms the final list.

**The per-book table.**

| Book | Distinct words | Noun words | Noun characters |
|---|---:|---:|---:|
| adventure-7.1 | 168 | 81 | 507 |
| adventure-7.2 | 168 | 95 | 620 |
| adventure-8.1 | 168 | 76 | 491 |
| adventure-8.2 | 168 | 101 | 704 |
| adventure-8.3 | 168 | 63 | 368 |
| adventure-9.1 | 168 | 104 | 674 |
| adventure-9.2 | 168 | 85 | 567 |
| adventure-9.3 | 168 | 102 | 702 |
| origins-1 | 148 | 89 | 411 |
| origins-2 | 121 | 61 | 330 |
| origins-3.1 | 128 | 65 | 358 |
| origins-3.2 | 158 | 93 | 540 |
| quest-4 | 156 | 82 | 452 |
| quest-5 | 168 | 70 | 511 |
| quest-6.1 | 168 | 81 | 488 |
| quest-6.2 | 168 | 89 | 560 |
| **Total** | **1,540** | **836** | **5,286** |

The total row holds the union of the 16 books. The per-book rows sum to 1,337 noun words (8,283 characters). A noun that two books share needs one picture.

The bank folders hold 952 distinct noun words (5,697 characters). They are apart from the books.

**The estimate.** 836 pictures. 5 nights, cap 200 pictures a night. The picture list price is not supplied, so only the quota applies.

**The style.** Printed-book style. One object. No text in the picture. The characters show hair and clothes only.

**The checks.** The style test of 10 pictures passes first. Each picture has one clear name, because a Thai child may name the same object with another word.

**The files.** `content/primary/<book>/media/<lesson>/` with the `file` field of the `images[]` entry.

## 11. Item 12: Speaking-prompt pictures for Tutor pair work and the tests

**The count.** 224 lessons in the 16 books hold one speaking-prompt picture set each. The tests hold 226 pictures, from the design document.

**The measurement.** The 224 lessons come from the same count as item 3 and item 4. The 226 test pictures come from the design document.

**The style.** Printed-book style. The characters show hair and clothes only. A pair-conversation picture gives two people something to talk about. A find-the-differences picture holds two scenes with small changes.

**The estimate.** 224 pictures for the lessons and 226 for the tests. 3 nights, cap 150 pictures a night.

**The checks.** The style test of 10 pictures passes first. The picture is at least 30 mm wide on an A4 page.

**The files.** `content/primary/<book>/media/<lesson>/` for the lessons. The private place holds the test pictures.

## 12. The per-book table

All 16 books and all 9 bank folders. The script read each folder on 2026-10-27.

| Folder | Packages | Article audio | Word audio | Timings | Picture | Git media | Disk media | Disk only | Clip cache |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| adventure-7.1 | 14 | 14 | 14 | 14 | 14 | 84 | 6,738 | 6,654 | 3,266 |
| adventure-7.2 | 14 | 14 | 14 | 14 | 14 | 84 | 6,676 | 6,592 | 3,232 |
| adventure-8.1 | 14 | 14 | 14 | 14 | 14 | 84 | 7,553 | 7,469 | 3,689 |
| adventure-8.2 | 14 | 14 | 14 | 14 | 14 | 84 | 7,473 | 7,389 | 3,634 |
| adventure-8.3 | 14 | 14 | 14 | 14 | 14 | 84 | 7,597 | 7,513 | 3,714 |
| adventure-9.1 | 14 | 14 | 14 | 14 | 14 | 85 | 7,905 | 7,820 | 3,868 |
| adventure-9.2 | 14 | 14 | 14 | 14 | 14 | 84 | 7,875 | 7,791 | 3,848 |
| adventure-9.3 | 14 | 14 | 14 | 14 | 14 | 84 | 8,082 | 7,998 | 3,942 |
| origins-1 | 14 | 14 | 14 | 14 | 14 | 84 | 3,509 | 3,425 | 1,604 |
| origins-2 | 14 | 14 | 14 | 14 | 14 | 84 | 4,223 | 4,139 | 1,884 |
| origins-3.1 | 14 | 14 | 14 | 14 | 14 | 84 | 4,364 | 4,280 | 1,989 |
| origins-3.2 | 14 | 14 | 14 | 14 | 14 | 84 | 4,535 | 4,451 | 2,124 |
| quest-4 | 14 | 14 | 14 | 14 | 14 | 84 | 5,223 | 5,139 | 2,534 |
| quest-5 | 14 | 14 | 14 | 14 | 14 | 84 | 5,794 | 5,710 | 2,791 |
| quest-6.1 | 14 | 14 | 14 | 14 | 14 | 84 | 6,176 | 6,092 | 2,979 |
| quest-6.2 | 14 | 14 | 14 | 14 | 14 | 84 | 5,966 | 5,882 | 2,869 |
| **Books total** | **224** | **224** | **224** | **224** | **224** | **1,345** | **99,689** | **98,344** | **47,967** |
| bank-1 | 36 | 36 | 36 | 36 | 36 | 221 | 1,568 | 1,347 | 1,235 |
| bank-2 | 24 | 24 | 24 | 24 | 24 | 144 | 1,180 | 1,036 | 964 |
| bank-3 | 84 | 84 | 84 | 84 | 84 | 532 | 4,227 | 3,695 | 3,443 |
| bank-4 | 36 | 36 | 36 | 36 | 36 | 216 | 1,811 | 1,595 | 1,487 |
| bank-5 | 36 | 36 | 36 | 36 | 36 | 216 | 1,901 | 1,685 | 1,577 |
| bank-6 | 72 | 72 | 72 | 72 | 72 | 432 | 3,965 | 3,533 | 3,305 |
| bank-7 | 72 | 72 | 72 | 72 | 72 | 432 | 4,186 | 3,754 | 3,522 |
| bank-8 | 108 | 108 | 108 | 108 | 108 | 648 | 6,564 | 5,916 | 5,578 |
| bank-9 | 108 | 108 | 108 | 108 | 108 | 648 | 6,605 | 5,957 | 5,614 |
| **Banks total** | **576** | **576** | **576** | **576** | **576** | **3,489** | **32,007** | **28,518** | **26,725** |
| **All folders** | **800** | **800** | **800** | **800** | **800** | **4,834** | **131,696** | **126,862** | **74,692** |

**The Git correction.** Version 0.1 of this plan said that the media files are outside Git. That was wrong. Git tracks 4,834 media files: 1,345 in the books and 3,489 in the banks.

The tracked files are the 6 files a lesson holds: `article.mp3`, `words.mp3`, `sentences.mp3`, `hero.jpg`, `inline-para-2.jpg` and `inline-para-3.jpg`. That is 4,800 files. Another 34 `.raw.jpg` files are tracked.

The other 126,862 media files exist only on disk. They are the `tutor/` clips, the `candidates/` pictures, the `.clips/` cache and the `samples/` folder.

**The article characters.** The 16 books hold 339,218 characters of paragraph text. The 9 bank folders hold 803,354 characters.

## 13. The night plan for item 2

The PM's go of 2026-10-27 at 21:05 ICT sets these rules:

1. Night only, after 22:00 ICT.
2. Cap 500 words a night.
3. Stop when the MiniMax 5-hour window passes 70 % used, or `ra-quota` shows MiniMax WAIT.
4. Keep the clip cache and never make a cached clip again.
5. A larger first night calibrates the pool cost per character.
6. Nothing goes into use or Git before the batch report goes to the PM.

The books come in the PM order: Origins 2, Origins 3.1, Origins 3.2, Quest 4, then the rest. A night holds up to 500 words and continues into the next book. A word that two books share is made once.

| Night | Date | Books | Words | Characters sent | Notes |
|---:|---|---|---:|---:|---|
| 1 | 2026-10-27 | origins-2, origins-3.1, origins-3.2, quest-4, adventure-7.1 | 500 | 3,379 | The test batch ran before this night at 21:05. This night calibrates the pool cost per character. |
| 2 | 2026-10-28 | adventure-7.1, adventure-7.2, adventure-8.1, adventure-8.2, adventure-8.3 | 500 | 3,747 | |
| 3 | 2026-10-29 | adventure-8.3, adventure-9.1, adventure-9.2, adventure-9.3, origins-1, quest-5, quest-6.1, quest-6.2 | 463 | 3,486 | |
| **Total** | | **16 books** | **1,463** | **10,612** | |

Night 1 and night 2 both hold the full cap of 500 words. Night 3 holds the remaining 463 words.

**The rules for each night.** Read `mmx quota show --output json` and `ra-quota status` before the night. Stop when the 5-hour window passes 70 % used or `ra-quota` shows MiniMax WAIT. Run the batch in one shell command, so that no model turn comes between the two quota reads. Keep the clip cache. Write the batch report to the PM before any clip enters use or Git.

**The banks.** Default: the banks follow the books. The 9 bank folders hold 1,478 new words (10,129 characters sent). At the cap of 500 words a night, that is 3 more nights.

| Night | Books | Words | Characters sent |
|---:|---|---:|---:|
| 4 | bank-1, bank-2, bank-3, bank-4 | 500 | 3,222 |
| 5 | bank-4, bank-5, bank-6, bank-7 | 500 | 3,364 |
| 6 | bank-7, bank-8, bank-9 | 478 | 3,543 |
| **Total** | **9 banks** | **1,478** | **10,129** |

The PM decides the dates of nights 4 to 6.

## 14. The schedule

| Date | What | Owner | MiniMax batch |
|---|---|---|---|
| 2026-10-27 | The 10-word test batch passed at 21:05 ICT. 63 characters, 10 of 10 words read on take 1. | Workbooks | Done |
| 2026-10-27 | Night 1 of item 2 (500 words, 5 books). | Workbooks | 3,379 characters |
| 2026-10-28 | The plan version 1 and the Monorepo answers are due. The answers give the live-app gap for item 1 and item 10. | Monorepo, PM | No |
| 2026-10-28 | Night 2 of item 2 (500 words, 5 books). | Workbooks | 3,747 characters |
| 2026-10-29 | Night 3 of item 2 (463 words, 8 books). | Workbooks | 3,486 characters |
| 2026-10-31 | The test design is due. | PM | No |
| 2026-11-01 | The Storytime covers go to Drive. The covers need no MiniMax batch. | Workbooks | No |
| 2026-11-01 | Daniel checks the test template. Item 7 starts after this check. | Daniel | No |
| 2026-11-02 onward | The item 7 batches run at night, before item 1, item 3, item 4, item 5, item 6, item 10, item 11 and item 12. Item 2 runs on nights 1 to 3. | Workbooks | 84,030 characters |
| 2026-11-02 onward | The item 4 batches run at night (9 nights, cap 25 dialogues a night). | Workbooks | 35,168 characters |
| 2026-11-02 onward | The item 11 batches run at night (5 nights, cap 200 pictures a night). | Workbooks | 836 pictures |
| 2026-11-02 onward | The item 12 batches run at night (3 nights, cap 150 pictures a night). | Workbooks | 450 pictures |
| 2026-11-02 onward | The item 3, item 5, item 6 and item 10 batches run when their inputs arrive. | Workbooks, PM | 6,048 characters, 760 characters, 29 clips |

## 15. The checks

| Check | Rule | Source |
|---|---|---|
| The English clip passes the recognizer | Word error rate at most 0.10 | The step directions build |
| The clip is not silent | True | `manifest-tutor.json` `checks.not_silent` |
| The peak level of a joined file | At most -1.5 dBFS | `manifest.json` `build.part_level` |
| The loudness of each part | -18 LUFS | Same |
| The inner silence | At most 1.2 s | `manifest-tutor.json` `checks.max_inner_silence_s` |
| The shift rate | At most 0.35 s a character | Same |
| The Thai clip | Daniel's ear only | Daniel, 2026-10-27 |
| The picture style test | 10 pictures go to Daniel's Drive before any volume | The PM's rules |
| The batch report | Goes to the PM before any clip enters use or Git | The PM, 2026-10-27 |
| The print check | A4; margins Default or None; Background graphics enabled | `content/primary/README.md` |

## 16. The open inputs

| # | Open input | Default | Owner | Due |
|---|---|---|---|---|
| 1 | The live-app articles that have no audio | The Workbooks count is 0; the live-app count is not yet known. | Monorepo, PM | 2026-10-30 |
| 2 | The live-app articles that have no picture | The Workbooks count is 0; the live-app count is not yet known. | Monorepo, PM | 2026-10-30 |
| 3 | The two listening-practice instruction texts | One practice a lesson, alternating "listen and point" and "listen and colour" | PM | 2026-10-30 |
| 4 | The pair-conversation dialogue text | 4 turns a dialogue, 157 characters a dialogue | PM | 2026-10-30 |
| 5 | The final minimal-pair list for item 5 | 38 candidate pairs from the 98 approved Storytime words | PM | 2026-10-30 |
| 6 | The game how-to-play texts | 28 games from the Monorepo registry | Monorepo, PM | 2026-10-30 |
| 7 | Whether the bank folders follow the books in the item 2 night plan | The banks follow the books, 3 more nights | PM | 2026-10-30 |
| 8 | The private place for the test items | A new private repository named `advantage-assessment` | Daniel | Before the first book test |
| 9 | The picture list price | Not supplied; only the quota applies | PM | Not set |

## 17. The defaults

Every default below is a choice this plan made where the brief left the choice open.

1. **Default:** one listening practice a lesson, alternating "listen and point" and "listen and colour".
2. **Default:** 4 turns a dialogue for item 4, so 157 characters a dialogue.
3. **Default:** the item 5 pair method is one differing letter between two words of the same length.
4. **Default:** a picturable object for item 11 is a glossary word whose part of speech is `noun`.
5. **Default:** the item 2 night plan follows the PM book order, and a word that two books share is made once.
6. **Default:** the bank folders follow the books in the item 2 night plan.
7. **Default:** the item 7 items use `English_captivating_female1` at speed 0.9, and the passage uses speed 0.85.
8. **Default:** the item 3 instruction is 27 characters, so 6,048 characters.
9. **Default:** the item 6 Thai template is one template that Daniel approves one time.
10. **Default:** the picture batches run at night with the caps in the summary table.
11. **Default:** the Daniel check minutes for items 2, 3, 4, 5, 6, 11 and 12 are estimates. Item 7 uses the 90 minutes of design v0.3 section 7.5.
12. **Default:** the item 2 batch speed is 0.9 with the word and a full stop. This is the spec of the test batch and of the 98 Storytime words. The lesson clip cache holds the words at speed 0.75, so those clips are a different clip.

## 18. The known limits

1. The live-app counts for item 1 and item 10 are not known. The Monorepo answers arrive on 10-30.
2. The item 3, item 4 and item 6 character counts rest on defaults. The real counts arrive with the Monorepo answers.
3. The item 5 count of 38 is a candidate list. Daniel's "ox and axe" is a rhyme pair, so the final list differs.
4. The item 11 count of 836 counts nouns. The upper bound is 1,540 words.
5. The picture list price is not supplied. Only the quota applies for pictures.
6. The cost per character of the speech is still unknown. The 63 characters of the test batch did not move the `general` pool, because the resolution is 1 %.

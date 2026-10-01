# Primary database field map (lesson package → app)

Version 1.3 | Date 2026-10-01 | Status: Draft | Owner: Daniel Bo | Internal

Track: `measure/tracks/primary_injector_20261001`. Sources: `../primary-advantage/prisma/schema.prisma`, `types/index.d.ts`, `lib/storage-config.ts`, the generators in `server/utils/genaretors/`, `reading-advantage-monorepo/packages/db/src/schema/{content,questions,primary}.ts`, and `tutor-advantage/services/learning-service/src/services/PrimaryAdvantageDB.ts`.

**Status:** this map comes from the code. A read-only sample of the 27 Origins 2 and 3.1 articles (`scripts/sample-legacy.ts`, 2026-10-01) confirmed the JSON shapes, the paragraph separator, and the level pairs.

## Where things are

| Item | Value |
|---|---|
| Legacy database | Cloud SQL instance `reading-advantage:asia-southeast1:cloud-sql`, database `primary_advantage`. The app runs on Cloud Run in project `primary-advantage` (service `primary-advantage-app`); its URL is the `DATABASE_URL` secret in that project. |
| Bucket | `primary-app-storage` (`STORAGE_BUCKET_NAME`), public URLs `https://storage.googleapis.com/primary-app-storage/<path>` |
| Readers | The app (legacy now, monorepo after the cutover), the ETL, and Tutor (`PrimaryAdvantageDB.ts`: `article`, `multiple_choice_questions`, `short_answer_questions`, `sentencs_and_words_for_flashcard`) |

## `article` (legacy, Prisma)

| Column | From the package | Rule |
|---|---|---|
| `id` | `db.legacy.articleId` | New cuid on the first insert; written back to the package |
| `title` | `meta.title` | |
| `summary` | `text.summary` | |
| `passage` | `text.paragraphs` | Joined with a blank line (`\n\n`). An existing passage that differs only in spaces and line breaks stays: 3 app articles break lines inside a paragraph, and the app shows them (`whitespace-pre-wrap`) |
| `type` | `meta.appType` | `fiction` or `nonfiction`; default `fiction` |
| `genre` | `meta.genre` | |
| `sub_genre` | — | `null` |
| `image_description` | `images[0].prompt` | The hero prompt |
| `cefr_level` | `meta.cefrLevel` | Must agree with `ra_level` by the app's `convertCefrLevel` table (A0− 1 … B2+ 15) |
| `ra_level` | `meta.raLevel` | |
| `rating` | — | `5` (Daniel approved the lesson; the app does not filter on it) |
| `audio_url` | `audio.article` | `/audios/articles/<id>.mp3` |
| `audio_word_url` | `audio.words` | `/audios/words/<id>.mp3` |
| `sentences` | `audio.sentences` | `SentenceTimepoint[]`: `{ sentence, startTime, endTime, words: { word, start, end }[] }`. Word times are estimated by word length inside each sentence (mmx gives no word times; the reading tasks highlight the word under the play head) |
| `words` | — | `null`. No production article has it (0 of 560); the app reads the vocabulary from `sentencs_and_words_for_flashcard.words` |
| `translated_passage` | `thai.paragraphs`, `locales` | `{ th, cn, tw, vi }`, one string per sentence in `sentences` order for each language. `cn`, `tw`, and `vi`: the old translation of the same sentence (`locales`, matched on lower-case letters and digits); English fills a gap. Never an empty string: the reading view shows `translatedPassage[locale][i] \|\| ""` |
| `translated_summary` | `thai.summary`, `locales` | `{ th, cn, tw, vi }`. `cn`, `tw`, and `vi`: the old summary, else the English summary. Never an empty string: the app uses `translatedSummary[locale] ?? summary`, and `??` keeps `""` |
| `author_id` | — | `""` (the app's own create uses `""`) |
| `is_published`, `is_approved` | `approval.lesson` | `true` |
| `is_draft` | — | `false` |
| `validation_status` | — | `OK`, `validated_at` = now, so the app's repair job leaves the row alone |
| `topic`, `brainstorming`, `planning` | — | `null` |

## Question tables (legacy)

| Table | Columns | From the package |
|---|---|---|
| `multiple_choice_questions` | `id`, `question`, `options text[]` (4), `answer`, `"textualEvidence"`, `article_id` | `bank.mcq[]`; ids in `db.legacy.mcq` |
| `short_answer_questions` | `id`, `question`, `answer`, `article_id` | `bank.saq[]`; ids in `db.legacy.saq` |
| `long_answer_questions` | `id`, `question`, `article_id` | `bank.laq[]`; ids in `db.legacy.laq` |

Prisma left the camelCase names `textualEvidence`, `createdAt`, and `updatedAt` unmapped on these tables, so SQL must quote them.

The package replaces the article's question rows (Q-ORF-01, Daniel 2026-10-01): rows of the article that the package does not have are deleted in the same transaction. No other row points at a question id; student activity points at the article id. The app picks 5 random MCQs from all rows of an article, so old and new rows would mix.

## `sentencs_and_words_for_flashcard` (legacy; Tutor reads it)

| Column | Rule |
|---|---|
| `sentence` | `{ sentence, translation: { th, cn, tw, vi }, timeSeconds }[]`: 3 to 5 sentences, the ones with the most glossed words. `cn`, `tw`, `vi` as in `translated_passage` |
| `audio_sentences_url` | `audios/sentences/<id>.mp3`, joined from the cached article clips (no new TTS) |
| `words` | `{ vocabulary, definition: { en, th, cn, tw, vi }, timeSeconds }[]`, the same list as `article.words`. `cn`, `tw`, `vi`: the old definition of the same word (`locales`), else the English definition |
| `words_url` | `audios/words/<id>.mp3` (the same file as `audio_word_url`) |

One row per article: a second row of the article is deleted in the same transaction (the app reads the first one it finds).

## Bucket objects

| Path | From |
|---|---|
| `images/<id>_1.png`, `_2.png`, `_3.png` | `images[]` in paragraph order (`hero` → 1, `inline-para-2` → 2, `inline-para-3` → 3), converted from JPEG to PNG. The app shows image n above paragraph group n |
| `audios/articles/<id>.mp3` | `audio.article` |
| `audios/words/<id>.mp3` | `audio.words` |
| `audios/sentences/<id>.mp3` | the flashcard sentences |

Before the upload for an existing article, the old objects go to `backup/<yyyymmdd-hhmmss>/<path>` in the same bucket (Tutor's old `manifest.json` too, in `tutor_advantage_bucket`).

## Tutor Advantage clips (bucket `tutor_advantage_bucket`)

Tutor plays one mp3 for each sentence, word, question, and option. It finds them through `articles/<id>/manifest.json` (version 1); without a manifest it points at files that do not exist. The ids copy `tutor-advantage/scripts/generate-article-tts.mjs` (`lib/media/tutor-audio.ts`), so Tutor's own generator skips the files we upload.

| Path | From |
|---|---|
| `articles/<id>/sentences/sentence-NNN-<sha1>.mp3` | each article sentence, in order (narrator voice) |
| `articles/<id>/words/word-NNN-<sha1>.mp3` | the glossary words (`words`, Tutor's vocabulary step), then every other story word (`sentenceWords`, for the sentence games) |
| `articles/<id>/questions/<mcq\|saq>-NNN-<sha1>[-optionN-<sha1>].mp3` | the MCQs in bank order with their options, then the SAQs |
| `articles/<id>/manifest.json` | uploaded last, with `no-cache` |

Tutor matches the questions by index to `SELECT … WHERE article_id = $1` with no `ORDER BY`; the injector writes them in bank order, and the new ids sort in that order.

## New schema (monorepo, after the cutover)

`articles` keeps the Prisma columns (`passage`, `translated_*`, `sentences`, `words`, `audio_*`, `ra_level`, `cefr_level`, `is_published`, …) plus `content` (text, not null: the passage), `level`, `published`. `multiple_choice_questions` adds `correct_answer` (index into `options`, jsonb) and `order`; `short_answer_questions` adds `sample_answer` and `order`. IDs are uuid; `legacy_id_map` links them to the cuids. `--target new` writes these after the cutover.

## Open items

1. Done (2026-10-01): the paragraph separator is `\n\n`; `sentences[]` is `{ sentence, startTime, endTime, words: { word, start, end }[] }`; the flashcard row is as above; the 27 articles are `fiction` with the app's genre names; the level pairs are `ra_level` 2 = A0 and 3 = A0+.
2. Decided again (Daniel, 2026-10-01): keep the old `cn`, `tw`, and `vi`, matched by sentence. The first decision ("Thai only", empty values) came from a wrong statement: the app does not show English for an empty string. A printed lesson copies its old values into the package (`locales`, `scripts/fetch-legacy-locales.ts`) before its first injection, and the injector refuses it without the copy. English fills each gap and a new lesson (E12) has English only.

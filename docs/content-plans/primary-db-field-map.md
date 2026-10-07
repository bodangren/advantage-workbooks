# Primary database field map (lesson package → app)

Version 1.4 | Date 2026-10-06 | Status: Draft | Owner: Daniel Bo | Internal

Track: `measure/tracks/primary_injector_20261001`. Sources: `../primary-advantage/prisma/schema.prisma`, `types/index.d.ts`, `lib/storage-config.ts`, the generators in `server/utils/genaretors/`, `reading-advantage-monorepo/packages/db/src/schema/{content,questions,primary}.ts`, and `tutor-advantage/services/learning-service/src/services/PrimaryAdvantageDB.ts`.

**Status:** this map comes from the code. A read-only sample of the 27 Origins 2 and 3.1 articles (`scripts/sample-legacy.ts`, 2026-10-01) confirmed the JSON shapes, the paragraph separator, and the level pairs.

## Where things are

| Item | Value |
|---|---|
| Legacy database | Cloud SQL instance `reading-advantage:asia-southeast1:cloud-sql`, database `primary_advantage`. The app runs on Cloud Run in project `primary-advantage` (service `primary-advantage-app`); its URL is the `DATABASE_URL` secret in that project. |
| Bucket | `primary-app-storage` (`STORAGE_BUCKET_NAME`), public URLs `https://storage.googleapis.com/primary-app-storage/<path>` |
| Readers | The app (legacy now, monorepo after the cutover), the ETL, and Tutor (`PrimaryAdvantageDB.ts`: `article`, `multiple_choice_questions`, `short_answer_questions`, `sentencs_and_words_for_flashcard`) |

## Production load and local copy (method of 2026-10-06)

Daniel runs these commands in his own terminal. An agent does not read the secret and does not start the proxy. An agent writes the packages, gives the commands, and checks the results.

1. Start the Cloud SQL proxy, and keep it open:

   ```
   cloud-sql-proxy --gcloud-auth --address 127.0.0.1 --port 5433 reading-advantage:asia-southeast1:cloud-sql
   ```

2. Run the injector. The URL comes from the `DATABASE_URL` secret, and `proxy-url.js` changes its host to the proxy. No step prints the URL.

   ```
   cd ~/Desktop/Workbooks/dashboard
   LEGACY_DATABASE_URL="$(gcloud secrets versions access latest --secret=DATABASE_URL --project=primary-advantage | node scripts/db/proxy-url.js)" npx tsx scripts/inject-lessons.ts ../content/primary/<book>/*.json
   ```

   The injector makes a Cloud SQL backup first. It then writes the lessons one at a time and writes `db.legacy` back into each package. A lesson with no change shows "(unchanged)", so a second run continues where the first run stopped. A workbook lesson takes about 5 to 8 minutes (bucket backup, upload, and Tutor clips).

3. After the load, copy production into a new local database for the ETL and the graphs work:

   ```
   bash ~/Desktop/Workbooks/dashboard/scripts/db/copy-legacy-db.sh primary_legacy_<YYYYMMDD>
   ```

   The copy goes into the `reading-advantage-postgres` container (port 5432). It does not change `primary_advantage` (the monorepo database) or an older copy. Tell the monorepo and graphs sessions the new name.

   If the VPN tunnel breaks the dump (2026-10-07: "server closed the connection unexpectedly" three times), use a Cloud SQL export to the private `backupsqldatabase` bucket. The export runs on the server in a few seconds, and `gcloud storage cp` continues a broken download. The `\restrict` lines of pg_dump 17.11 are unknown to the local psql 16, so `sed` removes them:

   ```
   N=primary_legacy_<YYYYMMDD>; F=$HOME/$N.sql.gz
   gcloud sql export sql cloud-sql gs://backupsqldatabase/Copy_$N.sql.gz --database=primary_advantage --project=reading-advantage
   gcloud storage cp gs://backupsqldatabase/Copy_$N.sql.gz "$F" && gzip -t "$F"
   podman exec reading-advantage-postgres createdb -U postgres $N
   zcat "$F" | sed -E '/^\\(un)?restrict /d' | podman exec -i reading-advantage-postgres psql -q -U postgres -d $N > /tmp/copy-$N.log 2>&1; grep -c ERROR /tmp/copy-$N.log; rm -f "$F"
   ```

   One ERROR line (`transaction_timeout`) is normal.

4. Commit the packages (they now hold the `db.legacy` ids and `inject-log.jsonl`), and export `content/primary/tags.json` again.

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

Command: `inject-lessons.ts --target new` (the default database variable is `NEW_DATABASE_URL`). Code: `dashboard/lib/inject/new-db.ts`. Sources: `packages/db/src/schema/{content,questions,primary}.ts` in `reading-advantage-monorepo`, and the migrations `0060_primary_legacy_id_map.sql` and `0061_tutor_compat_views.sql`. Those two migrations exist only in the worktree `~/Desktop/rama-worktrees/integration` (checked 2026-10-06); the master checkout has no id map yet.

The new target uses the same text rules as the legacy target (passage, translations, word times, flashcard sentences, `\n\n` separator, English fill for `cn`, `tw`, and `vi`). This section lists only the column names and the differences.

### Ids and the update-or-insert rule

All ids are `uuid` (`crypto.randomUUID`). `primary_legacy_id_map (table_name, legacy_id, new_id)` links a legacy cuid to its uuid. The column `table_name` holds the legacy table name: `article`, `multiple_choice_questions`, `short_answer_questions`, `long_answer_questions`, or `sentencs_and_words_for_flashcard`.

| Case | Action |
|---|---|
| The package has `db.new` ids (an earlier new-database run) | UPDATE those rows |
| The package has `db.legacy` ids, or names a printed or replaced article, and the map knows them | UPDATE the rows with the uuids from the map. The cutover ETL moved them. |
| The article has a legacy id and the map does not know it | The run stops. An insert would give the printed QR code a second article. |
| A question or flashcard row has no legacy id, or the map does not know it | INSERT with a new uuid |
| A new lesson | INSERT every row with a new uuid |

The package replaces the article's question rows (Q-ORF-01), as in the legacy target. Rows of the article that the package does not have are deleted in the same transaction. A flashcard row of the article that the package does not have is deleted too. The map keeps entries for deleted rows; they do no harm.

The run step reads the map with one SELECT. A dry run reads no database: a legacy id shows as `<uuid of ...>`. The ids go into `db.new` after a real run.

### Bucket key and picture key

The bucket key of an article is its legacy cuid when it has one, else its uuid. This is the plan of the monorepo side; it is not final. The bucket objects use the key: `images/<key>_<n>.png`, `audios/articles/<key>.mp3`, `audios/words/<key>.mp3`, `audios/sentences/<key>.mp3`. The Tutor clips use the key too (`articles/<key>/manifest.json`), because `tutor_compat.article.id` is `coalesce(legacy_id, id::text)`. The injector writes the key to `articles.image` (a nullable `text` column that exists in the shared schema).

### `articles`

| Column | From the package | Rule |
|---|---|---|
| `id` | plan | uuid |
| `title` | `meta.title` | |
| `content` | `text.paragraphs` | NOT NULL. The same text as `passage`. |
| `summary` | `text.summary` | |
| `level` | `meta.raLevel` | The same value as `ra_level` |
| `cefr_level` | `meta.cefrLevel` | Must agree with `ra_level` (the legacy level table) |
| `image` | bucket key | See above |
| `published` | — | `true` |
| `type`, `genre` | `meta.appType`, `meta.genre` | As in the legacy target |
| `sub_genre` | — | `null` |
| `passage` | `text.paragraphs` | Joined with `\n\n`. An existing passage that differs only in spaces and line breaks stays (the same rule as the legacy target; `content` too). |
| `translated_summary`, `translated_passage` | `thai`, `locales` | jsonb `{ th, cn, tw, vi }`, as in the legacy target |
| `image_description` | `images[0].prompt` | |
| `ra_level` | `meta.raLevel` | integer |
| `rating` | — | `5` |
| `audio_url`, `audio_word_url` | `audio.article`, `audio.words` | `/audios/articles/<key>.mp3`, `/audios/words/<key>.mp3` |
| `sentences` | `audio.sentences` | The sentence timing: `{ sentence, startTime, endTime, words: { word, start, end }[] }[]` |
| `words` | — | `null` (SQL null) |
| `is_approved`, `is_published` | `approval.lesson` | `true` |
| `is_draft` | — | `false` |
| `updated_at` | — | The run time. `created_at` has a database default. |

The injector does not write these columns:

- `author_id`: it is a foreign key to `users.id`, so the legacy value `''` would fail.
- `is_public`: default `false`. Its use in the new app is unknown.
- `topic`, `brainstorming`, `planning`: `null`.
- `validation_status` and `validated_at`: the new table does not have them.

### Questions and flashcard rows

| Table | Columns | From the package |
|---|---|---|
| `multiple_choice_questions` | `id`, `article_id`, `question`, `options` (jsonb array of 4), `correct_answer` (integer), `answer`, `textual_evidence`, `order`, `updated_at` | `bank.mcq[]`. `correct_answer` is the index of `answer` in `options` (the run stops when it is not there). `order` is the position in the bank, from 0. `textual_evidence` is `evidence`. |
| `short_answer_questions` | `id`, `article_id`, `question`, `sample_answer`, `answer`, `order`, `updated_at` | `bank.saq[]`. `sample_answer` and `answer` both hold `answer`. `order` is the position in the bank, from 0. |
| `long_answer_questions` | `id`, `article_id`, `question`, `updated_at` | `bank.laq[]`. The table has no `order` column. |
| `sentencs_and_words_for_flashcard` | `id`, `article_id`, `sentence` (jsonb), `audio_sentences_url`, `words` (jsonb), `words_url`, `updated_at` | As in the legacy target, with `audios/sentences/<key>.mp3` and `audios/words/<key>.mp3` |

The new tables use snake_case names (`textual_evidence`, `updated_at`), so SQL needs no special quoting. The injector does not write `explanation`, `rubric`, or `chapter_id`.

### Safety

- Cloud SQL backup first (`--backup-instance`, `--backup-project`), then the media, then one transaction per lesson, then the verify step.
- The content hash is in `db.new.contentHash`. An unchanged lesson is skipped unless `--force` is set.
- The log line in `content/primary/<book>/inject-log.jsonl` has `target: 'new'`.
- The verify step compares every column the injector writes, and lists rows of the article that the package does not have.

## Open items

1. Done (2026-10-01): the paragraph separator is `\n\n`; `sentences[]` is `{ sentence, startTime, endTime, words: { word, start, end }[] }`; the flashcard row is as above; the 27 articles are `fiction` with the app's genre names; the level pairs are `ra_level` 2 = A0 and 3 = A0+.
2. Decided again (Daniel, 2026-10-01): keep the old `cn`, `tw`, and `vi`, matched by sentence. The first decision ("Thai only", empty values) came from a wrong statement: the app does not show English for an empty string. A printed lesson copies its old values into the package (`locales`, `scripts/fetch-legacy-locales.ts`) before its first injection, and the injector refuses it without the copy. English fills each gap and a new lesson (E12) has English only.
3. Open for the monorepo side (2026-10-06), from the new target:
   - Answered (monorepo master f6dcaa243, 2026-10-06): the ETL keeps the legacy cuid in `articles.image` (spec D10), the same key that the injector writes.
   - The ETL (A6) exists (f6dcaa243, `pnpm --filter @reading-advantage/db legacy-import`). It reads the legacy copy `primary_legacy_20261006` and fills `primary_legacy_id_map`. Agreed order (2026-10-06): the injector writes only the legacy database until the cutover; the ETL moves those rows. Still open: the rule for an article that the injector writes to the new database after the cutover.
   - `packages/domain/src/primary-books/import.ts` (`importLessonPackage`) also inserts a new article for an approved workbook package with no legacy article. The injector would insert a second one. Choose one writer, or let the importer link to the injector's article.
   - Answered (f6dcaa243): the ETL writes `table_name` `article`, `multiple_choice_questions`, `short_answer_questions`, `long_answer_questions`, and `sentencs_and_words_for_flashcard`, the same as `MAP_TABLES` in `lib/inject/new-db.ts`. Check that the importer uses `article` too.
   - The importer does not change an article that has a legacy id (Tutor reads it). The injector updates it. Confirm that an update is allowed.
   - `articles.author_id` is a foreign key to `users`, `is_public` has a default of `false`, and `sub_genre` and `topic` stay empty. Confirm that the app needs none of them.
   - The worktree `lane-h` has the tables `primary_article_objectives`, `primary_question_objectives`, and `primary_article_word_nodes` (`primary-mastery.ts`). The injector does not write them yet.
   - The injector deletes question rows that the package does not have. Student answers keep a text `question_id` with no foreign key, so they stay, but they point at a deleted row.


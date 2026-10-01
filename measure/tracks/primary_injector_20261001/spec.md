# Spec: Inject lesson packages into the Primary databases

Track: `primary_injector_20261001` | Type: feature | Date: 2026-10-01 | Source: Origins 3.2 plan v1.2 §8, task C10

## Why

Every workbook asset must be in the live Primary database now and in the cutover database later (Daniel, 2026-10-01). The app's admin tool is not used. Daniel authorized Claude to write to production, and `gcloud` is signed in (project `reading-advantage`, Cloud SQL instance `cloud-sql`).

## Step 0: field map (first task)

For each place where the app, the ETL, or Tutor reads article content, record the table, the column, the JSON shape, and the bucket path:

- Legacy (`../primary-advantage`, Prisma): `article` (with `sentences`, `words`, `translated_passage`, `translated_summary`, `audio_url`, `audio_word_url`, `image_description`, `cefr_level`, `ra_level`, `is_published`, `is_approved`, `validation_status`), `multiple_choice_questions` (with `textual_evidence`), `short_answer_questions`, `long_answer_questions`, `sentencs_and_words_for_flashcard`. Bucket: `images/<id>_<n>.png`, `audios/articles/<id>.mp3`, `audios/words/<id>.mp3`.
- New (`reading-advantage-monorepo/packages/db/src/schema/content.ts`, `questions.ts`), the ETL, `legacy_id_map`, and the `tutor_compat` views.
- Tutor's four queries (`tutor-advantage/services/learning-service/src/services/PrimaryAdvantageDB.ts`).

Output: `docs/content-plans/primary-db-field-map.md`. Each field that the package does not carry gets a rule: derive it, set a default, or add it to the package.

## Injector (`dashboard/scripts/inject-lessons.ts`)

- Flags: `--target legacy|new`, `--book`, `--lesson`, `--dry-run`.
- Only packages with `approval.lesson = approved`.
- Before a production write: `gcloud sql backups create --instance cloud-sql`, and wait for it. The run log records the backup ID.
- One transaction per lesson. If the package has an article ID for the target, the script updates the article and its question rows in place (question rows keep their IDs, which the package stores). If not, it inserts the rows and writes the new IDs back to the package.
- `gcloud storage cp` uploads the media to the app's bucket paths.
- `cefr_level` and `ra_level` come from `meta`; `is_published = true`.
- Run log: `content/primary/<book>/inject-log.jsonl`.
- Connection: the legacy `DATABASE_URL` from `../primary-advantage/.env.local`; the new one from the monorepo env. Never print these values.

## Verify (`dashboard/scripts/verify-lessons.ts --target legacy|new`)

Compares each package with the database rows and the bucket objects. Reports missing rows, changed text, and missing files. Runs after each injection, after each rehearsal, and after the cutover.

## Cutover

Before the cutover, the injector writes to the legacy database and the ETL copies the rows. No content writes on the cutover evening. After the cutover, `--target new` uses `legacy_id_map` to fill the new article ID, and the verify script runs.

## Could

Re-label the 13 Origins 3.1 articles from level 2 to level 3 (metadata only; plan §2).

## Out of scope

The ETL, the D1 stable-URL route, and Tutor's book records (Tutor spec T2–T4).

## Acceptance

- Tests against a local Postgres with the legacy schema (PGlite with the Prisma migrations): insert, second run (no duplicates), update in place, and verify with zero differences.
- E12 is in production; the verify script passes; the article opens in the app.

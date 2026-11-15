# Reading Advantage Workbooks

## Measure Workflow

Load the `measure` skill and read `measure/index.md` before starting work.

**Goal:** Generate printable English learning workbooks (CEFR A1-C1) from JSON content.
**Stack:** JSON + HTML/Handlebars + Paged.js (Layout) + Next.js (Dashboard).

## Documentation Standards

Use JSDoc for all exported functions. Describe params and returns without repeating TypeScript types.

## Codebase Graph

`repo-graph` is the executable; `build-graph` is the skill that documents it. Load the `build-graph` skill for commands, then invoke `repo-graph`.

`graph.db` is at the repo root. To rebuild it, run `repo-graph scan . ./graph.db`.

## Critical Agent Knowledge
* **Schema Truth:** `dashboard/lib/workbook-schema.ts` (Zod) is the definitive data structure.
* **Strict Validation:** The compiler fails on missing fields. Validate every JSON change.
* **PDF Generation:** In the Dashboard print dialog, enable "Background graphics". Set margins to "Default" or "None".
* **Layout Engine:** Paged.js handles print layout. Test every CSS print change in the browser print preview.
* **Memory Protocol:** Read and update `measure/tech-debt.md` and `measure/lessons-learned.md` in every track.
* **Test Items:** Secure test items, test papers, answer keys, and test audio go only into `~/Desktop/level-tests/`, never into a repository. This repository is public (Daniel, 2026-10-28).
* **Thai filter first:** A non-Claude model must not see Thai text. A non-Claude role that can touch a week file (`content/storytime/**/*.json`) makes its Thai filter its first command, before any read: one script that drops every `th` key and every string with a character from U+0E00 to U+0E7F, and proves 0 Thai characters in its output (PM rule, 2026-11-09).

## Connected Repositories

All repos are siblings under `~/Desktop/`. Workbooks is the source of truth for Primary Advantage lesson content: Claude writes and checks every asset here, and the other systems receive copies. Do not create content through the Primary app's admin generator.

| Repo | What Workbooks uses or feeds | Key paths |
|---|---|---|
| `../mastery-advantage` | Vocabulary graph for the text check (`--graph`, `MASTERY_VOCAB_GRAPH`); Cambridge YLE lists incl. the Starters **name list** (capitalized headwords, exam `pre-a1-starters`); GSE-to-level map | `english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json`, `english/cefr-vocabulary/data/cambridge-vocabulary-inventory.json`, `english/gse-to-primary-advantage.csv` |
| `../primary-advantage` | **Legacy Primary app. The new build replaced it at the cutover on 2026-10-20.** Prisma, `cuid` IDs. Article rows: `article`, `multiple_choice_questions`, `short_answer_questions`, `long_answer_questions`, `sentencs_and_words_for_flashcard`. Bucket paths: `images/<articleId>_<n>.png`, `audios/articles/<articleId>.mp3`, `audios/words/<articleId>.mp3`. DB and bucket settings in `.env.local` (never print values). | `prisma/schema.prisma`, `server/models/articleModel.ts`, `server/utils/genaretors/` |
| `../reading-advantage-monorepo` | **Live Primary build (cutover done 2026-10-20) and its database.** Drizzle, `uuid` IDs, `legacy_id_map`, `tutor_compat` views. `apps/workbooks` is an older, unused workbook app. | `apps/primary-advantage`, `packages/db/src/schema/`, `docs/deployment/primary-cutover-migration-spec.md` |
| `../tutor-advantage` | Imports every folder in `primary/` (each needs a `project.json`); reads four legacy tables by `cuid` (see the cutover spec). Keep drafts and packages out of `primary/`. | `packages/database/import-primary-workbooks.ts`, `docs/specs/2026-10-tutor-catalogue-and-platform-spec.md` |
| `../advantage-pr` | Company rules and strategy: CEFR only in external copy, product naming, the canonical strategy. | `AGENTS.md`, `08-strategy/product-strategy-2026-2027.md` |

**Google Cloud:** `gcloud` is installed and signed in (project `reading-advantage`, Cloud SQL instance `cloud-sql`, Postgres 17). Use it for bucket uploads, database backups, and logs. Take a backup before any production write.

**Media:** use `mmx image` (`--subject-ref type=character,image=<sheet>`) and `mmx speech` (`--subtitles` for timing). Character sheets for the series bible cast are the image references.

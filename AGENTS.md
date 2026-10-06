# Reading Advantage Workbooks

## Measure Workflow

Load the `measure` skill and read `measure/index.md` before starting work.

**Goal:** Generate printable English learning workbooks (CEFR A1-C1) from JSON content.
**Stack:** JSON + HTML/Handlebars + Paged.js (Layout) + Next.js (Dashboard).

## Documentation Standards

Use JSDoc for all exported functions. Describe params and returns without repeating TypeScript types.

## Codebase Graph

`repo-graph` is the executable; `build-graph` is the skill that documents it. Load the `build-graph` skill for commands, then invoke `repo-graph`.

No `graph.db` exists in this repo yet — run `repo-graph scan . ./graph.db` before the first structural query.

## Critical Agent Knowledge
* **Schema Truth:** `workbook_schema.ts` (Zod) is the definitive data structure.
* **Strict Validation:** The compiler fails on missing fields. Always validate JSON modifications.
* **PDF Generation Gotcha:** To generate PDFs via the Dashboard print dialog, **"Background graphics" MUST be enabled**. Margins should be "Default" or "None".
* **Layout Engine:** Paged.js handles print layout. CSS print changes require testing in the browser print preview.
* **Memory Protocol:** You must read and update `measure/tech-debt.md` and `measure/lessons-learned.md` as part of your standard track workflow.

## Connected Repositories

All repos are siblings under `~/Desktop/`. Workbooks is the source of truth for Primary Advantage lesson content: Claude writes and checks every asset here, and the other systems receive copies. Do not create content through the Primary app's admin generator.

| Repo | What Workbooks uses or feeds | Key paths |
|---|---|---|
| `../mastery-advantage` | Vocabulary graph for the text check (`--graph`, `MASTERY_VOCAB_GRAPH`); Cambridge YLE lists incl. the Starters **name list** (capitalized headwords, exam `pre-a1-starters`); GSE-to-level map | `english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json`, `english/cefr-vocabulary/data/cambridge-vocabulary-inventory.json`, `english/gse-to-primary-advantage.csv` |
| `../primary-advantage` | **Live Primary app (legacy build, production until the cutover).** Prisma, `cuid` IDs. Article rows: `article`, `multiple_choice_questions`, `short_answer_questions`, `long_answer_questions`, `sentencs_and_words_for_flashcard`. Bucket paths: `images/<articleId>_<n>.png`, `audios/articles/<articleId>.mp3`, `audios/words/<articleId>.mp3`. DB and bucket settings in `.env.local` (never print values). | `prisma/schema.prisma`, `server/models/articleModel.ts`, `server/utils/genaretors/` |
| `../reading-advantage-monorepo` | **New Primary build and the cutover database.** Drizzle, `uuid` IDs, `legacy_id_map`, `tutor_compat` views. Cutover calendar (Daniel, 2026-10-06; strategy v1.4): test Wednesday Oct 7, deploy Sunday Oct 11, last date Oct 20. The injector writes the legacy database until the deploy. `apps/workbooks` is an older, unused workbook app. | `apps/primary-advantage`, `packages/db/src/schema/`, `docs/deployment/primary-cutover-migration-spec.md` |
| `../tutor-advantage` | Imports every folder in `primary/` (each needs a `project.json`); reads four legacy tables by `cuid` (see the cutover spec). Keep drafts and packages out of `primary/`. | `packages/database/import-primary-workbooks.ts`, `docs/specs/2026-10-tutor-catalogue-and-platform-spec.md` |
| `../advantage-pr` | Company rules and strategy: CEFR only in external copy, product naming, the canonical strategy. | `AGENTS.md`, `08-strategy/product-strategy-2026-2027.md` |

**Google Cloud:** `gcloud` is installed and signed in (project `reading-advantage`, Cloud SQL instance `cloud-sql`, Postgres 17). Use it for bucket uploads, database backups, and logs. Take a backup before any production write.

**Media:** use `mmx image` (`--subject-ref type=character,image=<sheet>`) and `mmx speech` (`--subtitles` for timing). Character sheets for the series bible cast are the image references.

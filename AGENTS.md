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

## Automation Supervisor

Do NOT modify measure/automation-supervisor.py. This file is centrally managed and hardlinked across all projects.
